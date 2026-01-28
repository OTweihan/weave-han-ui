<template>
  <el-dialog v-model="dialog.visible" :title="dialog.title" width="720px" append-to-body class="menu-form-dialog">
    <el-form ref="menuFormRef" :model="form" :rules="rules" label-width="100" class="menu-form">
      <div class="section-title">基础信息</div>
      <el-row :gutter="16">
        <el-col :span="24">
          <el-form-item label="上级菜单">
            <el-tree-select
              v-model="form.parentId"
              :data="menuOptions"
              :props="{ value: 'menuId', label: 'menuName', children: 'children' } as any"
              value-key="menuId"
              placeholder="选择上级菜单"
              check-strictly
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="菜单类型" prop="menuType">
            <el-radio-group v-model="form.menuType">
              <el-radio value="M">目录</el-radio>
              <el-radio value="C">菜单</el-radio>
              <el-radio value="F">按钮</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="菜单名称" prop="menuName">
            <el-input v-model="form.menuName" placeholder="请输入菜单名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="显示排序" prop="orderNum">
            <el-input-number v-model="form.orderNum" controls-position="right" :min="0" />
          </el-form-item>
        </el-col>
        <el-col v-if="form.menuType !== 'F'" :span="12">
          <el-form-item prop="isFrame">
            <template #label>
              <span class="label-with-icon">
                <el-tooltip content="选择是外链则路由地址需要以`http(s)://`开头" placement="top">
                  <el-icon class="label-icon">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
                <span>是否外链</span>
              </span>
            </template>
            <el-radio-group v-model="form.isFrame">
              <el-radio value="0">是</el-radio>
              <el-radio value="1">否</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col v-if="form.menuType !== 'F'" :span="12">
          <el-form-item prop="path">
            <template #label>
              <span class="label-with-icon">
                <el-tooltip content="访问的路由地址，如：`user`，如外网地址需内链访问则以`http(s)://`开头" placement="top">
                  <el-icon class="label-icon">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
                <span>路由地址</span>
              </span>
            </template>
            <el-input v-model="form.path" placeholder="请输入路由地址" />
          </el-form-item>
        </el-col>
        <el-col v-if="form.menuType === 'C'" :span="12">
          <el-form-item prop="component">
            <template #label>
              <span class="label-with-icon">
                <el-tooltip content="访问的组件路径，如：`system/user/index`，默认在`views`目录下" placement="top">
                  <el-icon class="label-icon">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
                <span>组件路径</span>
              </span>
            </template>
            <el-input v-model="form.component" placeholder="请输入组件路径" />
          </el-form-item>
        </el-col>
        <el-col v-if="form.menuType !== 'M'" :span="12">
          <el-form-item>
            <el-input v-model="form.perms" placeholder="请输入权限标识" maxlength="100" />
            <template #label>
              <span class="label-with-icon">
                <el-tooltip content="控制器中定义的权限字符，如：@SaCheckPermission('system:user:list')" placement="top">
                  <el-icon class="label-icon">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
                <span>权限字符</span>
              </span>
            </template>
          </el-form-item>
        </el-col>
        <el-col v-if="form.menuType === 'C'" :span="12">
          <el-form-item>
            <el-input v-model="form.queryParam" placeholder="请输入路由参数" maxlength="255" />
            <template #label>
              <span class="label-with-icon">
                <el-tooltip content='访问路由的默认传递参数，如：`{"id": 1, "name": "ry"}`' placement="top">
                  <el-icon class="label-icon">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
                <span>路由参数</span>
              </span>
            </template>
          </el-form-item>
        </el-col>
        <el-col v-if="form.menuType === 'C'" :span="12">
          <el-form-item>
            <template #label>
              <span class="label-with-icon">
                <el-tooltip content="选择是则会被`keep-alive`缓存，需要匹配组件的`name`和地址保持一致" placement="top">
                  <el-icon class="label-icon">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
                <span>是否缓存</span>
              </span>
            </template>
            <el-radio-group v-model="form.isCache">
              <el-radio value="0">缓存</el-radio>
              <el-radio value="1">不缓存</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col v-if="form.menuType !== 'F'" :span="12">
          <el-form-item>
            <template #label>
              <span class="label-with-icon">
                <el-tooltip content="选择隐藏则路由将不会出现在侧边栏，但仍然可以访问" placement="top">
                  <el-icon class="label-icon">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
                <span>显示状态</span>
              </span>
            </template>
            <el-radio-group v-model="form.visible">
              <el-radio v-for="dict in sys_show_hide" :key="dict.value" :value="dict.value">{{ dict.label }} </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item>
            <template #label>
              <span class="label-with-icon">
                <el-tooltip content="选择停用则路由将不会出现在侧边栏，也不能被访问" placement="top">
                  <el-icon class="label-icon">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
                <span>菜单状态</span>
              </span>
            </template>
            <el-radio-group v-model="form.status">
              <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
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
import { addMenu, getMenu, listMenu, updateMenu } from '@/api/system/menu';
import type { MenuForm, MenuVO } from '@/api/system/menu/types';
import { MenuTypeEnum } from '@/enums/MenuTypeEnum';
import { QuestionFilled } from '@element-plus/icons-vue';

defineProps<{
  sys_show_hide: any[];
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

const initFormData: MenuForm = {
  path: '',
  menuId: undefined,
  parentId: 0,
  menuName: '',
  menuType: MenuTypeEnum.M,
  orderNum: 1,
  isFrame: '1',
  isCache: '0',
  visible: '0',
  status: '0'
};

const form = ref<MenuForm>({ ...initFormData });

const rules = ref<ElFormRules>({
  menuName: [{ required: true, message: '菜单名称不能为空', trigger: 'blur' }],
  orderNum: [{ required: true, message: '菜单顺序不能为空', trigger: 'blur' }],
  path: [{ required: true, message: '路由地址不能为空', trigger: 'blur' }]
});

const menuOptions = ref<any[]>([]);
const menuFormRef = ref<ElFormInstance>();

const reset = () => {
  form.value = { ...initFormData };
  menuFormRef.value?.resetFields();
};

const getTreeselect = async () => {
  menuOptions.value = [];
  const response = await listMenu();
  const menu: any = { menuId: 0, menuName: '主类目', children: [] };
  menu.children = proxy?.handleTree<any>(response.data, 'menuId');
  menuOptions.value.push(menu);
};

const openAdd = async (row?: MenuVO) => {
  reset();
  await getTreeselect();
  form.value.parentId = row && row.menuId ? row.menuId : 0;
  dialog.visible = true;
  dialog.title = '添加菜单';
};

const openEdit = async (menuId: string | number) => {
  reset();
  await getTreeselect();
  if (menuId) {
    const { data } = await getMenu(menuId);
    form.value = data;
  }
  dialog.visible = true;
  dialog.title = '修改菜单';
};

const submitForm = () => {
  menuFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    if (form.value.menuId) {
      await updateMenu(form.value);
    } else {
      await addMenu(form.value);
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
.menu-form-dialog {
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

.menu-form {
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

.dialog-footer {
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-light);
}
</style>
