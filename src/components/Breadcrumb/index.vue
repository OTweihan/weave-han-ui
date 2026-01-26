<template>
  <el-breadcrumb class="app-breadcrumb" separator="">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item v-for="(item, index) in levelList" :key="item.path">
        <div class="breadcrumb-item-inner" :class="{ 'is-last': index == levelList.length - 1 }">
          <span v-if="item.redirect === 'noRedirect' || index == levelList.length - 1" class="no-redirect">
            {{ item.meta?.title }}
          </span>
          <a v-else class="redirect-link" @click.prevent="handleLink(item)">
            {{ item.meta?.title }}
          </a>
          <span v-if="index < levelList.length - 1" class="custom-separator"> / </span>
        </div>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { RouteLocationMatched } from 'vue-router';
import { usePermissionStore } from '@/store/modules/permission';

const route = useRoute();
const router = useRouter();
const permissionStore = usePermissionStore();
const levelList = ref<RouteLocationMatched[]>([]);

const getBreadcrumb = () => {
  let matched = [];
  const pathNum = findPathNum(route.path);
  if (pathNum > 2) {
    const reg = /\/\w+/gi;
    const pathList = route.path.match(reg).map((item, index) => {
      if (index !== 0) item = item.slice(1);
      return item;
    });
    getMatched(pathList, permissionStore.defaultRoutes, matched);
  } else {
    matched = route.matched.filter((item) => item.meta && item.meta.title);
  }
  // 判断是否为首页
  if (!isDashboard(matched[0])) {
    matched = [{ path: '/index', meta: { title: '首页' }, redirect: 'noRedirect' }].concat(matched);
  }
  levelList.value = matched.filter((item) => item.meta && item.meta.title && item.meta.breadcrumb !== false);
};

const findPathNum = (str: string, char = '/') => {
  if (typeof str !== 'string' || str.length === 0) return 0;
  return str.split(char).length - 1;
};

const getMatched = (pathList: string[] | void[], routeList: any[], matched: any[]) => {
  const data = routeList.find((item) => item.path == pathList[0] || (item.name += '').toLowerCase() == pathList[0]);
  if (data) {
    matched.push(data);
    if (data.children && pathList.length) {
      pathList.shift();
      getMatched(pathList, data.children, matched);
    }
  }
};

const isDashboard = (route: RouteLocationMatched) => {
  const name = route && (route.name as string);
  if (!name) {
    return false;
  }
  return name.trim() === 'Index';
};

const handleLink = (item: { redirect: any; path: any }) => {
  const { redirect, path } = item;
  redirect ? router.push(redirect) : router.push(path);
};

watchEffect(() => {
  if (route.path.startsWith('/redirect/')) return;
  getBreadcrumb();
});

onMounted(() => {
  getBreadcrumb();
});
</script>

<style lang="scss" scoped>
.el-breadcrumb {
  display: inline-block;
  font-size: 14px;
  line-height: 50px;
  margin-left: 18px;

  .breadcrumb-item-inner {
    display: flex;
    align-items: center;
  }

  .no-redirect {
    color: #606266;
    cursor: default;
    font-weight: 600;
  }

  .redirect-link {
    color: #909399;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
    text-decoration: none;

    &:hover {
      color: var(--el-color-primary);
      transform: translateY(-1px);
    }

    // 下划线动画
    &::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 1px;
      bottom: -2px;
      left: 0;
      background-color: var(--el-color-primary);
      transform: scaleX(0);
      transform-origin: bottom right;
      transition: transform 0.3s ease-out;
    }

    &:hover::after {
      transform: scaleX(1);
      transform-origin: bottom left;
    }
  }

  .custom-separator {
    margin: 0 8px;
    color: #c0c4cc;
    display: flex;
    align-items: center;
    font-size: 14px;
    font-weight: 400;
  }
}

:deep(.el-breadcrumb__separator) {
  display: none;
}
</style>
