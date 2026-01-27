<template>
  <div class="p-2 h-full flex flex-col">
    <!-- 搜索区域（可折叠） -->
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover" class="search-card">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="用户名称" prop="userName">
              <el-input v-model="queryParams.userName" placeholder="请输入用户名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="用户昵称" prop="nickName">
              <el-input v-model="queryParams.nickName" placeholder="请输入用户昵称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="手机号码" prop="phonenumber">
              <el-input v-model="queryParams.phonenumber" placeholder="请输入手机号码" clearable @keyup.enter="handleQuery" />
            </el-form-item>

            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="用户状态" clearable>
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
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <!-- 主表格区域 + 工具栏 -->
    <el-card shadow="hover" class="flex-1 flex flex-col overflow-hidden table-card">
      <template #header>
        <el-row :gutter="10">
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:user:add']" type="primary" plain icon="Plus" @click="handleAdd()">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:user:edit']" type="success" plain :disabled="single" icon="Edit" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:user:remove']" type="danger" plain :disabled="multiple" icon="Delete" @click="handleDelete()">
              删除
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-dropdown class="mt-[1px]">
              <el-button plain type="info">
                更多
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item icon="Download" @click="importTemplate">下载模板</el-dropdown-item>
                  <el-dropdown-item v-if="checkPermi(['system:user:import'])" icon="Top" @click="handleImport">导入数据</el-dropdown-item>
                  <el-dropdown-item v-if="checkPermi(['system:user:export'])" icon="Download" @click="handleExport">导出数据</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" :columns="columns" :search="true" @query-table="getList" />
        </el-row>
      </template>

      <!-- 表格主体 -->
      <div class="flex-1 overflow-hidden">
        <el-table v-loading="loading" border :data="userList" @selection-change="handleSelectionChange" height="100%">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column v-if="columns[0].visible" key="userId" label="用户编号" align="center" prop="userId" />
          <el-table-column v-if="columns[1].visible" key="userName" label="用户名称" align="center" prop="userName" :show-overflow-tooltip="true" />
          <el-table-column v-if="columns[2].visible" key="nickName" label="用户昵称" align="center" prop="nickName" :show-overflow-tooltip="true" />
          <el-table-column v-if="columns[3].visible" key="phonenumber" label="手机号码" align="center" prop="phonenumber" width="120" />
          <el-table-column v-if="columns[4].visible" key="status" label="状态" align="center">
            <template #default="scope">
              <el-switch v-model="scope.row.status" active-value="0" inactive-value="1" @change="handleStatusChange(scope.row)" />
            </template>
          </el-table-column>
          <el-table-column v-if="columns[5].visible" label="创建时间" align="center" prop="createTime" width="160" />

          <!-- 操作列（固定右侧） -->
          <el-table-column label="操作" fixed="right" width="180" class-name="small-padding fixed-width">
            <template #default="scope">
              <el-tooltip v-if="scope.row.userId !== 1" content="修改" placement="top">
                <el-button v-hasPermi="['system:user:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)" />
              </el-tooltip>
              <el-tooltip v-if="scope.row.userId !== 1" content="删除" placement="top">
                <el-button v-hasPermi="['system:user:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)" />
              </el-tooltip>
              <el-tooltip v-if="scope.row.userId !== 1" content="重置密码" placement="top">
                <el-button v-hasPermi="['system:user:resetPwd']" link type="primary" icon="Key" @click="handleResetPwd(scope.row)" />
              </el-tooltip>
              <el-tooltip v-if="scope.row.userId !== 1" content="分配角色" placement="top">
                <el-button v-hasPermi="['system:user:edit']" link type="primary" icon="CircleCheck" @click="handleAuthRole(scope.row)" />
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页组件 -->
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <UserFormDialog ref="userFormDialogRef" :sys_normal_disable="sys_normal_disable" :sys_user_sex="sys_user_sex" @success="getList" />

    <!-- 用户数据导入对话框 -->
    <el-dialog v-model="upload.open" :title="upload.title" width="400px" append-to-body>
      <el-upload
        ref="uploadRef"
        :limit="1"
        accept=".xlsx, .xls"
        :headers="upload.headers"
        :action="upload.url + '?updateSupport=' + upload.updateSupport"
        :disabled="upload.isUploading"
        :on-progress="handleFileUploadProgress"
        :on-success="handleFileSuccess"
        :auto-upload="false"
        drag
      >
        <el-icon class="el-icon--upload"><i-ep-upload-filled /></el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="text-center el-upload__tip">
            <div><el-checkbox v-model="upload.updateSupport" />是否更新已经存在的用户数据</div>
            <span>仅允许导入xls、xlsx格式文件。</span>
            <el-link type="primary" :underline="false" style="font-size: 12px; vertical-align: baseline" @click="importTemplate"> 下载模板 </el-link>
          </div>
        </template>
      </el-upload>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitFileForm">确 定</el-button>
          <el-button @click="upload.open = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="User" lang="ts">
import api from '@/api/system/user';
import { UserQuery, UserVO } from '@/api/system/user/types';
import { globalHeaders } from '@/utils/request';
import { to } from 'await-to-js';
import { checkPermi } from '@/utils/permission';
import { ArrowDown } from '@element-plus/icons-vue';
import UserFormDialog from './components/UserFormDialog.vue';

// 组件引用与响应式状态
const router = useRouter();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_normal_disable, sys_user_sex } = toRefs<any>(proxy?.useDict('sys_normal_disable', 'sys_user_sex'));

const userList = ref<UserVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const dateRange = ref<[string, string]>(['', '']);

// 导入相关状态
const upload = reactive<ImportOption>({
  open: false,
  title: '',
  isUploading: false,
  updateSupport: 0,
  headers: globalHeaders(),
  url: import.meta.env.VITE_APP_BASE_API + '/system/user/importData'
});

// 表格列显隐控制
const columns = ref<FieldOption[]>([
  { key: 0, label: '用户编号', visible: false, children: [] },
  { key: 1, label: '用户名称', visible: true, children: [] },
  { key: 2, label: '用户昵称', visible: true, children: [] },
  { key: 3, label: '手机号码', visible: true, children: [] },
  { key: 4, label: '状态', visible: true, children: [] },
  { key: 5, label: '创建时间', visible: true, children: [] }
]);

// 引用
const queryFormRef = ref<ElFormInstance>();
const uploadRef = ref<ElUploadInstance>();
const userFormDialogRef = ref<InstanceType<typeof UserFormDialog>>();

const initData: PageData<any, UserQuery> = {
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    userName: '',
    phonenumber: '',
    status: '',
    roleId: ''
  },
  rules: {}
};

const data = reactive<PageData<any, UserQuery>>(initData);
const { queryParams } = toRefs(data);

// 核心业务方法

/** 获取用户列表（主查询接口） */
const getList = async () => {
  loading.value = true;
  const res = await api.listUser(proxy?.addDateRange(queryParams.value, dateRange.value));
  loading.value = false;
  userList.value = res.rows;
  total.value = res.total;
};

/** 搜索 & 重置 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  dateRange.value = ['', ''];
  queryFormRef.value?.resetFields();
  queryParams.value.pageNum = 1;
  handleQuery();
};

/** 批量/单条删除 */
const handleDelete = async (row?: UserVO) => {
  const userIds = row?.userId || ids.value;
  const [err] = await to(proxy?.$modal.confirm(`是否确认删除用户编号为"${userIds}"的数据项？`) as any);
  if (!err) {
    await api.delUser(userIds);
    await getList();
    proxy?.$modal.msgSuccess('删除成功');
  }
};

/** 启用/停用切换 */
const handleStatusChange = async (row: UserVO) => {
  const text = row.status === '0' ? '启用' : '停用';
  try {
    await proxy?.$modal.confirm(`确认要"${text}""${row.userName}"用户吗?`);
    await api.changeUserStatus(row.userId, row.status);
    proxy?.$modal.msgSuccess(text + '成功');
  } catch {
    row.status = row.status === '0' ? '1' : '0'; // 失败回滚
  }
};

/** 跳转到角色分配页面 */
const handleAuthRole = (row: UserVO) => {
  router.push(`/system/user-auth/role/${row.userId}`);
};

/** 重置密码弹窗 */
const handleResetPwd = async (row: UserVO) => {
  const [err, res] = await to(
    ElMessageBox.prompt(`请输入"${row.userName}"的新密码`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      closeOnClickModal: false,
      inputPattern: /^.{5,20}$/,
      inputErrorMessage: '用户密码长度必须介于 5 和 20 之间',
      inputValidator: (value) => {
        if (/[<>"'|\\]/.test(value)) return '不能包含非法字符：< > " \' \\ |';
      }
    })
  );
  if (!err && res) {
    await api.resetUserPwd(row.userId, res.value);
    proxy?.$modal.msgSuccess(`修改成功，新密码是：${res.value}`);
  }
};

/** 表格多选变化 */
const handleSelectionChange = (selection: UserVO[]) => {
  ids.value = selection.map((item) => item.userId);
  single.value = selection.length !== 1;
  multiple.value = selection.length === 0;
};

// 导入 & 导出相关

const handleImport = () => {
  upload.title = '用户导入';
  upload.open = true;
};

const handleExport = () => {
  proxy?.download('system/user/export', { ...queryParams.value }, `user_${Date.now()}.xlsx`);
};

const importTemplate = () => {
  proxy?.download('system/user/importTemplate', {}, `user_template_${Date.now()}.xlsx`);
};

const handleFileUploadProgress = () => {
  upload.isUploading = true;
};

const handleFileSuccess = (response: any, file: UploadFile) => {
  upload.open = false;
  upload.isUploading = false;
  uploadRef.value?.handleRemove(file);
  ElMessageBox.alert(`<div style="overflow:auto;overflow-x:hidden;max-height:70vh;padding:10px 20px 0;">${response.msg}</div>`, '导入结果', {
    dangerouslyUseHTMLString: true
  });
  getList();
};

const submitFileForm = () => {
  uploadRef.value?.submit();
};

// 新增/编辑 对话框组件调用
const handleAdd = () => {
  userFormDialogRef.value?.openAdd();
};
const handleUpdate = (row?: UserVO) => {
  const raw = row?.userId ?? ids.value[0];
  const userId = typeof raw === 'string' ? Number(raw) : (raw as number | undefined);
  if (!userId || Number.isNaN(userId)) {
    proxy?.$modal.msgError('请选择一条要修改的用户');
    return;
  }
  userFormDialogRef.value?.openEdit(userId);
};

// 生命周期
onMounted(() => {
  getList();
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
