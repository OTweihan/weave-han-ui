<template>
  <el-card v-loading="loading" shadow="never" class="flex-1 min-h-0 flex flex-col overflow-hidden editor-card">
    <div class="editor-body">
      <div class="editor-top-bar">
        <div class="top-bar-left">
          <h1 class="editor-title">{{ pageTitle }}</h1>
          <div class="editor-badges">
            <el-tag :type="statusBadgeType" effect="light" round class="status-tag">
              {{ statusLabel }}
            </el-tag>
            <el-tag type="info" effect="plain" round class="source-tag">
              {{ sourceTypeLabel }}
            </el-tag>
            <transition name="fade">
              <div v-if="hasTouched" class="draft-save-indicator">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>已自动暂存</span>
              </div>
            </transition>
          </div>
        </div>
        <div class="top-bar-right">
          <el-button-group>
            <el-button icon="Refresh" @click="handleRefreshOptions">刷新</el-button>
            <el-button @click="handleCancel">返回列表</el-button>
          </el-button-group>
          <el-button :loading="buttonLoading" type="primary" icon="Check" @click="submitForm">保存文章</el-button>
        </div>
      </div>

      <el-form ref="postFormRef" :model="form" :rules="rules" label-width="92px" class="post-form">
        <el-tabs v-model="activeTab" class="post-form-tabs">
          <el-tab-pane label="基础信息" name="basic">
            <div class="tab-intro">
              <div>
                <div class="tab-intro__title">基础信息</div>
                <div class="tab-intro__desc">{{ publishStateText }}</div>
              </div>
              <div class="tab-intro__pill">{{ form.title ? '标题已填写' : '建议先填写标题' }}</div>
            </div>

            <div class="form-section">
              <el-row :gutter="18">
                <el-col :span="12">
                  <el-form-item label="文章标题" prop="title">
                    <el-input v-model="form.title" maxlength="300" show-word-limit placeholder="请输入文章标题" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="文章别名" prop="slug">
                    <el-input v-model="form.slug" maxlength="200" show-word-limit placeholder="请输入文章别名，例如：spring-boot-guide" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="所属分类" prop="categoryId">
                    <el-tree-select
                      v-model="form.categoryId"
                      :data="categoryTreeOptions"
                      :props="{ value: 'categoryId', label: 'name', children: 'children' }"
                      value-key="categoryId"
                      placeholder="请选择所属分类"
                      check-strictly
                      clearable
                      filterable
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="文章标签" prop="tagIds">
                    <el-select
                      v-model="form.tagIds"
                      multiple
                      filterable
                      collapse-tags
                      collapse-tags-tooltip
                      placeholder="请选择文章标签"
                      style="width: 100%"
                    >
                      <el-option v-for="item in tagOptions" :key="item.tagId" :label="item.name" :value="item.tagId" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="文章状态" prop="status">
                    <el-radio-group v-model="form.status">
                      <el-radio-button v-for="item in POST_STATUS_OPTIONS" :key="item.value" :value="item.value">
                        {{ item.label }}
                      </el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="来源类型" prop="sourceType">
                    <el-radio-group v-model="form.sourceType">
                      <el-radio-button v-for="item in SOURCE_TYPE_OPTIONS" :key="item.value" :value="item.value">
                        {{ item.label }}
                      </el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="封面图片" prop="coverImage">
                    <ImageUpload v-model="form.coverImage" :limit="1" :compress-support="true" />
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="文章摘要" prop="summary">
                    <el-input v-model="form.summary" type="textarea" maxlength="800" show-word-limit :rows="4" placeholder="请输入文章摘要" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="发布时间" prop="publishedTime">
                    <el-date-picker
                      v-model="form.publishedTime"
                      type="datetime"
                      value-format="YYYY-MM-DD HH:mm:ss"
                      placeholder="请选择发布时间"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="访问密码" prop="password">
                    <el-input v-model="form.password" maxlength="100" show-password show-word-limit placeholder="留空表示无需密码访问" />
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="原文链接" prop="sourceUrl">
                    <el-input
                      v-model="form.sourceUrl"
                      :disabled="sourceUrlDisabled"
                      maxlength="500"
                      show-word-limit
                      placeholder="转载或翻译文章时请输入原文链接"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="文章属性">
                    <div class="switch-group">
                      <div class="switch-item">
                        <span class="switch-label">是否置顶</span>
                        <el-switch v-model="form.isTop" active-value="1" inactive-value="0" />
                      </div>
                      <div class="switch-item">
                        <span class="switch-label">是否推荐</span>
                        <el-switch v-model="form.isFeatured" active-value="1" inactive-value="0" />
                      </div>
                      <div class="switch-item">
                        <span class="switch-label">允许评论</span>
                        <el-switch v-model="form.allowComment" active-value="1" inactive-value="0" />
                      </div>
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <el-tab-pane label="文章内容" name="content">
            <div class="tab-intro">
              <div>
                <div class="tab-intro__title">正文编辑</div>
                <div class="tab-intro__desc">当前 {{ accessModeText }}，正文会自动同步到 HTML 字段并保留草稿。</div>
              </div>
              <div class="tab-intro__pill">内容会自动同步到 HTML 字段</div>
            </div>

            <div class="form-section form-section--editor">
              <div class="content-metrics">
                <span>预计字数：{{ contentWordCount }}</span>
                <span>预计阅读：{{ contentReadingTime }} 分钟</span>
                <span>{{ draftStatusText }}</span>
              </div>
              <el-form-item label-width="0" prop="content" class="editor-form-item">
                <div class="editor-panel">
                  <Editor v-model="form.content" :min-height="480" :height="480" />
                </div>
              </el-form-item>
            </div>
          </el-tab-pane>

          <el-tab-pane label="SEO 设置" name="seo">
            <div class="tab-intro">
              <div>
                <div class="tab-intro__title">SEO 设置</div>
                <div class="tab-intro__desc">当前状态：{{ statusLabel }}，建议把搜索标题、路径和摘要一次整理完整。</div>
              </div>
              <div class="tab-intro__pill">建议描述控制在 70-120 字</div>
            </div>

            <div class="form-section">
              <el-row :gutter="18">
                <el-col :span="24">
                  <el-form-item label="SEO关键词" prop="seoKeywords">
                    <el-input v-model="form.seoKeywords" maxlength="200" show-word-limit placeholder="多个关键词建议用英文逗号分隔" />
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="SEO描述" prop="seoDescription">
                    <el-input v-model="form.seoDescription" type="textarea" maxlength="300" show-word-limit :rows="5" placeholder="请输入 SEO 描述" />
                  </el-form-item>
                </el-col>
              </el-row>

              <div class="seo-preview">
                <div class="seo-preview__title">{{ form.title || '这里会显示文章标题' }}</div>
                <div class="seo-preview__url">{{ seoPreviewUrl }}</div>
                <div class="seo-preview__desc">{{ seoPreviewDescription }}</div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-form>
    </div>
  </el-card>
</template>

<script setup name="PostEditorPanel" lang="ts">
import { Loading } from '@element-plus/icons-vue';
import { listAllCategory } from '@/api/blog/category';
import type { CategoryVO } from '@/api/blog/category/types';
import { addPost, getPost, updatePost } from '@/api/blog/post';
import type { PostForm, PostVO } from '@/api/blog/post/types';
import { listAllTag } from '@/api/blog/tag';
import type { TagVO } from '@/api/blog/tag/types';
import Editor from '@/components/Editor/index.vue';
import ImageUpload from '@/components/ImageUpload/index.vue';
import cache from '@/plugins/cache';
import { POST_EDITOR_DRAFT_KEY } from '../draft';

type SelectOption = {
  label: string;
  value: string;
};

type PostEditorDraft = {
  mode: 'add' | 'edit';
  postId?: number | string;
  activeTab?: string;
  form: PostForm;
};

const POST_STATUS_OPTIONS: SelectOption[] = [
  { label: '草稿', value: '0' },
  { label: '发布', value: '1' },
  { label: '下架', value: '2' },
  { label: '回收站', value: '3' }
];

const SOURCE_TYPE_OPTIONS: SelectOption[] = [
  { label: '原创', value: 'ORIGINAL' },
  { label: '转载', value: 'REPRINT' },
  { label: '翻译', value: 'TRANSLATION' }
];

const EMPTY_HTML_VALUES = ['<p></p>', '<p><br></p>'];

const props = defineProps<{
  mode: 'add' | 'edit';
  postId?: number | string;
}>();

const emit = defineEmits<{
  cancel: [];
  success: [];
}>();

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const loading = ref(false);
const buttonLoading = ref(false);
const activeTab = ref('basic');
const categoryTreeOptions = ref<CategoryVO[]>([]);
const tagOptions = ref<TagVO[]>([]);
const postFormRef = ref<ElFormInstance>();
const form = ref<PostForm>(initFormData());
const suspendDirtyTrack = ref(true);
const hasTouched = ref(false);

const rules = reactive({
  title: [{ required: true, message: '文章标题不能为空', trigger: 'blur' }],
  slug: [{ max: 200, message: '文章别名不能超过 200 个字符', trigger: 'blur' }],
  summary: [{ max: 800, message: '文章摘要不能超过 800 个字符', trigger: 'blur' }],
  password: [{ max: 100, message: '访问密码不能超过 100 个字符', trigger: 'blur' }],
  sourceUrl: [{ validator: validateSourceUrl, trigger: 'blur' }],
  seoKeywords: [{ max: 200, message: 'SEO 关键词不能超过 200 个字符', trigger: 'blur' }],
  seoDescription: [{ max: 300, message: 'SEO 描述不能超过 300 个字符', trigger: 'blur' }]
});

const pageTitle = computed(() => (props.mode === 'add' ? '新增文章' : '修改文章'));
const sourceUrlDisabled = computed(() => form.value.sourceType === 'ORIGINAL');
const contentWordCount = computed(() => countWord(form.value.content));
const contentReadingTime = computed(() => calculateReadingTime(contentWordCount.value));
const statusLabel = computed(() => findOptionLabel(POST_STATUS_OPTIONS, form.value.status));
const sourceTypeLabel = computed(() => findOptionLabel(SOURCE_TYPE_OPTIONS, form.value.sourceType));
const accessModeText = computed(() => (form.value.password ? '密码访问' : '公开访问'));
const draftStatusText = computed(() => (hasTouched.value ? '未保存内容已自动暂存' : '自动草稿保护已开启'));
const publishStateText = computed(() => {
  if (form.value.status === '1' && form.value.publishedTime) {
    return `计划 ${form.value.publishedTime} 发布`;
  }
  if (form.value.status === '1') {
    return '已设为发布状态，建议补充发布时间';
  }
  if (form.value.status === '2') {
    return '当前文章处于下架状态';
  }
  if (form.value.status === '3') {
    return '当前文章已进入回收站状态';
  }
  return '当前是草稿，可继续安心编辑';
});
const statusBadgeType = computed(() => {
  if (form.value.status === '1') {
    return 'success';
  }
  if (form.value.status === '2') {
    return 'warning';
  }
  if (form.value.status === '3') {
    return 'danger';
  }
  return 'info';
});
const seoPreviewUrl = computed(() => `https://your-site.com/post/${form.value.slug || 'your-article-slug'}`);
const seoPreviewDescription = computed(
  () => form.value.seoDescription || form.value.summary || 'SEO 描述会显示在这里，建议把核心信息和关键词自然地融合进去。'
);

function initFormData(): PostForm {
  return {
    postId: undefined,
    title: '',
    slug: '',
    summary: '',
    coverImage: undefined,
    categoryId: undefined,
    tagIds: [],
    status: '0',
    isTop: '0',
    isFeatured: '0',
    allowComment: '1',
    password: '',
    sourceType: 'ORIGINAL',
    sourceUrl: '',
    seoKeywords: '',
    seoDescription: '',
    publishedTime: undefined,
    content: '',
    contentHtml: '',
    wordCount: 0,
    readingTime: 0
  };
}

function validateSourceUrl(_rule: any, value: string, callback: (error?: Error) => void) {
  if (form.value.sourceType !== 'ORIGINAL' && !(value || '').trim()) {
    callback(new Error('转载或翻译文章必须填写原文链接'));
    return;
  }
  callback();
}

function findOptionLabel(options: SelectOption[], value?: string | number | null): string {
  return options.find((item) => item.value === String(value ?? ''))?.label || '-';
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

function normalizeCategoryOptions(list: CategoryVO[]) {
  categoryTreeOptions.value = proxy?.handleTree<CategoryVO>(list, 'categoryId', 'parentId') || [];
}

function normalizeIdValue(value: unknown): string | number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  const text = String(value).trim();
  return text ? text : undefined;
}

function normalizeSingleUploadValue(value: unknown): string | number | undefined {
  if (Array.isArray(value)) {
    return normalizeSingleUploadValue(value[0]);
  }
  if (value && typeof value === 'object') {
    const fileValue = (value as Record<string, any>).id ?? (value as Record<string, any>).ossId;
    return normalizeIdValue(fileValue);
  }
  const normalized = normalizeIdValue(value);
  if (normalized === undefined) {
    return undefined;
  }
  const [first] = String(normalized)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return first || undefined;
}

function normalizeTagIds(tagIds?: Array<number | string>): Array<number | string> {
  if (!Array.isArray(tagIds)) {
    return [];
  }
  return Array.from(new Set(tagIds.map((item) => normalizeIdValue(item)).filter((item): item is string | number => item !== undefined)));
}

function normalizeOptionalText(value?: string): string | undefined {
  const text = (value || '').trim();
  return text ? text : undefined;
}

function normalizeEditorContent(value?: string): string {
  const text = (value || '').trim();
  return EMPTY_HTML_VALUES.includes(text) ? '' : text;
}

function countWord(content?: string): number {
  return (content || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, '')
    .trim().length;
}

function calculateReadingTime(wordCount: number): number {
  if (!wordCount) {
    return 0;
  }
  return Math.max(1, Math.ceil(wordCount / 500));
}

function normalizePostDetail(detail: PostVO): PostForm {
  const postTags = Array.isArray(detail.tags) ? detail.tags.map((item) => item.tagId) : [];
  const content = detail.content || detail.contentHtml || '';
  return {
    postId: detail.postId,
    title: detail.title || '',
    slug: detail.slug || '',
    summary: detail.summary || '',
    coverImage: detail.coverImage ?? undefined,
    categoryId: detail.categoryId ?? undefined,
    tagIds: postTags,
    status: String(detail.status ?? '0'),
    isTop: String(detail.isTop ?? '0'),
    isFeatured: String(detail.isFeatured ?? '0'),
    allowComment: String(detail.allowComment ?? '1'),
    password: detail.password || '',
    sourceType: detail.sourceType || 'ORIGINAL',
    sourceUrl: detail.sourceUrl || '',
    seoKeywords: detail.seoKeywords || '',
    seoDescription: detail.seoDescription || '',
    publishedTime: detail.publishedTime || undefined,
    content,
    contentHtml: detail.contentHtml || content,
    wordCount: detail.wordCount ?? countWord(content),
    readingTime: detail.readingTime ?? calculateReadingTime(detail.wordCount ?? countWord(content))
  };
}

function buildSubmitData(): PostForm {
  const normalizedContent = normalizeEditorContent(form.value.content);
  const wordCount = countWord(normalizedContent);
  return {
    ...form.value,
    title: form.value.title.trim(),
    slug: normalizeOptionalText(form.value.slug),
    summary: normalizeOptionalText(form.value.summary),
    coverImage: normalizeSingleUploadValue(form.value.coverImage),
    categoryId: normalizeIdValue(form.value.categoryId),
    tagIds: normalizeTagIds(form.value.tagIds),
    status: String(form.value.status || '0'),
    isTop: String(form.value.isTop || '0'),
    isFeatured: String(form.value.isFeatured || '0'),
    allowComment: String(form.value.allowComment || '1'),
    password: normalizeOptionalText(form.value.password),
    sourceType: form.value.sourceType || 'ORIGINAL',
    sourceUrl: form.value.sourceType === 'ORIGINAL' ? undefined : normalizeOptionalText(form.value.sourceUrl),
    seoKeywords: normalizeOptionalText(form.value.seoKeywords),
    seoDescription: normalizeOptionalText(form.value.seoDescription),
    publishedTime: normalizeOptionalText(form.value.publishedTime),
    content: normalizedContent,
    contentHtml: normalizedContent,
    wordCount,
    readingTime: calculateReadingTime(wordCount)
  };
}

function getMatchedDraft(): PostEditorDraft | undefined {
  const draft = cache.session.getJSON(POST_EDITOR_DRAFT_KEY) as PostEditorDraft | null;
  if (!draft || draft.mode !== props.mode) {
    return undefined;
  }
  if (props.mode === 'edit' && String(draft.postId ?? '') !== String(props.postId ?? '')) {
    return undefined;
  }
  if (props.mode === 'add' && draft.postId !== undefined) {
    return undefined;
  }
  return draft;
}

function applyDraft(draft: PostEditorDraft) {
  form.value = {
    ...initFormData(),
    ...draft.form,
    tagIds: Array.isArray(draft.form.tagIds) ? draft.form.tagIds : []
  };
  activeTab.value = draft.activeTab || 'basic';
}

function saveDraft() {
  cache.session.setJSON(POST_EDITOR_DRAFT_KEY, {
    mode: props.mode,
    postId: props.mode === 'edit' ? props.postId : undefined,
    activeTab: activeTab.value,
    form: form.value
  } satisfies PostEditorDraft);
}

function clearDraft() {
  cache.session.remove(POST_EDITOR_DRAFT_KEY);
}

async function loadCategoryOptions() {
  const res = await listAllCategory();
  const list = extractList<CategoryVO>(res);
  normalizeCategoryOptions(list);
}

async function loadTagOptions() {
  const res = await listAllTag();
  tagOptions.value = extractList<TagVO>(res);
}

async function loadOptionData() {
  await Promise.all([loadCategoryOptions(), loadTagOptions()]);
}

async function initializeEditor() {
  loading.value = true;
  suspendDirtyTrack.value = true;
  hasTouched.value = false;
  activeTab.value = 'basic';
  form.value = initFormData();
  postFormRef.value?.clearValidate();
  try {
    await loadOptionData();
    if (props.mode === 'edit' && !props.postId) {
      proxy?.$modal.msgError('未获取到要编辑的文章编号');
      emit('cancel');
      return;
    }
    const draft = getMatchedDraft();
    if (draft) {
      applyDraft(draft);
      proxy?.$modal.msgSuccess(props.mode === 'add' ? '已恢复未保存的新增内容' : '已恢复未保存的编辑内容');
      return;
    }
    if (props.mode === 'edit') {
      const res = await getPost(props.postId);
      const detail = ((res as any).data || res) as PostVO;
      form.value = normalizePostDetail(detail);
    }
  } finally {
    loading.value = false;
    await nextTick();
    suspendDirtyTrack.value = false;
  }
}

async function handleRefreshOptions() {
  await loadOptionData();
  proxy?.$modal.msgSuccess('分类和标签选项已刷新');
}

async function handleCancel() {
  if (hasTouched.value) {
    try {
      await proxy?.$modal.confirm('当前未保存的文章内容将会丢失，是否返回列表？');
    } catch {
      return;
    }
  }
  clearDraft();
  emit('cancel');
}

async function submitForm() {
  if (!postFormRef.value) {
    return;
  }
  try {
    await postFormRef.value.validate();
  } catch {
    return;
  }
  buttonLoading.value = true;
  try {
    const submitData = buildSubmitData();
    if (submitData.postId !== undefined) {
      await updatePost(submitData);
      proxy?.$modal.msgSuccess('修改成功');
    } else {
      await addPost(submitData);
      proxy?.$modal.msgSuccess('新增成功');
    }
    clearDraft();
    hasTouched.value = false;
    emit('success');
  } finally {
    buttonLoading.value = false;
  }
}

watch(
  form,
  () => {
    if (!suspendDirtyTrack.value) {
      hasTouched.value = true;
      saveDraft();
    }
  },
  { deep: true }
);

watch(activeTab, () => {
  if (!suspendDirtyTrack.value) {
    saveDraft();
  }
});

watch(
  () => form.value.sourceType,
  (value) => {
    if (value === 'ORIGINAL') {
      form.value.sourceUrl = '';
    }
  }
);

watch(
  () => [props.mode, props.postId],
  () => {
    void initializeEditor();
  },
  { immediate: true }
);

onActivated(() => {
  void loadOptionData();
});
</script>

<style lang="scss" scoped>
.editor-card {
  --editor-primary: #2563eb;
  --editor-ink: #0f172a;
  --editor-muted: #64748b;
  --editor-border: #f1f5f9;
  --editor-bg-alt: #f8fafc;

  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    padding: 0;
  }
}

.editor-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
}

.editor-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px 12px;
  background: #ffffff;
  flex-shrink: 0;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.editor-title {
  color: var(--editor-ink);
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

.editor-badges {
  display: flex;
  align-items: center;
  gap: 8px;
}

.draft-save-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  background: #f0fdf4;
  color: #15803d;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid #dcfce7;

  .el-icon {
    font-size: 12px;
  }
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.post-form {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.post-form-tabs {
  display: flex !important;
  flex: 1;
  flex-direction: column !important;
  min-height: 0;
  width: 100%;

  :deep(.el-tabs__header) {
    order: 1;
    margin: 0 !important;
    padding: 0 24px;
    background: #ffffff;
    border-bottom: 1px solid var(--editor-border);
    flex-shrink: 0;
  }

  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }

  :deep(.el-tabs__item) {
    height: 48px;
    font-size: 14px;
    font-weight: 500;
    color: var(--editor-muted);
    padding: 0 20px;
    transition: all 0.2s;
  }

  :deep(.el-tabs__item.is-active) {
    color: var(--editor-primary);
    font-weight: 600;
  }

  :deep(.el-tabs__active-bar) {
    height: 2px;
    border-radius: 2px 2px 0 0;
  }

  :deep(.el-tabs__content) {
    order: 2;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    background: var(--editor-bg-alt);
    padding: 24px;
  }
}

/* Tab 面板内部组件样式 */
.tab-intro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
  padding: 0 0 16px;
  border-bottom: 1px dashed #e2e8f0;
}

.tab-intro__title {
  color: var(--editor-ink);
  font-size: 16px;
  font-weight: 700;
}

.tab-intro__desc {
  margin-top: 4px;
  color: var(--editor-muted);
  font-size: 12px;
}

.tab-intro__pill {
  flex-shrink: 0;
  padding: 4px 12px;
  border-radius: 6px;
  background: #ffffff;
  color: var(--editor-primary);
  font-size: 11px;
  font-weight: 600;
  border: 1px solid #e2e8f0;
}

.form-section {
  max-width: 1200px;
  margin: 0 auto;
}

.switch-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.switch-item {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  min-width: 160px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.switch-label {
  color: #475569;
  font-size: 13px;
  font-weight: 500;
}

.content-metrics {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding: 8px 16px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #475569;
  font-size: 12px;
  font-weight: 500;
}

.editor-panel {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
}

.seo-preview {
  margin-top: 24px;
  padding: 20px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.seo-preview__title {
  color: #1a0dab;
  font-size: 18px;
  line-height: 1.4;
  word-break: break-word;
}

.seo-preview__url {
  margin-top: 4px;
  color: #006621;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-all;
}

.seo-preview__desc {
  margin-top: 8px;
  color: #4b5563;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
}

/* Element Plus 重写 */
:deep(.el-form-item__label) {
  color: #334155;
  font-weight: 600;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-select__wrapper),
:deep(.el-date-editor.el-input__wrapper) {
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 0 0 1px #d1d5db inset;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover),
:deep(.el-select__wrapper:hover),
:deep(.el-date-editor.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #9ca3af inset;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus),
:deep(.el-select__wrapper.is-focused),
:deep(.el-date-editor.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px var(--editor-primary) inset,
    0 0 0 4px rgba(37, 99, 235, 0.1);
}

:deep(.el-radio-button__inner) {
  border-radius: 8px !important;
  margin-right: 8px;
  border: 1px solid #d1d5db !important;
}

:deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-radius: 8px !important;
}

:deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 8px !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
