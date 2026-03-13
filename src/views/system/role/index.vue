<template>
  <div class="p-2 h-full flex flex-col">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover" class="search-card">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="角色名称" prop="roleName">
              <el-input v-model="queryParams.roleName" placeholder="请输入角色名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="权限字符" prop="roleKey">
              <el-input v-model="queryParams.roleKey" placeholder="请输入权限字符" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="角色状态" clearable>
                <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="创建时间" style="width: 308px">
              <el-date-picker
                v-model="dateRange"
                value-format="YYYY-MM-DD HH:mm:ss"
                type="daterange"
                range-separator="-"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
              ></el-date-picker>
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
            <el-button v-hasPermi="['system:role:add']" type="primary" plain icon="Plus" @click="handleAdd()">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:role:edit']" type="success" plain :disabled="single" icon="Edit" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:role:delete']" type="danger" plain :disabled="ids.length === 0" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:role:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <div class="flex-1 overflow-hidden">
        <el-table
          ref="roleTableRef"
          border
          v-loading="loading"
          :data="roleList"
          height="100%"
          @selection-change="handleSelectionChange"
          row-key="roleId"
        >
          <el-table-column width="50" align="center" class-name="drag-column">
            <template #default>
              <el-icon class="cursor-move drag-handler" style="font-size: 16px; color: #909399"><Rank /></el-icon>
            </template>
          </el-table-column>
          <el-table-column type="selection" width="50" align="center" />

          <el-table-column label="角色名称" align="center" prop="roleName" :show-overflow-tooltip="true" min-width="150" />
          <el-table-column label="权限字符" align="center" prop="roleKey" :show-overflow-tooltip="true" min-width="200" />
          <el-table-column label="创建时间" align="center" prop="createTime" width="240">
            <template #default="scope">
              <span>{{ proxy.parseTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" align="center" width="100">
            <template #default="scope">
              <el-switch v-model="scope.row.status" active-value="0" inactive-value="1" @change="handleStatusChange(scope.row)"></el-switch>
            </template>
          </el-table-column>
          <el-table-column fixed="right" align="center" label="操作" width="180">
            <template #default="scope">
              <el-tooltip v-if="scope.row.roleId !== 1" content="修改" placement="top">
                <el-button v-hasPermi="['system:role:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
              </el-tooltip>
              <el-tooltip v-if="scope.row.roleId !== 1" content="删除" placement="top">
                <el-button v-hasPermi="['system:role:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
              </el-tooltip>
              <el-tooltip v-if="scope.row.roleId !== 1" content="数据权限" placement="top">
                <el-button v-hasPermi="['system:role:edit']" link type="primary" icon="CircleCheck" @click="handleDataScope(scope.row)"></el-button>
              </el-tooltip>
              <el-tooltip v-if="scope.row.roleId !== 1" content="分配用户" placement="top">
                <el-button v-hasPermi="['system:role:edit']" link type="primary" icon="User" @click="handleAuthUser(scope.row)"></el-button>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>

    <RoleFormDialog ref="roleFormDialogRef" :sys_normal_disable="sys_normal_disable" @success="getList" />

    <!-- 分配角色数据权限对话框 -->
    <el-dialog v-model="openDataScope" :title="dialog.title" width="500px" append-to-body>
      <el-form ref="dataScopeRef" :model="form" label-width="80px">
        <el-form-item label="角色名称">
          <el-input v-model="form.roleName" :disabled="true" />
        </el-form-item>
        <el-form-item label="权限字符">
          <el-input v-model="form.roleKey" :disabled="true" />
        </el-form-item>
        <el-form-item label="权限范围">
          <el-select v-model="form.dataScope" @change="dataScopeSelectChange">
            <el-option v-for="item in dataScopeOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitDataScope">确 定</el-button>
          <el-button @click="cancelDataScope">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Role" lang="ts">
import { changeRoleSort, changeRoleStatus, dataScope, delRole, getRole, listRole } from '@/api/system/role';
import { RoleForm, RoleQuery, RoleVO } from '@/api/system/role/types';
import { Rank } from '@element-plus/icons-vue';
import Sortable from 'sortablejs';
import RoleFormDialog from './components/RoleFormDialog.vue';

const router = useRouter();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_normal_disable } = toRefs<any>(proxy?.useDict('sys_normal_disable'));

const roleList = ref<RoleVO[]>();
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const dateRange = ref<[DateModelType, DateModelType]>(['', '']);
const openDataScope = ref(false);

/** 数据范围选项*/
const dataScopeOptions = ref([
  { value: '1', label: '全部数据权限' },
  { value: '2', label: '自定数据权限' },
  { value: '5', label: '仅本人数据权限' }
]);

const queryFormRef = ref<ElFormInstance>();
const dataScopeRef = ref<ElFormInstance>();
const roleFormDialogRef = ref<InstanceType<typeof RoleFormDialog>>();
const roleTableRef = ref<ElTableInstance>();
const sortableInstance = ref<Sortable | null>(null);

const initForm: RoleForm = {
  roleId: undefined,
  roleSort: 1,
  status: '0',
  roleName: '',
  roleKey: '',
  menuCheckStrictly: true,
  remark: '',
  dataScope: '1',
  menuIds: []
};

const data = reactive<PageData<RoleForm, RoleQuery>>({
  form: { ...initForm },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    roleName: '',
    roleKey: '',
    status: ''
  },
  rules: {
    roleName: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
    roleKey: [{ required: true, message: '权限字符不能为空', trigger: 'blur' }],
    roleSort: [{ required: true, message: '角色顺序不能为空', trigger: 'blur' }]
  }
});
const { form, queryParams } = toRefs(data);

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

/**
 * 查询角色列表
 */
const getList = async () => {
  loading.value = true;
  const res = await listRole(proxy?.addDateRange(queryParams.value, dateRange.value));
  roleList.value = [];
  await nextTick();
  roleList.value = res.rows;
  total.value = res.total;
  await nextTick();
  roleTableRef.value?.doLayout?.();
  if (sortableInstance.value) {
    sortableInstance.value.destroy();
    sortableInstance.value = null;
  }
  await nextTick(() => {
    initSortable();
  });
  loading.value = false;
};

/**
 * 搜索按钮操作
 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置 */
const resetQuery = () => {
  dateRange.value = ['', ''];
  queryFormRef.value?.resetFields();
  handleQuery();
};

/**删除按钮操作 */
const handleDelete = async (row?: RoleVO) => {
  const roleids = row?.roleId || ids.value;
  await proxy?.$modal.confirm('是否确认删除角色编号为' + roleids + '数据项目');
  await delRole(roleids);
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'system/role/export',
    {
      ...queryParams.value
    },
    `role_${new Date().getTime()}.xlsx`
  );
};
/** 多选框选中数据 */
const handleSelectionChange = (selection: RoleVO[]) => {
  ids.value = selection.map((item: RoleVO) => item.roleId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 角色状态修改 */
const handleStatusChange = async (row: RoleVO) => {
  const text = row.status === '0' ? '启用' : '停用';
  try {
    await proxy?.$modal.confirm('确认要"' + text + '""' + row.roleName + '"角色吗?');
    await changeRoleStatus(row.roleId, row.status);
    proxy?.$modal.msgSuccess(text + '成功');
  } catch {
    row.status = row.status === '0' ? '1' : '0';
  }
};

/** 分配用户 */
const handleAuthUser = (row: RoleVO) => {
  router.push('/system/role-auth/user/' + row.roleId);
};

/** 添加角色 */
const handleAdd = () => {
  roleFormDialogRef.value?.openAdd();
};

/** 修改角色 */
const handleUpdate = async (row?: RoleVO) => {
  const roleId = row?.roleId || ids.value[0];
  if (!roleId) {
    proxy?.$modal.msgError('请选择一条要修改的角色');
    return;
  }
  roleFormDialogRef.value?.openEdit(roleId);
};

/** 选择角色权限范围触发 */
const dataScopeSelectChange = () => {
  // 数据权限范围变更时的处理
};

/** 分配数据权限操作 */
const handleDataScope = async (row: RoleVO) => {
  const response = await getRole(row.roleId);
  Object.assign(form.value, response.data);
  openDataScope.value = true;
  dialog.title = '分配数据权限';
};

/** 提交按钮（数据权限） */
const submitDataScope = async () => {
  if (form.value.roleId) {
    await dataScope(form.value);
    proxy?.$modal.msgSuccess('修改成功');
    openDataScope.value = false;
    await getList();
  }
};

/** 取消按钮（数据权限）*/
const cancelDataScope = () => {
  dataScopeRef.value?.resetFields();
  form.value = { ...initForm };
  openDataScope.value = false;
};

/**
 * 初始化拖拽
 */
const initSortable = () => {
  const tbody = roleTableRef.value?.$el.querySelector('.el-table__body-wrapper tbody');
  if (!tbody) return;

  if (sortableInstance.value) {
    sortableInstance.value.destroy();
    sortableInstance.value = null;
  }

  sortableInstance.value = Sortable.create(tbody, {
    handle: '.drag-handler',
    animation: 150,
    onEnd: async ({ newIndex, oldIndex }: any) => {
      if (newIndex === oldIndex) return;

      const currRow = roleList.value?.splice(oldIndex, 1)[0];
      if (currRow && roleList.value) {
        roleList.value.splice(newIndex, 0, currRow);

        // 获取新的 ID 顺序
        const roleIds = roleList.value.map((item) => item.roleId);
        try {
          await changeRoleSort(roleIds);
          proxy?.$modal.msgSuccess('排序成功');
        } catch (error) {
          // 失败时刷新回原样
        } finally {
          await getList();
        }
      }
    }
  });
};

onMounted(() => {
  getList();
  nextTick(() => {
    initSortable();
  });
});
</script>

<style lang="scss" scoped>
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
</style>
