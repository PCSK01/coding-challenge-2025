/**
 * TaskList 组件
 * 需求: 4.1, 4.3, 4.4
 * 
 * 功能：
 * - 接收任务列表并渲染 TaskItem
 * - 实现空状态提示
 * - 实现虚拟滚动（任务数量 > 100 时）
 * - 添加响应式样式
 */

import { useRef, useMemo, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Task } from '../types';
import { TaskItem } from './TaskItem';

/**
 * 虚拟滚动阈值：超过此数量时启用虚拟滚动
 */
const VIRTUAL_SCROLL_THRESHOLD = 100;

/**
 * 预估的任务项高度（像素）
 */
const ESTIMATED_ITEM_HEIGHT = 120;

/**
 * TaskList 组件属性
 */
export interface TaskListProps {
  /** 任务列表 */
  tasks: Task[];
  /** 切换完成状态回调 */
  onToggleStatus: (taskId: string) => void;
  /** 删除任务回调 */
  onDeleteTask: (taskId: string) => void;
  /** 编辑任务回调 */
  onEditTask: (task: Task) => void;
  /** 是否正在加载 */
  isLoading?: boolean;
}

/**
 * 空状态组件
 * 需求: 4.3 - 任务列表为空时显示友好的空状态提示
 */
function EmptyState() {
  return (
    <div 
      className="flex flex-col items-center justify-center py-16 px-4"
      role="status"
      aria-label="暂无任务"
    >
      {/* 空状态图标 */}
      <div className="w-24 h-24 mb-6 text-gray-300 dark:text-gray-600">
        <svg 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          className="w-full h-full"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" 
          />
        </svg>
      </div>
      
      {/* 空状态文字 */}
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        暂无待办事项
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
        点击上方的"添加任务"按钮，开始创建您的第一个待办事项吧！
      </p>
    </div>
  );
}

/**
 * 加载状态组件
 */
function LoadingState() {
  return (
    <div 
      className="flex flex-col items-center justify-center py-16 px-4"
      role="status"
      aria-label="加载中"
    >
      {/* 加载动画 */}
      <div className="w-12 h-12 mb-4">
        <svg 
          className="animate-spin text-blue-500" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        正在加载任务列表...
      </p>
    </div>
  );
}

/**
 * 虚拟滚动列表组件
 * 用于任务数量超过阈值时的高性能渲染
 */
const VirtualTaskList = memo(function VirtualTaskList({
  tasks,
  onToggleStatus,
  onDeleteTask,
  onEditTask,
}: Omit<TaskListProps, 'isLoading'>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ITEM_HEIGHT,
    overscan: 5, // 预渲染额外的项目以提高滚动流畅度
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto"
      role="list"
      aria-label="任务列表"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const task = tasks[virtualItem.index];
          return (
            <div
              key={task.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
            >
              <div className="pb-3">
                <TaskItem
                  task={task}
                  onToggleStatus={onToggleStatus}
                  onDelete={onDeleteTask}
                  onEdit={onEditTask}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

/**
 * 普通列表组件
 * 用于任务数量较少时的简单渲染
 */
const NormalTaskList = memo(function NormalTaskList({
  tasks,
  onToggleStatus,
  onDeleteTask,
  onEditTask,
}: Omit<TaskListProps, 'isLoading'>) {
  return (
    <div 
      className="space-y-3"
      role="list"
      aria-label="任务列表"
    >
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleStatus={onToggleStatus}
          onDelete={onDeleteTask}
          onEdit={onEditTask}
        />
      ))}
    </div>
  );
});

/**
 * TaskList 组件
 * 根据任务数量自动选择普通渲染或虚拟滚动渲染
 */
export const TaskList = memo(function TaskList({
  tasks,
  onToggleStatus,
  onDeleteTask,
  onEditTask,
  isLoading = false,
}: TaskListProps) {
  // 判断是否需要使用虚拟滚动
  const useVirtualScroll = useMemo(
    () => tasks.length > VIRTUAL_SCROLL_THRESHOLD,
    [tasks.length]
  );

  // 加载状态
  if (isLoading) {
    return <LoadingState />;
  }

  // 空状态 - 需求 4.3
  if (tasks.length === 0) {
    return <EmptyState />;
  }

  // 任务统计信息
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const pendingCount = tasks.length - completedCount;

  return (
    <div className="w-full">
      {/* 任务统计 - 需求 4.4 */}
      <div className="mb-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>
          共 <span className="font-medium text-gray-900 dark:text-white">{tasks.length}</span> 个任务
        </span>
        <span>
          待完成 <span className="font-medium text-blue-600 dark:text-blue-400">{pendingCount}</span> · 
          已完成 <span className="font-medium text-green-600 dark:text-green-400">{completedCount}</span>
        </span>
      </div>

      {/* 虚拟滚动提示 */}
      {useVirtualScroll && (
        <div className="mb-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm text-blue-700 dark:text-blue-300">
          任务数量较多，已启用虚拟滚动以优化性能
        </div>
      )}

      {/* 任务列表 - 需求 4.1, 4.4 */}
      {useVirtualScroll ? (
        <VirtualTaskList
          tasks={tasks}
          onToggleStatus={onToggleStatus}
          onDeleteTask={onDeleteTask}
          onEditTask={onEditTask}
        />
      ) : (
        <NormalTaskList
          tasks={tasks}
          onToggleStatus={onToggleStatus}
          onDeleteTask={onDeleteTask}
          onEditTask={onEditTask}
        />
      )}
    </div>
  );
});

export default TaskList;
