<template>
  <div class="p-2 h-full flex flex-col">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="配置key" prop="configKey">
              <el-input v-model="queryParams.configKey" placeholder="配置key" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="桶名称" prop="bucketName">
              <el-input v-model="queryParams.bucketName" placeholder="请输入桶名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="是否默认" prop="status">
              <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
                <el-option key="0" label="是" value="0" />
                <el-option key="1" label="否" value="1" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="search" @click="handleQuery">搜索</el-button>
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
            <el-button v-hasPermi="['system:ossConfig:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()"
              >修改</el-button
            >
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
        <el-table-column v-if="columns[0].visible" label="主建" align="center" prop="ossConfigId" />
        <el-table-column v-if="columns[1].visible" label="配置key" align="center" prop="configKey" />
        <el-table-column v-if="columns[9].visible" label="存储器" align="center" prop="storageType">
          <template #default="scope">
            <dict-tag :options="infra_file_storage" :value="scope.row.storageType" />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[2].visible" label="访问站点" align="center" prop="endpoint" width="200" />
        <el-table-column v-if="columns[3].visible" label="自定义域名" align="center" prop="domain" width="200" />
        <el-table-column v-if="columns[4].visible" label="桶名称" align="center" prop="bucketName" />
        <el-table-column v-if="columns[5].visible" label="前缀" align="center" prop="prefix" />
        <el-table-column v-if="columns[6].visible" label="域" align="center" prop="region" />
        <el-table-column v-if="columns[7].visible" label="桶权限类型" align="center" prop="accessPolicy">
          <template #default="scope">
            <el-tag v-if="scope.row.accessPolicy === '0'" type="warning">private</el-tag>
            <el-tag v-if="scope.row.accessPolicy === '1'" type="success">public</el-tag>
            <el-tag v-if="scope.row.accessPolicy === '2'" type="info">custom</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[8].visible" label="是否默认" align="center" prop="status">
          <template #default="scope">
            <el-switch v-model="scope.row.status" active-value="0" inactive-value="1" @change="handleStatusChange(scope.row)"></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" align="center" width="150" class-name="small-padding">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['system:ossConfig:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
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
  </div>
</template>

<script setup data-name="OssConfig" lang="ts">
import { listOssConfig, delOssConfig, changeOssConfigStatus } from '@/api/system/ossConfig';
import { OssConfigQuery, OssConfigVO } from '@/api/system/ossConfig/types';
import OssConfigDialog from './components/OssConfigDialog.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { infra_file_storage } = toRefs<any>(proxy?.useDict('infra_file_storage'));

const ossConfigList = ref<OssConfigVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const ossConfigDialogRef = ref<InstanceType<typeof OssConfigDialog>>();

// 列显隐信息
const columns = ref<FieldOption[]>([
  { key: 0, label: `主建`, visible: false },
  { key: 1, label: `配置key`, visible: true },
  { key: 2, label: `访问站点`, visible: true },
  { key: 3, label: `自定义域名`, visible: true },
  { key: 4, label: `桶名称`, visible: true },
  { key: 5, label: `前缀`, visible: true },
  { key: 6, label: `域`, visible: true },
  { key: 7, label: `桶权限类型`, visible: true },
  { key: 8, label: `状态`, visible: true },
  { key: 9, label: `存储器`, visible: true }
]);

const queryParams = reactive<OssConfigQuery>({
  pageNum: 1,
  pageSize: 10,
  configKey: '',
  bucketName: '',
  status: ''
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
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  ossConfigDialogRef.value?.open();
};

/** 修改按钮操作 */
const handleUpdate = (row?: OssConfigVO) => {
  const ossConfigId = row?.ossConfigId || ids.value[0];
  ossConfigDialogRef.value?.open(ossConfigId);
};

/** 状态修改  */
const handleStatusChange = async (row: OssConfigVO) => {
  const text = row.status === '0' ? '启用' : '停用';
  try {
    await proxy?.$modal.confirm('确认要"' + text + '""' + row.configKey + '"配置吗?');
    await changeOssConfigStatus(row.ossConfigId, row.status, row.configKey);
    await getList();
    proxy?.$modal.msgSuccess(text + '成功');
  } catch {
    return;
  } finally {
    row.status = row.status === '0' ? '1' : '0';
  }
};

/** 删除按钮操作 */
const handleDelete = async (row?: OssConfigVO) => {
  const ossConfigIds = row?.ossConfigId || ids.value;
  await proxy?.$modal.confirm('是否确认删除OSS配置编号为"' + ossConfigIds + '"的数据项?');
  loading.value = true;
  await delOssConfig(ossConfigIds).finally(() => (loading.value = false));
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

onMounted(() => {
  getList();
});
</script>
