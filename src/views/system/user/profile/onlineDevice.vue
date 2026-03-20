<template>
  <div class="inner-device-wrapper">
    <div class="device-alert">
      <el-icon><Monitor /></el-icon>
      <span
        >当前共有 <b>{{ devices.length }}</b> 个活跃会话，若发现异常登录请及时强制下线并修改密码。</span
      >
    </div>

    <el-table
      :data="devices"
      class="refined-table"
      :header-cell-style="{ background: '#f8fafc', color: '#64748b', fontWeight: '700', borderBottom: 'none' }"
    >
      <el-table-column label="设备" width="160" align="center">
        <template #default="scope">
          <div class="device-type-cell">
            <dict-tag :options="sys_device_type" :value="scope.row.deviceType" />
          </div>
        </template>
      </el-table-column>

      <el-table-column label="登录信息" width="240">
        <template #default="scope">
          <div class="location-box">
            <span class="ip-text">{{ scope.row.ipaddr }}</span>
            <span class="location-text">{{ scope.row.loginLocation }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="运行环境" min-width="180">
        <template #default="scope">
          <div class="env-info">
            <div class="env-item">
              <el-icon><Cpu /></el-icon>
              <span>{{ scope.row.os }}</span>
            </div>
            <div class="env-item">
              <el-icon><Compass /></el-icon>
              <span>{{ scope.row.browser }}</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="登录时间" width="240" align="center">
        <template #default="scope">
          <div class="time-cell">
            {{ proxy.parseTime(scope.row.loginTime, '{y}-{m}-{d} {h}:{i}') }}
          </div>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="160" align="center" fixed="right">
        <template #default="scope">
          <el-button type="danger" variant="light" link class="offline-btn" @click="offlineDevice(scope.row)"> 强制下线 </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup data-name="Online" lang="ts">
import { delOnline } from '@/api/monitor/online';
import { propTypes } from '@/utils/propTypes';
import { Compass, Cpu, Monitor } from '@element-plus/icons-vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_device_type } = toRefs<any>(proxy?.useDict('sys_device_type'));

const props = defineProps({
  devices: propTypes.any.isRequired
});
const devices = computed(() => props.devices);

const offlineDevice = (row: any) => {
  ElMessageBox.confirm('确定要强制该设备下线吗？下线后该账号需重新登录。', '安全提醒', {
    confirmButtonText: '确定下线',
    cancelButtonText: '取消',
    type: 'warning',
    buttonSize: 'default',
    autofocus: false
  })
    .then(() => {
      return delOnline(row.tokenId);
    })
    .then((res: any) => {
      if (res.code === 200) {
        proxy?.$modal.msgSuccess('设备已成功下线');
        proxy?.$tab.refreshPage();
      }
    })
    .catch(() => {});
};
</script>

<style lang="scss" scoped>
.inner-device-wrapper {
  /* 顶部提示条 */
  .device-alert {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: #fff7ed;
    border: 1px solid #ffedd5;
    border-radius: 12px;
    color: #c2410c;
    font-size: 13px;
    margin-bottom: 24px;

    .el-icon {
      font-size: 16px;
    }
    b {
      color: #9a3412;
      margin: 0 2px;
    }
  }

  /* 表格样式重塑 */
  .refined-table {
    --el-table-border-color: #f1f5f9;

    :deep(.el-table__inner-wrapper::before) {
      display: none;
    }

    :deep(.el-table__row) {
      transition: all 0.2s ease;
      &:hover {
        background-color: #f8fafc !important;
      }
    }

    :deep(.el-table__cell) {
      padding: 16px 0;
      border-bottom: 1px solid #f1f5f9;
    }
  }

  /* 登录信息样式 */
  .location-box {
    display: flex;
    flex-direction: column;
    gap: 4px;
    .ip-text {
      font-weight: 600;
      color: #334155;
      font-size: 14px;
    }
    .location-text {
      color: #94a3b8;
      font-size: 12px;
    }
  }

  /* 运行环境样式 */
  .env-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    .env-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #64748b;
      font-size: 12px;
      .el-icon {
        font-size: 14px;
        color: #cbd5e1;
      }
    }
  }

  .time-cell {
    color: #64748b;
    font-size: 13px;
  }

  /* 下线按钮 */
  .offline-btn {
    font-weight: 600;
    font-size: 13px;
    &:hover {
      text-decoration: underline;
    }
  }
}

/* 针对移动端的微调 */
@media (max-width: 768px) {
  .inner-device-wrapper {
    .device-alert {
      font-size: 12px;
    }
  }
}
</style>
