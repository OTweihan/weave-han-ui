<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div class="search" v-show="showSearch">
        <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
          <el-form-item label="分类名称" prop="name">
            <el-input v-model="queryParams.name" placeholder="请输入分类名称" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </transition>

    <el-card shadow="never">
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

      <el-table
        v-if="refreshTable"
        v-loading="loading"
        :data="categoryList"
        row-key="categoryId"
        :default-expand-all="isExpandAll"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column label="分类名称" prop="name" />
        <el-table-column label="别名" prop="slug" />
        <el-table-column label="排序" prop="sortOrder" width="100" />
        <el-table-column label="文章数" prop="postCount" width="100" align="center" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="200">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['blog:category:edit']">修改</el-button>
            <el-button link type="primary" icon="Plus" @click="handleAdd(scope.row)" v-hasPermi="['blog:category:add']">新增</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['blog:category:remove']">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
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
          />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类别名" prop="slug">
          <el-input v-model="form.slug" placeholder="请输入分类别名（如: tech-java）" />
        </el-form-item>
        <el-form-item label="显示排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" controls-position="right" :min="0" />
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
import { listCategory, getCategory, delCategory, addCategory, updateCategory } from '@/api/blog/category';
import { CategoryVO, CategoryForm, CategoryQuery } from '@/api/blog/category/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const categoryList = ref<CategoryVO[]>([]);
const categoryOptions = ref<CategoryVO[]>([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const title = ref('');
const isExpandAll = ref(true);
const refreshTable = ref(true);
const categoryFormRef = ref<ElFormInstance>();
const queryFormRef = ref<ElFormInstance>();

const data = reactive<PageData<CategoryForm, CategoryQuery>>({
  form: {
    categoryId: undefined,
    parentId: undefined,
    name: '',
    slug: '',
    sortOrder: 0,
    description: '',
    coverImage: undefined
  },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: undefined,
    status: undefined
  },
  rules: {
    name: [{ required: true, message: '分类名称不能为空', trigger: 'blur' }],
    slug: [{ required: true, message: '分类别名不能为空', trigger: 'blur' }],
    sortOrder: [{ required: true, message: '显示排序不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询分类列表 */
async function getList() {
  loading.value = true;
  const res = await listCategory(queryParams.value);
  const data = (res as any).data || (res as any).rows || res;
  categoryList.value = proxy?.handleTree<CategoryVO>(data, 'categoryId', 'parentId');
  loading.value = false;
}

/** 查询分类下拉树结构 */
async function getTreeselect() {
  const res = await listCategory();
  categoryOptions.value = [];
  const data = { categoryId: 0, name: '主类目', children: [] } as any;
  const list = (res as any).data || (res as any).rows || res;
  data.children = proxy?.handleTree<CategoryVO>(list, 'categoryId', 'parentId');
  categoryOptions.value.push(data);
}

/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
}

/** 表单重置 */
function reset() {
  form.value = {
    categoryId: undefined,
    parentId: 0,
    name: '',
    slug: '',
    sortOrder: 0,
    description: '',
    coverImage: undefined
  };
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
function handleAdd(row?: CategoryVO) {
  reset();
  getTreeselect();
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
  await getTreeselect();
  if (row.categoryId) {
    const res = await getCategory(row.categoryId);
    Object.assign(form.value, res.data);
  }
  open.value = true;
  title.value = '修改分类';
}

/** 提交按钮 */
function submitForm() {
  (proxy?.$refs['categoryFormRef'] as any).validate(async (valid: boolean) => {
    if (valid) {
      if (form.value.categoryId != undefined) {
        await updateCategory(form.value);
        proxy?.$modal.msgSuccess('修改成功');
      } else {
        await addCategory(form.value);
        proxy?.$modal.msgSuccess('新增成功');
      }
      open.value = false;
      getList();
    }
  });
}

/** 删除按钮操作 */
async function handleDelete(row: CategoryVO) {
  await proxy?.$modal.confirm('是否确认删除分类编号为"' + row.name + '"的数据项？');
  await delCategory(row.categoryId);
  proxy?.$modal.msgSuccess('删除成功');
  getList();
}

onMounted(() => {
  getList();
});
</script>
