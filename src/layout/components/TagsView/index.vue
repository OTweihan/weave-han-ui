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

const permissionStore = usePermissionStore();
const settingsStore = useSettingsStore();
const tagsViewStore = useTagsViewStore();

const visible = ref(false);
const top = ref(0);
const left = ref(0);
const selectedTag = ref<RouteLocationNormalized | undefined>();
const affixTags = ref<RouteLocationNormalized[]>([]);
const scrollPaneRef = ref<InstanceType<typeof ScrollPane>>();

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const router = useRouter();

const visitedViews = computed(() => tagsViewStore.getVisitedViews());
const routes = computed(() => permissionStore.getRoutes());
const tagsIcon = computed(() => settingsStore.tagsIcon);

// 激活标签的样式常量，避免重复创建对象
const activeTagStyle = Object.freeze({
  'background-color': 'var(--el-color-primary)',
  'border-color': 'var(--el-color-primary)',
  color: '#ffffff'
});

// 路由变化时同步标签列表和滚动位置
watch(route, () => {
  addTags();
  moveToCurrentTag();
});

// 右键菜单打开时挂 body 点击事件，关闭时移除
watch(visible, (value) => {
  if (value) {
    document.body.addEventListener('click', closeMenu);
  } else {
    document.body.removeEventListener('click', closeMenu);
  }
});

const isActive = (r: RouteLocationNormalized): boolean => r.path === route.path;

const activeStyle = (tag: RouteLocationNormalized) => (isActive(tag) ? activeTagStyle : undefined);

const isAffix = (tag?: RouteLocationNormalized) => Boolean(tag?.meta?.affix);

const isFirstView = () => {
  const selectedFullPath = selectedTag.value?.fullPath;
  if (!selectedFullPath) return false;
  return selectedFullPath === '/index' || selectedFullPath === visitedViews.value[1]?.fullPath;
};

const isLastView = () => {
  const selectedFullPath = selectedTag.value?.fullPath;
  if (!selectedFullPath) return false;
  return selectedFullPath === visitedViews.value[visitedViews.value.length - 1]?.fullPath;
};

// 递归收集固定标签（affix）
const filterAffixTags = (routeList: RouteRecordRaw[], basePath = '') => {
  let tags: RouteLocationNormalized[] = [];

  routeList.forEach((routeItem) => {
    if (routeItem.meta && routeItem.meta.affix) {
      const tagPath = getNormalPath(basePath + '/' + routeItem.path);
      tags.push({
        hash: '',
        matched: [],
        params: undefined,
        query: undefined,
        redirectedFrom: undefined,
        fullPath: tagPath,
        path: tagPath,
        name: routeItem.name as string,
        meta: { ...routeItem.meta }
      });
    }

    if (routeItem.children) {
      const tempTags = filterAffixTags(routeItem.children, routeItem.path);
      if (tempTags.length >= 1) {
        tags = [...tags, ...tempTags];
      }
    }
  });

  return tags;
};

const initTags = () => {
  const affixTagList = filterAffixTags(routes.value);
  affixTags.value = affixTagList;

  for (const tag of affixTagList) {
    // 固定标签必须有 name，才能被 keep-alive 正确识别
    if (tag.name) {
      tagsViewStore.addVisitedView(tag);
    }
  }
};

const addTags = () => {
  const { name } = route;

  if (route.query.title) {
    route.meta.title = route.query.title as string;
  }

  if (name) {
    tagsViewStore.addView(route as RouteLocationNormalized);
  }
};

const moveToCurrentTag = () => {
  nextTick(() => {
    for (const r of visitedViews.value) {
      if (r.path === route.path) {
        scrollPaneRef.value?.moveToTarget(r);
        // query 变化时更新已访问标签，保持标题等信息最新
        if (r.fullPath !== route.fullPath) {
          tagsViewStore.updateVisitedView(route);
        }
        break;
      }
    }
  });
};

const refreshSelectedTag = (view?: RouteLocationNormalized) => {
  if (!view) return;

  proxy?.$tab.refreshPage(view);
  if (route.meta.link) {
    tagsViewStore.delIframeView(route);
  }
};

const closeSelectedTag = (view?: RouteLocationNormalized) => {
  if (!view) return;

  proxy?.$tab.closePage(view).then(({ visitedViews }: { visitedViews: RouteLocationNormalized[] }) => {
    if (isActive(view)) {
      toLastView(visitedViews, view);
    }
  });
};

const ensureCurrentRouteExists = (nextVisitedViews: RouteLocationNormalized[]) => {
  const currentExists = nextVisitedViews.some((item) => item.fullPath === route.fullPath);
  if (!currentExists) {
    toLastView(nextVisitedViews);
  }
};

const closeRightTags = () => {
  if (!selectedTag.value) return;

  proxy?.$tab.closeRightPage(selectedTag.value).then((nextVisitedViews: RouteLocationNormalized[]) => {
    ensureCurrentRouteExists(nextVisitedViews);
  });
};

const closeLeftTags = () => {
  if (!selectedTag.value) return;

  proxy?.$tab.closeLeftPage(selectedTag.value).then((nextVisitedViews: RouteLocationNormalized[]) => {
    ensureCurrentRouteExists(nextVisitedViews);
  });
};

const closeOthersTags = () => {
  if (!selectedTag.value) return;

  if (selectedTag.value?.fullPath) {
    router.push(selectedTag.value.fullPath).catch(() => {});
  }

  proxy?.$tab.closeOtherPage(selectedTag.value).then(() => {
    moveToCurrentTag();
  });
};

const closeAllTags = (view?: RouteLocationNormalized) => {
  proxy?.$tab.closeAllPage().then(({ visitedViews }: { visitedViews: RouteLocationNormalized[] }) => {
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
    return;
  }

  if (view?.name === 'Dashboard') {
    router.replace({ path: '/redirect' + view?.fullPath });
    return;
  }

  router.push('/');
};

const openMenu = (tag: RouteLocationNormalized, e: MouseEvent) => {
  const container = proxy?.$el as HTMLElement | undefined;
  if (!container) return;

  const menuMinWidth = 105;
  const containerRect = container.getBoundingClientRect();
  const offsetLeft = containerRect.left;
  const offsetTop = containerRect.top;
  const maxLeft = Math.max(containerRect.width - menuMinWidth, 0);
  const l = e.clientX - offsetLeft + 15;

  left.value = l > maxLeft ? maxLeft : l;
  // 使用容器相对坐标，避免 fixed-header 场景下被 Navbar 覆盖
  top.value = e.clientY - offsetTop;
  visible.value = true;
  selectedTag.value = tag;
};

const closeMenu = () => (visible.value = false);

// 滚动标签栏时关闭右键菜单，防止菜单悬空
const handleScroll = () => closeMenu();

onMounted(() => {
  initTags();
  addTags();
});

onBeforeUnmount(() => {
  document.body.removeEventListener('click', closeMenu);
});
</script>

<style lang="scss" scoped>
.tags-view-container {
  /* 需与 Navbar 保持一致 */
  --nav-glass-bg: rgba(255, 255, 255, 0.65);
  --nav-glass-border: rgba(0, 0, 0, 0.06);

  position: relative;
  z-index: 1001;
  height: 46px; /* 增高一点，配合 Navbar */
  width: calc(100% - 16px); /* 对应 Navbar 的 12px margin */
  margin: 0 0 0px 8px;
  background: var(--nav-glass-bg);
  border: 1px solid var(--nav-glass-border);
  border-top: 1px solid rgba(255, 255, 255, 0.4); /* 顶部高光线，区分 Navbar */
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); /* 底部轻微投影 */

  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);

  .tags-view-wrapper {
    .tags-view-item {
      display: inline-flex;
      align-items: center;
      position: relative;
      cursor: pointer;
      height: 28px;
      line-height: 1;
      border: 1px solid transparent; /* 默认无边框 */
      color: #5c6b7e;
      background: rgba(0, 0, 0, 0.03); /* 未激活状态为极浅的灰色 */
      padding: 0 12px;
      font-size: 13px;
      margin-left: 6px;
      margin-top: 7px;
      border-radius: 14px; /* 完全圆角（胶囊形状） */
      transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);

      &:first-of-type {
        margin-left: 16px;
      }
      &:last-of-type {
        margin-right: 16px;
      }

      &:hover {
        color: var(--el-color-primary);
        background-color: rgba(64, 158, 255, 0.08);
      }

      /* 激活状态：不需要圆点了，直接用高亮的底色 */
      &.active {
        background-color: var(--el-color-primary);
        color: #ffffff;
        font-weight: 500;
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.35); /* 主题色光晕 */
      }
    }
  }

  /* 极简亚克力右键菜单 */
  .contextmenu {
    margin: 0;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    z-index: 3000;
    position: absolute;
    list-style-type: none;
    padding: 6px; /* 给内部项目留出边距 */
    border-radius: 10px;
    font-size: 13px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    transform-origin: top left;
    animation: menu-pop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);

    li {
      margin: 0;
      padding: 8px 16px;
      cursor: pointer;
      color: #333;
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 6px;
      transition: all 0.15s ease;

      &:hover {
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }
    }
  }
}

@keyframes menu-pop {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>

<style lang="scss">
/* 非 scoped：标签内的关闭图标样式优化 */
.tags-view-wrapper {
  .tags-view-item {
    .el-icon-close {
      width: 14px;
      height: 14px;
      margin-left: 6px; /* 和文字拉开一点距离 */
      border-radius: 50%;
      text-align: center;
      transition: all 0.2s ease;
      color: #909399;
      display: inline-flex;
      align-items: center;
      justify-content: center;

      &:before {
        transform: scale(0.8);
      }

      &:hover {
        background-color: rgba(245, 108, 108, 0.9);
        color: #ffffff;
      }
    }

    &.active .el-icon-close {
      color: rgba(255, 255, 255, 0.85);

      &:hover {
        background-color: rgba(0, 0, 0, 0.15); /* 激活态下悬浮关闭按钮，用黑色半透明更克制 */
        color: #ffffff;
      }
    }
  }
}
</style>
