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

type NoticeItem = {
  read?: boolean;
};

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

// 未读消息数：由 store 派生，避免额外深度监听
const newNotice = computed(() => {
  const notices = noticeStore.state.value.notices as NoticeItem[] | undefined;
  return notices?.filter((item) => !item.read).length ?? 0;
});

// 搜索菜单
const searchMenuRef = ref<InstanceType<typeof SearchMenu>>();

const openSearchMenu = () => {
  searchMenuRef.value?.openSearch();
};

// 用户确认后退出并回到登录页
const logout = async () => {
  try {
    await ElMessageBox.confirm('确定注销并退出系统吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    } as ElMessageBoxOptions);

    await userStore.logout();
    router.replace({
      path: '/login',
      query: {
        redirect: encodeURIComponent(router.currentRoute.value.fullPath || '/')
      }
    });
    proxy?.$tab.closeAllPage();
  } catch {
    // 用户取消时不做额外处理
  }
};

type NavbarCommand = 'logout';

// 命令映射：下拉菜单按 command 路由到对应处理函数
const commandMap: Record<NavbarCommand, () => Promise<void>> = {
  logout
};

const handleCommand = (command: string) => {
  const action = commandMap[command as NavbarCommand];
  action?.();
};
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
  /* 优化：使用偏中性的玻璃参数，如果你有暗黑模式，建议换成 var(--el-bg-color-overlay) */
  --nav-glass-bg: rgba(255, 255, 255, 0.65);
  --nav-glass-border: rgba(0, 0, 0, 0.06);
  --nav-glass-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);

  position: relative;
  z-index: 1000;
  display: flex;
  align-items: center;
  height: 54px; /* 稍微增高一点，呼吸感更好 */
  padding: 0 16px;
  margin: 0px 8px 0 8px; /* 留出顶部间距，形成真正的悬浮岛 */

  background: var(--nav-glass-bg);
  border: 1px solid var(--nav-glass-border);
  border-bottom: none;
  border-radius: 12px 12px 0 0 !important; /* 更现代的大圆角 */
  box-shadow: var(--nav-glass-shadow);

  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  transition: background 0.3s ease;

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
    gap: 4px; /* 使用 gap 控制间距，替代 margin */

    .right-menu-item {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      font-size: 18px;
      color: #4b5b76;
      border-radius: 8px; /* 统一的交互圆角 */
      transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);

      &.hover-effect {
        cursor: pointer;
        &:hover {
          background: rgba(0, 0, 0, 0.05);
          color: var(--el-color-primary);
          transform: translateY(-1px); /* 微悬浮 */
        }
        &:active {
          transform: translateY(1px); /* 按压反馈 */
        }
      }
    }
  }

  .avatar-container {
    display: flex;
    align-items: center;
    margin-left: 8px;
    padding-left: 8px;
    position: relative;

    /* 头像左侧加一个极淡的分割线 */
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      height: 20px;
      width: 1px;
      background: rgba(0, 0, 0, 0.08);
    }

    :deep(.right-menu-item) {
      width: auto !important;
      height: auto !important;
      background: transparent !important;
      transform: none !important;
      box-shadow: none !important;
      outline: none !important;
    }

    .avatar-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      border-radius: 30px;
      cursor: pointer;
      transition: background 0.2s;
      box-shadow: none !important;

      &:hover {
        background: rgba(0, 0, 0, 0.05);

        .icon-caret {
          transform: rotate(180deg);
        }
      }

      .user-avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 1px solid rgba(0, 0, 0, 0.1);
        box-shadow: none !important;
        object-fit: cover;
      }

      .icon-caret {
        font-size: 12px;
        color: #8da0b4;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
    }
  }
}
</style>
