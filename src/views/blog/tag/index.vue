<template>
  <div class="p-2 h-full flex flex-col min-h-0">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover" class="search-card">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="68px">
            <el-form-item label="标签名称" prop="name">
              <el-input v-model="queryParams.name" placeholder="请输入标签名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="标签别名" prop="slug">
              <el-input v-model="queryParams.slug" placeholder="请输入标签别名" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="hover" class="flex-1 min-h-0 flex flex-col overflow-hidden table-card">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['blog:tag:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['blog:tag:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()"
              >删除</el-button
            >
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <div class="flex-1 min-h-0 overflow-hidden">
        <el-table v-loading="loading" :data="tagList" border height="100%" class="flex-1 min-h-0" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="标签名称" prop="name" min-width="140" align="center" />
          <el-table-column label="标签别名" prop="slug" min-width="160" align="center" />
          <el-table-column label="颜色" prop="color" width="140" align="center">
            <template #default="scope">
              <el-tag :style="{ backgroundColor: scope.row.color || defaultColor, borderColor: scope.row.color || defaultColor, color: '#ffffff' }">
                {{ scope.row.color || defaultColor }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="描述" prop="description" :show-overflow-tooltip="true" min-width="220" align="center" />
          <el-table-column label="文章数" prop="postCount" width="100" align="center" />
          <el-table-column label="创建时间" prop="createTime" width="180" align="center">
            <template #default="scope">
              <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="140">
            <template #default="scope">
              <el-tooltip content="修改" placement="top">
                <el-button v-hasPermi="['blog:tag:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button v-hasPermi="['blog:tag:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="560px" append-to-body>
      <el-form ref="tagFormRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="form.name" maxlength="30" show-word-limit placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="标签别名" prop="slug">
          <el-input v-model="form.slug" maxlength="30" show-word-limit placeholder="请输入标签别名" />
        </el-form-item>
        <el-form-item label="标签颜色" prop="color">
          <div class="color-field">
            <el-color-picker v-model="form.color" :predefine="predefineColors" />
            <el-input v-model="form.color" class="color-input" placeholder="#1890ff" maxlength="7" />
            <el-tag
              class="color-preview"
              :style="{ backgroundColor: form.color || defaultColor, borderColor: form.color || defaultColor, color: '#ffffff' }"
            >
              预览
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="标签描述" prop="description">
          <el-input v-model="form.description" type="textarea" maxlength="200" show-word-limit :rows="4" placeholder="请输入标签描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Tag" lang="ts">
import { addTag, delTag, getTag, listTag, updateTag } from '@/api/blog/tag';
import { TagForm, TagQuery, TagVO } from '@/api/blog/tag/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const tagList = ref<TagVO[]>([]);
const loading = ref(false);
const buttonLoading = ref(false);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const names = ref<string[]>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const tagFormRef = ref<ElFormInstance>();

const defaultColor = '#1890ff';
const predefineColors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#2f54eb', '#eb2f96'];

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData = (): TagForm => ({
  tagId: undefined,
  name: '',
  slug: '',
  description: '',
  color: defaultColor,
  postCount: undefined
});

const data = reactive<PageData<TagForm, TagQuery>>({
  form: initFormData(),
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: undefined,
    slug: undefined
  },
  rules: {
    name: [{ required: true, message: '标签名称不能为空', trigger: 'blur' }],
    slug: [{ required: true, message: '标签别名不能为空', trigger: 'blur' }],
    color: [{ pattern: /^#[0-9A-Fa-f]{6}$/, message: '标签颜色格式必须为 #RRGGBB', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

function extractTagList(res: any): TagVO[] {
  if (Array.isArray(res?.rows)) {
    return res.rows;
  }
  if (Array.isArray(res?.data?.rows)) {
    return res.data.rows;
  }
  if (Array.isArray(res?.data)) {
    return res.data;
  }
  if (Array.isArray(res)) {
    return res;
  }
  return [];
}

function extractTotal(res: any, fallback: number): number {
  if (typeof res?.total === 'number') {
    return res.total;
  }
  if (typeof res?.data?.total === 'number') {
    return res.data.total;
  }
  return fallback;
}

function normalizeColor(color?: string): string {
  const val = (color || '').trim();
  return /^#[0-9A-Fa-f]{6}$/.test(val) ? val : defaultColor;
}

/** 查询标签列表 */
async function getList() {
  loading.value = true;
  try {
    const res = await listTag(queryParams.value);
    const list = extractTagList(res);
    tagList.value = list;
    total.value = extractTotal(res, list.length);
  } finally {
    loading.value = false;
  }
}

/** 取消按钮 */
function cancel() {
  dialog.visible = false;
  reset();
}

/** 表单重置 */
function reset() {
  form.value = initFormData();
  tagFormRef.value?.resetFields();
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value?.resetFields();
  handleQuery();
}

/** 多选框选中数据 */
function handleSelectionChange(selection: TagVO[]) {
  ids.value = selection.map((item) => item.tagId);
  names.value = selection.map((item) => item.name);
  single.value = selection.length !== 1;
  multiple.value = selection.length === 0;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  dialog.visible = true;
  dialog.title = '添加标签';
}

/** 修改按钮操作 */
async function handleUpdate(row?: TagVO) {
  reset();
  const _tagId = row?.tagId || ids.value[0];
  if (!_tagId) {
    proxy?.$modal.msgError('请选择要修改的标签');
    return;
  }
  const res = await getTag(_tagId);
  const detail = (res as any).data || res;
  Object.assign(form.value, detail);
  form.value.color = normalizeColor(form.value.color);
  dialog.visible = true;
  dialog.title = '修改标签';
}

/** 提交按钮 */
function submitForm() {
  tagFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) {
      return;
    }
    buttonLoading.value = true;
    try {
      const submitData: TagForm = {
        ...form.value,
        color: normalizeColor(form.value.color)
      };
      if (submitData.tagId != undefined) {
        await updateTag(submitData);
        proxy?.$modal.msgSuccess('修改成功');
      } else {
        await addTag(submitData);
        proxy?.$modal.msgSuccess('新增成功');
      }
      dialog.visible = false;
      await getList();
    } finally {
      buttonLoading.value = false;
    }
  });
}

/** 删除按钮操作 */
async function handleDelete(row?: TagVO) {
  const _tagIds = row?.tagId || ids.value;
  const deleteNames = row?.name ? [row.name] : names.value;
  const nameText = deleteNames.filter(Boolean).join('、');
  const tip = nameText ? `标签名称为 "${nameText}"` : `标签编号为 "${_tagIds}"`;
  await proxy?.$modal.confirm('是否确认删除' + tip + '的数据项？');
  await delTag(_tagIds);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
}

onMounted(() => {
  getList();
});
</script>

<style lang="scss" scoped>
.search-card {
  :deep(.el-card__body) {
    padding-bottom: 7px !important;
  }
}

.table-card {
  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: 0;
  }
}

.color-field {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-input {
  width: 140px;
}

.color-preview {
  min-width: 56px;
  text-align: center;
}
</style>
