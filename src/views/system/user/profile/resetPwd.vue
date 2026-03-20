<template>
  <div class="inner-pwd-wrapper">
    <div class="pwd-section-header">
      <div class="header-line"></div>
      <div class="header-content">
        <h4>账户安全设置</h4>
        <p>定期更换密码能有效保障您的账户安全</p>
      </div>
    </div>

    <el-form ref="pwdRef" :model="user" :rules="rules" label-position="top" class="refined-pwd-form">
      <el-form-item label="当前旧密码" prop="oldPassword">
        <el-input v-model="user.oldPassword" placeholder="请输入当前正在使用的密码" type="password" show-password>
          <template #prefix>
            <el-icon class="input-icon"><Unlock /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="设置新密码" prop="newPassword">
        <el-input v-model="user.newPassword" placeholder="6-20位字符，包含字母与数字" type="password" show-password>
          <template #prefix>
            <el-icon class="input-icon"><Key /></el-icon>
          </template>
        </el-input>
        <div class="pwd-hint-box">
          <el-icon><InfoFilled /></el-icon>
          <span>长度 6-20 位，避免使用过于简单的字符组合。</span>
        </div>
      </el-form-item>

      <el-form-item label="确认新密码" prop="confirmPassword">
        <el-input v-model="user.confirmPassword" placeholder="请再次输入新密码" type="password" show-password>
          <template #prefix>
            <el-icon class="input-icon"><Checked /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <div class="form-action-bar">
        <el-button type="primary" class="submit-btn" @click="submit">
          <el-icon class="mr-1"><CircleCheck /></el-icon>
          保存新密码
        </el-button>
        <el-button class="reset-btn" @click="resetForm">重置填写</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { updateUserPwd } from '@/api/system/user';
import type { ResetPwdForm } from '@/api/system/user/types';
import { Checked, CircleCheck, InfoFilled, Key, Unlock } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const pwdRef = ref<FormInstance>();
const user = ref<ResetPwdForm>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const equalToPassword = (_rule: any, value: string, callback: any) => {
  if (user.value.newPassword !== value) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const rules = ref<FormRules>({
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
    { pattern: /^[^<>"'|\\]+$/, message: '包含非法字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: equalToPassword, trigger: 'blur' }
  ]
});

const submit = () => {
  pwdRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      await updateUserPwd(user.value.oldPassword, user.value.newPassword);
      proxy?.$modal.msgSuccess('密码修改成功，请妥善保管');
      resetForm();
    }
  });
};

const resetForm = () => {
  pwdRef.value?.resetFields();
};
</script>

<style lang="scss" scoped>
.inner-pwd-wrapper {
  /* 头部样式：简洁明了 */
  .pwd-section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 30px;

    .header-line {
      width: 4px;
      height: 24px;
      background: var(--el-color-primary);
      border-radius: 4px;
    }

    .header-content {
      h4 {
        margin: 0;
        font-size: 16px;
        color: #1e293b;
        font-weight: 700;
      }
      p {
        margin: 4px 0 0;
        font-size: 12px;
        color: #94a3b8;
      }
    }
  }

  /* 表单标签样式 */
  :deep(.el-form-item__label) {
    font-size: 14px;
    font-weight: 700;
    color: #334155;
    padding-bottom: 8px;
  }

  /* 输入框统一样式：与 UserInfo 一致 */
  :deep(.el-input__wrapper) {
    background-color: #f8fafc;
    box-shadow: 0 0 0 1px #e2e8f0 inset;
    border-radius: 12px;
    padding: 8px 16px;
    transition: all 0.3s ease;

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

  .pwd-hint-box {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    padding: 8px 12px;
    background: #f1f5f9;
    border-radius: 8px;
    color: #64748b;
    font-size: 12px;

    .el-icon {
      color: var(--el-color-primary);
    }
  }

  /* 底部按钮栏 */
  .form-action-bar {
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid #f1f5f9;
    display: flex;
    flex-direction: column; /* 垂直排列，在 narrow-pane 下视觉效果更好 */
    gap: 12px;

    .submit-btn {
      height: 46px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 15px;
      transition: all 0.3s;

      .mr-1 {
        margin-right: 6px;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px -6px rgba(var(--el-color-primary-rgb), 0.4);
      }
    }

    .reset-btn {
      height: 46px;
      border-radius: 12px;
      color: #94a3b8;
      border: 1px solid #e2e8f0;
      background: transparent;

      &:hover {
        background: #f8fafc;
        color: #64748b;
      }
    }
  }
}
</style>
