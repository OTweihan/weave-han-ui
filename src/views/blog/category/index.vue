<template>
  <div class="p-2 h-full flex flex-col min-h-0">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover" class="search-card">
          <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
            <el-form-item label="分类名称" prop="name">
              <el-input v-model="queryParams.name" placeholder="请输入分类名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="分类别名" prop="slug">
              <el-input v-model="queryParams.slug" placeholder="请输入分类别名" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd()" v-hasPermi="['blog:category:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="info" plain icon="Sort" @click="toggleExpandAll">展开/折叠</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <div class="flex-1 min-h-0 overflow-hidden">
        <el-table
          v-if="refreshTable"
          v-loading="loading"
          :data="categoryList"
          border
          row-key="categoryId"
          height="100%"
          class="flex-1 min-h-0"
          :default-expand-all="isExpandAll"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        >
          <el-table-column label="分类名称" prop="name" align="left" width="240" />
          <el-table-column label="别名" prop="slug" align="center" width="240" />
          <el-table-column label="描述" prop="description" :show-overflow-tooltip="true" align="center" />
          <el-table-column label="文章数" prop="postCount" width="100" align="center" />
          <el-table-column label="创建时间" align="center" prop="createTime" width="200">
            <template #default="scope">
              <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="240">
            <template #default="scope">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['blog:category:edit']">修改</el-button>
              <el-button link type="primary" icon="Plus" @click="handleAdd(scope.row)" v-hasPermi="['blog:category:add']">新增</el-button>
              <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['blog:category:remove']">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 添加或修改分类对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="categoryFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="上级分类" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="categoryOptions"
            :props="{ value: 'categoryId', label: 'name', children: 'children' }"
            value-key="categoryId"
            placeholder="选择上级分类"
            check-strictly
            clearable
          />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类别名" prop="slug">
          <el-input v-model="form.slug" placeholder="请输入分类别名（如: tech-java）" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容" />
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

<script setup name="Category" lang="ts">
import { listCategory, listAllCategory, getCategory, delCategory, addCategory, updateCategory } from '@/api/blog/category';
import { CategoryForm, CategoryQuery, CategoryVO } from '@/api/blog/category/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const categoryList = ref<CategoryVO[]>([]);
const categoryOptions = ref<CategoryVO[]>([]);
const open = ref(false);
const loading = ref(false);
const showSearch = ref(true);
const title = ref('');
const isExpandAll = ref(false);
const refreshTable = ref(true);
const categoryFormRef = ref<ElFormInstance>();
const queryFormRef = ref<ElFormInstance>();

const initFormData = (): CategoryForm => ({
  categoryId: undefined,
  parentId: 0,
  name: '',
  slug: '',
  description: '',
  coverImage: undefined
});

const data = reactive<PageData<CategoryForm, CategoryQuery>>({
  form: initFormData(),
  queryParams: {
    name: undefined,
    slug: undefined
  },
  rules: {
    name: [{ required: true, message: '分类名称不能为空', trigger: 'blur' }],
    slug: [{ required: true, message: '分类别名不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

function extractCategoryList(res: any): CategoryVO[] {
  if (Array.isArray(res?.rows)) {
    return res.rows;
  }
  if (Array.isArray(res?.data)) {
    return res.data;
  }
  if (Array.isArray(res)) {
    return res;
  }
  return [];
}

function isSameId(left: string | number | null | undefined, right: string | number | null | undefined): boolean {
  return String(left) === String(right);
}

function removeNodeWithChildren(nodes: CategoryVO[], excludeId: string | number): CategoryVO[] {
  const result: CategoryVO[] = [];
  for (const node of nodes) {
    if (isSameId(node.categoryId, excludeId)) {
      continue;
    }
    const nextChildren = node.children ? removeNodeWithChildren(node.children, excludeId) : [];
    result.push({
      ...node,
      children: nextChildren
    });
  }
  return result;
}

/** 查询分类列表 */
async function getList() {
  loading.value = true;
  try {
    const res = await listCategory(queryParams.value);
    const list = extractCategoryList(res);
    categoryList.value = proxy?.handleTree<CategoryVO>(list, 'categoryId', 'parentId') || [];
  } finally {
    loading.value = false;
  }
}

/** 查询分类下拉树结构 */
async function getTreeselect(excludeCategoryId?: string | number) {
  const res = await listAllCategory();
  const list = extractCategoryList(res);
  let tree = proxy?.handleTree<CategoryVO>(list, 'categoryId', 'parentId') || [];
  if (excludeCategoryId !== undefined) {
    tree = removeNodeWithChildren(tree, excludeCategoryId);
  }
  categoryOptions.value = [
    {
      categoryId: 0,
      name: '主类目',
      slug: '',
      postCount: 0,
      children: tree
    } as CategoryVO
  ];
}

/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
}

/** 表单重置 */
function reset() {
  form.value = initFormData();
  categoryFormRef.value?.resetFields();
}

/** 搜索按钮操作 */
function handleQuery() {
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value?.resetFields();
  handleQuery();
}

/** 新增按钮操作 */
async function handleAdd(row?: CategoryVO) {
  reset();
  await getTreeselect();
  if (row != null && row.categoryId) {
    form.value.parentId = row.categoryId;
  } else {
    form.value.parentId = 0;
  }
  open.value = true;
  title.value = '添加分类';
}

/** 展开/折叠操作 */
function toggleExpandAll() {
  refreshTable.value = false;
  isExpandAll.value = !isExpandAll.value;
  nextTick(() => {
    refreshTable.value = true;
  });
}

/** 修改按钮操作 */
async function handleUpdate(row: CategoryVO) {
  reset();
  await getTreeselect(row.categoryId);
  if (row.categoryId) {
    const res = await getCategory(row.categoryId);
    const detail = (res as any).data || res;
    Object.assign(form.value, detail);
    if (form.value.parentId === null || form.value.parentId === undefined) {
      form.value.parentId = 0;
    }
  }
  open.value = true;
  title.value = '修改分类';
}

/** 提交按钮 */
function buildSubmitForm(): CategoryForm {
  const submitData: CategoryForm = { ...form.value };
  if (submitData.parentId === null || submitData.parentId === undefined || Number(submitData.parentId) === 0) {
    submitData.parentId = 0;
  }
  return submitData;
}

async function submitForm() {
  if (!categoryFormRef.value) {
    return;
  }
  try {
    await categoryFormRef.value.validate();
  } catch {
    return;
  }
  const submitData = buildSubmitForm();
  if (submitData.categoryId != undefined) {
    await updateCategory(submitData);
    proxy?.$modal.msgSuccess('修改成功');
  } else {
    await addCategory(submitData);
    proxy?.$modal.msgSuccess('新增成功');
  }
  open.value = false;
  await getList();
}

/** 删除按钮操作 */
async function handleDelete(row: CategoryVO) {
  await proxy?.$modal.confirm('是否确认删除分类名称为 "' + row.name + '" 的数据项？');
  await delCategory(row.categoryId);
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
</style>
