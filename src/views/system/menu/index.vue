<template>
  <div class="p-2 h-full flex flex-col">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover" class="search-card">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="菜单名称" prop="menuName">
              <el-input v-model="queryParams.menuName" placeholder="请输入菜单名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="菜单状态" clearable>
                <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="hover" class="flex-1 flex flex-col overflow-hidden table-card">
      <template #header>
        <el-row :gutter="10">
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:menu:add']" type="primary" plain icon="Plus" @click="handleAdd()">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:menu:remove']" type="danger" plain icon="Delete" @click="handleCascadeDelete" :loading="deleteLoading"
              >级联删除</el-button
            >
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <div class="flex-1 overflow-hidden">
        <el-table
          ref="menuTableRef"
          v-loading="loading"
          :data="menuList"
          row-key="menuId"
          border
          height="100%"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          :default-expand-all="false"
          lazy
          :load="getChildrenList"
          :expand-change="expandMenuHandle"
        >
          <el-table-column prop="menuName" label="菜单名称" :show-overflow-tooltip="true" width="160"></el-table-column>
          <el-table-column prop="orderNum" label="排序" align="center" width="60"></el-table-column>
          <el-table-column prop="perms" label="权限标识" align="center" :show-overflow-tooltip="true"></el-table-column>
          <el-table-column prop="component" label="组件路径" align="center" :show-overflow-tooltip="true"></el-table-column>
          <el-table-column prop="status" label="状态" align="center" width="80">
            <template #default="scope">
              <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
            </template>
          </el-table-column>
          <el-table-column label="创建时间" align="center" prop="createTime" width="240">
            <template #default="scope">
              <span>{{ scope.row.createTime }}</span>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" align="center" width="180">
            <template #default="scope">
              <el-tooltip content="修改" placement="top">
                <el-button v-hasPermi="['system:menu:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)" />
              </el-tooltip>
              <el-tooltip content="新增" placement="top">
                <el-button v-hasPermi="['system:menu:add']" link type="primary" icon="Plus" @click="handleAdd(scope.row)" />
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button v-hasPermi="['system:menu:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)" />
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <MenuFormDialog ref="menuFormDialogRef" :sys_show_hide="sys_show_hide" :sys_normal_disable="sys_normal_disable" @success="getList" />

    <el-dialog v-model="deleteDialog.visible" :title="deleteDialog.title" destroy-on-close append-to-bod width="750px">
      <el-tree
        ref="menuTreeRef"
        class="tree-border"
        :data="menuOptions"
        show-checkbox
        node-key="menuId"
        :check-strictly="false"
        empty-text="加载中，请稍候"
        :default-expanded-keys="[0]"
        :props="{ value: 'menuId', label: 'menuName', children: 'children' } as any"
      />
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitDeleteForm" :loading="deleteLoading">确 定</el-button>
          <el-button @click="cancelCascade">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Menu" lang="ts">
import { cascadeDelMenu, delMenu, listMenu } from '@/api/system/menu';
import { MenuQuery, MenuVO } from '@/api/system/menu/types';
import MenuFormDialog from './components/MenuFormDialog.vue';

interface MenuOptionsType {
  menuId: number;
  menuName: string;
  children: MenuOptionsType[] | undefined;
}

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_show_hide, sys_normal_disable } = toRefs<any>(proxy?.useDict('sys_show_hide', 'sys_normal_disable'));

const menuList = ref<MenuVO[]>([]);
const menuChildrenListMap = ref({});
const menuExpandMap = ref({});
const loading = ref(true);
const showSearch = ref(true);
const menuOptions = ref<MenuOptionsType[]>([]);

const queryFormRef = ref<ElFormInstance>();
const menuFormDialogRef = ref<InstanceType<typeof MenuFormDialog>>();
const queryParams = ref<MenuQuery>({
  menuName: undefined,
  status: undefined
});

const menuTableRef = ref<ElTableInstance>();

/** 获取子菜单列表 */
const getChildrenList = async (row: any, treeNode: unknown, resolve: (data: any[]) => void) => {
  menuExpandMap.value[row.menuId] = { row, treeNode, resolve };
  const children = menuChildrenListMap.value[row.menuId] || [];
  // 菜单的子菜单清空后关闭展开
  if (children.length == 0) {
    // fix: 处理当菜单只有一个子菜单并被删除，需要将父菜单的展开状态关闭
    menuTableRef.value?.updateKeyChildren(row.menuId, children);
  }
  resolve(children);
};

/** 收起菜单时从menuExpandMap中删除对应菜单id数据 */
const expandMenuHandle = async (row: any, expanded: boolean) => {
  if (!expanded) {
    menuExpandMap.value[row.menuId] = undefined;
  }
};

/** 刷新展开的菜单数据 */
const refreshLoadTree = (parentId: string | number) => {
  if (menuExpandMap.value[parentId]) {
    const { row, treeNode, resolve } = menuExpandMap.value[parentId];
    if (row) {
      getChildrenList(row, treeNode, resolve);
      if (row.parentId) {
        const grandpaMenu = menuExpandMap.value[row.parentId];
        getChildrenList(grandpaMenu.row, grandpaMenu.treeNode, grandpaMenu.resolve);
      }
    }
  }
};

/** 重新加载所有已展开的菜单的数据 */
const refreshAllExpandMenuData = () => {
  for (const menuId in menuExpandMap.value) {
    refreshLoadTree(menuId);
  }
};

/** 查询菜单列表 */
const getList = async () => {
  loading.value = true;
  const res = await listMenu(queryParams.value);

  const tempMap = {};
  // 存储 父菜单:子菜单列表
  for (const menu of res.data) {
    const parentId = menu.parentId;
    if (!tempMap[parentId]) {
      tempMap[parentId] = [];
    }
    tempMap[parentId].push(menu);
  }
  // 创建一个当前所有 menuId 的 Set，用于查找父菜单是否存在于当前数据中
  const menuIdSet = new Set();
  // 设置有没有子菜单
  for (const menu of res.data) {
    menu['hasChildren'] = tempMap[menu.menuId]?.length > 0;
    menuIdSet.add(menu.menuId);
  }
  menuChildrenListMap.value = tempMap;
  // 找出所有父ID不在当前菜单ID集合中的菜单项，作为新的顶层菜单
  menuList.value = res.data.filter((menu) => !menuIdSet.has(menu.parentId));
  // 根据新数据重新加载子菜单数据
  refreshAllExpandMenuData();
  loading.value = false;
};
/** 查询菜单下拉树结构 */
const getTreeselect = async () => {
  menuOptions.value = [];
  const response = await listMenu();
  const menu: MenuOptionsType = { menuId: 0, menuName: '主类目', children: [] };
  menu.children = proxy?.handleTree<MenuOptionsType>(response.data, 'menuId');
  menuOptions.value.push(menu);
};
/** 搜索按钮操作 */
const handleQuery = () => {
  getList();
};
/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};
/** 新增按钮操作 */
const handleAdd = (row?: MenuVO) => {
  menuFormDialogRef.value?.openAdd(row);
};
/** 修改按钮操作 */
const handleUpdate = (row: MenuVO) => {
  if (row.menuId) {
    menuFormDialogRef.value?.openEdit(row.menuId);
  }
};
/** 删除按钮操作 */
const handleDelete = async (row: MenuVO) => {
  await proxy?.$modal.confirm('是否确认删除名称为"' + row.menuName + '"的数据项?');
  await delMenu(row.menuId);
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

const deleteLoading = ref<boolean>(false);
const menuTreeRef = ref<ElTreeInstance>();

const deleteDialog = reactive<DialogOption>({
  visible: false,
  title: '级联删除菜单'
});

/** 级联删除按钮操作 */
const handleCascadeDelete = () => {
  menuTreeRef.value?.setCheckedKeys([]);
  getTreeselect();
  deleteDialog.visible = true;
};

/** 取消按钮 */
const cancelCascade = () => {
  menuTreeRef.value?.setCheckedKeys([]);
  deleteDialog.visible = false;
};

/** 删除提交按钮 */
const submitDeleteForm = async () => {
  const menuIds = menuTreeRef.value?.getCheckedKeys();
  if (menuIds.length < 0) {
    proxy?.$modal.msgWarning('请选择要删除的菜单');
    return;
  }

  deleteLoading.value = true;
  await cascadeDelMenu(menuIds).finally(() => (deleteLoading.value = false));
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
  deleteDialog.visible = false;
};

onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
.search-card {
  :deep(.el-card__body) {
    padding-bottom: 7px !important;
  }
  :deep(.search-btn-item) {
    margin-bottom: 0 !important;
  }
}

.table-card {
  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}

.tree-border {
  height: 300px;
  overflow: auto;
}
</style>
