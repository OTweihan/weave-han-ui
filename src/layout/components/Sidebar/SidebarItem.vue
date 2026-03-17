<template>
  <div v-if="!item.hidden">
    <template v-if="hasOneShowingChild(item, item.children) && (!onlyOneChild.children || onlyOneChild.noShowingChildren) && !item.alwaysShow">
      <app-link v-if="onlyOneChild.meta" :to="resolvePath(onlyOneChild.path, onlyOneChild.query)">
        <el-menu-item :index="resolvePath(onlyOneChild.path)" :class="{ 'sub-menu-title-noDropdown': !isNest }">
          <template #title>
            <span class="menu-title" :title="hasTitle(onlyOneChild.meta.title)">{{ onlyOneChild.meta.title }}</span>
          </template>
        </el-menu-item>
      </app-link>
    </template>

    <el-sub-menu v-else ref="subMenu" :index="resolvePath(item.path)" teleported>
      <template v-if="item.meta" #title>
        <span class="menu-title" :title="hasTitle(item.meta?.title)">{{ item.meta?.title }}</span>
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

const onlyOneChild = ref<any>({});

const hasOneShowingChild = (parent: RouteRecordRaw, children?: RouteRecordRaw[]) => {
  if (!children) {
    children = [];
  }
  const showingChildren = children.filter((item) => {
    if (item.hidden) {
      return false;
    }
    onlyOneChild.value = item;
    return true;
  });

  if (showingChildren.length === 1) {
    return true;
  }

  if (showingChildren.length === 0) {
    onlyOneChild.value = { ...parent, path: '', noShowingChildren: true };
    return true;
  }

  return false;
};

const resolvePath = (routePath: string, routeQuery?: string): any => {
  if (isExternal(routePath)) {
    return routePath;
  }
  if (isExternal(props.basePath as string)) {
    return props.basePath;
  }
  if (routeQuery) {
    const query = JSON.parse(routeQuery);
    return { path: getNormalPath(props.basePath + '/' + routePath), query: query };
  }
  return getNormalPath(props.basePath + '/' + routePath);
};

const hasTitle = (title: string | undefined): string => {
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

  &:not(.is-active):hover {
    transform: translateX(2px);
  }

  &.is-active {
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
