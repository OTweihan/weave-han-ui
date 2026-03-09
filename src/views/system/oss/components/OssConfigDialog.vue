<template>
  <el-dialog v-model="visible" :title="title" width="800px" append-to-body>
    <el-form ref="ossConfigFormRef" :model="form" :rules="rules" label-width="120px" :validate-on-rule-change="false">
      <el-form-item label="配置key" prop="configKey">
        <el-input v-model="form.configKey" placeholder="请输入配置key" />
      </el-form-item>
      <el-form-item label="存储器" prop="storageType">
        <el-select v-model="form.storageType" placeholder="请选择存储器" clearable>
          <el-option v-for="dict in infra_file_storage" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <!-- S3 / FTP / SFTP / Local 共用域名 -->
      <el-form-item v-if="form.storageType" label="自定义域名" prop="domain">
        <el-input v-model="form.domain" placeholder="请输入自定义域名">
          <template #prefix v-if="form.storageType !== '1'">
            <span style="color: #999">{{ protocol }}</span>
          </template>
        </el-input>
      </el-form-item>
      <!-- S3 / FTP / SFTP / Local 共用前缀/基础路径 -->
      <el-form-item v-if="form.storageType && form.storageType !== '1'" :label="form.storageType === '20' ? '前缀' : '基础路径'" prop="prefix">
        <el-input v-model="form.prefix" :placeholder="form.storageType === '20' ? '请输入前缀' : '请输入基础路径'" />
      </el-form-item>

      <!-- S3 专用 -->
      <template v-if="form.storageType === '20'">
        <el-form-item label="访问站点" prop="endpoint">
          <el-input v-model="form.endpoint" placeholder="请输入访问站点">
            <template #prefix>
              <span style="color: #999">{{ protocol }}</span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="accessKey" prop="accessKey">
          <el-input v-model="form.accessKey" placeholder="请输入accessKey" />
        </el-form-item>
        <el-form-item label="secretKey" prop="secretKey">
          <el-input v-model="form.secretKey" placeholder="请输入秘钥" show-password />
        </el-form-item>
        <el-form-item label="桶名称" prop="bucketName">
          <el-input v-model="form.bucketName" placeholder="请输入桶名称" />
        </el-form-item>
        <el-form-item label="是否HTTPS">
          <el-radio-group v-model="form.isHttps">
            <el-radio v-for="dict in sys_yes_no" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="桶权限类型">
          <el-radio-group v-model="form.accessPolicy">
            <el-radio value="0">private</el-radio>
            <el-radio value="1">public</el-radio>
            <el-radio value="2">custom</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="域" prop="region">
          <el-input v-model="form.region" placeholder="请输入域" />
        </el-form-item>
      </template>

      <!-- FTP / SFTP 专用 -->
      <template v-if="form.storageType === '12' || form.storageType === '13'">
        <el-form-item label="主机地址" prop="endpoint">
          <el-input v-model="form.endpoint" placeholder="请输入主机地址" />
        </el-form-item>
        <el-form-item label="主机端口" prop="ext1">
          <el-input v-model="form.ext1" placeholder="请输入主机端口" />
        </el-form-item>
        <el-form-item label="用户名" prop="accessKey">
          <el-input v-model="form.accessKey" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="secretKey">
          <el-input v-model="form.secretKey" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item v-if="form.storageType === '12'" label="连接模式" prop="isHttps">
          <el-radio-group v-model="form.isHttps">
            <el-radio value="Active">主动模式</el-radio>
            <el-radio value="Passive">被动模式</el-radio>
          </el-radio-group>
        </el-form-item>
      </template>

      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { addOssConfig, updateOssConfig, getOssConfig } from '@/api/system/ossConfig';
import { OssConfigForm } from '@/api/system/ossConfig/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_yes_no, infra_file_storage } = toRefs<any>(proxy?.useDict('sys_yes_no', 'infra_file_storage') || {});

const visible = ref(false);
const title = ref('');
const buttonLoading = ref(false);
const ossConfigFormRef = ref<ElFormInstance>();

const initFormData: OssConfigForm = {
  ossConfigId: undefined,
  configKey: '',
  accessKey: '',
  secretKey: '',
  bucketName: '',
  prefix: '',
  endpoint: '',
  domain: '',
  isHttps: 'N',
  accessPolicy: '1',
  region: '',
  status: '1',
  remark: '',
  storageType: ''
};

const form = ref<OssConfigForm>({ ...initFormData });

const rules = computed(() => {
  const baseRules: any = {
    configKey: [{ required: true, message: 'configKey不能为空', trigger: 'blur' }],
    storageType: [{ required: true, message: '存储器不能为空', trigger: 'change' }]
  };

  if (form.value.storageType !== '1') {
    baseRules.domain = [{ required: true, message: '自定义域名不能为空', trigger: 'blur' }];
  }

  if (form.value.storageType === '20') {
    Object.assign(baseRules, {
      accessKey: [{ required: true, message: 'accessKey不能为空', trigger: 'blur' }],
      secretKey: [{ required: true, message: 'secretKey不能为空', trigger: 'blur' }],
      bucketName: [{ required: true, message: 'bucketName不能为空', trigger: 'blur' }],
      endpoint: [{ required: true, message: 'endpoint不能为空', trigger: 'blur' }],
      accessPolicy: [{ required: true, message: 'accessPolicy不能为空', trigger: 'blur' }],
      prefix: [{ required: true, message: '前缀不能为空', trigger: 'blur' }]
    });
  } else if (form.value.storageType === '12' || form.value.storageType === '13') {
    Object.assign(baseRules, {
      endpoint: [{ required: true, message: '主机地址不能为空', trigger: 'blur' }],
      ext1: [{ required: true, message: '主机端口不能为空', trigger: 'blur' }],
      accessKey: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
      secretKey: [{ required: true, message: '密码不能为空', trigger: 'blur' }],
      prefix: [{ required: true, message: '基础路径不能为空', trigger: 'blur' }]
    });
  } else if (form.value.storageType === '11') {
    Object.assign(baseRules, {
      prefix: [{ required: true, message: '基础路径不能为空', trigger: 'blur' }]
    });
  }

  return baseRules;
});

const protocol = computed(() => (form.value.isHttps === 'Y' ? 'https://' : 'http://'));

const emit = defineEmits(['success']);

const open = async (ossConfigId?: number | string) => {
  visible.value = true;
  await nextTick();
  reset();
  if (ossConfigId) {
    title.value = '修改对象存储配置';
    const res = await getOssConfig(ossConfigId);
    if (res && res.data) {
      Object.assign(form.value, res.data);
    }
  } else {
    title.value = '添加对象存储配置';
  }
  // 强制清除校验，防止初始化或赋值时触发校验
  await nextTick();
  ossConfigFormRef.value?.clearValidate();
};

const cancel = () => {
  visible.value = false;
  reset();
};

const reset = () => {
  form.value = { ...initFormData };
  ossConfigFormRef.value?.resetFields();
};

const submitForm = () => {
  ossConfigFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      try {
        if (form.value.ossConfigId) {
          await updateOssConfig(form.value);
        } else {
          await addOssConfig(form.value);
        }
        proxy?.$modal.msgSuccess(form.value.ossConfigId ? '修改成功' : '新增成功');
        visible.value = false;
        emit('success');
      } finally {
        buttonLoading.value = false;
      }
    }
  });
};

defineExpose({
  open
});
</script>
