<template>
  <div class="p-2 h-full flex flex-col">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="配置名" prop="configName">
              <el-input v-model="queryParams.configName" placeholder="请输入配置名" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="存储器" prop="storageType">
              <el-select v-model="queryParams.storageType" placeholder="请选择存储器" clearable>
                <el-option v-for="dict in infra_file_storage" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="主配置" prop="master">
              <el-select v-model="queryParams.master" placeholder="请选择" clearable>
                <el-option key="0" label="是" value="true" />
                <el-option key="1" label="否" value="false" />
              </el-select>
            </el-form-item>
            <el-form-item label="创建时间" style="width: 308px">
              <el-date-picker
                v-model="dateRange"
                value-format="YYYY-MM-DD HH:mm:ss"
                type="daterange"
                range-separator="-"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
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

    <el-card
      shadow="hover"
      class="flex-1 flex flex-col overflow-hidden"
      :body-style="{ flex: '1', overflow: 'hidden', display: 'flex', flexDirection: 'column' }"
    >
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:storageConfig:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:storageConfig:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">
              删除
            </el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="storageConfigList" height="100%" class="flex-1" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="配置名" align="center" prop="configName" />
        <el-table-column label="存储器" align="center" prop="storageType">
          <template #default="scope">
            <dict-tag :options="infra_file_storage" :value="String(scope.row.storageType)" />
          </template>
        </el-table-column>
        <el-table-column label="主配置" align="center" prop="master">
          <template #default="scope">
            <el-tag v-if="scope.row.master" type="success">是</el-tag>
            <el-tag v-else type="info">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="创建时间" align="center" prop="createTime" />
        <el-table-column label="操作" fixed="right" align="center" width="200" class-name="small-padding">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['system:storageConfig:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="主配置" placement="top">
              <el-button
                v-hasPermi="['system:storageConfig:edit']"
                link
                type="primary"
                icon="Star"
                :disabled="scope.row.master"
                @click="handleMaster(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip content="测试" placement="top">
              <el-button v-hasPermi="['system:storageConfig:edit']" link type="primary" icon="Upload" @click="handleTest(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['system:storageConfig:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <StorageConfigDialog ref="storageConfigDialogRef" @success="getList" />

    <el-dialog v-model="previewDialogVisible" title="测试上传预览" width="800px" append-to-body>
      <div v-if="previewUrl" class="flex justify-center items-center" style="height: 400px">
        <img
          :key="previewUrl"
          :src="previewUrl"
          class="block max-w-full max-h-full object-contain"
          alt="上传预览图"
          @load="onPreviewLoad"
          @error="onPreviewError"
        />
      </div>
      <el-empty v-else description="无可预览地址" />
    </el-dialog>
  </div>
</template>

<script setup data-name="StorageConfig" lang="ts">
import { ref, reactive, onMounted, watch, getCurrentInstance, toRefs } from 'vue';
import type { ComponentInternalInstance } from 'vue';
import { ElLoading, FormInstance } from 'element-plus';
import request from '@/utils/request';
import { deleteStorageConfig, listStorageConfig, testStorageConfig, updateStorageConfigMaster } from '@/api/system/storageConfig';
import { StorageConfigQuery, StorageConfigVO } from '@/api/system/storageConfig/types';
import StorageConfigDialog from './components/StorageConfigDialog.vue';

// 全局上下文与字典
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { infra_file_storage } = toRefs<any>(proxy?.useDict('infra_file_storage'));

// 表格与分页数据
const storageConfigList = ref<StorageConfigVO[]>([]);
const total = ref(0);
const loading = ref(true);
const showSearch = ref(true);

// 表格多选相关
const ids = ref<Array<number | string>>([]);
const selectionNames = ref<Array<string>>([]);
const single = ref(true);
const multiple = ref(true);

// 预览相关数据
const previewDialogVisible = ref(false);
const previewUrl = ref('');
const previewObjectUrl = ref('');

// 查询表单参数
const queryFormRef = ref<FormInstance>();
const dateRange = ref<[any, any]>(['', '']); // 若有精确类型可替换 any
const queryParams = reactive<StorageConfigQuery>({
  pageNum: 1,
  pageSize: 10,
  configName: '',
  storageType: '',
  master: ''
});

// 对话框引用
const storageConfigDialogRef = ref<InstanceType<typeof StorageConfigDialog>>();

/** 查询对象存储配置列表 */
const getList = async () => {
  loading.value = true;
  try {
    const params = proxy?.addDateRange(queryParams, dateRange.value) || queryParams;
    const res = await listStorageConfig(params);
    storageConfigList.value = res.rows;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  dateRange.value = ['', ''];
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 表格复选框选择操作 */
const handleSelectionChange = (selection: StorageConfigVO[]) => {
  ids.value = selection.map((item) => item.storageConfigId);
  selectionNames.value = selection.map((item) => item.configName);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  storageConfigDialogRef.value?.open();
};

/** 修改按钮操作 */
const handleUpdate = (row?: StorageConfigVO) => {
  const param = row || ids.value[0];
  storageConfigDialogRef.value?.open(param);
};

/** 设为主配置 */
const handleMaster = async (row: StorageConfigVO) => {
  try {
    await proxy?.$modal.confirm(`确认要将 "${row.configName}" 设为主配置吗?`);
    await updateStorageConfigMaster(row.storageConfigId);
    proxy?.$modal.msgSuccess('设置主配置成功');
    await getList();
  } catch (e) {
    // 捕获取消操作或接口报错，避免控制台抛出 Uncaught Promise Error
    console.info('取消设置主配置', e);
  }
};

/** 释放当前的 Object URL 防内存泄漏 */
const revokePreviewUrl = () => {
  if (previewObjectUrl.value) {
    URL.revokeObjectURL(previewObjectUrl.value);
    previewObjectUrl.value = '';
    previewUrl.value = '';
  }
};

/** 测试配置上传 */
const handleTest = async (row: StorageConfigVO) => {
  proxy?.$modal.msg('开始测试上传...');
  const loadingInstance = ElLoading.service({ text: '测试上传中...', background: 'rgba(0, 0, 0, 0.7)' });

  try {
    // 1. 获取测试上传的 URL
    const res: any = await testStorageConfig(row.storageConfigId);
    const urlFromRes = res?.data || res?.msg || '';

    if (!urlFromRes) {
      proxy?.$modal.msgError('未获取到可预览地址');
      return;
    }

    // 2. 将 URL 转换为 Blob 进行预览
    const blob = (await request({
      url: urlFromRes,
      method: 'get',
      responseType: 'blob'
    })) as Blob;

    // 3. 释放旧的 URL 引用，生成新的 Blob URL
    revokePreviewUrl();
    previewObjectUrl.value = URL.createObjectURL(blob);
    previewUrl.value = previewObjectUrl.value;

    // 4. 打开弹窗
    previewDialogVisible.value = true;
    proxy?.$modal.msgSuccess('测试上传成功');
  } catch (e) {
    console.error('[OssConfig] 测试上传请求失败', e);
    // request 拦截器通常已经弹出了错误提示，如果没有可以保留以下提示
    // proxy?.$modal.msgError('测试上传失败，请查看控制台');
  } finally {
    loadingInstance.close();
  }
};

/** 图片加载成功回调 */
const onPreviewLoad = () => {
  console.info('[OssConfig] 预览图片加载成功', { url: previewUrl.value });
};

/** 图片加载失败回调 */
const onPreviewError = () => {
  console.error('[OssConfig] 预览图片加载失败', { url: previewUrl.value });
};

/** 监听弹窗关闭，释放 Blob 内存 */
watch(previewDialogVisible, (isVisible) => {
  if (!isVisible) {
    revokePreviewUrl();
  }
});

/** 删除按钮操作 */
const handleDelete = async (row?: StorageConfigVO) => {
  const storageConfigIds = row?.storageConfigId || ids.value;
  const storageConfigNames = row?.configName || selectionNames.value.join(',');

  try {
    await proxy?.$modal.confirm(`是否确认删除配置名称为 "${storageConfigNames}" 的数据项?`);
    loading.value = true;
    await deleteStorageConfig(storageConfigIds);
    proxy?.$modal.msgSuccess('删除成功');
    await getList();
  } catch (e) {
    console.info('取消删除或删除失败', e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  getList();
});
</script>
