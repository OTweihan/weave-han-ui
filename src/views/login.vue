<template>
  <div class="relative flex min-h-screen flex-col justify-center items-center bg-gray-50 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8 flex flex-col items-center">
      <div class="text-center">
        <h1 class="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          {{ title }}
        </h1>
      </div>

      <div class="w-full bg-white rounded-2xl shadow-xl ring-1 ring-gray-900/5 p-8 sm:p-10">
        <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="space-y-6">
          <el-form-item prop="username" class="!mb-5">
            <div class="font-medium text-gray-700 mb-1.5 text-sm ml-1">{{ proxy.$t('login.username') }}</div>
            <el-input
              v-model="loginForm.username"
              type="text"
              size="large"
              auto-complete="off"
              :placeholder="proxy.$t('login.username')"
              class="!h-11 login-input"
            >
              <template #prefix><svg-icon icon-class="user" class="text-gray-400 text-lg" /></template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password" class="!mb-5">
            <div class="font-medium text-gray-700 mb-1.5 text-sm ml-1">{{ proxy.$t('login.password') }}</div>
            <el-input
              v-model="loginForm.password"
              type="password"
              size="large"
              auto-complete="off"
              :placeholder="proxy.$t('login.password')"
              @keyup.enter="handleLogin"
              show-password
              class="!h-11 login-input"
            >
              <template #prefix><svg-icon icon-class="password" class="text-gray-400 text-lg" /></template>
            </el-input>
          </el-form-item>

          <el-form-item v-if="captchaEnabled" prop="code" class="!mb-5">
            <div class="font-medium text-gray-700 mb-1.5 text-sm ml-1">{{ proxy.$t('login.code') }}</div>
            <div class="flex items-center gap-3 w-full">
              <el-input
                v-model="loginForm.code"
                size="large"
                auto-complete="off"
                :placeholder="proxy.$t('login.code')"
                class="flex-1 !h-11 login-input"
                @keyup.enter="handleLogin"
              >
                <template #prefix><svg-icon icon-class="validCode" class="text-gray-400 text-lg" /></template>
              </el-input>
              <div class="w-[110px] h-[44px] overflow-hidden rounded-md border border-gray-200 hover:shadow-sm transition-shadow">
                <img :src="codeUrl" class="w-full h-full object-cover cursor-pointer" @click="getCode" title="点击切换验证码" />
              </div>
            </div>
          </el-form-item>

          <div class="flex items-center justify-between">
            <el-checkbox v-model="loginForm.rememberMe" class="!text-gray-600">{{ proxy.$t('login.rememberPassword') }}</el-checkbox>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400">其他登录</span>
              <div
                class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-green-50 text-gray-400 hover:text-green-600 cursor-pointer transition-colors duration-300 border border-gray-100"
                :title="proxy.$t('login.social.wechat')"
                @click="doSocialLogin('wechat')"
              >
                <svg-icon icon-class="wechat" class="text-lg" />
              </div>
            </div>
          </div>

          <el-form-item class="!mb-0">
            <el-button
              :loading="loading"
              size="large"
              type="primary"
              class="!w-full !h-11 !rounded-lg !text-base !font-semibold !bg-blue-600 hover:!bg-blue-700 !border-none shadow-md hover:shadow-lg transition-all duration-300"
              @click.prevent="handleLogin"
            >
              <span v-if="!loading">{{ proxy.$t('login.login') }}</span>
              <span v-else>{{ proxy.$t('login.logging') }}</span>
            </el-button>
          </el-form-item>
        </el-form>

        <div class="mt-6 flex items-center justify-between text-sm">
          <router-link v-if="register" to="/register" class="font-medium text-blue-600 hover:text-blue-500 transition-colors">
            {{ proxy.$t('login.switchRegisterPage') }}
          </router-link>
          <div class="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" @click="goToMain">返回网站 &rarr;</div>
        </div>
      </div>
    </div>

    <div class="absolute bottom-6 w-full text-center text-xs text-gray-400">
      &copy; {{ new Date().getFullYear() }} {{ title }}. All rights reserved.
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCodeImg } from '@/api/login';
import { authBinding } from '@/api/system/social/auth';
import { useUserStore } from '@/store/modules/user';
import { LoginData } from '@/api/types';
import { to } from 'await-to-js';
import { HttpStatus } from '@/enums/RespEnum';
import { useI18n } from 'vue-i18n';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const title = import.meta.env.VITE_APP_TITLE;
const userStore = useUserStore();
const router = useRouter();
const { t } = useI18n();

const loginForm = ref<LoginData>({
  username: 'admin',
  password: 'admin123',
  rememberMe: false,
  code: '',
  uuid: ''
} as LoginData);

const loginRules: ElFormRules = {
  username: [{ required: true, trigger: 'blur', message: t('login.rule.username.required') }],
  password: [{ required: true, trigger: 'blur', message: t('login.rule.password.required') }],
  code: [{ required: true, trigger: 'change', message: t('login.rule.code.required') }]
};

const codeUrl = ref('');
const loading = ref(false);
const captchaEnabled = ref(true);
const register = ref(true);
const redirect = ref('/');
const loginRef = ref<ElFormInstance>();

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
        localStorage.setItem('username', String(loginForm.value.username));
        localStorage.setItem('password', String(loginForm.value.password));
        localStorage.setItem('rememberMe', String(loginForm.value.rememberMe));
      } else {
        localStorage.removeItem('username');
        localStorage.removeItem('password');
        localStorage.removeItem('rememberMe');
      }
      const [err] = await to(userStore.login(loginForm.value));
      if (!err) {
        const redirectUrl = redirect.value || '/';
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
  const username = localStorage.getItem('username');
  const password = localStorage.getItem('password');
  const rememberMe = localStorage.getItem('rememberMe');
  loginForm.value = {
    username: username === null ? String(loginForm.value.username) : username,
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

onMounted(() => {
  getCode();
  getLoginData();
});
</script>
