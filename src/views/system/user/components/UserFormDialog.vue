<template>
  <el-dialog
    v-model="dialog.visible"
    :title="dialog.title"
    width="640px"
    append-to-body
    class="user-form-dialog"
    @close="closeDialog"
  >
    <el-form ref="userFormRef" :model="form" :rules="rules" label-width="80px" class="user-form">
      <el-row>
        <el-col :span="12">
          <el-form-item label="用户昵称" prop="nickName">
            <el-input v-model="form.nickName" placeholder="请输入用户昵称" maxlength="30" />
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="form.userId == null || form.userId != useUserStore().userId"> </el-col>
      </el-row>

      <el-row>
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

      <el-row>
        <el-col :span="12">
          <el-form-item v-if="form.userId == undefined" label="用户名称" prop="userName">
            <el-input v-model="form.userName" placeholder="请输入用户名称" maxlength="30" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item v-if="form.userId == undefined" label="用户密码" prop="password">
            <el-input v-model="form.password" placeholder="请输入用户密码" type="password" maxlength="20" show-password />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
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
              <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12" v-if="form.userId == null || form.userId != useUserStore().userId">
          <el-form-item label="角色" prop="roleIds">
            <el-select v-model="form.roleIds" filterable multiple placeholder="请选择">
              <el-option v-for="item in roleOptions" :key="item.roleId" :label="item.roleName" :value="item.roleId" :disabled="item.status == '1'" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
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
import api from '@/api/system/user';
import type { UserForm } from '@/api/system/user/types';
import type { RoleVO } from '@/api/system/role/types';
import { useUserStore } from '@/store/modules/user';

const props = defineProps<{
  sys_normal_disable: any[];
  sys_user_sex: any[];
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const dialog = reactive({
  visible: false,
  title: ''
});

const initFormData: UserForm = {
  userId: undefined,
  userName: '',
  nickName: undefined,
  password: '',
  phonenumber: undefined,
  email: undefined,
  sex: undefined,
  status: '0',
  remark: '',
  roleIds: []
};

const form = ref<UserForm>({ ...initFormData });

const rules = ref<ElFormRules>({
  userName: [
    { required: true, message: '用户名称不能为空', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名称长度必须介于 2 和 20 之间', trigger: 'blur' }
  ],
  nickName: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
  password: [
    { required: true, message: '用户密码不能为空', trigger: 'blur' },
    { min: 5, max: 20, message: '用户密码长度必须介于 5 和 20 之间', trigger: 'blur' },
    { pattern: /^[^<>"'|\\]+$/, message: '不能包含非法字符：< > " \' \\ |', trigger: 'blur' }
  ],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }],
  phonenumber: [{ pattern: /^1[3456789][0-9]\d{8}$/, message: '请输入正确的手机号码', trigger: 'blur' }],
  roleIds: [{ required: true, message: '用户角色不能为空', trigger: 'blur' }]
});

const roleOptions = ref<RoleVO[]>([]);
const userFormRef = ref<ElFormInstance>();
const initPassword = ref<string>('');

const reset = () => {
  form.value = { ...initFormData };
  userFormRef.value?.resetFields();
};

const cancel = () => {
  dialog.visible = false;
  reset();
};

const openAdd = async () => {
  reset();
  const { data } = await api.getUser();
  dialog.visible = true;
  dialog.title = '新增用户';
  roleOptions.value = data.roles;
  form.value.password = initPassword.value;
};

const openEdit = async (userId: number) => {
  reset();
  const { data } = await api.getUser(userId);
  dialog.visible = true;
  dialog.title = '修改用户';
  Object.assign(form.value, data.user);
  roleOptions.value = Array.from(new Map([...data.roles, ...data.user.roles].map((r) => [r.roleId, r])).values());
  form.value.roleIds = data.roleIds;
  form.value.password = '';
};

const submitForm = () => {
  userFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    if (form.value.userId) {
      if (form.value.userId === useUserStore().userId) {
        form.value.roleIds = null;
      }
      await api.updateUser(form.value);
    } else {
      await api.addUser(form.value);
    }
    proxy?.$modal.msgSuccess('操作成功');
    dialog.visible = false;
    emit('success');
  });
};

const closeDialog = () => {
  dialog.visible = false;
  resetForm();
};

const resetForm = () => {
  userFormRef.value?.resetFields();
  userFormRef.value?.clearValidate();
  form.value.userId = undefined;
  form.value.status = '0';
};

onMounted(() => {
  proxy?.getConfigKey('sys.user.initPassword').then((res) => {
    initPassword.value = res.data;
  });
});

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
  background-color: #ffffff;
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
