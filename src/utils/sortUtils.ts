/**
 * 排序工具函数
 * 需求: 7.1, 7.2, 7.3
 */

import { Task, TaskPriority, SortBy } from '../types';

/**
 * 优先级权重映射（高优先级 = 更小的数字 = 排在前面）
 */
const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  [TaskPriority.HIGH]: 0,
  [TaskPriority.MEDIUM]: 1,
  [TaskPriority.LOW]: 2
};

/**
 * 按优先级排序（高 > 中 > 低）
 * 需求: 7.1
 */
export function sortByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
  });
}

/**
 * 按截止日期排序（近期 > 远期，无截止日期的排在最后）
 * 需求: 7.2
 */
export function sortByDueDate(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // 无截止日期的排在最后
    if (a.dueDate === null && b.dueDate === null) return 0;
    if (a.dueDate === null) return 1;
    if (b.dueDate === null) return -1;
    
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

/**
 * 按创建时间排序（新 > 旧）
 * 需求: 7.3
 */
export function sortByCreatedDate(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * 根据排序方式对任务列表进行排序
 * 需求: 7.1, 7.2, 7.3, 7.4
 */
export function sortTasks(tasks: Task[], sortBy: SortBy): Task[] {
  switch (sortBy) {
    case SortBy.PRIORITY:
      return sortByPriority(tasks);
    case SortBy.DUE_DATE:
      return sortByDueDate(tasks);
    case SortBy.CREATED_DATE:
    default:
      return sortByCreatedDate(tasks);
  }
}
