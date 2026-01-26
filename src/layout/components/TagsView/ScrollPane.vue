<template>
  <el-scrollbar ref="scrollContainerRef" :vertical="false" class="scroll-container" @wheel.prevent="handleScroll">
    <slot />
  </el-scrollbar>
</template>

<script setup lang="ts">
import { RouteLocationNormalized } from 'vue-router';
import { useTagsViewStore } from '@/store/modules/tagsView';
import { ElScrollbar } from 'element-plus';

const emits = defineEmits(['scroll']);
const tagsViewStore = useTagsViewStore();
const tagAndTagSpacing = ref(4);
const scrollContainerRef = ref<InstanceType<typeof ElScrollbar>>();
const visitedViews = computed(() => tagsViewStore.visitedViews);

// 获取滚动容器的包装元素
const scrollWrapper = computed(() => scrollContainerRef.value?.$refs.wrapRef as HTMLElement);

/**
 * 处理鼠标滚轮事件
 */
const handleScroll = (e: WheelEvent) => {
  const eventDelta = (e as any).wheelDelta || -e.deltaY * 40;
  const $scrollWrapper = scrollWrapper.value;
  $scrollWrapper.scrollLeft = $scrollWrapper.scrollLeft + eventDelta / 4;
};

/**
 * 触发滚动事件
 */
const emitScroll = () => {
  emits('scroll');
};

/**
 * 移动到目标标签
 * @param currentTag 当前选中的标签路由对象
 */
const moveToTarget = (currentTag: RouteLocationNormalized) => {
  const $container = scrollContainerRef.value?.$el;
  const $containerWidth = $container.offsetWidth;
  const $scrollWrapper = scrollWrapper.value;

  let firstTag = null;
  let lastTag = null;

  // 查找第一个和最后一个标签
  if (visitedViews.value.length > 0) {
    firstTag = visitedViews.value[0];
    lastTag = visitedViews.value[visitedViews.value.length - 1];
  }

  if (firstTag === currentTag) {
    $scrollWrapper.scrollLeft = 0;
  } else if (lastTag === currentTag) {
    $scrollWrapper.scrollLeft = $scrollWrapper.scrollWidth - $containerWidth;
  } else {
    // 查找当前标签的前一个和后一个标签的 DOM 元素
    const tagListDom = document.getElementsByClassName('tags-view-item') as HTMLCollectionOf<HTMLElement>;
    const currentIndex = visitedViews.value.findIndex((item) => item === currentTag);
    let prevTag = null;
    let nextTag = null;

    for (let i = 0; i < tagListDom.length; i++) {
      const tag = tagListDom[i];
      if (tag.dataset.path === visitedViews.value[currentIndex - 1]?.path) {
        prevTag = tag;
      }
      if (tag.dataset.path === visitedViews.value[currentIndex + 1]?.path) {
        nextTag = tag;
      }
    }

    // 移动到下一个标签之后
    const afterNextTagOffsetLeft = nextTag.offsetLeft + nextTag.offsetWidth + tagAndTagSpacing.value;

    // 移动到前一个标签之前
    const beforePrevTagOffsetLeft = prevTag.offsetLeft - tagAndTagSpacing.value;

    if (afterNextTagOffsetLeft > $scrollWrapper.scrollLeft + $containerWidth) {
      $scrollWrapper.scrollLeft = afterNextTagOffsetLeft - $containerWidth;
    } else if (beforePrevTagOffsetLeft < $scrollWrapper.scrollLeft) {
      $scrollWrapper.scrollLeft = beforePrevTagOffsetLeft;
    }
  }
};

onMounted(() => {
  scrollWrapper.value?.addEventListener('scroll', emitScroll, true);
});

onBeforeUnmount(() => {
  scrollWrapper.value?.removeEventListener('scroll', emitScroll);
});

defineExpose({
  moveToTarget
});
</script>

<style lang="scss" scoped>
.scroll-container {
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  width: 100%;

  // 隐藏默认滚动条
  :deep(.el-scrollbar__bar) {
    bottom: 0;
  }

  // 调整滚动区域高度以适应标签
  :deep(.el-scrollbar__wrap) {
    height: 55px;
  }
}
</style>
