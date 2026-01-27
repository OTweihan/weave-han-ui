<template>
  <div class="p-2 h-full flex flex-col">
    <!-- 搜索表单区域（可折叠） -->
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-3">
        <el-card shadow="hover" class="search-card">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="用户账号">
              <el-input
                v-model="queryParams.userAccount"
                placeholder="请输入用户账号"
                clearable
                maxlength="20"
                @input="queryParams.userAccount = $event.replace(/[^a-zA-Z0-9]/g, '')"
                @keyup.enter="handleQuery"
              />
            </el-form-item>

            <el-form-item label="用户名称">
              <el-input v-model="queryParams.nickName" placeholder="请输入用户昵称" clearable @keyup.enter="handleQuery" />
            </el-form-item>

            <el-form-item label="手机号码">
              <el-input v-model="queryParams.phonenumber" placeholder="请输入手机号码" clearable @keyup.enter="handleQuery" />
            </el-form-item>

            <el-form-item label="状态">
              <el-select v-model="queryParams.status" placeholder="全部" clearable>
                <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>

            <el-form-item label="创建时间" style="width: 308px">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="-"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD HH:mm:ss"
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

    <!-- 表格 + 工具栏 + 分页 -->
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
            <el-dropdown>
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
          <el-table-column v-if="columns[0].visible" label="用户编号" prop="userId" align="center" />
          <el-table-column v-if="columns[1].visible" label="用户账号" prop="userAccount" align="center" :show-overflow-tooltip="true" />
          <el-table-column v-if="columns[2].visible" label="用户名称" prop="nickName" align="center" :show-overflow-tooltip="true" />
          <el-table-column v-if="columns[3].visible" label="手机号码" prop="phonenumber" align="center" width="140" />
          <el-table-column v-if="columns[5].visible" label="创建时间" prop="createTime" align="center" width="240" />
          <el-table-column v-if="columns[4].visible" label="状态" align="center" width="120">
            <template #default="{ row }">
              <el-switch v-model="row.status" active-value="0" inactive-value="1" @change="handleStatusChange(row)" />
            </template>
          </el-table-column>

          <!-- 操作列 - 固定右侧 -->
          <el-table-column label="操作" align="center" fixed="right" width="180" class-name="small-padding fixed-width">
            <template #default="{ row }">
              <template v-if="row.userId !== 1">
                <el-tooltip content="修改" placement="top">
                  <el-button v-hasPermi="['system:user:edit']" link type="primary" icon="Edit" @click="handleUpdate(row)" />
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-button v-hasPermi="['system:user:remove']" link type="primary" icon="Delete" @click="handleDelete(row)" />
                </el-tooltip>
                <el-tooltip content="重置密码" placement="top">
                  <el-button v-hasPermi="['system:user:resetPwd']" link type="primary" icon="Key" @click="handleResetPwd(row)" />
                </el-tooltip>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <UserFormDialog ref="userFormDialogRef" :sys_normal_disable="sys_normal_disable" :sys_user_sex="sys_user_sex" @success="getList" />

    <!-- 导入对话框 -->
    <el-dialog v-model="upload.open" :title="upload.title" width="400px" append-to-body>
      <el-upload
        ref="uploadRef"
        :limit="1"
        accept=".xlsx,.xls"
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
            <div><el-checkbox v-model="upload.updateSupport" /> 是否更新已经存在的用户数据</div>
            <div>仅支持 xls / xlsx 格式</div>
            <el-link type="primary" style="font-size: 12px" @click="importTemplate">下载模板</el-link>
          </div>
        </template>
      </el-upload>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="upload.open = false">取消</el-button>
          <el-button type="primary" @click="submitFileForm">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="User">
import { ref, reactive, toRefs, onMounted, getCurrentInstance } from 'vue';
import type { ComponentInternalInstance } from 'vue';
import { ElMessageBox } from 'element-plus';
import api from '@/api/system/user';
import type { UserQuery, UserVO } from '@/api/system/user/types';
import { globalHeaders } from '@/utils/request';
import { checkPermi } from '@/utils/permission';
import { to } from 'await-to-js';
import { ArrowDown } from '@element-plus/icons-vue';

import UserFormDialog from './components/UserFormDialog.vue';

// 全局引用与字典
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_normal_disable, sys_user_sex } = toRefs(proxy?.useDict('sys_normal_disable', 'sys_user_sex'));

// 表格数据与状态
const userList = ref<UserVO[]>([]);
const loading = ref(false);
const total = ref(0);
const ids = ref<(number | string)[]>([]);
const selectNickNames = ref<string[]>([]);
const single = ref(true); // 是否只选中一行
const multiple = ref(true); // 是否未选中任何行
const showSearch = ref(true);

// 查询参数
const dateRange = ref<string[]>(['', '']);

const queryParams = reactive<UserQuery>({
  pageNum: 1,
  pageSize: 10,
  userAccount: '',
  nickName: '',
  phonenumber: '',
  status: '',
  roleId: ''
});

// 表格列显隐控制
const columns = ref([
  { key: 0, label: '用户编号', visible: false },
  { key: 1, label: '用户账号', visible: true },
  { key: 2, label: '用户名称', visible: true },
  { key: 3, label: '手机号码', visible: true },
  { key: 4, label: '状态', visible: true },
  { key: 5, label: '创建时间', visible: true }
]);

// 引用
const queryFormRef = ref();
const uploadRef = ref();
const userFormDialogRef = ref<InstanceType<typeof UserFormDialog>>();

// 导入相关状态
const upload = reactive({
  open: false,
  title: '用户数据导入',
  isUploading: false,
  updateSupport: 0, // 是否覆盖更新
  headers: globalHeaders(),
  url: import.meta.env.VITE_APP_BASE_API + '/system/user/importData'
});

// 核心业务逻辑

/** 获取用户列表 */
const getList = async () => {
  loading.value = true;
  const params = proxy?.addDateRange({ ...queryParams }, dateRange.value);
  const res = await api.listUser(params);
  userList.value = res.rows || [];
  total.value = res.total || 0;
  loading.value = false;
};

/** 搜索 & 重置 */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  dateRange.value = ['', ''];
  queryFormRef.value?.resetFields();
  queryParams.pageNum = 1;
  handleQuery();
};

/** 删除（支持批量） */
const handleDelete = async (row?: UserVO) => {
  const userIds = row?.userId || ids.value;
  const nickName = row?.nickName || selectNickNames.value.join(', ');
  const [err] = await to(proxy?.$modal.confirm(`确认删除用户 "${nickName}" 吗？`) as any);
  if (!err) {
    await api.delUser(userIds);
    await getList();
    proxy?.$modal.msgSuccess('删除成功');
  }
};

/** 状态切换（启用/停用） */
const handleStatusChange = async (row: UserVO) => {
  const text = row.status === '0' ? '启用' : '停用';
  try {
    await proxy?.$modal.confirm(`确认要${text}用户 "${row.userAccount}" 吗？`);
    await api.changeUserStatus(row.userId, row.status);
    proxy?.$modal.msgSuccess(`${text}成功`);
  } catch {
    // 操作失败回滚
    row.status = row.status === '0' ? '1' : '0';
  }
};

/** 重置密码 */
const handleResetPwd = async (row: UserVO) => {
  const [err, res] = await to(
    ElMessageBox.prompt(`请输入用户 "${row.userAccount}" 的新密码`, '重置密码', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^.{5,20}$/,
      inputErrorMessage: '密码长度必须为 5~20 位'
    })
  );

  if (err || !res?.value) return;

  await api.resetUserPwd(row.userId, res.value);
  proxy?.$modal.msgSuccess(`重置成功，新密码：${res.value}`);
};

/** 多选变化 */
const handleSelectionChange = (selection: UserVO[]) => {
  ids.value = selection.map((item) => item.userId);
  selectNickNames.value = selection.map((item) => item.nickName);
  single.value = selection.length !== 1;
  multiple.value = selection.length === 0;
};

// 导入导出

const handleImport = () => {
  upload.open = true;
};

const submitFileForm = () => {
  uploadRef.value?.submit();
};

const handleFileUploadProgress = () => {
  upload.isUploading = true;
};

const handleFileSuccess = (response: any) => {
  upload.open = false;
  upload.isUploading = false;
  uploadRef.value?.clearFiles();
  ElMessageBox.alert(response.msg, '导入结果', {
    dangerouslyUseHTMLString: true
  });
  getList();
};

const handleExport = () => {
  proxy?.download('system/user/export', { ...queryParams }, `用户列表_${Date.now()}.xlsx`);
};

const importTemplate = () => {
  proxy?.download('system/user/importTemplate', {}, `用户导入模板_${Date.now()}.xlsx`);
};

// 新增/编辑

const handleAdd = () => {
  userFormDialogRef.value?.openAdd();
};

const handleUpdate = (row?: UserVO) => {
  const userId = row?.userId ?? ids.value[0];
  if (!userId) {
    proxy?.$modal.msgError('请至少选择一条记录');
    return;
  }
  userFormDialogRef.value?.openEdit(Number(userId));
};

// 生命周期
onMounted(() => {
  getList();
});
</script>

<style lang="scss" scoped>
.search-card {
  :deep(.el-card__body) {
    padding-bottom: 6px !important;
  }
}

.table-card {
  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    padding: 0;
  }
}
</style>
