<template>
  <el-dialog v-model="dialog.visible" :title="dialog.title" width="720px" append-to-body class="config-form-dialog">
    <el-form ref="configFormRef" :model="form" :rules="rules" label-width="100" class="config-form">
      <div class="section-title">基础信息</div>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="参数名称" prop="configName">
            <el-input v-model="form.configName" placeholder="请输入参数名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="configKey">
            <template #label>
              <span class="label-with-icon">
                <el-tooltip content="用于系统读取的参数键名，需唯一" placement="top">
                  <el-icon class="label-icon">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
                <span>参数键名</span>
              </span>
            </template>
            <el-input v-model="form.configKey" placeholder="请输入参数键名" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item prop="configValue">
            <template #label>
              <span class="label-with-icon">
                <el-tooltip content="对应键的值，支持文本与JSON" placement="top">
                  <el-icon class="label-icon">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
                <span>参数键值</span>
              </span>
            </template>
            <el-input v-model="form.configValue" type="textarea" placeholder="请输入参数键值" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item>
            <template #label>
              <span class="label-with-icon">
                <el-tooltip content="是否为系统内置参数，内置参数需谨慎修改" placement="top">
                  <el-icon class="label-icon">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
                <span>系统内置</span>
              </span>
            </template>
            <el-radio-group v-model="form.configType">
              <el-radio v-for="dict in sys_yes_no" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>

      <div class="section-divider"></div>
      <div class="section-title">其他信息</div>
      <el-row :gutter="16">
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { addConfig, updateConfig, getConfig } from '@/api/system/config';
import type { ConfigForm } from '@/api/system/config/types';
import { QuestionFilled } from '@element-plus/icons-vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

defineProps<{
  sys_yes_no: any[];
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const configFormRef = ref<ElFormInstance>();
const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: ConfigForm = {
  configId: undefined,
  configName: '',
  configKey: '',
  configValue: '',
  configType: 'Y',
  remark: ''
};

const form = ref<ConfigForm>({ ...initFormData });

const rules = ref<ElFormRules>({
  configName: [{ required: true, message: '参数名称不能为空', trigger: 'blur' }],
  configKey: [{ required: true, message: '参数键名不能为空', trigger: 'blur' }],
  configValue: [{ required: true, message: '参数键值不能为空', trigger: 'blur' }]
});

const cancel = () => {
  reset();
  dialog.visible = false;
};

const reset = () => {
  form.value = { ...initFormData };
  configFormRef.value?.resetFields();
};

const openAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加参数';
};

const openEdit = async (configId: string | number) => {
  reset();
  const res = await getConfig(configId);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改参数';
};

const submitForm = () => {
  configFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      form.value.configId ? await updateConfig(form.value) : await addConfig(form.value);
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      emit('success');
    }
  });
};

defineExpose({
  openAdd,
  openEdit
});
</script>

<style scoped lang="scss">
.config-form-dialog {
  :deep(.el-dialog__header) {
    padding: 14px 20px 10px;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  :deep(.el-dialog__title) {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  :deep(.el-dialog__body) {
    padding: 16px 20px 10px;
    background-color: #f5f7fb;
  }
}

.config-form {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 18px 18px 10px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);

  :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper),
  :deep(.el-textarea__inner) {
    border-radius: 4px;
  }
}

.label-with-icon {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.label-icon {
  font-size: 14px;
  color: var(--el-color-primary);
}

.section-title {
  margin: 2px 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.section-divider {
  height: 1px;
  margin: 8px 0 10px;
  background-color: var(--el-border-color-light);
}

.dialog-footer {
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-light);
}
</style>
