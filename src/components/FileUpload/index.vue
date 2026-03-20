<template>
  <div class="upload-file">
    <div v-if="!disabled" class="upload-file-trigger">
      <el-upload
        ref="fileUploadRef"
        multiple
        :action="uploadFileUrl"
        :before-upload="handleBeforeUpload"
        :file-list="fileList"
        :limit="limit"
        :accept="fileAccept"
        :on-error="handleUploadError"
        :on-exceed="handleExceed"
        :on-success="handleUploadSuccess"
        :show-file-list="false"
        :headers="headers"
        class="upload-file-uploader"
      >
        <el-button type="primary" plain class="upload-file-button">
          <el-icon class="upload-file-button__icon"><UploadFilled /></el-icon>
          <span>选择文件</span>
        </el-button>
      </el-upload>

      <div v-if="showTip" class="upload-file-tip">
        <el-icon class="upload-file-tip__icon"><InfoFilled /></el-icon>
        <div class="upload-file-tip__content">
          支持上传
          <template v-if="fileType">
            <span class="upload-file-tip__highlight">{{ fileType.join('/') }}</span>
          </template>
          <template v-if="fileSize">
            ，单个文件不超过 <span class="upload-file-tip__highlight">{{ fileSize }}MB</span>
          </template>
        </div>
      </div>
    </div>

    <!-- 文件列表 -->
    <transition-group class="upload-file-list el-upload-list el-upload-list--text" name="el-fade-in-linear" tag="ul">
      <li v-for="(file, index) in fileList" :key="file.uid" class="el-upload-list__item ele-upload-list__item-content upload-file-item">
        <div class="upload-file-item__main">
          <div class="upload-file-item__icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="upload-file-item__info">
            <el-link :href="`${file.url}`" :underline="false" target="_blank" class="upload-file-item__name">
              {{ getFileName(file.name) }}
            </el-link>
            <div class="upload-file-item__meta">
              <span class="upload-file-item__tag">{{ getFileTypeLabel(file.name) }}</span>
              <span class="upload-file-item__text">点击可查看原文件</span>
            </div>
          </div>
        </div>
        <div class="ele-upload-list__item-content-action upload-file-item__actions">
          <el-link :href="`${file.url}`" :underline="false" target="_blank" class="upload-file-item__action">查看</el-link>
          <el-button type="danger" v-if="!disabled" link class="upload-file-item__delete" @click="handleDelete(index)">删除</el-button>
        </div>
      </li>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { propTypes } from '@/utils/propTypes';
import { deleteFile, listFilesByIds } from '@/api/system/file';
import { globalHeaders } from '@/utils/request';

const props = defineProps({
  modelValue: {
    type: [String, Object, Array],
    default: () => []
  },
  // 数量限制
  limit: propTypes.number.def(5),
  // 大小限制(MB)
  fileSize: propTypes.number.def(5),
  // 文件类型, 例如['png', 'jpg', 'jpeg']
  fileType: propTypes.array.def(['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'pdf']),
  // 是否显示提示
  isShowTip: propTypes.bool.def(true),
  // 禁用组件（仅查看文件）
  disabled: propTypes.bool.def(false)
});

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const emit = defineEmits(['update:modelValue']);
const number = ref(0);
const uploadList = ref<any[]>([]);

const baseUrl = import.meta.env.VITE_APP_BASE_API;
const uploadFileUrl = ref(baseUrl + '/resource/file/upload'); // 上传文件服务器地址
const headers = ref(globalHeaders());

const fileList = ref<any[]>([]);
const showTip = computed(() => props.isShowTip && (props.fileType || props.fileSize));

const fileUploadRef = ref<ElUploadInstance>();

// 监听 fileType 变化，更新 fileAccept
const fileAccept = computed(() => props.fileType.map((type) => `.${type}`).join(','));

const normalizeFileUrl = (url?: string) => {
  if (!url) {
    return '';
  }
  if (/^(https?:)?\/\//.test(url) || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return url.startsWith('/') ? `${normalizedBaseUrl}${url}` : `${normalizedBaseUrl}/${url}`;
};

watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      let temp = 1;
      // 首先将值转为数组
      let list: any[] = [];
      if (Array.isArray(val)) {
        list = val;
      } else if (typeof val === 'object') {
        list = [val];
      } else {
        const res = await listFilesByIds(val);
        list = res.data.map((file) => {
          return {
            id: file.id,
            name: file.originalName,
            url: normalizeFileUrl(file.url)
          };
        });
      }
      // 然后将数组转为对象数组
      fileList.value = list.map((item) => {
        item = { id: item.id ?? item.ossId, name: item.name, url: normalizeFileUrl(item.url) };
        item.uid = item.uid || new Date().getTime() + temp++;
        return item;
      });
    } else {
      fileList.value = [];
      return [];
    }
  },
  { deep: true, immediate: true }
);

// 上传前校检格式和大小
const handleBeforeUpload = (file: any) => {
  // 校检文件类型
  if (props.fileType.length) {
    const fileName = file.name.split('.');
    const fileExt = fileName[fileName.length - 1];
    const isTypeOk = props.fileType.indexOf(fileExt) >= 0;
    if (!isTypeOk) {
      proxy?.$modal.msgError(`文件格式不正确, 请上传${props.fileType.join('/')}格式文件!`);
      return false;
    }
  }
  // 校检文件名是否包含特殊字符
  if (file.name.includes(',')) {
    proxy?.$modal.msgError('文件名不正确，不能包含英文逗号!');
    return false;
  }
  // 校检文件大小
  if (props.fileSize) {
    const isLt = file.size / 1024 / 1024 < props.fileSize;
    if (!isLt) {
      proxy?.$modal.msgError(`上传文件大小不能超过 ${props.fileSize} MB!`);
      return false;
    }
  }
  proxy?.$modal.loading('正在上传文件，请稍候...');
  number.value++;
  return true;
};

// 文件个数超出
const handleExceed = () => {
  proxy?.$modal.msgError(`上传文件数量不能超过 ${props.limit} 个!`);
};

// 上传失败
const handleUploadError = () => {
  proxy?.$modal.msgError('上传文件失败');
};

// 上传成功回调
const handleUploadSuccess = (res: any, file: UploadFile) => {
  if (res.code === 200) {
    uploadList.value.push({
      name: res.data.fileName,
      url: normalizeFileUrl(res.data.url),
      id: res.data.id
    });
    uploadedSuccessfully();
  } else {
    number.value--;
    proxy?.$modal.closeLoading();
    proxy?.$modal.msgError(res.msg);
    fileUploadRef.value?.handleRemove(file);
    uploadedSuccessfully();
  }
};

// 删除文件
const handleDelete = (index: number) => {
  const fileId = fileList.value[index].id;
  if (fileId) {
    deleteFile(fileId);
  }
  fileList.value.splice(index, 1);
  emit('update:modelValue', listToString(fileList.value));
};

// 上传结束处理
const uploadedSuccessfully = () => {
  if (number.value > 0 && uploadList.value.length === number.value) {
    fileList.value = fileList.value.filter((f) => f.url !== undefined).concat(uploadList.value);
    uploadList.value = [];
    number.value = 0;
    emit('update:modelValue', listToString(fileList.value));
    proxy?.$modal.closeLoading();
  }
};

// 获取文件名称
const getFileName = (name: string) => {
  // 如果是url那么取最后的名字 如果不是直接返回
  if (name.lastIndexOf('/') > -1) {
    return name.slice(name.lastIndexOf('/') + 1);
  } else {
    return name;
  }
};

const getFileTypeLabel = (name: string) => {
  const fileName = getFileName(name);
  const index = fileName.lastIndexOf('.');
  return index > -1 ? fileName.slice(index + 1).toUpperCase() : 'FILE';
};

// 对象转成指定字符串分隔
const listToString = (list: any[], separator?: string) => {
  let strs = '';
  separator = separator || ',';
  list.forEach((item) => {
    const fileId = item.id ?? item.ossId;
    if (fileId) {
      strs += fileId + separator;
    }
  });
  return strs != '' ? strs.substring(0, strs.length - 1) : '';
};
</script>

<style lang="scss" scoped>
.upload-file {
  width: 100%;
}

.upload-file-trigger {
  margin-bottom: 14px;
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.upload-file-uploader {
  margin-bottom: 10px;

  :deep(.el-upload) {
    display: flex;
  }
}

.upload-file-button {
  min-width: 116px;
  border-radius: 6px;
  font-weight: 600;
}

.upload-file-button__icon {
  margin-right: 6px;
}

.upload-file-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
}

.upload-file-tip__icon {
  margin-top: 2px;
  color: var(--el-color-primary);
}

.upload-file-tip__content {
  flex: 1;
}

.upload-file-tip__highlight {
  margin: 0 2px;
  color: #334155;
  font-weight: 600;
}

.upload-file-list .el-upload-list__item {
  margin-bottom: 10px;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  line-height: 1.5;
  position: relative;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
    transform: translateY(-1px);
  }
}

.upload-file-list .ele-upload-list__item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  color: inherit;
}

.upload-file-item__main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.upload-file-item__icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  flex-shrink: 0;

  .el-icon {
    font-size: 18px;
  }
}

.upload-file-item__info {
  min-width: 0;
  flex: 1;
}

.upload-file-item__name {
  max-width: 100%;
  color: #334155;
  font-weight: 600;

  :deep(.el-link__inner) {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.upload-file-item__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
  color: #94a3b8;
}

.upload-file-item__tag {
  padding: 2px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-weight: 600;
}

.upload-file-item__text {
  white-space: nowrap;
}

.upload-file-item__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.upload-file-item__action {
  color: var(--el-color-primary);
  font-weight: 500;
}

.upload-file-item__delete {
  font-weight: 500;
}

@media (max-width: 768px) {
  .upload-file-list .ele-upload-list__item-content {
    flex-direction: column;
    align-items: stretch;
  }

  .upload-file-item__actions {
    justify-content: flex-end;
  }

  .upload-file-item__text {
    white-space: normal;
  }
}
</style>
