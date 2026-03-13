<template>
  <div class="login-page">
    <div class="login-bg">
      <span class="bg-mesh"></span>
      <span class="bg-light-sweep"></span>
      <span class="bg-orb bg-orb-a"></span>
      <span class="bg-orb bg-orb-b"></span>
      <span class="bg-orb bg-orb-c"></span>
    </div>

    <div class="login-shell">
      <section class="login-card">
        <div class="card-header">
          <div class="card-header-top">
            <p class="brand-kicker">WEAVE HAN</p>
          </div>
          <h1 class="brand-title">{{ title }}</h1>
          <h2>{{ proxy.$t('register.register') }}</h2>
          <p>欢迎加入，请完成账号创建</p>
        </div>

        <el-form ref="registerRef" :model="registerForm" :rules="registerRules" class="login-form">
          <el-form-item prop="userAccount">
            <div class="field-label">{{ proxy.$t('register.username') }}</div>
            <el-input
              v-model="registerForm.userAccount"
              type="text"
              size="large"
              auto-complete="off"
              :placeholder="proxy.$t('register.username')"
              class="login-input"
            >
              <template #prefix><svg-icon icon-class="user" class="input-icon" /></template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <div class="field-label">{{ proxy.$t('register.password') }}</div>
            <el-input
              v-model="registerForm.password"
              type="password"
              size="large"
              auto-complete="off"
              :placeholder="proxy.$t('register.password')"
              class="login-input"
              @keyup.enter="handleRegister"
            >
              <template #prefix><svg-icon icon-class="password" class="input-icon" /></template>
            </el-input>
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <div class="field-label">{{ proxy.$t('register.confirmPassword') }}</div>
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              size="large"
              auto-complete="off"
              :placeholder="proxy.$t('register.confirmPassword')"
              class="login-input"
              @keyup.enter="handleRegister"
            >
              <template #prefix><svg-icon icon-class="password" class="input-icon" /></template>
            </el-input>
          </el-form-item>

          <el-form-item v-if="captchaEnabled" prop="code">
            <div class="field-label">{{ proxy.$t('register.code') }}</div>
            <div class="captcha-row">
              <el-input
                v-model="registerForm.code"
                size="large"
                auto-complete="off"
                :placeholder="proxy.$t('register.code')"
                class="login-input captcha-input"
                @keyup.enter="handleRegister"
              >
                <template #prefix><svg-icon icon-class="validCode" class="input-icon" /></template>
              </el-input>
              <div class="captcha-box">
                <img :src="codeUrl" class="captcha-image" @click="getCode" title="点击切换验证码" alt="" />
              </div>
            </div>
          </el-form-item>

          <el-form-item class="login-submit">
            <el-button
              :loading="loading"
              size="large"
              type="primary"
              class="submit-btn"
              :style="submitBtnStyle"
              @mousemove="handleSubmitMouseMove"
              @mouseleave="resetSubmitMouse"
              @click.prevent="handleRegister"
            >
              <span v-if="!loading">{{ proxy.$t('register.register') }}</span>
              <span v-else>{{ proxy.$t('register.registering') }}</span>
            </el-button>
          </el-form-item>
        </el-form>

        <div class="card-footer register-footer-actions">
          <router-link class="register-link" :to="'/login'">{{ proxy.$t('register.switchLoginPage') }}</router-link>
        </div>
      </section>
    </div>

    <div class="login-copyright">&copy; {{ new Date().getFullYear() }} {{ title }}. All rights reserved.</div>
  </div>
</template>

<script setup lang="ts">
import { getCodeImg, register } from '@/api/login';
import { RegisterForm } from '@/api/types';
import { to } from 'await-to-js';
import { useI18n } from 'vue-i18n';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const title = import.meta.env.VITE_APP_TITLE;
const router = useRouter();

const { t } = useI18n();

const registerForm = ref<RegisterForm>({
  userAccount: '',
  password: '',
  confirmPassword: '',
  code: '',
  uuid: '',
  userType: 'sys_user'
});

const equalToPassword = (_rule: any, value: string, callback: any) => {
  if (registerForm.value.password !== value) {
    callback(new Error(t('register.rule.confirmPassword.equalToPassword')));
  } else {
    callback();
  }
};

const registerRules: ElFormRules = {
  userAccount: [
    { required: true, trigger: 'blur', message: t('register.rule.username.required') },
    { min: 2, max: 20, message: t('register.rule.username.length', { min: 2, max: 20 }), trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9]+$/, message: '用户账号只能包含英文字母和数字', trigger: 'blur' }
  ],
  password: [
    { required: true, trigger: 'blur', message: t('register.rule.password.required') },
    { min: 5, max: 20, message: t('register.rule.password.length', { min: 5, max: 20 }), trigger: 'blur' },
    { pattern: /^[^<>"'|\\]+$/, message: t('register.rule.password.pattern', { strings: '< > " \' \\ |' }), trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, trigger: 'blur', message: t('register.rule.confirmPassword.required') },
    { required: true, validator: equalToPassword, trigger: 'blur' }
  ],
  code: [{ required: true, trigger: 'change', message: t('register.rule.code.required') }]
};

const codeUrl = ref('');
const loading = ref(false);
const captchaEnabled = ref(true);
const registerRef = ref<ElFormInstance>();

const submitHoverPos = ref({ x: '50%', y: '50%' });
let submitResetTimer: ReturnType<typeof setTimeout> | null = null;

const submitBtnStyle = computed<Record<string, string>>(() => ({
  '--mx': submitHoverPos.value.x,
  '--my': submitHoverPos.value.y
}));

const handleRegister = () => {
  registerRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true;
      const [err] = await to(register(registerForm.value));
      if (!err) {
        const username = registerForm.value.userAccount;
        await ElMessageBox.alert('<span style="color: red; ">' + t('register.registerSuccess', { username }) + '</span>', '系统提示', {
          dangerouslyUseHTMLString: true,
          type: 'success'
        });
        await router.push('/login');
      } else {
        loading.value = false;
        if (captchaEnabled.value) {
          await getCode();
        }
      }
    }
  });
};

const getCode = async () => {
  const res = await getCodeImg();
  const { data } = res;
  captchaEnabled.value = data.captchaEnabled === undefined ? true : data.captchaEnabled;
  if (captchaEnabled.value) {
    codeUrl.value = 'data:image/gif;base64,' + data.img;
    registerForm.value.uuid = data.uuid;
  }
};

const handleSubmitMouseMove = (event: MouseEvent) => {
  if (submitResetTimer) {
    clearTimeout(submitResetTimer);
    submitResetTimer = null;
  }
  const target = event.currentTarget as HTMLElement | null;
  if (!target) {
    return;
  }
  const rect = target.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  submitHoverPos.value = {
    x: `${x.toFixed(2)}%`,
    y: `${y.toFixed(2)}%`
  };
};

const resetSubmitMouse = () => {
  if (submitResetTimer) {
    clearTimeout(submitResetTimer);
  }
  submitResetTimer = setTimeout(() => {
    submitHoverPos.value = { x: '50%', y: '50%' };
    submitResetTimer = null;
  }, 260);
};

onMounted(() => {
  getCode();
});

onBeforeUnmount(() => {
  if (submitResetTimer) {
    clearTimeout(submitResetTimer);
    submitResetTimer = null;
  }
});
</script>

<style scoped src="../assets/styles/views/register.css"></style>
