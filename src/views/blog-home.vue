<template>
  <div class="main-container">
    <div class="header">
      <h1>欢迎使用系统</h1>
      <div class="header-actions">
        <el-button type="primary" @click="goToLogin">登录</el-button>
        <el-button @click="goToRegister">注册</el-button>
      </div>
    </div>
  </div>
</template>

<script setup data-name="blog-home" lang="ts">
import { useRouter } from 'vue-router';
import { getToken, removeToken } from '@/utils/auth';

const router = useRouter();

const goToLogin = () => {
  console.log('点击登录按钮');
  console.log('当前路由:', router.currentRoute.value.path);

  // 如果已经登录（有token），先清除token
  if (getToken()) {
    console.log('检测到已登录，清除token');
    removeToken();
  }

  router
    .push('/login')
    .then(() => {
      console.log('路由跳转成功');
      console.log('跳转后路由:', router.currentRoute.value.path);
    })
    .catch((err) => {
      console.error('路由跳转失败:', err);
    });
};

const goToRegister = () => {
  console.log('点击注册按钮, router:', router);

  // 如果已经登录（有token），先清除token
  if (getToken()) {
    console.log('检测到已登录，清除token');
    removeToken();
  }

  router
    .push('/register')
    .then(() => {
      console.log('路由跳转成功');
    })
    .catch((err) => {
      console.error('路由跳转失败:', err);
    });
};
</script>

<style lang="scss" scoped></style>
