<template>
  <el-dialog v-model="visible" :title="title" width="800px" append-to-body>
    <el-form ref="ossConfigFormRef" :model="form" :rules="rules" label-width="120px">
      <el-form-item label="配置key" prop="configKey">
        <el-input v-model="form.configKey" placeholder="请输入配置key" />
      </el-form-item>
      <el-form-item label="访问站点" prop="endpoint">
        <el-input v-model="form.endpoint" placeholder="请输入访问站点">
          <template #prefix>
            <span style="color: #999">{{ protocol }}</span>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="自定义域名" prop="domain">
        <el-input v-model="form.domain" placeholder="请输入自定义域名">
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
      <el-form-item label="前缀" prop="prefix">
        <el-input v-model="form.prefix" placeholder="请输入前缀" />
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
const { sys_yes_no } = toRefs<any>(proxy?.useDict('sys_yes_no'));

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
  remark: ''
};

const form = ref<OssConfigForm>({ ...initFormData });

const rules = {
  configKey: [{ required: true, message: 'configKey不能为空', trigger: 'blur' }],
  accessKey: [
    { required: true, message: 'accessKey不能为空', trigger: 'blur' },
    { min: 2, max: 200, message: 'accessKey长度必须介于 2 和 100 之间', trigger: 'blur' }
  ],
  secretKey: [
    { required: true, message: 'secretKey不能为空', trigger: 'blur' },
    { min: 2, max: 100, message: 'secretKey长度必须介于 2 和 100 之间', trigger: 'blur' }
  ],
  bucketName: [
    { required: true, message: 'bucketName不能为空', trigger: 'blur' },
    { min: 2, max: 100, message: 'bucketName长度必须介于 2 和 100 之间', trigger: 'blur' }
  ],
  endpoint: [
    { required: true, message: 'endpoint不能为空', trigger: 'blur' },
    { min: 2, max: 100, message: 'endpoint名称长度必须介于 2 和 100 之间', trigger: 'blur' }
  ],
  accessPolicy: [{ required: true, message: 'accessPolicy不能为空', trigger: 'blur' }]
};

const protocol = computed(() => (form.value.isHttps === 'Y' ? 'https://' : 'http://'));

const emit = defineEmits(['success']);

const open = async (ossConfigId?: number | string) => {
  visible.value = true;
  reset();
  if (ossConfigId) {
    title.value = '修改对象存储配置';
    const res = await getOssConfig(ossConfigId);
    Object.assign(form.value, res.data);
  } else {
    title.value = '添加对象存储配置';
  }
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
