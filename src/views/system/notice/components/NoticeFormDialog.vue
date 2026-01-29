<template>
  <el-dialog v-model="dialog.visible" :title="dialog.title" width="780px" append-to-body class="notice-form-dialog">
    <el-form ref="noticeFormRef" :model="form" :rules="rules" label-width="100" class="notice-form">
      <div class="section-title">基础信息</div>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="公告标题" prop="noticeTitle">
            <el-input v-model="form.noticeTitle" placeholder="请输入公告标题" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item>
            <template #label>
              <span class="label-with-icon">
                <el-tooltip content="公告类型用于分类展示与筛选" placement="top">
                  <el-icon class="label-icon">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
                <span>公告类型</span>
              </span>
            </template>
            <el-select v-model="form.noticeType" placeholder="请选择">
              <el-option v-for="dict in sys_notice_type" :key="dict.value" :label="dict.label" :value="dict.value"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="24">
          <el-form-item label="状态">
            <el-radio-group v-model="form.status">
              <el-radio v-for="dict in sys_notice_status" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>

      <div class="section-divider"></div>
      <div class="section-title">公告内容</div>
      <el-form-item label="内容">
        <editor v-model="form.noticeContent" :min-height="192" />
      </el-form-item>
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
import { addNotice, updateNotice, getNotice } from '@/api/system/notice';
import type { NoticeForm } from '@/api/system/notice/types';
import { QuestionFilled } from '@element-plus/icons-vue';

defineProps<{
  sys_notice_status: any[];
  sys_notice_type: any[];
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const noticeFormRef = ref<ElFormInstance>();
const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: NoticeForm = {
  noticeId: undefined,
  noticeTitle: '',
  noticeType: '',
  noticeContent: '',
  status: '0',
  remark: '',
  createByName: ''
};

const form = ref<NoticeForm>({ ...initFormData });

const rules = ref<ElFormRules>({
  noticeTitle: [{ required: true, message: '公告标题不能为空', trigger: 'blur' }],
  noticeType: [{ required: true, message: '公告类型不能为空', trigger: 'change' }]
});

const cancel = () => {
  reset();
  dialog.visible = false;
};

const reset = () => {
  form.value = { ...initFormData };
  noticeFormRef.value?.resetFields();
};

const openAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加公告';
};

const openEdit = async (noticeId: string | number) => {
  reset();
  const { data } = await getNotice(noticeId);
  Object.assign(form.value, data);
  dialog.visible = true;
  dialog.title = '修改公告';
};

const submitForm = () => {
  noticeFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      form.value.noticeId ? await updateNotice(form.value) : await addNotice(form.value);
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
.notice-form-dialog {
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

.notice-form {
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
