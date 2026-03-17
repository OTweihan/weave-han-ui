<template>
  <div v-if="!sidebarItem.hidden">
    <template
      v-if="
        hasOneShowingChild(sidebarItem, sidebarItem.children) && (!onlyOneChild.children || onlyOneChild.noShowingChildren) && !sidebarItem.alwaysShow
      "
    >
      <app-link v-if="onlyOneChild.meta" :to="resolvePath(onlyOneChild.path, onlyOneChild.query)">
        <el-menu-item :index="resolveMenuIndex(onlyOneChild.path)" :class="{ 'sub-menu-title-noDropdown': !isNest }">
          <template #title>
            <span class="menu-title" :title="resolveTitleTooltip(onlyOneChild.meta.title)">{{ onlyOneChild.meta.title }}</span>
          </template>
        </el-menu-item>
      </app-link>
    </template>

    <el-sub-menu v-else ref="subMenu" :index="resolveMenuIndex(sidebarItem.path)" teleported>
      <template v-if="sidebarItem.meta" #title>
        <span class="menu-title" :title="resolveTitleTooltip(sidebarItem.meta?.title)">{{ sidebarItem.meta?.title }}</span>
      </template>

      <sidebar-item
        v-for="(child, index) in sidebarItem.children || []"
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

const sidebarItem = computed(() => props.item as SidebarRoute);

// 当只有一个可见子路由时，直接渲染成一级菜单。
const onlyOneChild = ref<SidebarRoute>({} as SidebarRoute);

const hasOneShowingChild = (parent: SidebarRoute, children: SidebarRoute[] = []): boolean => {
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
    onlyOneChild.value = showingChildren[0];
    return true;
  }

  if (showingChildren.length === 0) {
    onlyOneChild.value = { ...parent, path: '', noShowingChildren: true };
    return true;
  }

  return false;
};

const resolvePath = (routePath: string, routeQuery?: string): string | { path: string; query: Record<string, unknown> } => {
  if (isExternal(routePath)) {
    return routePath;
  }

  if (isExternal(props.basePath)) {
    return props.basePath;
  }

  const normalizedPath = getNormalPath(`${props.basePath}/${routePath}`);

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
:deep(.el-menu-item) {
  height: 50px;
  margin: 4px 0;
  border-radius: 8px;
  transition:
    background-color 0.3s ease-in-out,
    color 0.3s ease-in-out;

  &:not(.is-active):hover {
    background-color: #eef2ff;
  }

  &.is-active {
    background-color: #e0e7ff;
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 24px;
      background: linear-gradient(180deg, #4f46e5 0%, #3b82f6 100%);
      border-radius: 0 4px 4px 0;
    }

    .menu-title {
      color: #3730a3 !important;
      font-weight: 700;
    }
  }
}

:deep(.el-sub-menu__title) {
  height: 50px;
  margin: 4px 0;
  border-radius: 8px;
  transition:
    background-color 0.3s ease-in-out,
    color 0.3s ease-in-out;

  &:hover {
    background-color: #eef2ff;
  }
}

.menu-title {
  font-size: 15px;
  letter-spacing: 0.5px;
  line-height: 1;
  transition: color 0.2s ease;
}
</style>
