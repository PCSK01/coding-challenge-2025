/**
 * App 主应用组件
 * 需求: 所有需求
 * 
 * 功能：
 * - 集成 useTasks 和 useNotification Hooks
 * - 组合 TaskForm, FilterBar, TaskList 组件
 * - 实现筛选和排序逻辑
 * - 实现响应式布局（桌面/移动）
 * - 添加全局样式和主题
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Task, FilterOptions, DEFAULT_FILTER_OPTIONS, CreateTaskInput, UpdateTaskInput } from './types';
import { useTasks } from './hooks/useTasks';
import { useNotification } from './hooks/useNotification';
import { TaskForm } from './components/TaskForm';
import { FilterBar } from './components/FilterBar';
import { TaskList } from './components/TaskList';
import { filterTasks } from './utils/filterUtils';
import { sortTasks } from './utils/sortUtils';

/**
 * Toast 通知类型
 */
interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

/**
 * Toast 通知组件
 */
function Toast({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  }[toast.type];

  return (
    <div
      className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in`}
      role="alert"
    >
      <span>{toast.message}</span>
      <button
        onClick={onClose}
        className="ml-2 hover:opacity-80 focus:outline-none"
        aria-label="关闭通知"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * App 主组件
 */
function App() {
  // 任务管理 Hook
  const {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    clearError,
  } = useTasks();

  // 筛选条件状态
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(DEFAULT_FILTER_OPTIONS);

  // 编辑模式状态
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // 表单提交状态
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast 通知状态
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = useRef(0);

  /**
   * 显示 Toast 通知
   */
  const showToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = Date.now() + toastIdRef.current++;
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  /**
   * 应用内提醒回调（用于通知权限被拒绝时）
   */
  const handleInAppReminder = useCallback((reminderTasks: Task[]) => {
    // 应用内提醒 - 显示每个即将到期的任务
    reminderTasks.forEach(task => {
      showToast('warning', `任务 "${task.title}" 即将到期！`);
    });
  }, [showToast]);

  /**
   * 任务通知后的回调
   */
  const handleTasksNotified = useCallback((taskIds: string[]) => {
    // 更新已通知状态
    taskIds.forEach(id => {
      updateTask(id, { notificationSent: true });
    });
  }, [updateTask]);

  // 通知管理 Hook
  const {
    permissionStatus,
    isSupported: isNotificationSupported,
    requestPermission,
    updateTasks,
  } = useNotification({
    checkInterval: 60000, // 每分钟检查一次
    onInAppReminder: handleInAppReminder,
    onTasksNotified: handleTasksNotified,
  });

  /**
   * 关闭 Toast 通知
   */
  const closeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /**
   * 启动通知检查 - 当任务列表变化时更新
   */
  useEffect(() => {
    updateTasks(tasks);
  }, [tasks, updateTasks]);

  /**
   * 处理错误显示
   */
  useEffect(() => {
    if (error) {
      showToast('error', error);
      clearError();
    }
  }, [error, showToast, clearError]);

  /**
   * 筛选和排序后的任务列表
   * 使用 useMemo 缓存结果，优化性能
   * 需求: 6.3, 7.1, 7.2, 7.3, 7.4, 10.2
   */
  const filteredAndSortedTasks = useMemo(() => {
    // 先筛选
    const filtered = filterTasks(tasks, {
      category: filterOptions.category,
      status: filterOptions.status,
    });
    // 再排序
    return sortTasks(filtered, filterOptions.sortBy);
  }, [tasks, filterOptions]);

  /**
   * 处理添加任务
   * 需求: 1.1, 5.1
   */
  const handleAddTask = useCallback(async (taskData: CreateTaskInput) => {
    setIsSubmitting(true);
    try {
      const newTask = await addTask(taskData);
      if (newTask) {
        showToast('success', '任务添加成功！');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [addTask, showToast]);

  /**
   * 处理更新任务
   * 需求: 5.2
   */
  const handleUpdateTask = useCallback(async (taskData: CreateTaskInput) => {
    if (!editingTask) return;
    
    setIsSubmitting(true);
    try {
      const updates: UpdateTaskInput = {
        title: taskData.title,
        description: taskData.description,
        category: taskData.category,
        priority: taskData.priority,
        status: taskData.status,
        dueDate: taskData.dueDate,
        reminderOption: taskData.reminderOption,
        notificationSent: false, // 更新任务时重置通知状态
      };
      const success = await updateTask(editingTask.id, updates);
      if (success) {
        showToast('success', '任务更新成功！');
        setEditingTask(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [editingTask, updateTask, showToast]);

  /**
   * 处理删除任务
   * 需求: 2.1, 5.3
   */
  const handleDeleteTask = useCallback(async (taskId: string) => {
    const success = await deleteTask(taskId);
    if (success) {
      showToast('success', '任务已删除');
      // 如果正在编辑被删除的任务，取消编辑
      if (editingTask?.id === taskId) {
        setEditingTask(null);
      }
    }
  }, [deleteTask, showToast, editingTask]);

  /**
   * 处理切换任务状态
   * 需求: 3.1, 3.3
   */
  const handleToggleStatus = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const success = await toggleTaskStatus(taskId);
    if (success && task) {
      const newStatus = task.status === 'pending' ? '已完成' : '待完成';
      showToast('info', `任务已标记为${newStatus}`);
    }
  }, [toggleTaskStatus, tasks, showToast]);

  /**
   * 处理编辑任务
   */
  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    // 滚动到表单位置
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  /**
   * 取消编辑
   */
  const handleCancelEdit = useCallback(() => {
    setEditingTask(null);
  }, []);

  /**
   * 处理筛选条件变化
   * 需求: 6.3, 7.4
   */
  const handleFilterChange = useCallback((options: FilterOptions) => {
    setFilterOptions(options);
  }, []);

  /**
   * 请求通知权限
   * 需求: 8.2
   */
  const handleRequestNotificationPermission = useCallback(async () => {
    const status = await requestPermission();
    if (status === 'granted') {
      showToast('success', '通知权限已开启');
    } else if (status === 'denied') {
      showToast('warning', '通知权限被拒绝，将使用应用内提醒');
    }
  }, [requestPermission, showToast]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Toast 通知容器 */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onClose={() => closeToast(toast.id)} />
        ))}
      </div>

      {/* 主容器 - 响应式布局 */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* 头部区域 */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                TODO List
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                管理您的待办事项，提高工作效率
              </p>
            </div>

            {/* 通知权限按钮 - 需求 8.2 */}
            {isNotificationSupported && permissionStatus === 'default' && (
              <button
                onClick={handleRequestNotificationPermission}
                className="
                  inline-flex items-center gap-2 px-4 py-2 rounded-lg
                  bg-blue-600 text-white text-sm font-medium
                  hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                  transition-colors
                "
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                开启通知提醒
              </button>
            )}

            {/* 通知状态指示 */}
            {isNotificationSupported && permissionStatus === 'granted' && (
              <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                通知已开启
              </span>
            )}
          </div>
        </header>

        {/* 任务表单 - 需求 1.1, 1.2, 1.3, 1.4, 1.5, 1.6 */}
        <section className="mb-6" aria-label={editingTask ? '编辑任务' : '添加任务'}>
          <TaskForm
            onSubmit={editingTask ? handleUpdateTask : handleAddTask}
            initialTask={editingTask ?? undefined}
            isSubmitting={isSubmitting}
            onCancel={editingTask ? handleCancelEdit : undefined}
          />
        </section>

        {/* 筛选和排序栏 - 需求 6.3, 7.1, 7.2, 7.3 */}
        <section className="mb-6" aria-label="筛选和排序">
          <FilterBar
            filterOptions={filterOptions}
            onFilterChange={handleFilterChange}
          />
        </section>

        {/* 任务列表 - 需求 4.1, 4.2, 4.3, 4.4 */}
        <section aria-label="任务列表">
          <TaskList
            tasks={filteredAndSortedTasks}
            onToggleStatus={handleToggleStatus}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleEditTask}
            isLoading={loading}
          />
        </section>

        {/* 页脚 */}
        <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            TODO List 应用 · 使用 React + TypeScript + Tailwind CSS 构建
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
