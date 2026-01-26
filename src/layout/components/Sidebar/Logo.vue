<template>
  <div class="sidebar-logo-container">
    <transition name="sidebarLogoFade">
      <router-link key="expand" class="sidebar-logo-link" to="/index/home">
        <h1 class="sidebar-title">{{ title }}</h1>
      </router-link>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from '@/store/modules/settings';

const title = import.meta.env.VITE_APP_LOGO_TITLE;
const settingsStore = useSettingsStore();
computed(() => settingsStore.sideTheme);
</script>

<style lang="scss" scoped>
.sidebarLogoFade-enter-active {
  transition: opacity 0.3s;
}

.sidebarLogoFade-leave-active {
  transition: opacity 0.3s;
}

.sidebarLogoFade-enter-from,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 50px;
  line-height: 50px;
  background: #ffffff;
  text-align: center;
  overflow: hidden;

  & .sidebar-logo-link {
    height: 100%;
    width: 100%;
    display: flex !important;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    position: absolute;
    left: 0;
    top: 0;

    & .logo-mark {
      width: 32px;
      height: 32px;
      line-height: 32px;
      background: linear-gradient(220.55deg, #7cf7ff 0%, #4b73ff 100%);
      color: #fff;
      font-weight: 700;
      font-size: 18px;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(75, 115, 255, 0.3);
      user-select: none;
    }

    & .sidebar-title {
      display: inline-block;
      margin: 0;
      font-weight: 700;
      line-height: 50px;
      font-size: 20px;
      font-family: Avenir, 'Helvetica Neue', Arial, Helvetica, sans-serif;
      vertical-align: middle;
      background: linear-gradient(220.55deg, #7cf7ff 0%, #4b73ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: 0.5px;
      user-select: none;
      white-space: nowrap;
    }
  }
}
</style>
