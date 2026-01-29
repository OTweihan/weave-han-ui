<template>
  <el-dialog v-model="open" title="操作日志详细" width="700px" append-to-body close-on-click-modal>
    <el-descriptions v-if="info" :column="1" border>
      <el-descriptions-item label="操作状态">
        <template #default>
          <dict-tag :options="sys_common_status" :value="info.status" />
        </template>
      </el-descriptions-item>
      <el-descriptions-item label="登录信息">
        <template #default> {{ info.operName }} / {{ info.operIp }} / {{ info.operLocation }} </template>
      </el-descriptions-item>
      <el-descriptions-item label="请求信息">
        <template #default> {{ info.requestMethod }} {{ info.operUrl }} </template>
      </el-descriptions-item>
      <el-descriptions-item label="操作模块">
        <template #default> {{ info.title }} / {{ typeFormat(info) }} </template>
      </el-descriptions-item>
      <el-descriptions-item label="操作方法">
        <template #default>
          {{ info.method }}
        </template>
      </el-descriptions-item>
      <el-descriptions-item label="请求参数">
        <template #default>
          <div class="relative group">
            <el-tooltip content="复制" placement="top">
              <el-button
                v-if="info.operParam"
                link
                type="primary"
                icon="CopyDocument"
                class="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                @click="handleCopy(info.operParam)"
              />
            </el-tooltip>
            <div class="max-h-300px overflow-y-auto">
              <VueJsonPretty :data="formatToJsonObject(info.operParam)" />
            </div>
          </div>
        </template>
      </el-descriptions-item>
      <el-descriptions-item label="返回参数">
        <template #default>
          <div class="relative group">
            <el-tooltip content="复制" placement="top">
              <el-button
                v-if="info.jsonResult"
                link
                type="primary"
                icon="CopyDocument"
                class="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                @click="handleCopy(info.jsonResult)"
              />
            </el-tooltip>
            <div class="max-h-300px overflow-y-auto">
              <VueJsonPretty :data="formatToJsonObject(info.jsonResult)" />
            </div>
          </div>
        </template>
      </el-descriptions-item>
      <el-descriptions-item label="消耗时间">
        <template #default>
          <span> {{ info.costTime }}ms </span>
        </template>
      </el-descriptions-item>
      <el-descriptions-item label="操作时间">
        <template #default> {{ proxy.parseTime(info.operTime) }}</template>
      </el-descriptions-item>
      <el-descriptions-item v-if="info.status === 1" label="异常信息">
        <template #default>
          <span class="text-danger"> {{ info.errorMsg }}</span>
        </template>
      </el-descriptions-item>
    </el-descriptions>
  </el-dialog>
</template>

<script setup lang="ts">
import type { OperLogForm } from '@/api/monitor/operlog/types';
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';

const open = ref(false);
const info = ref<OperLogForm | null>(null);
function openDialog(row: OperLogForm) {
  info.value = row;
  open.value = true;
}

function closeDialog() {
  open.value = false;
}

defineExpose({
  openDialog,
  closeDialog
});

/**
 * json转为对象
 * @param data 原始数据
 */
function formatToJsonObject(data: string) {
  try {
    return JSON.parse(data);
  } catch (error) {
    return data;
  }
}

/**
 * 字典信息
 */
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const { sys_oper_type, sys_common_status } = toRefs<any>(proxy?.useDict('sys_oper_type', 'sys_common_status'));

const typeFormat = (row: OperLogForm) => {
  return proxy?.selectDictLabel(sys_oper_type.value, row.businessType);
};

const { copy } = useClipboard();
const handleCopy = (text: string) => {
  const data = formatToJsonObject(text);
  if (typeof data === 'object' && data !== null) {
    copy(JSON.stringify(data, null, 2));
  } else {
    copy(text);
  }
  proxy?.$modal.msgSuccess('复制成功');
};
</script>

<style lang="scss" scoped>
/**
label宽度固定
*/
:deep(.el-descriptions__label) {
  width: 120px;
  font-weight: bold;
}
/**
文字超过 换行显示
*/
:deep(.el-descriptions__content) {
  word-break: break-word;
  overflow-wrap: break-word;
}
</style>
