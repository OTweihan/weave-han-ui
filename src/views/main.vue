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

<script setup name="Main" lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goToLogin = () => {
  router.push('/login');
};

const goToRegister = () => {
  router.push('/register');
};
</script>

<style lang="scss" scoped></style>
