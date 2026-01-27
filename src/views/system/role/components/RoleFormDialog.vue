<template>
  <el-dialog v-model="dialog.visible" :title="dialog.title" width="720px" append-to-body class="role-form-dialog">
    <el-form ref="roleFormRef" :model="form" :rules="rules" label-width="100" class="role-form">
      <div class="section-title">基础信息</div>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="角色名称" prop="roleName">
            <el-input v-model="form.roleName" placeholder="请输入角色名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="roleKey">
            <template #label>
              <span class="label-with-icon">
                <el-tooltip content="控制器中定义的权限字符，如：@SaCheckRole('admin')" placement="top">
                  <el-icon class="label-icon">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
                <span>权限字符</span>
              </span>
            </template>
            <el-input v-model="form.roleKey" placeholder="请输入权限字符" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="角色顺序" prop="roleSort">
            <el-input-number v-model="form.roleSort" controls-position="right" :min="0" />
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

      <div class="section-divider"></div>
      <div class="section-title">菜单权限</div>
        <el-form-item class="menu-permission-item">
          <div class="menu-toolbar">
            <el-checkbox v-model="menuExpand" @change="handleCheckedTreeExpand($event, 'menu')">展开/折叠</el-checkbox>
            <el-checkbox v-model="menuNodeAll" @change="handleCheckedTreeNodeAll($event, 'menu')">全选/全不选</el-checkbox>
            <el-checkbox v-model="form.menuCheckStrictly" @change="handleCheckedTreeConnect($event, 'menu')">父子联动</el-checkbox>
          </div>
          <el-tree
            ref="menuRef"
            class="tree-border"
            :data="menuOptions"
            show-checkbox
            node-key="id"
            :check-strictly="!form.menuCheckStrictly"
            empty-text="加载中，请稍候"
            :props="{ label: 'label', children: 'children' } as any"
          />
        </el-form-item>

      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" placeholder="请输入备注信息" />
      </el-form-item>
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
import { addRole, getRole, updateRole } from '@/api/system/role';
import { roleMenuTreeselect, treeselect as menuTreeselect } from '@/api/system/menu';
import type { RoleForm } from '@/api/system/role/types';
import type { MenuTreeOption, RoleMenuTree } from '@/api/system/menu/types';
import { QuestionFilled } from '@element-plus/icons-vue';

defineProps<{
  sys_normal_disable: any[];
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const dialog = reactive({
  visible: false,
  title: ''
});

const initForm: RoleForm = {
  roleId: undefined,
  roleSort: 1,
  status: '0',
  roleName: '',
  roleKey: '',
  menuCheckStrictly: true,
  remark: '',
  dataScope: '1',
  menuIds: []
};

const form = ref<RoleForm>({ ...initForm });

const rules = ref<ElFormRules>({
  roleName: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
  roleKey: [{ required: true, message: '权限字符不能为空', trigger: 'blur' }],
  roleSort: [{ required: true, message: '角色顺序不能为空', trigger: 'blur' }]
});

const menuOptions = ref<MenuTreeOption[]>([]);
const menuExpand = ref(false);
const menuNodeAll = ref(false);
const roleFormRef = ref<ElFormInstance>();
const menuRef = ref<ElTreeInstance>();

const reset = () => {
  form.value = { ...initForm };
  roleFormRef.value?.resetFields();
  menuRef.value?.setCheckedKeys([]);
  menuExpand.value = false;
  menuNodeAll.value = false;
};

const getMenuTreeselect = async () => {
  const res = await menuTreeselect();
  menuOptions.value = res.data;
};

const getRoleMenuTreeselect = async (roleId: string | number) => {
  const res = await roleMenuTreeselect(roleId);
  menuOptions.value = res.data.menus;
  return res.data as RoleMenuTree;
};

const openAdd = async () => {
  reset();
  await getMenuTreeselect();
  dialog.visible = true;
  dialog.title = '添加角色';
};

const openEdit = async (roleId: string | number) => {
  reset();
  const { data } = await getRole(roleId);
  Object.assign(form.value, data);
  form.value.roleSort = Number(form.value.roleSort);
  const res = await getRoleMenuTreeselect(roleId);
  dialog.title = '修改角色';
  dialog.visible = true;
  res.checkedKeys.forEach((v) => {
    nextTick(() => {
      menuRef.value?.setChecked(v, true, false);
    });
  });
};

const handleCheckedTreeExpand = (value: boolean | string | number, type: string) => {
  if (type == 'menu') {
    const isExpand = value === true;
    const treeList = menuOptions.value;
    for (let i = 0; i < treeList.length; i++) {
      if (menuRef.value) {
        menuRef.value.store.nodesMap[treeList[i].id].expanded = isExpand;
      }
    }
  }
};

const handleCheckedTreeNodeAll = (value: any, type: string) => {
  if (type == 'menu') {
    menuRef.value?.setCheckedNodes(value ? (menuOptions.value as any) : []);
  }
};

const handleCheckedTreeConnect = (value: any, type: string) => {
  if (type == 'menu') {
    form.value.menuCheckStrictly = value;
  }
};

const getMenuAllCheckedKeys = (): any => {
  const checkedKeys = menuRef.value?.getCheckedKeys();
  const halfCheckedKeys = menuRef.value?.getHalfCheckedKeys();
  if (halfCheckedKeys) {
    checkedKeys?.unshift(...halfCheckedKeys);
  }
  return checkedKeys;
};

const submitForm = () => {
  roleFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    form.value.menuIds = getMenuAllCheckedKeys();
    if (form.value.roleId) {
      await updateRole(form.value);
    } else {
      await addRole(form.value);
    }
    proxy?.$modal.msgSuccess('操作成功');
    dialog.visible = false;
    emit('success');
  });
};

const cancel = () => {
  dialog.visible = false;
  reset();
};

defineExpose({
  openAdd,
  openEdit
});
</script>

<style scoped lang="scss">
.role-form-dialog {
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
    padding: 16px 20px 10px;
    background-color: #f5f7fb;
  }
}

.role-form {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 18px 18px 10px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);

  :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper),
  :deep(.el-textarea__inner) {
    border-radius: 4px;
  }

  :deep(.el-textarea__inner) {
    min-height: 70px;
  }
}

.label-with-icon {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.label-icon {
  font-size: 14px;
  color: var(--el-color-primary);
}

.section-title {
  margin: 2px 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.section-divider {
  height: 1px;
  margin: 10px 0 12px;
  background: linear-gradient(to right, transparent, rgba(148, 163, 184, 0.8), transparent);
}

.menu-permission-item {
  flex-direction: column;
  align-items: stretch;
}

.menu-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-bottom: 8px;
}

.menu-section {
  margin-top: 2px;
  padding: 10px 12px 8px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  background: radial-gradient(circle at top left, #f9fafb, #f3f4f6);
}

.tree-border {
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  padding: 8px 10px;
  max-height: 320px;
  overflow: auto;
  background-color: #f9fafb;
}

.dialog-footer {
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-light);
}
</style>
