<template>
  <div v-if="!menuRoute.hidden">
    <template v-if="showSingleMenu">
      <app-link v-if="onlyOneChild.meta" :to="resolvePath(onlyOneChild.path, onlyOneChild.query)">
        <el-menu-item :index="resolveMenuIndex(onlyOneChild.path)" :class="{ 'sub-menu-title-noDropdown': !isNest }">
          <template #title>
            <span class="menu-title" :title="resolveTitleTooltip(onlyOneChild.meta.title)">{{ onlyOneChild.meta.title }}</span>
          </template>
        </el-menu-item>
      </app-link>
    </template>

    <el-sub-menu v-else ref="subMenu" :index="resolveMenuIndex(menuRoute.path)" teleported>
      <template v-if="menuRoute.meta" #title>
        <span class="menu-title" :title="resolveTitleTooltip(menuRoute.meta?.title)">{{ menuRoute.meta?.title }}</span>
      </template>

      <sidebar-item
        v-for="(child, index) in menuChildren"
        :key="child.path + index"
        :is-nest="true"
        :item="child"
        :base-path="resolveMenuIndex(child.path)"
        class="nest-menu"
      />
    </el-sub-menu>
  </div>
</template>

<script setup lang="ts">
import { getNormalPath } from '@/utils/common';
import { isExternal } from '@/utils/validate';
import { RouteRecordRaw } from 'vue-router';
import AppLink from './Link.vue';

type SidebarRouteMeta = Record<string, unknown> & {
  title?: string;
  activeMenu?: string;
};

type SidebarRoute = RouteRecordRaw & {
  meta?: SidebarRouteMeta;
  children?: SidebarRoute[];
  hidden?: boolean;
  alwaysShow?: boolean;
  query?: string;
  noShowingChildren?: boolean;
};

const props = defineProps({
  item: {
    type: Object as PropType<RouteRecordRaw>,
    required: true
  },
  isNest: {
    type: Boolean,
    default: false
  },
  basePath: {
    type: String,
    default: ''
  }
});

const menuRoute = computed(() => props.item as SidebarRoute);
const menuChildren = computed(() => menuRoute.value.children || []);

type SingleChildResult = {
  onlyChild: SidebarRoute;
  hasOneShowingChild: boolean;
};

const resolveSingleShowingChild = (parent: SidebarRoute, children: SidebarRoute[] = []): SingleChildResult => {
  const showingChildren: SidebarRoute[] = [];

  for (const child of children) {
    if (child.hidden) {
      continue;
    }
    showingChildren.push(child);

    // 只关心是否超过 1 个可见子菜单，提前退出可减少无意义遍历。
    if (showingChildren.length > 1) {
      break;
    }
  }

  if (showingChildren.length === 1) {
    return {
      onlyChild: showingChildren[0],
      hasOneShowingChild: true
    };
  }

  if (showingChildren.length === 0) {
    return {
      onlyChild: { ...parent, path: '', noShowingChildren: true },
      hasOneShowingChild: true
    };
  }

  return {
    onlyChild: {} as SidebarRoute,
    hasOneShowingChild: false
  };
};

// 避免在模板中执行带副作用的方法，统一收敛到计算属性中。
const singleChildResult = computed(() => resolveSingleShowingChild(menuRoute.value, menuChildren.value));
const onlyOneChild = computed(() => singleChildResult.value.onlyChild);
const showSingleMenu = computed(
  () =>
    singleChildResult.value.hasOneShowingChild &&
    (!onlyOneChild.value.children || onlyOneChild.value.noShowingChildren) &&
    !menuRoute.value.alwaysShow
);

const resolvePath = (routePath: string, routeQuery?: string): string | { path: string; query: Record<string, unknown> } => {
  if (isExternal(routePath)) {
    return routePath;
  }

  if (isExternal(props.basePath)) {
    return props.basePath;
  }

  const fullPath = routePath.startsWith('/') ? routePath : `${props.basePath}/${routePath}`;
  const normalizedPath = getNormalPath(fullPath);

  // 后端可能返回 query JSON 字符串，解析失败时降级为纯路径，避免菜单渲染中断。
  if (routeQuery) {
    try {
      const query = JSON.parse(routeQuery) as Record<string, unknown>;
      return { path: normalizedPath, query };
    } catch (_error) {
      return normalizedPath;
    }
  }

  return normalizedPath;
};

// Element Plus 菜单 index 仅支持 string，避免将 query 对象传入 index。
const resolveMenuIndex = (routePath: string): string => {
  const resolved = resolvePath(routePath);
  return typeof resolved === 'string' ? resolved : resolved.path;
};

const resolveTitleTooltip = (title: string | undefined): string => {
  // 短标题不展示 tooltip，减少无效悬浮提示。
  if (!title || title.length <= 5) {
    return '';
  }
  return title;
};
</script>

<style lang="scss" scoped>
.menu-title {
  line-height: 1.2;
}
</style>
