<template>
  <div class="inner-form-wrapper">
    <el-form ref="userRef" :model="userForm" :rules="rules" label-position="top" class="refined-form">
      <el-row :gutter="32">
        <el-col :span="12" :xs="24">
          <el-form-item label="用户昵称" prop="nickName">
            <el-input v-model="userForm.nickName" maxlength="30" placeholder="设置一个响亮的昵称">
              <template #prefix>
                <el-icon class="input-icon"><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>
        </el-col>

        <el-col :span="12" :xs="24">
          <el-form-item label="手机号码" prop="phonenumber">
            <el-input v-model="userForm.phonenumber" maxlength="11" placeholder="用于安全验证和联系">
              <template #prefix>
                <el-icon class="input-icon"><Iphone /></el-icon>
              </template>
            </el-input>
          </el-form-item>
        </el-col>

        <el-col :span="12" :xs="24">
          <el-form-item label="电子邮箱" prop="email">
            <el-input v-model="userForm.email" maxlength="50" placeholder="请输入常用邮箱">
              <template #prefix>
                <el-icon class="input-icon"><Message /></el-icon>
              </template>
            </el-input>
          </el-form-item>
        </el-col>

        <el-col :span="12" :xs="24">
          <el-form-item label="性别区分">
            <el-radio-group v-model="userForm.sex" class="gender-radio-group">
              <el-radio-button value="0">
                <el-icon><Male /></el-icon> <span>男</span>
              </el-radio-button>
              <el-radio-button value="1">
                <el-icon><Female /></el-icon> <span>女</span>
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>

      <div class="form-action-bar">
        <el-button type="primary" class="save-btn" @click="submit">
          <el-icon><CircleCheck /></el-icon>
          <span>更新个人信息</span>
        </el-button>
        <el-button class="close-btn" @click="close">取消返回</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { updateUserProfile } from '@/api/system/user';
import { propTypes } from '@/utils/propTypes';
import { CircleCheck, Female, Iphone, Male, Message, User } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';

const props = defineProps({
  user: propTypes.any.isRequired
});
const userForm = computed(() => props.user);
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const userRef = ref<FormInstance>();

const rules = ref<FormRules>({
  nickName: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
  email: [
    { required: true, message: '邮箱地址不能为空', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
  ],
  phonenumber: [
    { required: true, message: '手机号码不能为空', trigger: 'blur' },
    { pattern: /^1[3456789][0-9]\d{8}$/, message: '手机号码格式错误', trigger: 'blur' }
  ]
});

const submit = () => {
  userRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      await updateUserProfile(props.user);
      proxy?.$modal.msgSuccess('个人资料更新成功');
    }
  });
};

const close = () => {
  proxy?.$tab.closePage();
};
</script>

<style lang="scss" scoped>
.inner-form-wrapper {
  /* 标题标签样式 */
  :deep(.el-form-item__label) {
    font-size: 14px;
    font-weight: 700;
    color: #334155;
    padding-bottom: 10px;
  }

  /* 输入框精致美化 */
  :deep(.el-input__wrapper) {
    background-color: #f8fafc;
    box-shadow: 0 0 0 1px #e2e8f0 inset;
    border-radius: 12px;
    padding: 8px 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &.is-focus {
      background-color: #ffffff;
      box-shadow:
        0 0 0 1px var(--el-color-primary) inset,
        0 8px 16px -4px rgba(var(--el-color-primary-rgb), 0.15);
    }

    .input-icon {
      color: #94a3b8;
      font-size: 16px;
      margin-right: 4px;
    }
  }

  /* 性别按钮重塑 */
  .gender-radio-group {
    display: flex;
    gap: 12px;
    width: 100%;

    :deep(.el-radio-button) {
      flex: 1;
      .el-radio-button__inner {
        width: 100%;
        border: 1px solid #e2e8f0 !important;
        border-radius: 12px !important;
        background: #f8fafc;
        color: #64748b;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-weight: 600;
        box-shadow: none !important;
        transition: all 0.2s ease;
      }

      &.is-active .el-radio-button__inner {
        background-color: var(--el-color-primary) !important;
        border-color: var(--el-color-primary) !important;
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3) !important;
      }
    }
  }

  /* 底部按钮栏 */
  .form-action-bar {
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid #f1f5f9;
    display: flex;
    gap: 12px;

    .save-btn {
      height: 46px;
      padding: 0 32px;
      border-radius: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px -6px rgba(var(--el-color-primary-rgb), 0.5);
      }
    }

    .close-btn {
      height: 46px;
      padding: 0 24px;
      border-radius: 12px;
      color: #64748b;
      border: 1px solid #e2e8f0;
      background: #ffffff;

      &:hover {
        background: #f1f5f9;
        color: #1e293b;
      }
    }
  }
}

/* 适配窄屏 */
@media (max-width: 768px) {
  .inner-form-wrapper {
    .el-row {
      margin: 0 !important;
    }
    .el-col {
      padding: 0 !important;
    }
  }
}
</style>
