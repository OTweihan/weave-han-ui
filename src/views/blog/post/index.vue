<template>
  <div class="p-2 h-full flex flex-col min-h-0">
    <template v-if="!showEditor">
      <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
        <div v-show="showSearch" class="mb-[10px]">
          <el-card shadow="hover" class="search-card">
            <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="82px">
              <el-form-item label="文章标题" prop="title">
                <el-input v-model="queryParams.title" placeholder="请输入文章标题" clearable @keyup.enter="handleQuery" />
              </el-form-item>
              <el-form-item label="文章别名" prop="slug">
                <el-input v-model="queryParams.slug" placeholder="请输入文章别名" clearable @keyup.enter="handleQuery" />
              </el-form-item>
              <el-form-item label="所属分类" prop="categoryId">
                <el-select v-model="queryParams.categoryId" placeholder="请选择分类" clearable filterable style="width: 220px">
                  <el-option v-for="item in categorySearchOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="来源类型" prop="sourceType">
                <el-select v-model="queryParams.sourceType" placeholder="请选择来源" clearable style="width: 160px">
                  <el-option v-for="item in SOURCE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="是否置顶" prop="isTop">
                <el-select v-model="queryParams.isTop" placeholder="请选择" clearable style="width: 120px">
                  <el-option v-for="item in BOOLEAN_OPTIONS" :key="'top-' + item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="是否推荐" prop="isFeatured">
                <el-select v-model="queryParams.isFeatured" placeholder="请选择" clearable style="width: 120px">
                  <el-option v-for="item in BOOLEAN_OPTIONS" :key="'featured-' + item.value" :label="item.label" :value="item.value" />
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

      <el-card shadow="hover" class="flex-1 min-h-0 flex flex-col overflow-hidden table-card">
        <template #header>
          <div class="flex items-center justify-between flex-wrap gap-4">
            <el-tabs v-model="activeStatusTab" class="status-tabs" @tab-change="handleStatusTabChange">
              <el-tab-pane label="全部文章" name="all" />
              <el-tab-pane v-for="item in POST_STATUS_OPTIONS" :key="item.value" :label="item.label" :name="item.value" />
            </el-tabs>

            <el-row :gutter="10" class="mb8">
              <el-col :span="1.5">
                <el-button v-hasPermi="['blog:post:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
              </el-col>
              <el-col :span="1.5">
                <el-button v-hasPermi="['blog:post:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()"
                  >删除</el-button
                >
              </el-col>
              <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
            </el-row>
          </div>
        </template>

        <div class="flex-1 min-h-0 overflow-hidden">
          <el-table v-loading="loading" :data="postList" border height="100%" class="flex-1 min-h-0" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column label="文章标题" prop="title" min-width="220" show-overflow-tooltip />
            <el-table-column label="文章别名" prop="slug" min-width="180" show-overflow-tooltip />
            <el-table-column label="摘要" prop="summary" min-width="220" show-overflow-tooltip />
            <el-table-column label="分类" min-width="130" align="center">
              <template #default="scope">
                <span>{{ scope.row.category?.name || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="scope">
                <el-tag :type="getStatusTagType(scope.row.status)" effect="light">
                  {{ getStatusLabel(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="来源" width="100" align="center">
              <template #default="scope">
                <el-tag effect="plain">{{ getSourceTypeLabel(scope.row.sourceType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="属性" width="100" align="center">
              <template #default="scope">
                <div class="flex flex-col gap-1 items-center">
                  <el-tooltip v-if="scope.row.isTop === '1'" content="已置顶" placement="top">
                    <el-tag size="small" type="danger" effect="dark">顶</el-tag>
                  </el-tooltip>
                  <el-tooltip v-if="scope.row.isFeatured === '1'" content="已推荐" placement="top">
                    <el-tag size="small" type="success" effect="dark">荐</el-tag>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="作者" prop="authorName" width="100" align="center" />
            <el-table-column label="数据统计" width="180" align="center">
              <template #default="scope">
                <div class="stats-grid">
                  <div class="stats-item">
                    <el-icon><View /></el-icon>
                    <span>{{ scope.row.viewCount || 0 }}</span>
                  </div>
                  <div class="stats-item">
                    <el-icon><Pointer /></el-icon>
                    <span>{{ scope.row.likeCount || 0 }}</span>
                  </div>
                  <div class="stats-item">
                    <el-icon><ChatDotRound /></el-icon>
                    <span>{{ scope.row.commentCount || 0 }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="发布时间" prop="publishedTime" width="170" align="center">
              <template #default="scope">
                <span>{{ scope.row.publishedTime ? parseTime(scope.row.publishedTime) : '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" prop="createTime" width="170" align="center">
              <template #default="scope">
                <span>{{ parseTime(scope.row.createTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="140">
              <template #default="scope">
                <el-tooltip content="修改" placement="top">
                  <el-button v-hasPermi="['blog:post:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-button v-hasPermi="['blog:post:remove']" link type="danger" icon="Delete" @click="handleDelete(scope.row)"></el-button>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
      </el-card>
    </template>

    <post-editor-panel v-else :mode="activeEditorMode" :post-id="currentPostId" @cancel="handleEditorCancel" @success="handleEditorSuccess" />
  </div>
</template>

<script setup name="Post" lang="ts">
import { View, Pointer, ChatDotRound } from '@element-plus/icons-vue';
import { listAllCategory } from '@/api/blog/category';
import type { CategoryVO } from '@/api/blog/category/types';
import { delPost, listPost } from '@/api/blog/post';
import type { PostQuery, PostVO } from '@/api/blog/post/types';
import cache from '@/plugins/cache';
import PostEditorPanel from './components/PostEditorPanel.vue';
import { POST_EDITOR_DRAFT_KEY } from './draft';

type SelectOption = {
  label: string;
  value: string;
  tagType?: '' | 'success' | 'info' | 'warning' | 'danger';
};

type CategorySelectOption = {
  label: string;
  value: number | string;
};

type EditorMode = 'add' | 'edit';

type PostEditorDraft = {
  mode?: EditorMode;
  postId?: number | string;
};

const POST_STATUS_OPTIONS: SelectOption[] = [
  { label: '草稿', value: '0', tagType: 'info' },
  { label: '发布', value: '1', tagType: 'success' },
  { label: '下架', value: '2', tagType: 'warning' },
  { label: '回收站', value: '3', tagType: 'danger' }
];

const SOURCE_TYPE_OPTIONS: SelectOption[] = [
  { label: '原创', value: 'ORIGINAL' },
  { label: '转载', value: 'REPRINT' },
  { label: '翻译', value: 'TRANSLATION' }
];

const BOOLEAN_OPTIONS: SelectOption[] = [
  { label: '是', value: '1' },
  { label: '否', value: '0' }
];

const DEFAULT_PAGE_SIZE = 10;

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const postList = ref<PostVO[]>([]);
const categorySearchOptions = ref<CategorySelectOption[]>([]);
const loading = ref(false);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const titles = ref<string[]>([]);
const multiple = ref(true);
const total = ref(0);
const editorMode = ref<EditorMode | undefined>();
const currentPostId = ref<number | string>();
const activeStatusTab = ref('all');

const queryFormRef = ref<ElFormInstance>();

const queryParams = reactive<PostQuery>({
  pageNum: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  title: undefined,
  slug: undefined,
  categoryId: undefined,
  status: undefined,
  sourceType: undefined,
  isTop: undefined,
  isFeatured: undefined
});

const showEditor = computed(() => Boolean(editorMode.value));
const activeEditorMode = computed<EditorMode>(() => editorMode.value || 'add');

function handleStatusTabChange(name: any) {
  queryParams.status = name === 'all' ? undefined : name;
  handleQuery();
}

function extractList<T>(res: any): T[] {
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

function findOption(options: SelectOption[], value?: string | number | null): SelectOption | undefined {
  return options.find((item) => item.value === String(value ?? ''));
}

function getStatusLabel(value?: string | number | null): string {
  return findOption(POST_STATUS_OPTIONS, value)?.label || '-';
}

function getStatusTagType(value?: string | number | null): '' | 'success' | 'info' | 'warning' | 'danger' {
  return findOption(POST_STATUS_OPTIONS, value)?.tagType || 'info';
}

function getSourceTypeLabel(value?: string | number | null): string {
  return findOption(SOURCE_TYPE_OPTIONS, value)?.label || '-';
}

function flattenCategoryTree(list: CategoryVO[], level = 0): CategorySelectOption[] {
  const result: CategorySelectOption[] = [];
  for (const item of list) {
    result.push({
      label: `${level > 0 ? '— '.repeat(level) : ''}${item.name}`,
      value: item.categoryId
    });
    if (Array.isArray(item.children) && item.children.length > 0) {
      result.push(...flattenCategoryTree(item.children, level + 1));
    }
  }
  return result;
}

function normalizeCategoryOptions(list: CategoryVO[]) {
  const tree = proxy?.handleTree<CategoryVO>(list, 'categoryId', 'parentId') || [];
  categorySearchOptions.value = flattenCategoryTree(tree);
}

async function loadCategoryOptions() {
  const res = await listAllCategory();
  const list = extractList<CategoryVO>(res);
  normalizeCategoryOptions(list);
}

async function getList() {
  loading.value = true;
  try {
    const res = await listPost(queryParams);
    const list = extractList<PostVO>(res);
    postList.value = list;
    total.value = extractTotal(res, list.length);
  } finally {
    loading.value = false;
  }
}

function handleQuery() {
  queryParams.pageNum = 1;
  getList();
}

function resetQuery() {
  queryFormRef.value?.resetFields();
  queryParams.pageNum = 1;
  queryParams.pageSize = DEFAULT_PAGE_SIZE;
  activeStatusTab.value = 'all';
  queryParams.status = undefined;
  handleQuery();
}

function handleSelectionChange(selection: PostVO[]) {
  ids.value = selection.map((item) => item.postId);
  titles.value = selection.map((item) => item.title);
  multiple.value = selection.length === 0;
}

function handleAdd() {
  currentPostId.value = undefined;
  editorMode.value = 'add';
}

function handleUpdate(row?: PostVO) {
  const postId = row?.postId || ids.value[0];
  if (!postId) {
    proxy?.$modal.msgError('请选择要修改的文章');
    return;
  }
  currentPostId.value = postId;
  editorMode.value = 'edit';
}

function handleEditorCancel() {
  editorMode.value = undefined;
  currentPostId.value = undefined;
}

async function handleEditorSuccess() {
  editorMode.value = undefined;
  currentPostId.value = undefined;
  await loadCategoryOptions();
  await getList();
}

async function handleDelete(row?: PostVO) {
  const postIds = row?.postId || ids.value;
  const deleteTitles = row?.title ? [row.title] : titles.value;
  if (!postIds || (Array.isArray(postIds) && postIds.length === 0)) {
    proxy?.$modal.msgError('请选择要删除的文章');
    return;
  }
  const titleText = deleteTitles.filter(Boolean).join('、');
  const tip = titleText ? `文章标题为 "${titleText}"` : `文章编号为 "${postIds}"`;
  await proxy?.$modal.confirm('是否确认删除' + tip + '的数据项？');
  await delPost(postIds);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
}

function restoreDraftEditor() {
  if (showEditor.value) {
    return;
  }
  const draft = cache.session.getJSON(POST_EDITOR_DRAFT_KEY) as PostEditorDraft | null;
  if (!draft?.mode) {
    return;
  }
  editorMode.value = draft.mode;
  currentPostId.value = draft.mode === 'edit' ? draft.postId : undefined;
}

onMounted(async () => {
  await loadCategoryOptions();
  restoreDraftEditor();
  await getList();
});

onActivated(() => {
  restoreDraftEditor();
  void loadCategoryOptions();
});
</script>

<style lang="scss" scoped>
.search-card {
  :deep(.el-card__body) {
    padding-bottom: 7px !important;
  }
}

.table-card {
  :deep(.el-card__header) {
    padding: 10px 20px 0;
    border-bottom: 1px solid #f1f5f9;
  }

  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: 0;
  }
}

.status-tabs {
  :deep(.el-tabs__header) {
    margin: 0;
    border-bottom: none;
  }

  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }

  :deep(.el-tabs__item) {
    height: 48px;
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
  }

  :deep(.el-tabs__item.is-active) {
    color: var(--el-color-primary);
    font-weight: 600;
  }
}

.stats-grid {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #64748b;
  font-size: 13px;
}

.stats-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
