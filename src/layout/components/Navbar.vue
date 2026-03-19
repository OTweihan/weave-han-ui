<template>
  <div class="navbar">
    <breadcrumb v-if="!settingsStore.topNav" id="breadcrumb-container" class="breadcrumb-container" />
    <top-nav v-if="settingsStore.topNav" id="topmenu-container" class="topmenu-container" />

    <div class="right-menu flex align-center">
      <template v-if="appStore.device !== 'mobile'">
        <search-menu ref="searchMenuRef" />
        <div class="right-menu-item hover-effect" @click="openSearchMenu">
          <svg-icon class-name="search-icon" icon-class="search" />
        </div>

        <!-- 消息 -->
        <div class="right-menu-item hover-effect">
          <el-popover
            placement="bottom"
            trigger="hover"
            transition="el-zoom-in-top"
            :width="300"
            :persistent="false"
            :popper-options="{
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, 20]
                  }
                }
              ]
            }"
          >
            <template #reference>
              <el-badge :value="newNotice > 0 ? newNotice : ''" :max="99" class="message-badge">
                <svg-icon icon-class="message" />
              </el-badge>
            </template>
            <template #default>
              <notice></notice>
            </template>
          </el-popover>
        </div>

        <screenfull id="screenfull" class="right-menu-item hover-effect" />

        <lang-select id="lang-select" class="right-menu-item hover-effect" />
      </template>
      <div class="avatar-container">
        <el-dropdown class="right-menu-item hover-effect" trigger="hover" @command="handleCommand">
          <div class="avatar-wrapper">
            <img :src="userStore.avatar" class="user-avatar" alt="" />
            <el-icon class="icon-caret"><caret-bottom /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu class="user-dropdown">
              <router-link to="/user/profile">
                <el-dropdown-item>{{ proxy.$t('navbar.personalCenter') }}</el-dropdown-item>
              </router-link>
              <el-dropdown-item divided command="logout">
                <span>{{ proxy.$t('navbar.logout') }}</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import router from '@/router';
import { useAppStore } from '@/store/modules/app';
import { useNoticeStore } from '@/store/modules/notice';
import { useSettingsStore } from '@/store/modules/settings';
import { useUserStore } from '@/store/modules/user';
import { CaretBottom } from '@element-plus/icons-vue';
import { ElMessageBoxOptions } from 'element-plus/es/components/message-box/src/message-box.type';
import notice from './notice/index.vue';
import SearchMenu from './TopBar/search.vue';

const appStore = useAppStore();
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const noticeStore = storeToRefs(useNoticeStore());
const newNotice = ref(<number>0);

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

// 搜索菜单
const searchMenuRef = ref<InstanceType<typeof SearchMenu>>();

const openSearchMenu = () => {
  searchMenuRef.value?.openSearch();
};

const logout = async () => {
  await ElMessageBox.confirm('确定注销并退出系统吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  } as ElMessageBoxOptions);
  userStore.logout().then(() => {
    router.replace({
      path: '/login',
      query: {
        redirect: encodeURIComponent(router.currentRoute.value.fullPath || '/')
      }
    });
    proxy?.$tab.closeAllPage();
  });
};

// 定义Command方法对象 通过key直接调用方法
const commandMap: { [key: string]: any } = {
  logout
};

const handleCommand = (command: string) => {
  // 判断是否存在该方法
  if (commandMap[command]) {
    commandMap[command]();
  }
};

//用深度监听 消息
watch(
  () => noticeStore.state.value.notices,
  (newVal) => {
    newNotice.value = newVal.filter((item: any) => !item.read).length;
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
/* Element Plus 样式覆盖 */
:deep(.el-select .el-input__wrapper) {
  height: 30px;
}

:deep(.el-badge__content.is-fixed) {
  top: 10px;
  right: 5px;
  transform: scale(0.8);
}

.flex {
  display: flex;
}

.align-center {
  align-items: center;
}

/* 导航栏主体 */
.navbar {
  /* 统一的玻璃拟态变量 */
  --nav-glass-bg: rgba(255, 255, 255, 0.85);
  --nav-glass-border: rgba(0, 0, 0, 0.1);
  --nav-glass-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
  --nav-glass-shadow-hover: inset 0 0 0 1px rgba(64, 158, 255, 0.25);

  height: 50px;
  overflow: visible;
  position: relative;
  background: var(--nav-glass-bg);
  border: 1px solid var(--nav-glass-border);
  border-bottom: none;
  box-shadow: var(--nav-glass-shadow);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 4px 4px 0 0 !important;
  z-index: 1000;
  display: flex;
  align-items: center;
  padding: 0 20px;
  margin-right: 8px;
  margin-left: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: rgba(0, 0, 0, 0.2);
    box-shadow: var(--nav-glass-shadow-hover);
  }

  .breadcrumb-container {
    height: 100%;
    display: flex;
    align-items: center;
  }

  .topmenu-container {
    position: absolute;
    left: 50px;
  }

  .right-menu {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    height: 100%;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 8px;
      height: 36px;
      margin: 0 4px;
      font-size: 18px;
      color: rgba(30, 45, 70, 0.75);
      border: 1px solid transparent;
      transition: all 0.3s ease;

      &.hover-effect {
        cursor: pointer;
        position: relative;

        &:hover {
          background: rgba(0, 0, 0, 0.04);
          color: #1a2a44;
          border-color: transparent;
        }
      }
    }

    :deep(svg) {
      vertical-align: middle;
    }
  }

  .avatar-container {
    margin-right: 0;
    padding-left: 0;
    height: auto;
    display: flex;
    align-items: center;

    .right-menu-item {
      height: 40px;
      margin: 0 0 0 6px;
    }

    .avatar-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 0 10px;
      height: 40px;
      border-radius: 8px;
      border: 1px solid transparent;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(0, 0, 0, 0.04);
      }

      .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        box-shadow: none;
        border: 1px solid rgba(0, 0, 0, 0.1);
        transition: transform 0.3s ease;

        &:hover {
          transform: scale(1.05);
        }
      }

      .icon-caret {
        font-size: 12px;
        color: #4b5b76;
        transition: transform 0.3s;
      }

      &:hover .icon-caret {
        transform: rotate(180deg);
      }
    }
  }
}
</style>
