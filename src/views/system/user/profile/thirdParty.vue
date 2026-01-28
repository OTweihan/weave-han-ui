<template>
  <div class="p-4 h-full flex flex-col">
    <div class="flex-1">
      <el-table :data="auths" border style="width: 100%" :header-cell-style="{ background: '#f8f9fa', color: '#606266' }">
        <el-table-column label="序号" width="60" type="index" align="center" />
        <el-table-column label="绑定账号平台" min-width="140" align="center" prop="source" show-overflow-tooltip>
          <template #default="scope">
            <el-tag :type="scope.row.source === 'wechat' ? 'success' : 'primary'" effect="light" round>
              {{ scope.row.source }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="头像" min-width="120" align="center" prop="avatar">
          <template #default="scope">
            <el-avatar :size="40" :src="scope.row.avatar" class="border border-gray-200" />
          </template>
        </el-table-column>
        <el-table-column label="系统账号" min-width="180" align="center" prop="userName" :show-overflow-tooltip="true" />
        <el-table-column label="绑定时间" width="240" align="center" prop="createTime" />
        <el-table-column label="操作" width="100" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button size="small" type="danger" link icon="Unlink" @click="unlockAuth(scope.row)">解绑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="border-t border-gray-100">
      <h4 class="text-base font-medium text-gray-700 mb-4 flex items-center">
        <span>支持绑定以下第三方帐号</span>
      </h4>

      <div class="flex flex-wrap gap-6">
        <!-- 微信绑定按钮 -->
        <div
          class="group relative flex flex-col items-center justify-center p-6 w-36 bg-white border border-gray-200 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-green-500 hover:-translate-y-1"
          @click="authUrl('wechat')"
          title="使用微信账号授权登录"
        >
          <div
            class="w-12 h-12 flex items-center justify-center rounded-full bg-green-50 text-green-600 mb-3 group-hover:bg-green-500 group-hover:text-white transition-colors duration-300"
          >
            <svg-icon icon-class="wechat" class="text-2xl" />
          </div>
          <span class="text-sm font-medium text-gray-600 group-hover:text-green-600 transition-colors">微信</span>

          <!-- 装饰性背景圆 -->
          <div
            class="absolute -right-4 -top-4 w-16 h-16 bg-green-50 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl"
          ></div>
        </div>

        <!-- QQ绑定按钮 -->
        <div
          class="group relative flex flex-col items-center justify-center p-6 w-36 bg-white border border-gray-200 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-blue-500 hover:-translate-y-1"
          @click="authUrl('qq')"
          title="使用QQ账号授权登录"
        >
          <div
            class="w-12 h-12 flex items-center justify-center rounded-full bg-blue-50 text-blue-500 mb-3 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300"
          >
            <svg-icon icon-class="qq" class="text-2xl" />
          </div>
          <span class="text-sm font-medium text-gray-600 group-hover:text-blue-500 transition-colors">QQ</span>

          <!-- 装饰性背景圆 -->
          <div
            class="absolute -right-4 -top-4 w-16 h-16 bg-blue-50 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { authUnlock, authBinding } from '@/api/system/social/auth';
import { propTypes } from '@/utils/propTypes';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const props = defineProps({
  auths: propTypes.any.isRequired
});
const auths = computed(() => props.auths);

const unlockAuth = (row: any) => {
  ElMessageBox.confirm('您确定要解除"' + row.source + '"的账号绑定吗？')
    .then(() => {
      return authUnlock(row.id);
    })
    .then((res: any) => {
      if (res.code === 200) {
        proxy?.$modal.msgSuccess('解绑成功');
        proxy?.$tab.refreshPage();
      } else {
        proxy?.$modal.msgError(res.msg);
      }
    })
    .catch(() => {});
};

const authUrl = (source: string) => {
  authBinding(source).then((res: any) => {
    if (res.code === 200) {
      window.location.href = res.data;
    } else {
      proxy?.$modal.msgError(res.msg);
    }
  });
};
</script>
