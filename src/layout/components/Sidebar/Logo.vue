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

// 标题优先级：自定义 Logo 标题 > 应用标题 > 默认标题。
const resolveLogoTitle = (): string => {
  const candidates = [import.meta.env.VITE_APP_LOGO_TITLE, import.meta.env.VITE_APP_TITLE, 'Weave-Han'];
  const value = candidates.map((item) => String(item ?? '').trim()).find((item) => item.length > 0);
  return value || 'Weave-Han';
};

const logoTitle = computed(resolveLogoTitle);
</script>

<style lang="scss" scoped>
.sidebarLogoFade-enter-active,
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
}

// 保持图标和标题在玻璃容器中居中展示。
.sidebar-logo-link {
  width: 100%;
  height: 100%;
  display: flex !important;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  position: relative;
  z-index: 2;
  gap: 4px;
  border-radius: 12px;
  border: none;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  overflow: visible;
}

.sidebar-logo-image {
  width: 70px;
  height: 70px;
  object-fit: contain;
  user-select: none;
  transition: transform 0.3s ease;
}

.sidebar-logo-link:hover .sidebar-logo-image {
  transform: scale(1.1);
}

.sidebar-title {
  display: inline-block;
  margin: 0;
  max-width: none;
  overflow: visible;
  text-overflow: clip;
  font-weight: 700;
  line-height: 1;
  font-size: 22px;
  font-family: 'Manrope', 'Noto Sans SC', 'PingFang SC', sans-serif;
  vertical-align: middle;
  color: #214f83 !important;
  letter-spacing: 0.02em;
  visibility: visible !important;
  opacity: 1 !important;
  user-select: none;
  white-space: nowrap;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.sidebar-logo-link:hover .sidebar-title {
  transform: scale(1.1);
}
</style>
