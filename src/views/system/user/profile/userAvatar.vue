<template>
  <div class="user-info-head group relative w-[120px] h-[120px] mx-auto cursor-pointer" @click="editCropper()">
    <img
      :src="options.img"
      title="点击上传头像"
      class="w-full h-full rounded-full object-cover border-4 border-white shadow-lg group-hover:shadow-xl transition-all duration-300"
      alt=""
    />
    <div
      class="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
    >
      <el-icon class="text-white text-3xl"><Camera /></el-icon>
    </div>

    <el-dialog v-model="open" :title="title" width="800px" append-to-body @opened="modalOpened" @close="closeDialog">
      <el-row :gutter="20">
        <el-col :xs="24" :md="12" class="h-[350px]">
          <vue-cropper
            v-if="visible"
            ref="cropper"
            :img="options.img"
            :info="true"
            :auto-crop="options.autoCrop"
            :auto-crop-width="options.autoCropWidth"
            :auto-crop-height="options.autoCropHeight"
            :fixed-box="options.fixedBox"
            :output-type="options.outputType"
            @real-time="realTime"
          />
        </el-col>
        <el-col :xs="24" :md="12" class="h-[350px] flex items-center justify-center bg-gray-50 rounded-lg">
          <div class="avatar-upload-preview overflow-hidden rounded-full shadow-md border-4 border-white">
            <img :src="options.previews.url" :style="options.previews.img" alt="" />
          </div>
        </el-col>
      </el-row>
      <div class="mt-6 flex justify-between items-center">
        <div class="flex gap-2">
          <el-upload action="#" :http-request="requestUpload" :show-file-list="false" :before-upload="beforeUpload">
            <el-button type="primary" plain>
              选择图片
              <el-icon class="el-icon--right"><Upload /></el-icon>
            </el-button>
          </el-upload>
          <el-button-group>
            <el-button icon="Plus" @click="changeScale(1)" />
            <el-button icon="Minus" @click="changeScale(-1)" />
            <el-button icon="RefreshLeft" @click="rotateLeft()" />
            <el-button icon="RefreshRight" @click="rotateRight()" />
          </el-button-group>
        </div>
        <el-button type="primary" @click="uploadImg()">保存并提交</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import 'vue-cropper/dist/index.css';
import { VueCropper } from 'vue-cropper';
import { uploadAvatar } from '@/api/system/user';
import { useUserStore } from '@/store/modules/user';
import { UploadRawFile } from 'element-plus';
import { Upload } from '@element-plus/icons-vue';

interface Options {
  img: string | any; // 裁剪图片的地址
  autoCrop: boolean; // 是否默认生成截图框
  autoCropWidth: number; // 默认生成截图框宽度
  autoCropHeight: number; // 默认生成截图框高度
  fixedBox: boolean; // 固定截图框大小 不允许改变
  fileName: string;
  previews: any; // 预览数据
  outputType: string;
  visible: boolean;
}

const userStore = useUserStore();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const open = ref(false);
const visible = ref(false);
const title = ref('修改头像');

const cropper = ref<any>({});

//图片裁剪数据
const options = reactive<Options>({
  img: userStore.avatar,
  autoCrop: true,
  autoCropWidth: 200,
  autoCropHeight: 200,
  fixedBox: true,
  outputType: 'png',
  fileName: '',
  previews: {},
  visible: false
});

/** 编辑头像 */
const editCropper = () => {
  open.value = true;
};

/** 打开弹出层结束时的回调 */
const modalOpened = () => {
  visible.value = true;
};

/** 覆盖默认上传行为 */
const requestUpload = (): any => {};

/** 向左旋转 */
const rotateLeft = () => {
  cropper.value.rotateLeft();
};

/** 向右旋转 */
const rotateRight = () => {
  cropper.value.rotateRight();
};

/** 图片缩放 */
const changeScale = (num: number) => {
  num = num || 1;
  cropper.value.changeScale(num);
};

/** 上传预处理 */
const beforeUpload = (file: UploadRawFile): any => {
  if (file.type.indexOf('image/') == -1) {
    proxy?.$modal.msgError('文件格式错误，请上传图片类型,如：JPG，PNG后缀的文件。');
  } else {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      options.img = reader.result;
      options.fileName = file.name;
    };
  }
};

/** 上传图片 */
const uploadImg = async () => {
  cropper.value.getCropBlob(async (data: any) => {
    const formData = new FormData();
    formData.append('avatarFile', data, options.fileName);
    const res = await uploadAvatar(formData);
    open.value = false;
    options.img = res.data.imgUrl;
    userStore.setAvatar(options.img);
    proxy?.$modal.msgSuccess('修改成功');
    visible.value = false;
  });
};

/** 实时预览 */
const realTime = (data: any) => {
  options.previews = data;
};

/** 关闭窗口 */
const closeDialog = () => {
  options.img = userStore.avatar;
  options.visible = false;
};
</script>
