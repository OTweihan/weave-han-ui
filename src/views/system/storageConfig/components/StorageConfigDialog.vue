<template>
  <el-dialog v-model="visible" :title="title" width="800px" append-to-body @close="cancel">
    <el-form ref="ossConfigFormRef" v-loading="dialogLoading" :model="form" :rules="rules" label-width="120px" :validate-on-rule-change="false">
      <el-form-item label="配置名" prop="configName">
        <el-input v-model="form.configName" placeholder="请输入配置名" maxlength="100" />
      </el-form-item>
      <el-form-item label="存储器" prop="storageType">
        <el-select v-model="form.storageType" placeholder="请选择存储器" clearable @change="handleStorageTypeChange">
          <el-option v-for="dict in infra_file_storage" :key="dict.value" :label="dict.label" :value="Number(dict.value)" />
        </el-select>
      </el-form-item>

      <template v-if="isLocalType">
        <el-form-item label="基础路径" prop="configData.basePath">
          <el-input v-model="form.configData.basePath" placeholder="请输入基础路径，如: D:/uploads 或 /uploads" />
        </el-form-item>
      </template>

      <template v-if="isFtpFamilyType">
        <el-form-item label="主机地址" prop="configData.host">
          <el-input v-model="form.configData.host" placeholder="请输入主机地址" />
        </el-form-item>
        <el-form-item label="主机端口" prop="configData.port">
          <el-input-number v-model="form.configData.port" class="port-input-number" :min="0" :max="65535" placeholder="端口" style="width: 100%" />
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
        <el-form-item v-if="isFtpType" label="连接模式" prop="configData.mode">
          <el-radio-group v-model="form.configData.mode">
            <el-radio value="Active">主动模式</el-radio>
            <el-radio value="Passive">被动模式</el-radio>
          </el-radio-group>
        </el-form-item>
      </template>

      <template v-if="isS3Type">
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
        <el-form-item label="PathStyle 访问" prop="configData.enablePathStyleAccess">
          <el-radio-group v-model="form.configData.enablePathStyleAccess">
            <el-radio :value="true">开启</el-radio>
            <el-radio :value="false">关闭</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="公开访问" prop="configData.enablePublicAccess">
          <el-radio-group v-model="form.configData.enablePublicAccess">
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="域" prop="configData.region">
          <el-input v-model="form.configData.region" placeholder="请输入域，如: us-east-1" />
        </el-form-item>
      </template>

      <el-form-item v-if="hasStorageType" label="自定义域名" prop="configData.domain">
        <el-input v-model="form.configData.domain" placeholder="请输入自定义域名，如: http://oss.example.com" />
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
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
import { addStorageConfig, updateStorageConfig, getStorageConfig } from '@/api/system/storageConfig';
import { StorageConfigForm, StorageConfigVO } from '@/api/system/storageConfig/types';
import type { FormInstance, FormRules } from 'element-plus';

const STORAGE_TYPE = {
  LOCAL: 10,
  FTP: 11,
  SFTP: 12,
  S3: 20
} as const;

type StorageConfigPayload = Partial<Omit<StorageConfigForm, 'storageType'>> & {
  storageType?: number | string | null;
  configData?: Record<string, any> | null;
};

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { infra_file_storage } = toRefs<any>(proxy?.useDict('infra_file_storage'));

// 状态控制
const visible = ref(false);
const title = ref('');
const dialogLoading = ref(false);
const buttonLoading = ref(false);
const ossConfigFormRef = ref<FormInstance>();

// 根据存储类型构建 configData 初始值，确保深层字段绑定稳定可用
const buildDefaultConfigData = (storageType?: number): Record<string, any> => {
  const defaultData: Record<string, any> = { domain: '' };
  if (storageType === STORAGE_TYPE.FTP) {
    defaultData.port = 21;
    defaultData.mode = 'Passive';
  } else if (storageType === STORAGE_TYPE.SFTP) {
    defaultData.port = 22;
  } else if (storageType === STORAGE_TYPE.S3) {
    defaultData.enablePathStyleAccess = true;
    defaultData.enablePublicAccess = false;
  }
  return defaultData;
};

// 初始化表单结构
const initFormData = (): StorageConfigForm => ({
  storageConfigId: undefined,
  configName: '',
  storageType: undefined,
  configData: buildDefaultConfigData(),
  master: false,
  remark: ''
});

const form = ref<StorageConfigForm>(initFormData());

const resetForm = () => {
  form.value = initFormData();
};

/** 校验 URL 格式 */
const validateDomainUrl = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value) return callback();
  try {
    const url = new URL(value.trim());
    if (['http:', 'https:'].includes(url.protocol)) {
      return callback();
    }
    callback(new Error('域名必须以 http:// 或 https:// 开头'));
  } catch {
    callback(new Error('自定义域名格式不正确'));
  }
};

/** 将接口数据合并到表单，并补齐当前类型下的默认配置字段 */
const applyFormData = (source: StorageConfigPayload) => {
  const normalizedStorageType = source.storageType === undefined || source.storageType === null ? undefined : Number(source.storageType);
  form.value = {
    ...initFormData(),
    ...source,
    storageType: normalizedStorageType,
    configData: {
      ...buildDefaultConfigData(normalizedStorageType),
      ...((source.configData as Record<string, any>) ?? {})
    }
  };
};

/** 动态计算校验规则 */
const rules = computed<FormRules>(() => {
  const storageType = form.value.storageType;
  const baseRules: FormRules = {
    configName: [{ required: true, message: '配置名不能为空', trigger: 'blur' }],
    storageType: [{ required: true, message: '存储器不能为空', trigger: 'change' }]
  };

  // 只要选择了存储器，就校验自定义域名
  if (storageType !== undefined && storageType !== null) {
    baseRules['configData.domain'] = [
      { required: true, message: '自定义域名不能为空', trigger: 'blur' },
      { validator: validateDomainUrl, trigger: 'blur' }
    ];
  }

  // 本地存储校验
  if (storageType === STORAGE_TYPE.LOCAL) {
    baseRules['configData.basePath'] = [{ required: true, message: '基础路径不能为空', trigger: 'blur' }];
  }

  // FTP/SFTP 校验
  if (storageType === STORAGE_TYPE.FTP || storageType === STORAGE_TYPE.SFTP) {
    baseRules['configData.host'] = [{ required: true, message: '主机地址不能为空', trigger: 'blur' }];
    baseRules['configData.port'] = [{ required: true, message: '主机端口不能为空', trigger: 'blur' }];
    baseRules['configData.username'] = [{ required: true, message: '用户名不能为空', trigger: 'blur' }];
    baseRules['configData.password'] = [{ required: true, message: '密码不能为空', trigger: 'blur' }];
    baseRules['configData.basePath'] = [{ required: true, message: '基础路径不能为空', trigger: 'blur' }];
  }

  // S3 校验
  if (storageType === STORAGE_TYPE.S3) {
    baseRules['configData.endpoint'] = [{ required: true, message: '节点地址不能为空', trigger: 'blur' }];
    baseRules['configData.bucket'] = [{ required: true, message: '存储Bucket不能为空', trigger: 'blur' }];
    baseRules['configData.accessKey'] = [{ required: true, message: 'accessKey不能为空', trigger: 'blur' }];
    baseRules['configData.accessSecret'] = [{ required: true, message: 'accessSecret不能为空', trigger: 'blur' }];
    baseRules['configData.enablePathStyleAccess'] = [{ required: true, message: 'PathStyle 访问不能为空', trigger: 'change' }];
    baseRules['configData.enablePublicAccess'] = [{ required: true, message: '公开访问不能为空', trigger: 'change' }];
  }

  return baseRules;
});

const emit = defineEmits(['success']);

// 模板层语义化状态，减少魔法数字和重复判断
const isLocalType = computed(() => form.value.storageType === STORAGE_TYPE.LOCAL);
const isFtpType = computed(() => form.value.storageType === STORAGE_TYPE.FTP);
const isFtpFamilyType = computed(() => form.value.storageType === STORAGE_TYPE.FTP || form.value.storageType === STORAGE_TYPE.SFTP);
const isS3Type = computed(() => form.value.storageType === STORAGE_TYPE.S3);
const hasStorageType = computed(() => form.value.storageType !== undefined && form.value.storageType !== null);

/** 切换存储器类型时，重置配置项数据并清除旧校验 */
const handleStorageTypeChange = (val?: number | null) => {
  // 类型变化后重建 configData，避免旧字段残留导致提交脏数据
  form.value.configData = buildDefaultConfigData(val);
  nextTick(() => {
    ossConfigFormRef.value?.clearValidate();
  });
};

/** 外部调用打开弹窗 */
const open = async (param?: number | string | StorageConfigVO) => {
  resetForm();
  visible.value = true;

  if (param) {
    title.value = '修改对象存储配置';
    if (typeof param === 'object' && 'storageConfigId' in param) {
      const data = JSON.parse(JSON.stringify(param)) as StorageConfigVO;
      applyFormData(data);
    } else {
      dialogLoading.value = true;
      try {
        const res = await getStorageConfig(param);
        applyFormData(res.data);
      } finally {
        dialogLoading.value = false;
      }
    }
  } else {
    title.value = '添加对象存储配置';
  }

  await nextTick();
  ossConfigFormRef.value?.clearValidate();
};

/** 取消操作 */
const cancel = () => {
  visible.value = false;
  buttonLoading.value = false;
  resetForm();
  nextTick(() => {
    ossConfigFormRef.value?.clearValidate();
  });
};

/** 统一清洗可输入 URL 的字符串字段，避免尾部空格与非法字符影响后端校验 */
const normalizeConfigTextFields = () => {
  const { configData } = form.value;
  const normalizeKeys = ['endpoint', 'domain'] as const;
  normalizeKeys.forEach((key) => {
    const raw = configData?.[key];
    if (typeof raw === 'string') {
      configData[key] = raw.replace(/`/g, '').trim();
    }
  });
};

/** 提交表单 */
const submitForm = async () => {
  if (!ossConfigFormRef.value) {
    return;
  }

  try {
    await ossConfigFormRef.value.validate();
  } catch {
    return;
  }

  buttonLoading.value = true;
  try {
    normalizeConfigTextFields();
    const isEdit = form.value.storageConfigId !== undefined && form.value.storageConfigId !== null;
    if (isEdit) {
      await updateStorageConfig(form.value);
    } else {
      await addStorageConfig(form.value);
    }
    proxy?.$modal.msgSuccess(isEdit ? '修改成功' : '新增成功');
    visible.value = false;
    resetForm();
    emit('success');
  } catch (error) {
    console.error('提交失败:', error);
  } finally {
    buttonLoading.value = false;
  }
};

defineExpose({
  open
});
</script>

<style scoped>
/* 强制端口数字输入框文字左对齐，符合表单习惯 */
:deep(.port-input-number .el-input__inner) {
  text-align: left;
}

/* 调整对话框内表单间距 */
.el-form-item {
  margin-bottom: 22px;
}
</style>
