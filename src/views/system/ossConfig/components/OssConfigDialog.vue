<template>
  <el-dialog v-model="visible" :title="title" width="800px" append-to-body>
    <el-form ref="ossConfigFormRef" v-loading="dialogLoading" :model="form" :rules="rules" label-width="120px" :validate-on-rule-change="false">
      <el-form-item label="配置名" prop="configName">
        <el-input v-model="form.configName" placeholder="请输入配置名" />
      </el-form-item>
      <el-form-item label="存储器" prop="storageType">
        <el-select v-model="form.storageType" placeholder="请选择存储器" clearable @change="handleStorageTypeChange">
          <el-option v-for="dict in infra_file_storage" :key="dict.value" :label="dict.label" :value="Number(dict.value)" />
        </el-select>
      </el-form-item>

      <!-- 本地存储 (10) -->
      <template v-if="form.storageType === 10">
        <el-form-item label="存储路径" prop="configData.path">
          <el-input v-model="form.configData.path" placeholder="请输入存储路径，如: /uploads" />
        </el-form-item>
      </template>

      <!-- FTP (11) -->
      <template v-if="form.storageType === 11">
        <el-form-item label="主机地址" prop="configData.host">
          <el-input v-model="form.configData.host" placeholder="请输入主机地址" />
        </el-form-item>
        <el-form-item label="主机端口" prop="configData.port">
          <el-input-number v-model="form.configData.port" :min="0" :max="65535" placeholder="请输入主机端口" />
        </el-form-item>
        <el-form-item label="用户名" prop="configData.username">
          <el-input v-model="form.configData.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="configData.password">
          <el-input v-model="form.configData.password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="基础路径" prop="configData.basePath">
          <el-input v-model="form.configData.basePath" placeholder="请输入基础路径" />
        </el-form-item>
        <el-form-item label="连接模式" prop="configData.mode">
          <el-radio-group v-model="form.configData.mode">
            <el-radio value="Active">主动模式</el-radio>
            <el-radio value="Passive">被动模式</el-radio>
          </el-radio-group>
        </el-form-item>
      </template>

      <!-- SFTP (12) -->
      <template v-if="form.storageType === 12">
        <el-form-item label="主机地址" prop="configData.host">
          <el-input v-model="form.configData.host" placeholder="请输入主机地址" />
        </el-form-item>
        <el-form-item label="主机端口" prop="configData.port">
          <el-input-number v-model="form.configData.port" :min="0" :max="65535" placeholder="请输入主机端口" />
        </el-form-item>
        <el-form-item label="用户名" prop="configData.username">
          <el-input v-model="form.configData.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="configData.password">
          <el-input v-model="form.configData.password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="基础路径" prop="configData.basePath">
          <el-input v-model="form.configData.basePath" placeholder="请输入基础路径" />
        </el-form-item>
      </template>

      <!-- S3 (20) -->
      <template v-if="form.storageType === 20">
        <el-form-item label="节点地址" prop="configData.endpoint">
          <el-input v-model="form.configData.endpoint" placeholder="请输入节点地址，如: http://localhost:9000" />
        </el-form-item>
        <el-form-item label="存储Bucket" prop="configData.bucket">
          <el-input v-model="form.configData.bucket" placeholder="请输入存储Bucket" />
        </el-form-item>
        <el-form-item label="accessKey" prop="configData.accessKey">
          <el-input v-model="form.configData.accessKey" placeholder="请输入accessKey" />
        </el-form-item>
        <el-form-item label="accessSecret" prop="configData.accessSecret">
          <el-input v-model="form.configData.accessSecret" placeholder="请输入accessSecret" show-password />
        </el-form-item>
        <el-form-item label="是否HTTPS">
          <el-radio-group v-model="form.configData.enableHttps">
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="桶权限类型">
          <el-radio-group v-model="form.configData.accessPolicy">
            <el-radio value="0">private</el-radio>
            <el-radio value="1">public</el-radio>
            <el-radio value="2">custom</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="域" prop="configData.region">
          <el-input v-model="form.configData.region" placeholder="请输入域，如: us-east-1" />
        </el-form-item>
      </template>

      <!-- 通用：自定义域名 -->
      <el-form-item v-if="form.storageType" label="自定义域名" prop="configData.domain">
        <el-input v-model="form.configData.domain" placeholder="请输入自定义域名，如: http://localhost:8080" />
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
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
import { OssConfigForm, OssConfigVO } from '@/api/system/ossConfig/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { infra_file_storage } = toRefs<any>(proxy?.useDict('infra_file_storage'));

const visible = ref(false);
const title = ref('');
const dialogLoading = ref(false);
const buttonLoading = ref(false);
const ossConfigFormRef = ref<ElFormInstance>();

const initFormData = (): OssConfigForm => ({
  ossConfigId: undefined,
  configName: '',
  storageType: undefined,
  configData: {},
  master: false,
  remark: ''
});

const form = ref<OssConfigForm>(initFormData());

const validateDomainUrl = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback();
    return;
  }
  try {
    const url = new URL(value.trim());
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      callback();
      return;
    }
  } catch {
    callback(new Error('自定义域名必须是URL格式'));
    return;
  }
  callback(new Error('自定义域名必须是URL格式'));
};

const rules = computed(() => {
  const baseRules: any = {
    configName: [{ required: true, message: '配置名不能为空', trigger: 'blur' }],
    storageType: [{ required: true, message: '存储器不能为空', trigger: 'change' }]
  };

  if (form.value.storageType) {
    baseRules['configData.domain'] = [
      { required: true, message: '自定义域名不能为空', trigger: 'blur' },
      { validator: validateDomainUrl, trigger: 'blur' }
    ];
  }

  if (form.value.storageType === 10) {
    baseRules['configData.path'] = [{ required: true, message: '存储路径不能为空', trigger: 'blur' }];
  }
  if (form.value.storageType === 11 || form.value.storageType === 12) {
    baseRules['configData.host'] = [{ required: true, message: '主机地址不能为空', trigger: 'blur' }];
    baseRules['configData.port'] = [{ required: true, message: '主机端口不能为空', trigger: 'blur' }];
    baseRules['configData.username'] = [{ required: true, message: '用户名不能为空', trigger: 'blur' }];
    baseRules['configData.password'] = [{ required: true, message: '密码不能为空', trigger: 'blur' }];
    baseRules['configData.basePath'] = [{ required: true, message: '基础路径不能为空', trigger: 'blur' }];
  }
  if (form.value.storageType === 20) {
    baseRules['configData.endpoint'] = [{ required: true, message: '节点地址不能为空', trigger: 'blur' }];
    baseRules['configData.bucket'] = [{ required: true, message: '存储Bucket不能为空', trigger: 'blur' }];
    baseRules['configData.accessKey'] = [{ required: true, message: 'accessKey不能为空', trigger: 'blur' }];
    baseRules['configData.accessSecret'] = [{ required: true, message: 'accessSecret不能为空', trigger: 'blur' }];
  }

  return baseRules;
});

const emit = defineEmits(['success']);

const handleStorageTypeChange = () => {
  form.value.configData = {};
  nextTick(() => {
    ossConfigFormRef.value?.clearValidate();
  });
};

const open = async (param?: number | string | OssConfigVO) => {
  visible.value = true;
  if (param) {
    title.value = '修改对象存储配置';
    if (typeof param === 'object' && 'ossConfigId' in param) {
      // 如果传入的是对象，直接回显数据
      form.value = { ...initFormData(), ...param };
    } else {
      // 如果传入的是ID，则请求详情
      dialogLoading.value = true;
      try {
        const res = await getOssConfig(param);
        form.value = { ...initFormData(), ...res.data };
      } finally {
        dialogLoading.value = false;
      }
    }
  } else {
    title.value = '添加对象存储配置';
    form.value = initFormData();
  }
  nextTick(() => {
    ossConfigFormRef.value?.clearValidate();
  });
};

const cancel = () => {
  visible.value = false;
  // reset();
};

const reset = () => {
  form.value = initFormData();
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
