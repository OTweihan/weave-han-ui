<template>
  <div v-loading="state.loading" class="notice-container">
    <div class="header">
      <div class="title">通知公告</div>
      <div class="mark-read" @click="readAll" v-if="newsList.length > 0">
        <el-icon><Check /></el-icon>
        <span>全部已读</span>
      </div>
    </div>

    <div class="notice-list">
      <template v-if="newsList.length > 0">
        <div v-for="(v, k) in newsList" :key="k" class="notice-item" :class="{ 'is-read': v.read }" @click="onNewsClick(k)">
          <div class="notice-status">
            <div class="dot"></div>
          </div>
          <div class="notice-content">
            <div class="message">{{ v.message }}</div>
            <div class="time">{{ v.time }}</div>
          </div>
        </div>
      </template>
      <div v-else class="empty-state">
        <el-empty :image-size="80" description="暂无新消息" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="layoutBreadcrumbUserNews">
import { useNoticeStore } from '@/store/modules/notice';
import { Check } from '@element-plus/icons-vue';

const noticeStore = useNoticeStore();
const { readAll } = useNoticeStore();

// 定义变量内容
const state = reactive({
  loading: false
});
const newsList = ref([]) as any;

/**
 * 初始化数据
 * @returns
 */
const getTableData = async () => {
  state.loading = true;
  newsList.value = noticeStore.state.notices;
  state.loading = false;
};

//点击消息，写入已读
const onNewsClick = (item: any) => {
  newsList.value[item].read = true;
  //并且写入pinia
  noticeStore.state.notices = newsList.value;
};

onMounted(() => {
  nextTick(() => {
    getTableData();
  });
});
</script>

<style lang="scss" scoped>
.notice-container {
  /* 统一玻璃拟态变量 */
  --nav-glass-bg: rgba(255, 255, 255, 0.96);
  --nav-glass-border: rgba(0, 0, 0, 0.08);

  display: flex;
  flex-direction: column;
  background: var(--nav-glass-bg);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  overflow: hidden;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px; /* 增加高度更显高级 */
    border-bottom: 1px solid var(--nav-glass-border);
    background-color: rgba(255, 255, 255, 0.5);

    .title {
      font-size: 15px;
      font-weight: 700;
      color: #1a2a44;
      letter-spacing: 0.5px;
    }

    .mark-read {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--el-color-primary);
      cursor: pointer;
      padding: 4px 10px;
      border-radius: 20px; /* 胶囊状按钮 */
      background: rgba(64, 158, 255, 0.05);
      transition: all 0.3s ease;

      &:hover {
        background-color: var(--el-color-primary);
        color: #fff;
        transform: translateY(-1px);
      }
    }
  }

  .notice-list {
    max-height: 380px;
    overflow-y: auto;
    background: transparent;

    /* 优化滚动条 */
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 10px;
    }

    .notice-item {
      display: flex;
      padding: 14px 18px;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      border-bottom: 1px solid rgba(0, 0, 0, 0.04);
      position: relative;
      background: transparent;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background-color: rgba(64, 158, 255, 0.04);
        padding-left: 22px; /* 悬停时轻微右移，增加交互感 */
      }

      .notice-status {
        margin-right: 12px;
        display: flex;
        align-items: center;

        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: var(--el-color-primary); /* 统一用主色点 */
          box-shadow: 0 0 8px rgba(64, 158, 255, 0.4);
          transition: all 0.3s;
        }
      }

      .notice-content {
        flex: 1;

        .message {
          font-size: 13px;
          color: #334155;
          line-height: 1.6;
          margin-bottom: 4px;
          /* 限制行数 */
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.3s;
        }

        .time {
          font-size: 11px;
          color: #94a3b8;
          font-family: 'Manrope', sans-serif;
        }
      }

      /* 已读状态：大幅度弱化 */
      &.is-read {
        background-color: transparent;

        .notice-status .dot {
          background-color: #cbd5e1;
          box-shadow: none;
          transform: scale(0.8);
        }

        .message {
          color: #94a3b8;
        }

        &:hover {
          background-color: rgba(0, 0, 0, 0.02);
        }
      }
    }

    .empty-state {
      padding: 60px 0;
      :deep(.el-empty__description) {
        margin-top: 8px;
        p {
          font-size: 13px;
          color: #94a3b8;
        }
      }
    }
  }

  /* 底部“查看更多”建议增加（可选） */
  .footer-more {
    padding: 12px;
    text-align: center;
    font-size: 12px;
    color: #64748b;
    border-top: 1px solid var(--nav-glass-border);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      color: var(--el-color-primary);
      background: rgba(64, 158, 255, 0.02);
    }
  }
}
</style>
