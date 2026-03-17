<template>
  <div v-if="!item.hidden">
    <template v-if="hasOneShowingChild(item, item.children) && (!onlyOneChild.children || onlyOneChild.noShowingChildren) && !item.alwaysShow">
      <app-link v-if="onlyOneChild.meta" :to="resolvePath(onlyOneChild.path, onlyOneChild.query)">
        <el-menu-item :index="resolvePath(onlyOneChild.path)" :class="{ 'sub-menu-title-noDropdown': !isNest }">
          <template #title>
            <span class="menu-title" :title="resolveTitleTooltip(onlyOneChild.meta.title)">{{ onlyOneChild.meta.title }}</span>
          </template>
        </el-menu-item>
      </app-link>
    </template>

    <el-sub-menu v-else ref="subMenu" :index="resolvePath(item.path)" teleported>
      <template v-if="item.meta" #title>
        <span class="menu-title" :title="resolveTitleTooltip(item.meta?.title)">{{ item.meta?.title }}</span>
      </template>

      <sidebar-item
        v-for="(child, index) in item.children"
        :key="child.path + index"
        :is-nest="true"
        :item="child"
        :base-path="resolvePath(child.path)"
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

type SidebarRoute = RouteRecordRaw & {
  hidden?: boolean;
  query?: string;
  noShowingChildren?: boolean;
};

const props = defineProps({
  item: {
    type: Object as PropType<SidebarRoute>,
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
  position: relative;
  display: flex;
  align-items: center;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;

  // 悬停时轻微右移，增强交互反馈。
  &:not(.is-active):hover {
    transform: translateX(2px);
  }

  &.is-active {
    // 当前菜单左侧高亮条，增强激活态识别。
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 20px;
      background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
      border-radius: 0 3px 3px 0;
    }

    .menu-title {
      color: #409eff !important;
      font-weight: 600;
    }
  }
}

:deep(.el-sub-menu__title) {
  display: flex;
  align-items: center;
  transition:
    color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    transform: translateX(2px);
  }
}

.menu-title {
  font-size: 14px;
  letter-spacing: 0.5px;
  line-height: 1;
  transition: color 0.2s ease;
}
</style>
