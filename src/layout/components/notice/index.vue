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
  display: flex;
  flex-direction: column;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 18px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background-color: #fff;

    .title {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .mark-read {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: var(--el-color-primary);
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background-color 0.2s;

      &:hover {
        background-color: var(--el-color-primary-light-9);
      }
    }
  }

  .notice-list {
    max-height: 350px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: #e0e0e0;
      border-radius: 3px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }

    .notice-item {
      display: flex;
      padding: 16px 20px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-bottom: 1px solid var(--el-border-color-lighter);
      position: relative;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background-color: var(--el-fill-color-light);
      }

      .notice-status {
        margin-right: 12px;
        padding-top: 6px;

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--el-color-danger);
          box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2);
        }
      }

      .notice-content {
        flex: 1;

        .message {
          font-size: 14px;
          color: var(--el-text-color-primary);
          line-height: 1.5;
          margin-bottom: 6px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .time {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }

      &.is-read {
        opacity: 0.7;

        .notice-status .dot {
          background-color: var(--el-text-color-placeholder);
          box-shadow: none;
        }

        .message {
          color: var(--el-text-color-regular);
        }
      }
    }

    .empty-state {
      padding: 40px 0;
      display: flex;
      justify-content: center;
    }
  }

  .footer {
    padding: 12px;
    border-top: 1px solid var(--el-border-color-lighter);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    background-color: var(--el-fill-color-lighter);
    color: var(--el-text-color-regular);
    font-size: 13px;
    transition: all 0.2s;

    &:hover {
      background-color: var(--el-fill-color);
      color: var(--el-color-primary);
    }
  }
}
</style>
