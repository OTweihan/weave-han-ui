<template>
  <div class="sidebar-logo-container">
    <transition name="sidebarLogoFade">
      <router-link key="expand" class="sidebar-logo-link" to="/index/home">
        <img :src="logoUrl" alt="logo" class="sidebar-logo-image" />
        <span class="sidebar-title" :title="logoTitle">
          {{ logoTitle }}
        </span>
      </router-link>
    </transition>
  </div>
</template>

<script setup lang="ts">
import logoUrl from '@/assets/logo/logo.png';

const logoTitle = computed(() => {
  const candidates = [import.meta.env.VITE_APP_LOGO_TITLE, import.meta.env.VITE_APP_TITLE, 'Weave-Han'];
  const value = candidates.map((item) => String(item ?? '').trim()).find((item) => item.length > 0);
  return value || 'Weave-Han';
});
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
  height: 100%;
  padding: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: visible;

  & .sidebar-logo-link {
    width: 100%;
    height: 100%;
    display: flex !important;
    align-items: center;
    justify-content: center;
    gap: 12px;
    text-decoration: none;
    position: relative;
    inset: auto;
    z-index: 2;
    border-radius: 12px;
    border: none;
    background: transparent;
    box-shadow: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    overflow: visible;

    & .sidebar-logo-image {
      width: 38px;
      height: 38px;
      object-fit: contain;
      flex: 0 0 38px;
      user-select: none;
    }

    & .sidebar-title {
      display: inline-block;
      margin: 0;
      max-width: none;
      overflow: visible;
      text-overflow: clip;
      font-weight: 700;
      line-height: 1;
      font-size: 20px;
      font-family: 'Manrope', 'Noto Sans SC', 'PingFang SC', sans-serif;
      vertical-align: middle;
      color: #214f83 !important;
      letter-spacing: 0.02em;
      visibility: visible !important;
      opacity: 1 !important;
      user-select: none;
      white-space: nowrap;
      flex-shrink: 0;
    }
  }
}
</style>
