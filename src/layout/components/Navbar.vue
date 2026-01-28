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
                    offset: [0, 0]
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
        <el-dropdown class="right-menu-item hover-effect" trigger="click" @command="handleCommand">
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
import SearchMenu from './TopBar/search.vue';
import { useAppStore } from '@/store/modules/app';
import { useUserStore } from '@/store/modules/user';
import { useSettingsStore } from '@/store/modules/settings';
import { useNoticeStore } from '@/store/modules/notice';
import notice from './notice/index.vue';
import router from '@/router';
import { ElMessageBoxOptions } from 'element-plus/es/components/message-box/src/message-box.type';
import { CaretBottom } from '@element-plus/icons-vue';

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

.navbar {
  height: 55px;
  overflow: hidden;
  position: relative;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  z-index: 1000;

  .breadcrumb-container {
    float: left;
    height: 100%;
    display: flex;
    align-items: center;
  }

  .topmenu-container {
    position: absolute;
    left: 50px;
  }

  .errLog-container {
    display: inline-block;
    vertical-align: top;
  }

  .right-menu {
    float: right;
    height: 100%;
    line-height: 55px;
    display: flex;
    align-items: center;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 8px;
      height: 34px;
      border-radius: 8px;
      margin: 0 4px;
      font-size: 18px;
      color: #606266;
      vertical-align: text-bottom;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

      &.hover-effect {
        cursor: pointer;
        position: relative;

        &:hover {
          background: rgba(0, 0, 0, 0.05);
          color: var(--el-color-primary, #409eff);
        }
      }

      :deep(svg) {
        vertical-align: middle;
      }
    }

    .avatar-container {
      margin-right: 20px;
      padding-left: 0;
      height: 100%;
      display: flex;
      align-items: center;

      .right-menu-item {
        height: 100%;
        margin: 0;
        border-radius: 0;

        &:hover {
          background: rgba(0, 0, 0, 0.025);
          color: inherit;
        }
      }

      .avatar-wrapper {
        margin-top: 0;
        position: relative;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
          border: 2px solid #fff;

          &:hover {
            transform: scale(1.05);
          }
        }

        .icon-caret {
          font-size: 12px;
          color: #909399;
          transition: transform 0.3s;
        }

        &:hover .icon-caret {
          transform: rotate(180deg);
        }
      }
    }
  }
}
</style>
