/**
 * 筛选和排序相关类型定义
 * 需求: 6.3, 7.1, 7.2, 7.3
 */

import { TaskCategory, TaskStatus } from './task';

/**
 * 排序方式枚举
 */
export enum SortBy {
  CREATED_DATE = 'createdDate',  // 按创建时间
  DUE_DATE = 'dueDate',          // 按截止日期
  PRIORITY = 'priority'          // 按优先级
}

/**
 * 筛选条件接口
 */
export interface FilterOptions {
  category: TaskCategory | 'all';  // 分类筛选
  status: TaskStatus | 'all';      // 状态筛选
  sortBy: SortBy;                  // 排序方式
}

/**
 * 默认筛选条件
 */
export const DEFAULT_FILTER_OPTIONS: FilterOptions = {
  category: 'all',
  status: 'all',
  sortBy: SortBy.CREATED_DATE
};
