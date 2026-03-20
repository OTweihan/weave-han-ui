<template>
  <div class="profile-layout-container">
    <el-row :gutter="20">
      <el-col :span="6" :xs="24">
        <div class="user-profile-card">
          <div class="avatar-decoration-bg"></div>

          <div class="user-info-content">
            <div class="avatar-section">
              <div class="avatar-inner-wrapper">
                <userAvatar />
              </div>
              <div class="username">{{ state.user.nickName }}</div>
              <div class="user-role-tag">{{ state.roleGroup }}</div>
            </div>

            <div class="info-list">
              <div class="info-item">
                <div class="label"><svg-icon icon-class="user" /> 用户账号</div>
                <div class="value">{{ state.user.userAccount }}</div>
              </div>
              <div class="info-item">
                <div class="label"><svg-icon icon-class="phone" /> 手机号码</div>
                <div class="value">{{ state.user.phonenumber }}</div>
              </div>
              <div class="info-item">
                <div class="label"><svg-icon icon-class="email" /> 用户邮箱</div>
                <div class="value">{{ state.user.email }}</div>
              </div>
              <div class="info-item">
                <div class="label"><svg-icon icon-class="date" /> 创建日期</div>
                <div class="value">{{ state.user.createTime }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :span="18" :xs="24">
        <div class="profile-tabs-card">
          <el-tabs v-model="activeTab" class="custom-profile-tabs">
            <el-tab-pane label="基本资料" name="userinfo">
              <div class="pane-content">
                <userInfo :user="userForm" />
              </div>
            </el-tab-pane>

            <el-tab-pane label="修改密码" name="resetPwd">
              <div class="pane-content narrow-pane">
                <resetPwd />
              </div>
            </el-tab-pane>

            <el-tab-pane label="第三方应用" name="thirdParty">
              <div class="pane-content">
                <thirdParty :auths="state.auths" />
              </div>
            </el-tab-pane>

            <el-tab-pane label="在线设备" name="onlineDevice">
              <div class="pane-content">
                <onlineDevice :devices="state.devices" />
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup data-name="Profile" lang="ts">
import { getOnline } from '@/api/monitor/online';
import { getAuthList } from '@/api/system/social/auth';
import { getUserProfile } from '@/api/system/user';
import { UserVO } from '@/api/system/user/types';
import { getCurrentInstance, onMounted, ref } from 'vue';

// 子组件导入 (确保路径正确)
import OnlineDevice from './onlineDevice.vue';
import ResetPwd from './resetPwd.vue';
import ThirdParty from './thirdParty.vue';
import UserAvatar from './userAvatar.vue';
import UserInfo from './userInfo.vue';

/** 界面状态定义 */
interface State {
  user: Partial<UserVO>;
  roleGroup: string;
  auths: any[];
  devices: any[];
}

const { proxy } = getCurrentInstance() as any;

const activeTab = ref('userinfo');
const userForm = ref({});
const state = ref<State>({
  user: {},
  roleGroup: '',
  auths: [],
  devices: []
});

/** 数据初始化 */
const getUser = async () => {
  const res = await getUserProfile();
  state.value.user = res.data.user;
  userForm.value = { ...res.data.user };
  state.value.roleGroup = res.data.roleGroup;
};

const getAuths = async () => {
  const res = await getAuthList();
  state.value.auths = res.data;
};

const getOnlines = async () => {
  const res = await getOnline();
  state.value.devices = res.rows;
};

onMounted(() => {
  getUser();
  getAuths();
  getOnlines();
});
</script>

<style lang="scss" scoped>
/* 页面背景与整体布局 */
.profile-layout-container {
  padding: 8px;
  background-color: #f8fafc; /* 浅蓝灰背景，更有现代感 */
  min-height: 100%;
}

/* 通用卡片悬浮样式定义 (公用 SCSS mixin 思想) */
@mixin card-hover-effect {
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04);

  &:hover {
    transform: translateY(-4px); /* 统一的 4px 位移 */
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.08); /* 深呼吸阴影 */
  }
}

/* --- 左侧卡片 --- */
.user-profile-card {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;

  /* 引入悬浮效果 */
  @include card-hover-effect;

  /* 顶部修饰线：代替原本的大色块 */
  .avatar-decoration-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: linear-gradient(to bottom, var(--el-color-primary-light-9), transparent);
    z-index: 0;
  }

  .user-info-content {
    position: relative;
    z-index: 1;
    padding: 35px 24px;

    .avatar-section {
      text-align: center;
      margin-bottom: 30px;

      .avatar-inner-wrapper {
        display: inline-block;
        padding: 4px;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
        margin-bottom: 16px;
      }

      .username {
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
        letter-spacing: -0.5px;
      }

      .user-role-tag {
        margin-top: 10px;
        font-size: 12px;
        font-weight: 600;
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
        padding: 4px 14px;
        border-radius: 12px;
        display: inline-block;
      }
    }

    .info-list {
      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 0;
        border-bottom: 1px dashed #f1f5f9;
        font-size: 13px;

        &:last-child {
          border-bottom: none;
        }

        .label {
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 8px;
          .svg-icon {
            font-size: 16px;
            color: #94a3b8;
          }
        }

        .value {
          color: #334155;
          font-weight: 600;
        }
      }
    }
  }
}

/* --- 右侧 Tabs 卡片 --- */
.profile-tabs-card {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 10px 32px 32px;
  min-height: 620px;

  @include card-hover-effect;

  :deep(.custom-profile-tabs) {
    .el-tabs__header {
      margin-bottom: 25px;
    }
    .el-tabs__nav-wrap::after {
      background-color: #f1f5f9;
    }
    .el-tabs__item {
      font-size: 15px;
      height: 55px;
      line-height: 55px;
      font-weight: 700;
      color: #94a3b8;
      &.is-active {
        color: var(--el-color-primary);
      }
    }
    .el-tabs__active-bar {
      height: 4px;
      border-radius: 2px;
    }
  }
}

/* 内容容器 */
.pane-content {
  padding: 8px 0;

  /* 窄表单控制（如修改密码项） */
  &.narrow-pane {
    max-width: 420px;
    margin: 0 auto;
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .profile-layout-container {
    padding: 12px;
  }
  .el-col {
    margin-bottom: 20px;
  }
}
</style>
