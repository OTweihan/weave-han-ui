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
        <span class="card-ambient card-ambient-a"></span>
        <span class="card-ambient card-ambient-b"></span>
        <div class="card-header">
          <p class="brand-kicker">WEAVE HAN</p>
          <h1 class="brand-title">{{ title }}</h1>
          <h2>{{ proxy.$t('login.login') }}</h2>
          <p>欢迎回来，请完成身份验证</p>
        </div>

        <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form">
          <el-form-item prop="userAccount">
            <div class="field-label">{{ proxy.$t('login.username') }}</div>
            <el-input
              v-model="loginForm.userAccount"
              type="text"
              size="large"
              auto-complete="off"
              :placeholder="proxy.$t('login.username')"
              class="login-input"
            >
              <template #prefix><svg-icon icon-class="user" class="input-icon" /></template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <div class="field-label">{{ proxy.$t('login.password') }}</div>
            <el-input
              v-model="loginForm.password"
              type="password"
              size="large"
              auto-complete="off"
              :placeholder="proxy.$t('login.password')"
              @keyup.enter="handleLogin"
              show-password
              class="login-input"
            >
              <template #prefix><svg-icon icon-class="password" class="input-icon" /></template>
            </el-input>
          </el-form-item>

          <el-form-item v-if="captchaEnabled" prop="code">
            <div class="field-label">{{ proxy.$t('login.code') }}</div>
            <div class="captcha-row">
              <el-input
                v-model="loginForm.code"
                size="large"
                auto-complete="off"
                :placeholder="proxy.$t('login.code')"
                class="login-input captcha-input"
                @keyup.enter="handleLogin"
              >
                <template #prefix><svg-icon icon-class="validCode" class="input-icon" /></template>
              </el-input>
              <div class="captcha-box">
                <img :src="codeUrl" class="captcha-image" @click="getCode" title="点击切换验证码" alt="" />
              </div>
            </div>
          </el-form-item>

          <div class="login-meta">
            <el-checkbox v-model="loginForm.rememberMe" class="remember-check">{{ proxy.$t('login.rememberPassword') }}</el-checkbox>
            <div class="social-entry">
              <span>其他登录</span>
              <button class="wechat-btn" :title="proxy.$t('login.social.wechat')" @click="doSocialLogin('wechat')">
                <svg-icon icon-class="wechat" class="text-lg" />
              </button>
            </div>
          </div>

          <el-form-item class="login-submit">
            <el-button
              :loading="loading"
              size="large"
              type="primary"
              class="submit-btn"
              :style="submitBtnStyle"
              @mousemove="handleSubmitMouseMove"
              @mouseleave="resetSubmitMouse"
              @click.prevent="handleLogin"
            >
              <span v-if="!loading">{{ proxy.$t('login.login') }}</span>
              <span v-else>{{ proxy.$t('login.logging') }}</span>
            </el-button>
          </el-form-item>
        </el-form>

        <div class="card-footer">
          <router-link v-if="register" to="/register" class="register-link">
            {{ proxy.$t('login.switchRegisterPage') }}
          </router-link>
          <button class="main-link" @click="goToMain">返回网站</button>
        </div>
      </section>
    </div>

    <div class="login-copyright">&copy; {{ new Date().getFullYear() }} {{ title }}. All rights reserved.</div>
  </div>
</template>

<script setup lang="ts">
import { getCodeImg } from '@/api/login';
import { authBinding } from '@/api/system/social/auth';
import { LoginData } from '@/api/types';
import { HttpStatus } from '@/enums/RespEnum';
import { useUserStore } from '@/store/modules/user';
import { to } from 'await-to-js';
import { useI18n } from 'vue-i18n';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const title = import.meta.env.VITE_APP_TITLE;
const userStore = useUserStore();
const router = useRouter();
const { t } = useI18n();

const loginForm = ref<LoginData>({
  userAccount: 'admin',
  password: 'admin123',
  rememberMe: false,
  code: '',
  uuid: ''
} as LoginData);

const loginRules: ElFormRules = {
  userAccount: [{ required: true, trigger: 'blur', message: t('login.rule.username.required') }],
  password: [{ required: true, trigger: 'blur', message: t('login.rule.password.required') }],
  code: [{ required: true, trigger: 'change', message: t('login.rule.code.required') }]
};

const codeUrl = ref('');
const loading = ref(false);
const captchaEnabled = ref(true);
const register = ref(true);
const redirect = ref('/index');
const loginRef = ref<ElFormInstance>();
const submitHoverPos = ref({ x: '50%', y: '50%' });
let submitResetTimer: ReturnType<typeof setTimeout> | null = null;

const submitBtnStyle = computed<Record<string, string>>(() => ({
  '--mx': submitHoverPos.value.x,
  '--my': submitHoverPos.value.y
}));

watch(
  () => router.currentRoute.value,
  (newRoute: any) => {
    redirect.value = newRoute.query && newRoute.query.redirect && decodeURIComponent(newRoute.query.redirect);
  },
  { immediate: true }
);

const handleLogin = () => {
  loginRef.value?.validate(async (valid: boolean, fields: any) => {
    if (valid) {
      loading.value = true;
      if (loginForm.value.rememberMe) {
        localStorage.setItem('userAccount', String(loginForm.value.userAccount));
        localStorage.setItem('password', String(loginForm.value.password));
        localStorage.setItem('rememberMe', String(loginForm.value.rememberMe));
      } else {
        localStorage.removeItem('userAccount');
        localStorage.removeItem('password');
        localStorage.removeItem('rememberMe');
      }
      const [err] = await to(userStore.login(loginForm.value));
      if (!err) {
        const redirectUrl = redirect.value || '/index';
        await router.push(redirectUrl);
        loading.value = false;
      } else {
        loading.value = false;
        if (captchaEnabled.value) {
          await getCode();
        }
      }
    } else {
      console.log('error submit!', fields);
    }
  });
};

const getCode = async () => {
  const res = await getCodeImg();
  const { data } = res;
  captchaEnabled.value = data.captchaEnabled === undefined ? true : data.captchaEnabled;
  if (captchaEnabled.value) {
    codeUrl.value = 'data:image/gif;base64,' + data.img;
    loginForm.value.uuid = data.uuid;
  }
};

const getLoginData = () => {
  const userAccount = localStorage.getItem('userAccount');
  const password = localStorage.getItem('password');
  const rememberMe = localStorage.getItem('rememberMe');
  loginForm.value = {
    userAccount: userAccount === null ? String(loginForm.value.userAccount) : userAccount,
    password: password === null ? String(loginForm.value.password) : String(password),
    rememberMe: rememberMe === null ? false : Boolean(rememberMe)
  } as LoginData;
};

const goToMain = () => {
  router.push('/main');
};

const doSocialLogin = (type: string) => {
  authBinding(type).then((res: any) => {
    if (res.code === HttpStatus.SUCCESS) {
      window.location.href = res.data;
    } else {
      ElMessage.error(res.msg);
    }
  });
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
  // 先淡出高光，再回到中心，避免视觉上“回弹”
  submitResetTimer = setTimeout(() => {
    submitHoverPos.value = { x: '50%', y: '50%' };
    submitResetTimer = null;
  }, 260);
};

onMounted(() => {
  getCode();
  getLoginData();
});

onBeforeUnmount(() => {
  if (submitResetTimer) {
    clearTimeout(submitResetTimer);
    submitResetTimer = null;
  }
});
</script>

<style scoped src="../assets/styles/views/login.css"></style>
