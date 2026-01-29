<template>
  <div class="p-2 h-full">
    <el-row :gutter="20" class="h-full">
      <el-col :span="6" :xs="24" class="h-full">
        <el-card class="box-card h-full" shadow="hover">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-bold">个人信息</span>
            </div>
          </template>
          <div>
            <div class="text-center mb-6">
              <userAvatar />
              <div class="mt-2 text-lg font-medium">{{ state.user.nickName }}</div>
              <div class="text-sm text-gray-500">{{ state.roleGroup }}</div>
            </div>
            <div class="space-y-4">
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <div class="flex items-center text-gray-600">
                  <svg-icon icon-class="user" class="mr-2" />
                  <span>用户账号</span>
                </div>
                <div class="font-medium text-gray-900">{{ state.user.userAccount }}</div>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <div class="flex items-center text-gray-600">
                  <svg-icon icon-class="phone" class="mr-2" />
                  <span>手机号码</span>
                </div>
                <div class="font-medium text-gray-900">{{ state.user.phonenumber }}</div>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <div class="flex items-center text-gray-600">
                  <svg-icon icon-class="email" class="mr-2" />
                  <span>用户邮箱</span>
                </div>
                <div class="font-medium text-gray-900">{{ state.user.email }}</div>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <div class="flex items-center text-gray-600">
                  <svg-icon icon-class="peoples" class="mr-2" />
                  <span>所属角色</span>
                </div>
                <div class="font-medium text-gray-900">{{ state.roleGroup }}</div>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <div class="flex items-center text-gray-600">
                  <svg-icon icon-class="date" class="mr-2" />
                  <span>创建日期</span>
                </div>
                <div class="font-medium text-gray-900">{{ state.user.createTime }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="18" :xs="24" class="h-full">
        <el-card class="h-full" shadow="hover">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-bold">基本资料</span>
            </div>
          </template>
          <el-tabs v-model="activeTab" class="profile-tabs">
            <el-tab-pane label="基本资料" name="userinfo">
              <userInfo :user="userForm" />
            </el-tab-pane>
            <el-tab-pane label="修改密码" name="resetPwd">
              <resetPwd />
            </el-tab-pane>
            <el-tab-pane label="第三方应用" name="thirdParty">
              <thirdParty :auths="state.auths" />
            </el-tab-pane>
            <el-tab-pane label="在线设备" name="onlineDevice">
              <onlineDevice :devices="state.devices" />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup data-name="Profile" lang="ts">
import UserAvatar from './userAvatar.vue';
import UserInfo from './userInfo.vue';
import ResetPwd from './resetPwd.vue';
import ThirdParty from './thirdParty.vue';
import OnlineDevice from './onlineDevice.vue';
import { getAuthList } from '@/api/system/social/auth';
import { getUserProfile } from '@/api/system/user';
import { getOnline } from '@/api/monitor/online';
import { UserVO } from '@/api/system/user/types';

const activeTab = ref('userinfo');
interface State {
  user: Partial<UserVO>;
  roleGroup: string;
  auths: any;
  devices: any;
}

const state = ref<State>({
  user: {},
  roleGroup: '',
  auths: [],
  devices: []
});

const userForm = ref({});

const getUser = async () => {
  const res = await getUserProfile();
  state.value.user = res.data.user;
  userForm.value = { ...res.data.user };
  state.value.roleGroup = res.data.roleGroup;
};

const getAuths = async () => {
  const res = await getAuthList();
  state.value.auths = res.data;
};

const getOnlines = async () => {
  const res = await getOnline();
  state.value.devices = res.rows;
};

onMounted(() => {
  getUser();
  getAuths();
  getOnlines();
});
</script>
