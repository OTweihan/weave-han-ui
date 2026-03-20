<template>
  <div class="social-auth-container">
    <div class="table-section">
      <div class="section-header">
        <h4 class="title">已绑定账号管理</h4>
      </div>

      <el-table :data="auths" class="custom-table" style="width: 100%">
        <el-table-column label="序号" width="70" type="index" align="center" />

        <el-table-column label="平台" min-width="120" align="center">
          <template #default="scope">
            <div class="platform-tag" :class="scope.row.source">
              <svg-icon :icon-class="scope.row.source" class="platform-icon" />
              <span>{{ scope.row.source.toUpperCase() }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="头像" width="100" align="center">
          <template #default="scope">
            <div class="avatar-wrapper">
              <el-avatar :size="36" :src="scope.row.avatar" />
            </div>
          </template>
        </el-table-column>

        <el-table-column label="系统账号" min-width="150" align="center" prop="userName" show-overflow-tooltip />

        <el-table-column label="绑定时间" width="200" align="center" prop="createTime">
          <template #default="scope">
            <span class="time-text">{{ scope.row.createTime }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="scope">
            <el-button class="unbind-btn" size="small" type="danger" link icon="Unlink" @click="unlockAuth(scope.row)"> 解绑账号 </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="bind-section">
      <div class="section-header">
        <h4 class="title">增补绑定<span>第三方账号</span></h4>
        <p class="subtitle">绑定后可直接使用第三方账号安全登录系统</p>
      </div>

      <div class="auth-cards-group">
        <div class="auth-card wechat" @click="authUrl('wechat')">
          <div class="card-inner">
            <div class="icon-box">
              <svg-icon icon-class="wechat" />
            </div>
            <div class="info-box">
              <div class="name">微信账号</div>
              <div class="desc">WeChat Connect</div>
            </div>
            <div class="arrow-icon">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
          <div class="glow-effect"></div>
        </div>

        <div class="auth-card qq" @click="authUrl('qq')">
          <div class="card-inner">
            <div class="icon-box">
              <svg-icon icon-class="qq" />
            </div>
            <div class="info-box">
              <div class="name">QQ 账号</div>
              <div class="desc">Tencent Login</div>
            </div>
            <div class="arrow-icon">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
          <div class="glow-effect"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { authBinding, authUnlock } from '@/api/system/social/auth';
import { propTypes } from '@/utils/propTypes';
import { ArrowRight } from '@element-plus/icons-vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const props = defineProps({
  auths: propTypes.any.isRequired
});

const auths = computed(() => props.auths);

// 解绑逻辑
const unlockAuth = (row: any) => {
  ElMessageBox.confirm(`确定要解除与 "${row.source}" 的账号绑定吗？`, '安全提示', {
    confirmButtonText: '确定解绑',
    cancelButtonText: '取消',
    type: 'warning',
    buttonSize: 'default'
  })
    .then(() => {
      return authUnlock(row.id);
    })
    .then((res: any) => {
      if (res.code === 200) {
        proxy?.$modal.msgSuccess('解绑成功');
        proxy?.$tab.refreshPage();
      } else {
        proxy?.$modal.msgError(res.msg);
      }
    })
    .catch(() => {});
};

// 绑定跳转
const authUrl = (source: string) => {
  authBinding(source).then((res: any) => {
    if (res.code === 200) {
      window.location.href = res.data;
    } else {
      proxy?.$modal.msgError(res.msg);
    }
  });
};
</script>

<style lang="scss" scoped>
.social-auth-container {
  height: 100%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 32px;
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
}

/* 通用标题样式 */
.section-header {
  margin-bottom: 20px;
  .title {
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;

    span {
      color: var(--el-color-primary);
    }
  }
  .subtitle {
    font-size: 13px;
    color: #94a3b8;
    margin: 4px 0 0;
  }
}

/* 1. 表格区域美化 */
.custom-table {
  --el-table-border-color: rgba(0, 0, 0, 0.05);
  --el-table-header-bg-color: #f8fafc;

  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05) !important;

  :deep(.el-table__header) {
    th {
      font-weight: 600;
      color: #475569 !important;
    }
  }

  .platform-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    background: #f1f5f9;
    color: #64748b;

    &.wechat {
      background: rgba(7, 193, 96, 0.1);
      color: #07c160;
    }
    &.qq {
      background: rgba(18, 183, 245, 0.1);
      color: #12b7f5;
    }

    .platform-icon {
      font-size: 14px;
    }
  }

  .avatar-wrapper {
    display: inline-flex;
    padding: 2px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: 50%;
  }

  .time-text {
    font-family: 'Manrope', sans-serif;
    color: #64748b;
    font-size: 13px;
  }

  .unbind-btn {
    font-weight: 600;
    transition: all 0.2s;
    &:hover {
      transform: scale(1.05);
    }
  }
}

/* 2. 第三方绑定卡片重构 */
.auth-cards-group {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.auth-card {
  --accent-rgb: 148, 163, 184;
  position: relative;
  width: 240px;
  height: 80px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  backdrop-filter: blur(10px);

  &.wechat {
    --accent-rgb: 7, 193, 96;
  }
  &.qq {
    --accent-rgb: 18, 183, 245;
  }

  .card-inner {
    position: relative;
    z-index: 2;
    padding: 16px;
    display: flex;
    align-items: center;
    height: 100%;
  }

  .icon-box {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--accent-rgb), 0.08);
    color: rgb(var(--accent-rgb));
    border-radius: 12px;
    font-size: 24px;
    transition: all 0.3s ease;
  }

  .info-box {
    margin-left: 14px;
    flex: 1;
    .name {
      font-size: 15px;
      font-weight: 700;
      color: #1e293b;
    }
    .desc {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 2px;
    }
  }

  .arrow-icon {
    font-size: 16px;
    color: #cbd5e1;
    opacity: 0;
    transform: translateX(-10px);
    transition: all 0.3s ease;
  }

  .glow-effect {
    position: absolute;
    top: -20px;
    right: -20px;
    width: 100px;
    height: 100px;
    background: radial-gradient(circle, rgba(var(--accent-rgb), 0.12), transparent 70%);
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.5s ease;
  }

  /* 悬浮反馈：-4px 位移 + 柔和彩色投影 */
  &:hover {
    transform: translateY(-4px);
    background: #ffffff;
    border-color: rgba(var(--accent-rgb), 0.3);
    box-shadow:
      0 12px 20px -8px rgba(var(--accent-rgb), 0.2),
      0 4px 10px -2px rgba(var(--accent-rgb), 0.05);

    .icon-box {
      background: rgb(var(--accent-rgb));
      color: #ffffff;
      transform: scale(1.05) rotate(-5deg);
    }

    .arrow-icon {
      opacity: 1;
      transform: translateX(0);
      color: rgb(var(--accent-rgb));
    }

    .glow-effect {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(-1px);
  }
}
</style>
