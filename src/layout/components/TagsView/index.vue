<template>
  <div id="tags-view-container" class="tags-view-container">
    <scroll-pane ref="scrollPaneRef" class="tags-view-wrapper" @scroll="handleScroll">
      <router-link
        v-for="tag in visitedViews"
        :key="tag.path"
        :data-path="tag.path"
        :class="{ 'active': isActive(tag), 'has-icon': tagsIcon }"
        :to="{ path: tag.path ? tag.path : '', query: tag.query }"
        class="tags-view-item"
        :style="activeStyle(tag)"
        @click.middle="!isAffix(tag) ? closeSelectedTag(tag) : ''"
        @contextmenu.prevent="openMenu(tag, $event)"
      >
        <svg-icon v-if="tagsIcon && tag.meta && tag.meta.icon && tag.meta.icon !== '#'" :icon-class="tag.meta.icon" />
        <span class="tags-view-item-title">{{ tag.title }}</span>
        <span v-if="!isAffix(tag)" @click.prevent.stop="closeSelectedTag(tag)">
          <close class="el-icon-close" style="width: 1em; height: 1em; vertical-align: middle" />
        </span>
      </router-link>
    </scroll-pane>
    <ul v-show="visible" :style="{ left: left + 'px', top: top + 'px' }" class="contextmenu">
      <li @click="refreshSelectedTag(selectedTag)"><refresh-right style="width: 1em; height: 1em" /> 刷新页面</li>
      <li v-if="!isAffix(selectedTag)" @click="closeSelectedTag(selectedTag)"><close style="width: 1em; height: 1em" /> 关闭当前</li>
      <li @click="closeOthersTags"><circle-close style="width: 1em; height: 1em" /> 关闭其他</li>
      <li v-if="!isFirstView()" @click="closeLeftTags"><back style="width: 1em; height: 1em" /> 关闭左侧</li>
      <li v-if="!isLastView()" @click="closeRightTags"><right style="width: 1em; height: 1em" /> 关闭右侧</li>
      <li @click="closeAllTags(selectedTag)"><circle-close style="width: 1em; height: 1em" /> 全部关闭</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { usePermissionStore } from '@/store/modules/permission';
import { useSettingsStore } from '@/store/modules/settings';
import { useTagsViewStore } from '@/store/modules/tagsView';
import { getNormalPath } from '@/utils/common';
import { Back, CircleClose, Close, RefreshRight, Right } from '@element-plus/icons-vue';
import { RouteLocationNormalized, RouteRecordRaw } from 'vue-router';
import ScrollPane from './ScrollPane.vue';

const visible = ref(false);
const top = ref(0);
const left = ref(0);
const selectedTag = ref<RouteLocationNormalized>();
const affixTags = ref<RouteLocationNormalized[]>([]);
const scrollPaneRef = ref<InstanceType<typeof ScrollPane>>();

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const router = useRouter();

const visitedViews = computed(() => useTagsViewStore().getVisitedViews());
const routes = computed(() => usePermissionStore().getRoutes());
const tagsIcon = computed(() => useSettingsStore().tagsIcon);

watch(route, () => {
  addTags();
  moveToCurrentTag();
});

watch(visible, (value) => {
  if (value) {
    document.body.addEventListener('click', closeMenu);
  } else {
    document.body.removeEventListener('click', closeMenu);
  }
});

const isActive = (r: RouteLocationNormalized): boolean => {
  return r.path === route.path;
};

const activeStyle = (tag: RouteLocationNormalized) => {
  if (!isActive(tag)) return {};
  return {
    'background-color': 'var(--el-color-primary)',
    'border-color': 'var(--el-color-primary)',
    'color': '#ffffff'
  };
};

const isAffix = (tag: RouteLocationNormalized) => {
  return tag?.meta && tag?.meta?.affix;
};

const isFirstView = () => {
  try {
    return selectedTag.value.fullPath === '/index' || selectedTag.value.fullPath === visitedViews.value[1].fullPath;
  } catch (err) {
    return false;
  }
};

const isLastView = () => {
  try {
    return selectedTag.value.fullPath === visitedViews.value[visitedViews.value.length - 1].fullPath;
  } catch (err) {
    return false;
  }
};

const filterAffixTags = (routes: RouteRecordRaw[], basePath = '') => {
  let tags: RouteLocationNormalized[] = [];

  routes.forEach((route) => {
    if (route.meta && route.meta.affix) {
      const tagPath = getNormalPath(basePath + '/' + route.path);
      tags.push({
        hash: '',
        matched: [],
        params: undefined,
        query: undefined,
        redirectedFrom: undefined,
        fullPath: tagPath,
        path: tagPath,
        name: route.name as string,
        meta: { ...route.meta }
      });
    }
    if (route.children) {
      const tempTags = filterAffixTags(route.children, route.path);
      if (tempTags.length >= 1) {
        tags = [...tags, ...tempTags];
      }
    }
  });
  return tags;
};

const initTags = () => {
  const res = filterAffixTags(routes.value);
  affixTags.value = res;
  for (const tag of res) {
    // Must have tag name
    if (tag.name) {
      useTagsViewStore().addVisitedView(tag);
    }
  }
};

const addTags = () => {
  const { name } = route;
  if (route.query.title) {
    route.meta.title = route.query.title as string;
  }
  if (name) {
    useTagsViewStore().addView(route as any);
  }
};

const moveToCurrentTag = () => {
  nextTick(() => {
    for (const r of visitedViews.value) {
      if (r.path === route.path) {
        scrollPaneRef.value?.moveToTarget(r);
        // when query is different then update
        if (r.fullPath !== route.fullPath) {
          useTagsViewStore().updateVisitedView(route);
        }
      }
    }
  });
};

const refreshSelectedTag = (view: RouteLocationNormalized) => {
  proxy?.$tab.refreshPage(view);
  if (route.meta.link) {
    useTagsViewStore().delIframeView(route);
  }
};

const closeSelectedTag = (view: RouteLocationNormalized) => {
  proxy?.$tab.closePage(view).then(({ visitedViews }: any) => {
    if (isActive(view)) {
      toLastView(visitedViews, view);
    }
  });
};

const closeRightTags = () => {
  proxy?.$tab.closeRightPage(selectedTag.value).then((visitedViews: RouteLocationNormalized[]) => {
    if (!visitedViews.find((i: RouteLocationNormalized) => i.fullPath === route.fullPath)) {
      toLastView(visitedViews);
    }
  });
};

const closeLeftTags = () => {
  proxy?.$tab.closeLeftPage(selectedTag.value).then((visitedViews: RouteLocationNormalized[]) => {
    if (!visitedViews.find((i: RouteLocationNormalized) => i.fullPath === route.fullPath)) {
      toLastView(visitedViews);
    }
  });
};

const closeOthersTags = () => {
  if (selectedTag.value?.fullPath) {
    router.push(selectedTag.value.fullPath).catch(() => {});
  }
  proxy?.$tab.closeOtherPage(selectedTag.value).then(() => {
    moveToCurrentTag();
  });
};

const closeAllTags = (view: RouteLocationNormalized) => {
  proxy?.$tab.closeAllPage().then(({ visitedViews }) => {
    if (affixTags.value.some((tag) => tag.path === route.path)) {
      return;
    }
    toLastView(visitedViews, view);
  });
};

const toLastView = (visitedViews: RouteLocationNormalized[], view?: RouteLocationNormalized) => {
  const latestView = visitedViews.slice(-1)[0];
  if (latestView) {
    router.push(latestView.fullPath as string);
  } else {
    if (view?.name === 'Dashboard') {
      router.replace({ path: '/redirect' + view?.fullPath });
    } else {
      router.push('/');
    }
  }
};

const openMenu = (tag: RouteLocationNormalized, e: MouseEvent) => {
  const menuMinWidth = 105;
  const offsetLeft = proxy?.$el.getBoundingClientRect().left;
  const offsetWidth = proxy?.$el.offsetWidth;
  const maxLeft = offsetWidth - menuMinWidth;
  const l = e.clientX - offsetLeft + 15;

  if (l > maxLeft) {
    left.value = maxLeft;
  } else {
    left.value = l;
  }

  top.value = e.clientY;
  visible.value = true;
  selectedTag.value = tag;
};

const closeMenu = () => {
  visible.value = false;
};

const handleScroll = () => {
  closeMenu();
};

onMounted(() => {
  initTags();
  addTags();
});
</script>

<style lang="scss" scoped>
.tags-view-container {
  /* 引用完全相同的玻璃拟态参数，保持高度统一 */
  --nav-glass-bg: rgba(255, 255, 255, 0.85);
  --nav-glass-border: rgba(0, 0, 0, 0.1);
  --nav-glass-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
  --nav-glass-shadow-hover: inset 0 0 0 1px rgba(64, 158, 255, 0.25);

  height: 40px; /* 微调高度，留出舒适的上下边距 */
  width: calc(100% - 8px);
  margin-right: 8px;
  margin-left: 8px;
  margin-top: 0;
  box-sizing: border-box;
  background: var(--nav-glass-bg);
  border: 1px solid var(--nav-glass-border);
  border-top: none;
  border-radius: 0 0 4px 4px !important;
  box-shadow: var(--nav-glass-shadow);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: rgba(0, 0, 0, 0.2);
    box-shadow: var(--nav-glass-shadow-hover);
  }

  .tags-view-wrapper {
    .tags-view-item {
      display: inline-block;
      position: relative;
      cursor: pointer;
      height: 28px;
      line-height: 26px;
      /* 将白底灰框改为更清透的半透明底 */
      border: 1px solid rgba(0, 0, 0, 0.05);
      color: #495060;
      background: rgba(255, 255, 255, 0.5);
      padding: 0 12px;
      font-size: 12px;
      margin-left: 6px;
      margin-top: 5px; /* 垂直居中对齐 */
      border-radius: 6px; /* 更柔和的圆角 */
      transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);

      &:hover {
        border-color: rgba(64, 158, 255, 0.3);
        color: var(--el-color-primary);
        background-color: rgba(64, 158, 255, 0.05);
      }

      &:first-of-type {
        margin-left: 12px;
      }

      &:last-of-type {
        margin-right: 12px;
      }

      /* 激活状态：清爽的蓝底白字 */
      &.active {
        background-color: var(--el-color-primary);
        color: #fff;
        border-color: var(--el-color-primary);
        box-shadow: 0 2px 6px rgba(64, 158, 255, 0.2); /* 给激活的标签加一点点专属呼吸感阴影 */

        &::before {
          content: '';
          background: #fff;
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          position: relative;
          margin-right: 6px;
          vertical-align: 1px;
        }
      }
    }
  }

  .tags-view-item.active.has-icon::before {
    content: none !important;
  }

  .tags-view-item-title {
    margin-left: 4px;
    margin-right: 3px;
  }

  /* 右键菜单也统一为极简亚克力风格 */
  .contextmenu {
    margin: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    z-index: 3000;
    position: absolute;
    list-style-type: none;
    padding: 6px 0;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 400;
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

    li {
      margin: 0;
      padding: 8px 20px;
      cursor: pointer;
      color: #606266;
      display: flex;
      align-items: center;
      gap: 6px; /* 图标和文字的间距 */
      transition: all 0.2s;

      &:hover {
        background: rgba(64, 158, 255, 0.08);
        color: var(--el-color-primary);
      }
    }
  }
}
</style>

<style lang="scss">
/* 标签内的关闭图标样式优化 */
.tags-view-wrapper {
  .tags-view-item {
    .el-icon-close {
      width: 14px;
      height: 14px;
      vertical-align: -1px;
      border-radius: 50%;
      text-align: center;
      transition: all 0.2s;
      transform-origin: 100% 50%;
      color: #909399;

      &:before {
        transform: scale(0.8);
        display: inline-block;
      }

      &:hover {
        background-color: rgba(245, 108, 108, 0.8); /* 柔和一点的红色 */
        color: #ffffff;
        width: 14px !important;
        height: 14px !important;
      }
    }

    &.active .el-icon-close {
      color: rgba(255, 255, 255, 0.8);

      &:hover {
        background-color: rgba(255, 255, 255, 0.3);
        color: #ffffff;
      }
    }
  }
}
</style>
