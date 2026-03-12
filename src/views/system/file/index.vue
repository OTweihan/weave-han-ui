<template>
  <div class="p-2 h-full flex flex-col">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="原名" prop="originalName">
              <el-input v-model="queryParams.originalName" placeholder="请输入原名" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="文件类型" prop="mimeType">
              <el-select v-model="queryParams.mimeType" placeholder="请选择文件类型" clearable filterable>
                <el-option v-for="dict in sys_file_mime_type" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="上传时间" style="width: 308px">
              <el-date-picker
                v-model="dateRangeCreateTime"
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

    <el-card
      shadow="hover"
      class="flex-1 flex flex-col overflow-hidden"
      :body-style="{ flex: '1', overflow: 'hidden', display: 'flex', flexDirection: 'column' }"
    >
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:file:upload']" type="primary" plain icon="Upload" @click="handleFile">上传文件</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:file:upload']" type="primary" plain icon="Upload" @click="handleImage">上传图片</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:file:delete']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">
              删除
            </el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table
        v-if="showTable"
        v-loading="loading"
        :data="fileRows"
        border
        class="flex-1 table-single-line"
        :header-cell-class-name="handleHeaderClass"
        @selection-change="handleSelectionChange"
        @header-click="handleHeaderClick"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="文件名" align="center" prop="fileName" show-overflow-tooltip min-width="160" />
        <el-table-column label="原名" align="center" prop="originalName" show-overflow-tooltip />
        <el-table-column label="文件类型" align="center" prop="mimeType" min-width="140" show-overflow-tooltip width="160" />
        <el-table-column label="文件大小" align="center" prop="fileSize" width="140" show-overflow-tooltip>
          <template #default="scope">
            <span>{{ formatFileSizeKb(scope.row.fileSize) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="上传时间" align="center" prop="createTime" width="240" sortable="custom" show-overflow-tooltip>
          <template #default="scope">
            <span>{{ proxy.parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="160">
          <template #default="scope">
            <el-tooltip content="下载" placement="top">
              <el-button v-hasPermi="['system:file:download']" link type="primary" icon="Download" @click="handleDownload(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="复制链接" placement="top">
              <el-button link type="primary" icon="CopyDocument" @click="handleCopyUrl(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['system:file:delete']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px" append-to-body>
      <el-form ref="ossFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="文件名" prop="file">
          <fileUpload v-if="type === UPLOAD_TYPE.FILE" v-model="form.file" />
          <imageUpload v-if="type === UPLOAD_TYPE.IMAGE" v-model="form.file" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup data-name="File" lang="ts">
import { deleteFile, listFile } from '@/api/system/file';
import { FileForm, FileQuery, FileVO } from '@/api/system/file/types';
import { useClipboard } from '@vueuse/core';

type DateRangeValue = [DateModelType, DateModelType] | [];
type SortOrder = 'ascending' | 'descending' | '';
type SortHeaderColumn = {
  property: string;
  sortable: string | boolean;
  order?: SortOrder;
  multiOrder?: SortOrder;
};

const UPLOAD_TYPE = {
  FILE: 0,
  IMAGE: 1
} as const;

const DEFAULT_SORT: Readonly<{ prop: string; order: SortOrder }> = {
  prop: 'createTime',
  order: 'ascending'
};

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { copy } = useClipboard();

const fileRows = ref<FileVO[]>([]);
// 通过 v-if 短暂卸载表格，清空列对象上挂载的 multiOrder 状态
const showTable = ref(true);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const multiple = ref(true);
const total = ref(0);
const type = ref<number>(UPLOAD_TYPE.FILE);
const dateRangeCreateTime = ref<DateRangeValue>([]);

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const ossFormRef = ref<ElFormInstance>();
const queryFormRef = ref<ElFormInstance>();
const { sys_file_mime_type } = toRefs<any>(proxy?.useDict('sys_file_mime_type'));

const initFormData: FileForm = {
  file: undefined
};

const data = reactive<PageData<FileForm, FileQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    fileName: '',
    originalName: '',
    mimeType: '',
    orderByColumn: DEFAULT_SORT.prop,
    isAsc: DEFAULT_SORT.order
  },
  rules: {
    file: [{ required: true, message: '文件不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 基于当前筛选条件构造请求参数，避免 addDateRange 直接污染 queryParams */
const buildRequestQuery = (): FileQuery => {
  const requestQuery = { ...queryParams.value };
  return (proxy?.addDateRange(requestQuery, dateRangeCreateTime.value, 'CreateTime') ?? requestQuery) as FileQuery;
};

/** 查询文件列表 */
const getList = async () => {
  loading.value = true;
  try {
    const response = await listFile(buildRequestQuery());
    fileRows.value = response.rows;
    total.value = response.total;
  } finally {
    loading.value = false;
    showTable.value = true;
  }
};

/** 复制/访问统一使用文件代理地址，避免直连存储端地址受权限或域名策略影响 */
const normalizeFileUrl = (url: string) => {
  if (!url) {
    return url;
  }
  return url.replace('/resource/storage/', '/resource/file/');
};

const formatFileSizeKb = (fileSize?: number) => {
  const size = Number(fileSize ?? 0);
  return `${(size / 1024).toFixed(2)} KB`;
};

/** 复制链接 */
const handleCopyUrl = async (row: FileVO) => {
  try {
    await copy(normalizeFileUrl(row.url));
    proxy?.$modal.msgSuccess('复制成功');
  } catch (_error) {
    proxy?.$modal.msgError('复制失败');
  }
};

/** 取消按钮 */
const cancel = () => {
  dialog.visible = false;
  reset();
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  ossFormRef.value?.clearValidate();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  void getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  showTable.value = false;
  dateRangeCreateTime.value = [];
  queryFormRef.value?.resetFields();
  queryParams.value.orderByColumn = DEFAULT_SORT.prop;
  queryParams.value.isAsc = DEFAULT_SORT.order;
  handleQuery();
};

/** 选择条数 */
const handleSelectionChange = (selection: FileVO[]) => {
  ids.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

/** 设置列的排序为我们自定义的排序 */
const handleHeaderClass = ({ column }: { column: any }): string => {
  column.order = column.multiOrder ?? '';
  return '';
};

const getNextSortOrder = (currentOrder?: SortOrder): SortOrder => {
  if (currentOrder === 'descending') {
    return 'ascending';
  }
  if (currentOrder === 'ascending') {
    return '';
  }
  return 'descending';
};

/** 点击表头进行排序 */
const handleHeaderClick = (column: SortHeaderColumn) => {
  if (column.sortable !== 'custom' || !column.property) {
    return;
  }

  column.multiOrder = getNextSortOrder(column.multiOrder);
  handleOrderChange(column.property, column.multiOrder);
};

/** 维护 queryParams 中的多列排序字符串，保持与后端分页接口约定一致 */
const handleOrderChange = (prop: string, order: SortOrder) => {
  const orderByArr = queryParams.value.orderByColumn ? queryParams.value.orderByColumn.split(',') : [];
  const isAscArr = queryParams.value.isAsc ? queryParams.value.isAsc.split(',') : [];
  const propIndex = orderByArr.indexOf(prop);

  if (propIndex !== -1) {
    if (order) {
      // 排序里已存在，仅更新方向
      isAscArr[propIndex] = order;
    } else {
      // 取消排序时，同步移除字段和方向
      isAscArr.splice(propIndex, 1);
      orderByArr.splice(propIndex, 1);
    }
  } else if (order) {
    // 排序里不存在且 order 有值时才新增
    orderByArr.push(prop);
    isAscArr.push(order);
  }

  queryParams.value.orderByColumn = orderByArr.join(',');
  queryParams.value.isAsc = isAscArr.join(',');
  void getList();
};

/** 打开上传弹窗 */
const openUploadDialog = (uploadType: number, title: string) => {
  reset();
  type.value = uploadType;
  dialog.visible = true;
  dialog.title = title;
};

/** 文件按钮操作 */
const handleFile = () => {
  openUploadDialog(UPLOAD_TYPE.FILE, '上传文件');
};

/** 图片按钮操作 */
const handleImage = () => {
  openUploadDialog(UPLOAD_TYPE.IMAGE, '上传图片');
};

/** 提交按钮 */
const submitForm = async () => {
  if (!ossFormRef.value) {
    return;
  }

  try {
    await ossFormRef.value.validate();
  } catch {
    return;
  }

  dialog.visible = false;
  reset();
  await getList();
};

/** 下载按钮操作 */
const handleDownload = (row: FileVO) => {
  proxy?.$download.file(row.id);
};

/** 删除按钮操作 */
const handleDelete = async (row?: FileVO) => {
  const fileIds = row?.id ?? ids.value;
  if (Array.isArray(fileIds) && fileIds.length === 0) {
    proxy?.$modal.msgWarning('请先选择需要删除的文件');
    return;
  }

  try {
    await proxy?.$modal.confirm(`是否确认删除文件编号为 "${Array.isArray(fileIds) ? fileIds.join(',') : fileIds}" 的数据项?`);
    loading.value = true;
    await deleteFile(fileIds);
    proxy?.$modal.msgSuccess('删除成功');
    await getList();
  } catch (error) {
    console.info('取消删除或删除失败', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  void getList();
});
</script>

<style scoped>
.table-single-line :deep(.el-table__cell .cell) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-single-line :deep(.el-table__header .cell) {
  white-space: nowrap;
}
</style>
