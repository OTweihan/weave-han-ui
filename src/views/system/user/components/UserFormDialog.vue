<template>
  <el-dialog v-model="dialog.visible" :title="dialog.title" width="640px" append-to-body class="user-form-dialog" @close="closeDialog">
    <el-form ref="userFormRef" :model="form" :rules="rules" label-width="80px" class="user-form">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="用户昵称" prop="nickName">
            <el-input v-model="form.nickName" placeholder="请输入用户昵称" maxlength="30" />
          </el-form-item>
        </el-col>

        <!-- 自己不能修改自己的角色，因此留空一列保持对齐 -->
        <el-col :span="12" v-if="form.userId == null || form.userId !== userStore.userId">
          <!-- 留空，用于视觉对齐 -->
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="手机号码" prop="phonenumber">
            <el-input v-model="form.phonenumber" placeholder="请输入手机号码" maxlength="11" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 新增用户时才显示账号和密码 -->
      <el-row :gutter="16" v-if="!form.userId">
        <el-col :span="12">
          <el-form-item label="用户账号" prop="userAccount">
            <el-input
              v-model="form.userAccount"
              placeholder="仅限字母数字，最多20位"
              maxlength="20"
              @input="form.userAccount = $event.replace(/[^a-zA-Z0-9]/g, '')"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="用户密码" prop="password">
            <el-input v-model="form.password" placeholder="请输入用户密码" type="password" maxlength="20" show-password />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="用户性别">
            <el-select v-model="form.sex" placeholder="请选择">
              <el-option v-for="dict in sys_user_sex" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态">
            <el-radio-group v-model="form.status">
              <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 禁止给自己修改角色 -->
      <el-row :gutter="16" v-if="form.userId == null || form.userId !== userStore.userId">
        <el-col :span="12">
          <el-form-item label="角色" prop="roleIds">
            <el-select v-model="form.roleIds" filterable multiple placeholder="请选择角色">
              <el-option v-for="item in roleOptions" :key="item.roleId" :label="item.roleName" :value="item.roleId" :disabled="item.status === '1'" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="24">
          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注内容（选填）" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, getCurrentInstance } from 'vue';
import type { ComponentInternalInstance } from 'vue';
import type { FormRules } from 'element-plus';
import api from '@/api/system/user';
import type { UserForm } from '@/api/system/user/types';
import type { RoleVO } from '@/api/system/role/types';
import { useUserStore } from '@/store/modules/user';

// Props & Emits
defineProps<{
  sys_normal_disable: any[];
  sys_user_sex: any[];
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

// 全局依赖
const userStore = useUserStore();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

// 对话框状态
const dialog = reactive({
  visible: false,
  title: ''
});

// 表单数据与校验
const initFormData: UserForm = {
  userId: undefined,
  userAccount: '',
  nickName: '',
  password: '',
  phonenumber: '',
  email: '',
  sex: undefined,
  status: '0',
  remark: '',
  roleIds: []
};

const form = ref<UserForm>({ ...initFormData });

const rules = ref<FormRules>({
  userAccount: [
    { required: true, message: '用户账号不能为空', trigger: 'blur' },
    { min: 2, max: 20, message: '长度必须在2-20个字符之间', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9]+$/, message: '仅允许字母和数字', trigger: 'blur' }
  ],
  nickName: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
  password: [
    { required: true, message: '密码不能为空', trigger: 'blur' },
    { min: 5, max: 20, message: '密码长度需为5-20位', trigger: 'blur' },
    { pattern: /^[^<>"'|\\]+$/, message: '密码不能包含非法字符 < > " \' \\ |', trigger: 'blur' }
  ],
  email: [{ type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }],
  phonenumber: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号码', trigger: 'blur' }],
  roleIds: [{ required: true, message: '请至少选择一个角色', trigger: 'blur' }]
});

// 角色下拉选项
const roleOptions = ref<RoleVO[]>([]);

// 表单引用 & 初始密码
const userFormRef = ref();
const initPassword = ref<string>('');

// 工具函数
const resetForm = () => {
  form.value = { ...initFormData };
  userFormRef.value?.resetFields();
  userFormRef.value?.clearValidate();
};

const cancel = () => {
  dialog.visible = false;
  resetForm();
};

const closeDialog = () => {
  resetForm();
};

// 打开新增/编辑
const openAdd = async () => {
  resetForm();
  dialog.title = '新增用户';
  dialog.visible = true;

  const { data } = await api.getUser(); // 获取角色列表
  roleOptions.value = data.roles;
  form.value.password = initPassword.value;
};

const openEdit = async (userId: number) => {
  resetForm();
  dialog.title = '修改用户';
  dialog.visible = true;

  const { data } = await api.getUser(userId);
  Object.assign(form.value, data.user);
  // 合并去重角色列表
  const roleMap = new Map([...data.roles, ...data.user.roles].map((r) => [r.roleId, r]));
  roleOptions.value = Array.from(roleMap.values());

  form.value.roleIds = data.roleIds;
  form.value.password = ''; // 编辑时不回显密码
};

// 提交表单
const submitForm = async () => {
  await userFormRef.value?.validate();

  // 防止给自己修改角色
  if (form.value.userId && form.value.userId === userStore.userId) {
    form.value.roleIds = null;
  }

  if (form.value.userId) {
    await api.updateUser(form.value);
  } else {
    await api.addUser(form.value);
  }

  proxy?.$modal.msgSuccess('操作成功');
  dialog.visible = false;
  emit('success');
};

// 生命周期
onMounted(async () => {
  const res = await proxy?.getConfigKey('sys.user.initPassword');
  initPassword.value = res?.data ?? '123456';
});

// 对外暴露方法
defineExpose({
  openAdd,
  openEdit
});
</script>

<style scoped lang="scss">
.user-form-dialog {
  :deep(.el-dialog__header) {
    padding: 14px 20px 10px;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  :deep(.el-dialog__title) {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  :deep(.el-dialog__body) {
    padding: 16px 20px 8px;
    background-color: #f5f7fb;
  }
}

.user-form {
  background: #ffffff;
  border-radius: 6px;
  padding: 16px 18px 4px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);

  :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    border-radius: 4px;
  }

  :deep(.el-textarea__inner) {
    border-radius: 4px;
    min-height: 70px;
  }
}

.dialog-footer {
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-light);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
