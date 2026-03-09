import { ElMessage, ElMessageBox, ElNotification, ElLoading } from 'element-plus';
import type { MessageBoxData } from 'element-plus';
import type { LoadingInstance } from 'element-plus/es/components/loading/src/loading';

// 全局 loading 实例，初始化为 null
let loadingInstance: LoadingInstance | null = null;

// 从 Element Plus 的 ElMessageBox.confirm 提取相关参数类型，保证和官方类型同步
type ConfirmContent = Parameters<typeof ElMessageBox.confirm>[0];
type ConfirmTitle = Parameters<typeof ElMessageBox.confirm>[1];
type ConfirmOptions = Parameters<typeof ElMessageBox.confirm>[2];

/**
 * 确认窗体重载方法定义
 * @param content 确认框提示内容
 * @param title 确认框标题
 * @param options 确认框额外配置
 */
function confirm(content: ConfirmContent, title?: ConfirmTitle, options?: ConfirmOptions): Promise<MessageBoxData>;
function confirm(content: ConfirmContent, options?: ConfirmOptions): Promise<MessageBoxData>;
function confirm(content: ConfirmContent, titleOrOptions?: ConfirmTitle | ConfirmOptions, options?: ConfirmOptions): Promise<MessageBoxData> {
  // 解析标题：如果第二个参数是字符串，则为标题，否则使用默认标题
  const title = typeof titleOrOptions === 'string' ? titleOrOptions : '系统提示';
  // 解析配置：如果第二个参数是字符串，则配置在第三个参数，否则配置在第二个参数
  const resolvedOptions = (typeof titleOrOptions === 'string' ? options : titleOrOptions) ?? {};

  return ElMessageBox.confirm(content, title, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning', // 默认为警告类型
    ...resolvedOptions
  });
}

/**
 * 全局 UI 交互提示工具类
 */
export default {
  /**
   * 普通消息提示
   * @param content 提示文字
   */
  msg(content: string) {
    ElMessage.info(content);
  },

  /**
   * 错误消息提示
   * @param content 提示文字
   */
  msgError(content: string) {
    ElMessage.error(content);
  },

  /**
   * 成功消息提示
   * @param content 提示文字
   */
  msgSuccess(content: string) {
    ElMessage.success(content);
  },

  /**
   * 警告消息提示
   * @param content 提示文字
   */
  msgWarning(content: string) {
    ElMessage.warning(content);
  },

  /**
   * 弹出提示框 (默认 info 类型)
   * @param content 提示内容
   */
  alert(content: string) {
    ElMessageBox.alert(content, '系统提示');
  },

  /**
   * 错误提示框
   * @param content 错误内容
   */
  alertError(content: string) {
    ElMessageBox.alert(content, '系统提示', { type: 'error' });
  },

  /**
   * 成功提示框
   * @param content 成功内容
   */
  alertSuccess(content: string) {
    ElMessageBox.alert(content, '系统提示', { type: 'success' });
  },

  /**
   * 警告提示框
   * @param content 警告内容
   */
  alertWarning(content: string) {
    ElMessageBox.alert(content, '系统提示', { type: 'warning' });
  },

  /**
   * 右上角通知提示 (默认 info 类型)
   * @param content 通知内容
   */
  notify(content: string) {
    ElNotification.info(content);
  },

  /**
   * 右上角错误通知
   * @param content 错误内容
   */
  notifyError(content: string) {
    ElNotification.error(content);
  },

  /**
   * 右上角成功通知
   * @param content 成功内容
   */
  notifySuccess(content: string) {
    ElNotification.success(content);
  },

  /**
   * 右上角警告通知
   * @param content 警告内容
   */
  notifyWarning(content: string) {
    ElNotification.warning(content);
  },

  /** * 二次确认弹窗
   * 调用方式支持：
   * 1. confirm('确认删除吗？')
   * 2. confirm('确认删除吗？', '提示标题')
   * 3. confirm('确认删除吗？', { type: 'error' })
   * 4. confirm('确认删除吗？', '提示标题', { type: 'error' })
   */
  confirm,

  /**
   * 提交内容弹窗 (带输入框)
   * @param content 输入框上方的提示文字
   * @returns 返回包含用户输入内容的 Promise
   */
  prompt(content: string) {
    return ElMessageBox.prompt(content, '系统提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
  },

  /**
   * 打开全局遮罩层 (Loading)
   * @param content 遮罩层下方显示的加载文字
   */
  loading(content: string) {
    loadingInstance = ElLoading.service({
      lock: true, // 锁定屏幕滚动
      text: content,
      background: 'rgba(0, 0, 0, 0.7)' // 半透明黑色背景
    });
  },

  /**
   * 关闭全局遮罩层 (Loading)
   */
  closeLoading() {
    // 增加判空处理，避免未调用 loading() 直接调用 closeLoading() 时报错
    if (loadingInstance) {
      loadingInstance.close();
      loadingInstance = null; // 重置引用释放内存
    }
  }
};
