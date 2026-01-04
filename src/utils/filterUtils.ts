/**
 * 筛选工具函数
 * 需求: 6.3
 */

import { Task, TaskCategory, TaskStatus, FilterOptions } from '../types';

/**
 * 按分类筛选任务
 * 需求: 6.3
 */
export function filterByCategory(tasks: Task[], category: TaskCategory | 'all'): Task[] {
  if (category === 'all') {
    return tasks;
  }
  return tasks.filter(task => task.category === category);
}

/**
 * 按状态筛选任务
 * 需求: 6.3
 */
export function filterByStatus(tasks: Task[], status: TaskStatus | 'all'): Task[] {
  if (status === 'all') {
    return tasks;
  }
  return tasks.filter(task => task.status === status);
}

/**
 * 组合筛选函数 - 同时按分类和状态筛选
 * 需求: 6.3
 */
export function filterTasks(
  tasks: Task[],
  options: Pick<FilterOptions, 'category' | 'status'>
): Task[] {
  let result = tasks;
  
  // 按分类筛选
  result = filterByCategory(result, options.category);
  
  // 按状态筛选
  result = filterByStatus(result, options.status);
  
  return result;
}
