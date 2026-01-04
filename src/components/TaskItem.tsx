/**
 * TaskItem 组件
 * 需求: 3.1, 3.2, 2.1, 4.2
 * 
 * 显示单个任务项，包含：
 * - 任务信息展示（标题、描述、分类、优先级、截止日期）
 * - 完成状态切换按钮
 * - 删除按钮
 * - 编辑按钮
 * - 已完成任务的视觉区分（删除线、灰色）
 * - 响应式样式
 */

import { useCallback, memo } from 'react';
import { Task, TaskCategory, TaskPriority, TaskStatus, ReminderOption } from '../types';

/**
 * TaskItem 组件属性
 */
export interface TaskItemProps {
  /** 任务数据 */
  task: Task;
  /** 切换完成状态回调 */
  onToggleStatus: (taskId: string) => void;
  /** 删除任务回调 */
  onDelete: (taskId: string) => void;
  /** 编辑任务回调 */
  onEdit: (task: Task) => void;
}

/**
 * 分类标签配置
 */
const CATEGORY_CONFIG: Record<TaskCategory, { label: string; bgColor: string; textColor: string }> = {
  [TaskCategory.WORK]: { 
    label: '工作', 
    bgColor: 'bg-blue-100 dark:bg-blue-900', 
    textColor: 'text-blue-800 dark:text-blue-200' 
  },
  [TaskCategory.STUDY]: { 
    label: '学习', 
    bgColor: 'bg-purple-100 dark:bg-purple-900', 
    textColor: 'text-purple-800 dark:text-purple-200' 
  },
  [TaskCategory.LIFE]: { 
    label: '生活', 
    bgColor: 'bg-green-100 dark:bg-green-900', 
    textColor: 'text-green-800 dark:text-green-200' 
  },
};

/**
 * 优先级配置
 */
const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; icon: string }> = {
  [TaskPriority.HIGH]: { 
    label: '高', 
    color: 'text-red-600 dark:text-red-400',
    icon: '🔴'
  },
  [TaskPriority.MEDIUM]: { 
    label: '中', 
    color: 'text-yellow-600 dark:text-yellow-400',
    icon: '🟡'
  },
  [TaskPriority.LOW]: { 
    label: '低', 
    color: 'text-green-600 dark:text-green-400',
    icon: '🟢'
  },
};

/**
 * 提醒选项标签
 */
const REMINDER_LABELS: Record<ReminderOption, string> = {
  [ReminderOption.NONE]: '',
  [ReminderOption.AT_TIME]: '到期时提醒',
  [ReminderOption.FIVE_MIN]: '5分钟前提醒',
  [ReminderOption.FIFTEEN_MIN]: '15分钟前提醒',
  [ReminderOption.THIRTY_MIN]: '30分钟前提醒',
  [ReminderOption.ONE_HOUR]: '1小时前提醒',
  [ReminderOption.TWO_HOURS]: '2小时前提醒',
  [ReminderOption.ONE_DAY]: '1天前提醒',
};

/**
 * 格式化日期时间显示
 */
function formatDateTime(date: Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 检查日期是否已过期
 */
function isOverdue(date: Date | null): boolean {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(date);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

/**
 * 检查日期是否即将到期（3天内）
 */
function isDueSoon(date: Date | null): boolean {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(date);
  dueDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 3;
}


/**
 * TaskItem 组件
 * 使用 memo 优化渲染性能
 */
export const TaskItem = memo(function TaskItem({ 
  task, 
  onToggleStatus, 
  onDelete, 
  onEdit 
}: TaskItemProps) {
  const isCompleted = task.status === TaskStatus.COMPLETED;
  const categoryConfig = CATEGORY_CONFIG[task.category];
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const overdue = !isCompleted && isOverdue(task.dueDate);
  const dueSoon = !isCompleted && !overdue && isDueSoon(task.dueDate);

  /**
   * 处理状态切换
   * 需求: 3.1 - 切换任务完成状态
   */
  const handleToggleStatus = useCallback(() => {
    onToggleStatus(task.id);
  }, [task.id, onToggleStatus]);

  /**
   * 处理删除
   * 需求: 2.1 - 删除任务
   */
  const handleDelete = useCallback(() => {
    onDelete(task.id);
  }, [task.id, onDelete]);

  /**
   * 处理编辑
   */
  const handleEdit = useCallback(() => {
    onEdit(task);
  }, [task, onEdit]);

  return (
    <div 
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-sm border transition-all duration-200
        hover:shadow-md
        ${isCompleted 
          ? 'border-gray-200 dark:border-gray-700 opacity-75' 
          : overdue 
            ? 'border-red-300 dark:border-red-700' 
            : dueSoon 
              ? 'border-yellow-300 dark:border-yellow-700'
              : 'border-gray-200 dark:border-gray-700'
        }
      `}
      role="article"
      aria-label={`任务: ${task.title}`}
    >
      <div className="p-4">
        {/* 顶部区域：复选框、标题、操作按钮 */}
        <div className="flex items-start gap-3">
          {/* 完成状态复选框 - 需求 3.1 */}
          <button
            type="button"
            onClick={handleToggleStatus}
            className={`
              flex-shrink-0 w-6 h-6 mt-0.5 rounded-full border-2 transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${isCompleted 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
              }
            `}
            aria-label={isCompleted ? '标记为未完成' : '标记为已完成'}
            aria-pressed={isCompleted}
          >
            {isCompleted && (
              <svg 
                className="w-full h-full p-0.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={3} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            )}
          </button>

          {/* 任务内容区域 */}
          <div className="flex-1 min-w-0">
            {/* 标题 - 需求 3.2, 4.2 */}
            <h3 
              className={`
                text-base font-medium break-words
                ${isCompleted 
                  ? 'text-gray-500 dark:text-gray-400 line-through' 
                  : 'text-gray-900 dark:text-white'
                }
              `}
            >
              {task.title}
            </h3>

            {/* 描述 - 需求 4.2 */}
            {task.description && (
              <p 
                className={`
                  mt-1 text-sm break-words
                  ${isCompleted 
                    ? 'text-gray-400 dark:text-gray-500 line-through' 
                    : 'text-gray-600 dark:text-gray-300'
                  }
                `}
              >
                {task.description}
              </p>
            )}

            {/* 标签区域：分类、优先级、截止日期 - 需求 4.2 */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* 分类标签 */}
              <span 
                className={`
                  inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                  ${categoryConfig.bgColor} ${categoryConfig.textColor}
                `}
              >
                {categoryConfig.label}
              </span>

              {/* 优先级标签 */}
              <span 
                className={`
                  inline-flex items-center text-xs font-medium
                  ${priorityConfig.color}
                `}
                title={`优先级: ${priorityConfig.label}`}
              >
                <span className="mr-1">{priorityConfig.icon}</span>
                {priorityConfig.label}优先级
              </span>

              {/* 截止日期时间 */}
              {task.dueDate && (
                <span 
                  className={`
                    inline-flex items-center text-xs
                    ${isCompleted 
                      ? 'text-gray-400 dark:text-gray-500' 
                      : overdue 
                        ? 'text-red-600 dark:text-red-400 font-medium' 
                        : dueSoon 
                          ? 'text-yellow-600 dark:text-yellow-400 font-medium'
                          : 'text-gray-500 dark:text-gray-400'
                    }
                  `}
                >
                  <svg 
                    className="w-3.5 h-3.5 mr-1" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                    />
                  </svg>
                  {formatDateTime(task.dueDate)}
                  {overdue && ' (已过期)'}
                  {dueSoon && ' (即将到期)'}
                </span>
              )}

              {/* 提醒设置 */}
              {task.dueDate && task.reminderOption && task.reminderOption !== ReminderOption.NONE && (
                <span 
                  className={`
                    inline-flex items-center text-xs
                    ${task.notificationSent 
                      ? 'text-gray-400 dark:text-gray-500' 
                      : 'text-blue-500 dark:text-blue-400'
                    }
                  `}
                  title={task.notificationSent ? '已提醒' : REMINDER_LABELS[task.reminderOption]}
                >
                  <svg 
                    className="w-3.5 h-3.5 mr-1" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                    />
                  </svg>
                  {task.notificationSent ? '已提醒' : REMINDER_LABELS[task.reminderOption]}
                </span>
              )}
            </div>
          </div>

          {/* 操作按钮组 */}
          <div className="flex-shrink-0 flex items-center gap-1">
            {/* 编辑按钮 */}
            <button
              type="button"
              onClick={handleEdit}
              className="
                p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50
                dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-700
                focus:outline-none focus:ring-2 focus:ring-blue-500
                transition-colors
              "
              aria-label="编辑任务"
              title="编辑"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                />
              </svg>
            </button>

            {/* 删除按钮 - 需求 2.1 */}
            <button
              type="button"
              onClick={handleDelete}
              className="
                p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50
                dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-gray-700
                focus:outline-none focus:ring-2 focus:ring-red-500
                transition-colors
              "
              aria-label="删除任务"
              title="删除"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TaskItem;
