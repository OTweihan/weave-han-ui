<template>
  <div :class="classObj" class="app-wrapper" :style="{ '--current-color': theme }">
    <div class="layout-bg" aria-hidden="true">
      <span class="bg-mesh"></span>
      <span class="bg-light-sweep"></span>
      <span class="bg-orb bg-orb-a"></span>
      <span class="bg-orb bg-orb-b"></span>
      <span class="bg-orb bg-orb-c"></span>
    </div>
    <div v-if="device === 'mobile' && sidebar.opened" class="drawer-bg" @click="handleClickOutside" />
    <side-bar v-if="!sidebar.hide" class="sidebar-container" />
    <div :class="{ hasTagsView: needTagsView, sidebarHide: sidebar.hide }" class="main-container">
      <div class="layout-header" :class="{ 'fixed-header': fixedHeader }">
        <navbar ref="navbarRef" />
        <tags-view v-if="needTagsView" />
      </div>
      <app-main />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/store/modules/app';
import { useSettingsStore } from '@/store/modules/settings';
import { initSSE } from '@/utils/sse';
import { initWebSocket } from '@/utils/websocket';
import { AppMain, Navbar, TagsView } from './components';
import SideBar from './components/Sidebar/index.vue';

const settingsStore = useSettingsStore();
const theme = computed(() => settingsStore.theme);
const sidebar = computed(() => useAppStore().sidebar);
const device = computed(() => useAppStore().device);
const needTagsView = computed(() => settingsStore.tagsView);
const fixedHeader = computed(() => settingsStore.fixedHeader);

const classObj = computed(() => ({
  hideSidebar: device.value === 'mobile' ? !sidebar.value.opened : false,
  openSidebar: device.value === 'mobile' ? sidebar.value.opened : true,
  withoutAnimation: sidebar.value.withoutAnimation,
  mobile: device.value === 'mobile'
}));

const { width } = useWindowSize();
const WIDTH = 992; // refer to Bootstrap's responsive design

watchEffect(() => {
  if (device.value === 'mobile') {
    useAppStore().closeSideBar({ withoutAnimation: false });
  }
  if (width.value - 1 < WIDTH) {
    useAppStore().toggleDevice('mobile');
    useAppStore().closeSideBar({ withoutAnimation: true });
  } else {
    useAppStore().toggleDevice('desktop');
  }
});

const navbarRef = ref<InstanceType<typeof Navbar>>();

// 初始化租户列表功能已移除，保留空钩子用于后续扩展
onMounted(() => {
  // 租户相关功能已移除
});

onMounted(() => {
  const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
  initWebSocket(protocol + window.location.host + import.meta.env.VITE_APP_BASE_API + '/resource/websocket');
});

onMounted(() => {
  initSSE(import.meta.env.VITE_APP_BASE_API + '/resource/sse');
});

const handleClickOutside = () => {
  useAppStore().closeSideBar({ withoutAnimation: false });
};
</script>

<style lang="scss" scoped>
@use '@/assets/styles/mixin.scss';
@use '@/assets/styles/variables.module.scss' as *;

.app-wrapper {
  @include mixin.clearfix;
  position: relative;
  height: 100%;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
  background: #ffffff;

  &.mobile.openSidebar {
    position: fixed;
    top: 0;
  }
}

.layout-bg {
  display: none;
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.bg-mesh {
  position: absolute;
  inset: -120px;
  background:
    repeating-linear-gradient(120deg, rgba(255, 255, 255, 0.16) 0, rgba(255, 255, 255, 0.16) 1px, transparent 1px, transparent 24px),
    repeating-linear-gradient(30deg, rgba(255, 255, 255, 0.12) 0, rgba(255, 255, 255, 0.12) 1px, transparent 1px, transparent 22px);
  opacity: 0.28;
}

.bg-light-sweep {
  position: absolute;
  width: 720px;
  height: 720px;
  left: -240px;
  top: -240px;
  border-radius: 50%;
  background: conic-gradient(
    from 40deg,
    rgba(255, 255, 255, 0.4),
    rgba(255, 255, 255, 0) 32%,
    rgba(111, 167, 235, 0.22) 58%,
    rgba(255, 255, 255, 0.06) 76%,
    rgba(255, 255, 255, 0.4)
  );
  filter: blur(34px);
  opacity: 0.45;
}

.bg-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(4px);
  opacity: 0.42;
}

.bg-orb-a {
  width: 440px;
  height: 440px;
  background: radial-gradient(circle, rgba(115, 170, 234, 0.34), rgba(115, 170, 234, 0));
  top: -150px;
  left: -110px;
}

.bg-orb-b {
  width: 520px;
  height: 520px;
  background: radial-gradient(circle, rgba(88, 142, 208, 0.24), rgba(88, 142, 208, 0));
  right: -180px;
  top: 36%;
}

.bg-orb-c {
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, rgba(77, 180, 202, 0.22), rgba(77, 180, 202, 0));
  left: 42%;
  bottom: -140px;
}

.sidebar-container,
.main-container {
  position: relative;
  z-index: 2;
}

.drawer-bg {
  background: #000;
  opacity: 0.3;
  width: 100%;
  top: 0;
  height: 100%;
  position: absolute;
  z-index: 999;
}

.layout-header {
  padding-top: 12px;
}

.fixed-header {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9;
  width: calc(100% - #{$base-sidebar-width});
  transition: width 0.28s;
  background: $fixed-header-bg;
}

.sidebarHide .fixed-header {
  width: 100%;
}

.mobile .fixed-header {
  width: 100%;
}
</style>
