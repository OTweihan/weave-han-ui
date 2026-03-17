<template>
  <div class="sidebar-shell" :class="{ 'has-logo': showLogo }" :style="{ backgroundColor: menuBackgroundColor }">
    <div v-if="showLogo" class="sidebar-logo-box">
      <logo />
    </div>
    <div class="sidebar-menu-box">
      <el-scrollbar :class="sideTheme" wrap-class="scrollbar-wrapper">
        <transition :enter-active-class="proxy?.animate.menuSearchAnimate.enter" mode="out-in">
          <el-menu
            :default-active="activeMenu"
            :collapse="isCollapse"
            :background-color="menuBackgroundColor"
            :text-color="menuTextColor"
            :unique-opened="true"
            :active-text-color="theme"
            :collapse-transition="false"
            :popper-offset="12"
            mode="vertical"
          >
            <sidebar-item v-for="(r, index) in sidebarRouters" :key="r.path + index" :item="r" :base-path="r.path" />
          </el-menu>
        </transition>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import variables from '@/assets/styles/variables.module.scss';
import { usePermissionStore } from '@/store/modules/permission';
import { useSettingsStore } from '@/store/modules/settings';
import { RouteRecordRaw } from 'vue-router';
import Logo from './Logo.vue';
import SidebarItem from './SidebarItem.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const route = useRoute();
const settingsStore = useSettingsStore();
const permissionStore = usePermissionStore();
const sidebarRouters = computed<RouteRecordRaw[]>(() => permissionStore.getSidebarRoutes());
const showLogo = computed(() => settingsStore.sidebarLogo);
const sideTheme = computed(() => settingsStore.sideTheme);
const theme = computed(() => settingsStore.theme);

// 当前设计不走折叠态，保留常量便于后续切回 store 控制。
const isCollapse = false;

// 路由声明了 activeMenu 时优先使用，兼容“详情页高亮列表菜单”场景。
const activeMenu = computed(() => {
  const { meta, path } = route;
  if (meta.activeMenu) {
    return meta.activeMenu;
  }
  return path;
});

// 亚克力侧栏使用透明背景，颜色由样式层统一接管。
const menuBackgroundColor = 'transparent';
const menuTextColor = computed(() => (sideTheme.value === 'theme-dark' ? variables.menuColor : 'rgba(26, 49, 78, 0.88)'));
</script>
