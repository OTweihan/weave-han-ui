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
            <el-button v-hasPermi="['system:ossConfig:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:ossConfig:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">
              修改
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:ossConfig:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">
              删除
            </el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="ossConfigList" height="100%" class="flex-1" @selection-change="handleSelectionChange">
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
              <el-button v-hasPermi="['system:ossConfig:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="主配置" placement="top">
              <el-button
                v-hasPermi="['system:ossConfig:edit']"
                link
                type="primary"
                icon="Star"
                :disabled="scope.row.master"
                @click="handleMaster(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip content="测试" placement="top">
              <el-button v-hasPermi="['system:ossConfig:edit']" link type="primary" icon="Upload" @click="handleTest(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['system:ossConfig:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 添加或修改对象存储配置对话框 -->
    <OssConfigDialog ref="ossConfigDialogRef" @success="getList" />
    <el-dialog v-model="previewDialogVisible" title="测试上传预览" width="800px" append-to-body>
      <div v-if="previewUrl">
        <img
          :key="previewUrl"
          :src="previewUrl"
          style="display: block; max-width: 100%; margin: 0 auto"
          @load="() => console.info('[OssConfig] 预览图片加载成功', { url: previewUrl })"
          @error="() => console.error('[OssConfig] 预览图片加载失败', { url: previewUrl })"
          alt=""
        />
      </div>
      <div v-else>无可预览地址</div>
    </el-dialog>
  </div>
</template>

<script setup data-name="OssConfig" lang="ts">
import { listOssConfig, delOssConfig, testOssConfig, updateOssConfigMaster } from '@/api/system/ossConfig';
import { OssConfigQuery, OssConfigVO } from '@/api/system/ossConfig/types';
import OssConfigDialog from './components/OssConfigDialog.vue';
import { ElLoading } from 'element-plus';
import request from '@/utils/request';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { infra_file_storage } = toRefs<any>(proxy?.useDict('infra_file_storage'));

const ossConfigList = ref<OssConfigVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const selectionNames = ref<Array<string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const previewDialogVisible = ref(false);
const previewUrl = ref('');
const previewObjectUrl = ref('');

const queryFormRef = ref<ElFormInstance>();
const ossConfigDialogRef = ref<InstanceType<typeof OssConfigDialog>>();

const queryParams = reactive<OssConfigQuery>({
  pageNum: 1,
  pageSize: 10,
  configName: '',
  bucketName: '',
  storageType: '',
  master: ''
});

/** 查询对象存储配置列表 */
const getList = async () => {
  loading.value = true;
  const res = await listOssConfig(queryParams);
  ossConfigList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 选择条数  */
const handleSelectionChange = (selection: OssConfigVO[]) => {
  ids.value = selection.map((item) => item.ossConfigId);
  selectionNames.value = selection.map((item) => item.configName);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  ossConfigDialogRef.value?.open();
};

/** 修改按钮操作 */
const handleUpdate = (row?: OssConfigVO) => {
  const param = row || ids.value[0];
  ossConfigDialogRef.value?.open(param);
};

/** 设为主配置 */
const handleMaster = async (row: OssConfigVO) => {
  try {
    await proxy?.$modal.confirm('确认要将 "' + row.configName + '" 设为主配置吗?');
    await updateOssConfigMaster(row.ossConfigId);
    await getList();
    proxy?.$modal.msgSuccess('设置成功');
  } catch {
    return;
  }
};

/** 测试配置 */
const handleTest = async (row: OssConfigVO) => {
  const debugMeta = {
    ossConfigId: row?.ossConfigId,
    configName: row?.configName,
    storageType: row?.storageType
  };
  console.info('[OssConfig] 点击测试上传', debugMeta);
  proxy?.$modal.msg('开始测试上传...');

  let loadingInstance: any;
  try {
    loadingInstance = ElLoading.service({
      text: '测试上传中...'
    });
  } catch (e) {
    console.error('[OssConfig] ElLoading 启动失败', e);
  }
  try {
    console.info('[OssConfig] 准备请求 testOssConfig', debugMeta);
    const res: any = await testOssConfig(row.ossConfigId);
    console.info('[OssConfig] testOssConfig 返回结果', { ...debugMeta, res });
    const urlFromRes = res?.data || res?.msg || '';
    if (urlFromRes) {
      console.info('[OssConfig] 测试上传返回地址', { ...debugMeta, urlFromRes });
      const blob: any = await request({
        url: urlFromRes,
        method: 'get',
        responseType: 'blob'
      });
      try {
        if (previewObjectUrl.value) URL.revokeObjectURL(previewObjectUrl.value);
      } catch {}
      previewObjectUrl.value = URL.createObjectURL(blob);
      previewUrl.value = previewObjectUrl.value;
      console.info('[OssConfig] 预览 Blob 加载完成', { ...debugMeta, blobType: blob?.type, previewUrl: previewUrl.value });
      previewDialogVisible.value = true;
      proxy?.$modal.msgSuccess('测试上传成功');
    } else {
      console.warn('[OssConfig] 未获取到可预览地址', { ...debugMeta, res });
      proxy?.$modal.msgError('未获取到可预览地址');
    }
  } catch (e) {
    console.error('[OssConfig] testOssConfig 请求失败', { ...debugMeta, error: e });
    proxy?.$modal.msgError('测试上传失败，请打开控制台查看错误');
  } finally {
    try {
      loadingInstance?.close();
    } catch (e) {
      console.error('[OssConfig] ElLoading 关闭失败', e);
    }
  }
};

watch(previewDialogVisible, (v) => {
  if (v) return;
  try {
    if (previewObjectUrl.value) URL.revokeObjectURL(previewObjectUrl.value);
  } catch {}
  previewObjectUrl.value = '';
  previewUrl.value = '';
});

/** 删除按钮操作 */
const handleDelete = async (row?: OssConfigVO) => {
  const ossConfigIds = row?.ossConfigId || ids.value;
  const ossConfigNames = row?.configName || selectionNames.value;
  await proxy?.$modal.confirm('是否确认删除配置名称为 "' + ossConfigNames + '" 的数据项?');
  loading.value = true;
  await delOssConfig(ossConfigIds).finally(() => (loading.value = false));
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

onMounted(() => {
  getList();
});
</script>
