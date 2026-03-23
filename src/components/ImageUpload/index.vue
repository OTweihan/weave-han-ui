<template>
  <div class="component-upload-image">
    <el-upload
      ref="imageUploadRef"
      multiple
      :action="uploadImgUrl"
      list-type="picture-card"
      :on-success="handleUploadSuccess"
      :before-upload="handleBeforeUpload"
      :limit="limit"
      :accept="fileAccept"
      :on-error="handleUploadError"
      :on-exceed="handleExceed"
      :before-remove="handleDelete"
      :show-file-list="true"
      :headers="headers"
      :file-list="fileList"
      :on-preview="handlePictureCardPreview"
      :class="{ 'hide-upload': fileList.length >= limit }"
      class="refined-uploader"
    >
      <div class="upload-trigger-area">
        <el-icon class="uploader-icon"><Plus /></el-icon>
        <span class="upload-text">添加图片</span>
      </div>
    </el-upload>

    <div v-if="showTip" class="upload-tip-container">
      <el-icon><InfoFilled /></el-icon>
      <div class="tip-content">
        建议格式：<span class="highlight">{{ fileType.join('/') }}</span
        >， 单张不超过 <span class="highlight">{{ fileSize }}MB</span>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" title="查看原图" width="800px" append-to-body align-center class="custom-preview-dialog">
      <div class="preview-wrapper">
        <img :src="dialogImageUrl" class="preview-img" alt="Uploaded Image" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { deleteFile, listFilesByIds } from '@/api/system/file';
import { FileVO } from '@/api/system/file/types';
import { propTypes } from '@/utils/propTypes';
import { globalHeaders } from '@/utils/request';
import { compressAccurately } from 'image-conversion';
import { InfoFilled, Plus } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: {
    type: [String, Object, Array],
    default: () => []
  },
  // 图片数量限制
  limit: propTypes.number.def(5),
  // 大小限制(MB)
  fileSize: propTypes.number.def(5),
  // 文件类型, 例如['png', 'jpg', 'jpeg']
  fileType: propTypes.array.def(['png', 'jpg', 'jpeg']),
  // 是否显示提示
  isShowTip: {
    type: Boolean,
    default: true
  },
  // 是否支持压缩，默认否
  compressSupport: {
    type: Boolean,
    default: false
  },
  // 压缩目标大小，单位KB。默认300KB以上文件才压缩，并压缩至300KB以内
  compressTargetSize: propTypes.number.def(300)
});

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const emit = defineEmits(['update:modelValue']);
const number = ref(0);
const uploadList = ref<any[]>([]);
const dialogImageUrl = ref('');
const dialogVisible = ref(false);

const baseUrl = import.meta.env.VITE_APP_BASE_API;
const uploadImgUrl = ref(baseUrl + '/resource/file/upload'); // 上传的图片服务器地址
const headers = ref(globalHeaders());

const fileList = ref<any[]>([]);
const showTip = computed(() => props.isShowTip && (props.fileType || props.fileSize));

const imageUploadRef = ref<ElUploadInstance>();

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
  async (val: string) => {
    if (val) {
      // 首先将值转为数组
      let list: FileVO[];
      if (Array.isArray(val)) {
        list = val as FileVO[];
      } else if (typeof val === 'object') {
        list = [val as FileVO];
      } else {
        const res = await listFilesByIds(val);
        list = res.data;
      }
      // 然后将数组转为对象数组
      fileList.value = list.map((item) => {
        // 字符串回显处理 如果此处存的是url可直接回显 如果存的是id需要调用接口查出来
        let itemData: { name: string; url: string; id?: string | number };
        if (typeof item === 'string') {
          itemData = { name: item, url: normalizeFileUrl(item) };
        } else {
          const fileId = item.id ?? item.ossId;
          itemData = { id: fileId, name: String(fileId), url: normalizeFileUrl(item.url) };
        }
        return itemData;
      });
    } else {
      fileList.value = [];
      return [];
    }
  },
  { deep: true, immediate: true }
);

/** 上传前loading加载 */
const handleBeforeUpload = (file: any) => {
  let isImg: boolean;
  if (props.fileType.length) {
    let fileExtension = '';
    if (file.name.lastIndexOf('.') > -1) {
      fileExtension = file.name.slice(file.name.lastIndexOf('.') + 1);
    }
    isImg = props.fileType.some((type: any) => {
      if (file.type.indexOf(type) > -1) return true;
      return fileExtension && fileExtension.indexOf(type) > -1;
    });
  } else {
    isImg = file.type.indexOf('image') > -1;
  }
  if (!isImg) {
    proxy?.$modal.msgError(`文件格式不正确, 请上传${props.fileType.join('/')}图片格式文件!`);
    return false;
  }
  if (file.name.includes(',')) {
    proxy?.$modal.msgError('文件名不正确，不能包含英文逗号!');
    return false;
  }
  if (props.fileSize) {
    const isLt = file.size / 1024 / 1024 < props.fileSize;
    if (!isLt) {
      proxy?.$modal.msgError(`上传头像图片大小不能超过 ${props.fileSize} MB!`);
      return false;
    }
  }

  //压缩图片，开启压缩并且大于指定的压缩大小时才压缩
  if (props.compressSupport && file.size / 1024 > props.compressTargetSize) {
    proxy?.$modal.loading('正在上传图片，请稍候...');
    number.value++;
    return compressAccurately(file, props.compressTargetSize);
  } else {
    proxy?.$modal.loading('正在上传图片，请稍候...');
    number.value++;
  }
};

// 文件个数超出
const handleExceed = () => {
  proxy?.$modal.msgError(`上传文件数量不能超过 ${props.limit} 个!`);
};

// 上传成功回调
const handleUploadSuccess = (res: any, file: UploadFile) => {
  if (res.code === 200) {
    uploadList.value.push({ id: res.data.id, name: String(res.data.id), url: normalizeFileUrl(res.data.url) });
    uploadedSuccessfully();
  } else {
    number.value--;
    proxy?.$modal.closeLoading();
    proxy?.$modal.msgError(res.msg);
    imageUploadRef.value?.handleRemove(file);
    uploadedSuccessfully();
  }
};

// 删除图片
const handleDelete = (file: UploadFile): boolean => {
  const findex = fileList.value.map((f) => f.name).indexOf(file.name);
  if (findex > -1 && uploadList.value.length === number.value) {
    const fileId = fileList.value[findex].id;
    if (fileId) {
      deleteFile(fileId);
    }
    fileList.value.splice(findex, 1);
    emit('update:modelValue', listToString(fileList.value));
    return false;
  }
  return true;
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

// 上传失败
const handleUploadError = () => {
  proxy?.$modal.msgError('上传图片失败');
  proxy?.$modal.closeLoading();
};

// 预览
const handlePictureCardPreview = (file: any) => {
  dialogImageUrl.value = file.url;
  dialogVisible.value = true;
};

// 对象转成指定字符串分隔
const listToString = (list: any[], separator?: string) => {
  let strs = '';
  separator = separator || ',';
  for (const i in list) {
    const fileId = list[i].id ?? list[i].ossId;
    if (undefined !== fileId && list[i].url.indexOf('blob:') !== 0) {
      strs += fileId + separator;
    }
  }
  return strs != '' ? strs.substring(0, strs.length - 1) : '';
};
</script>

<style lang="scss" scoped>
.component-upload-image {
  width: 100%;
}

.refined-uploader {
  line-height: 0;

  :deep(.el-upload-list--picture-card) {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;

    .el-upload-list__item {
      width: 120px;
      height: 120px;
      margin: 0;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        transform 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        border-color: #cbd5e1;
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.1);
      }

      .el-upload-list__item-actions {
        background-color: rgba(15, 23, 42, 0.5);
      }
    }
  }

  :deep(.el-upload--picture-card) {
    width: 120px;
    height: 120px;
    background-color: #f8fafc;
    border: 1px dashed #cbd5e1;
    border-radius: 10px;
    transition:
      border-color 0.2s ease,
      background-color 0.2s ease,
      transform 0.2s ease,
      box-shadow 0.2s ease;
    margin: 0;

    &:hover {
      background-color: #ffffff;
      border-color: var(--el-color-primary);
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.12);
      transform: translateY(-1px);

      .uploader-icon {
        color: var(--el-color-primary);
        transform: translateY(-1px);
      }
      .upload-text {
        color: var(--el-color-primary);
      }
    }
  }
}

.upload-trigger-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;

  .uploader-icon {
    font-size: 24px;
    color: #94a3b8;
    margin-bottom: 8px;
    transition: all 0.2s ease;
  }

  .upload-text {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    transition: all 0.2s ease;
  }
}

.hide-upload :deep(.el-upload--picture-card) {
  display: none;
}

.upload-tip-container {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  margin-top: 14px;
  padding: 10px 12px;
  background-color: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;

  .el-icon {
    margin-top: 2px;
    color: var(--el-color-primary);
    font-size: 14px;
  }

  .highlight {
    color: #334155;
    font-weight: 600;
    margin: 0 2px;
  }
}

:deep(.custom-preview-dialog) {
  .el-dialog {
    overflow: hidden;
    border-radius: 12px;
    box-shadow: 0 18px 36px rgba(15, 23, 42, 0.12);
  }

  .el-dialog__header {
    background: #ffffff;
    margin: 0;
    padding: 14px 20px 12px;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  .el-dialog__title {
    font-size: 15px;
    font-weight: 600;
  }

  .el-dialog__body {
    background: #f5f7fb;
    padding: 18px 20px 20px;
  }
}

.preview-wrapper {
  width: 100%;
  max-height: 70vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;

  .preview-img {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  }
}
</style>
