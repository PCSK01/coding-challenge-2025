/**
 * FilterBar 组件
 * 需求: 6.3, 7.1, 7.2, 7.3
 * 
 * 提供任务筛选和排序控制：
 * - 分类筛选下拉框
 * - 状态筛选下拉框
 * - 排序方式选择
 * - 响应式样式
 */

import { useCallback, memo } from 'react';
import { TaskCategory, TaskStatus } from '../types/task';
import { FilterOptions, SortBy } from '../types/filter';

/**
 * FilterBar 组件属性
 */
export interface FilterBarProps {
  /** 当前筛选条件 */
  filterOptions: FilterOptions;
  /** 筛选条件变化回调 */
  onFilterChange: (options: FilterOptions) => void;
}

/**
 * 分类筛选选项
 */
const CATEGORY_OPTIONS: { value: TaskCategory | 'all'; label: string }[] = [
  { value: 'all', label: '全部分类' },
  { value: TaskCategory.WORK, label: '工作' },
  { value: TaskCategory.STUDY, label: '学习' },
  { value: TaskCategory.LIFE, label: '生活' },
];

/**
 * 状态筛选选项
 */
const STATUS_OPTIONS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: TaskStatus.PENDING, label: '待完成' },
  { value: TaskStatus.COMPLETED, label: '已完成' },
];

/**
 * 排序方式选项
 */
const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: SortBy.CREATED_DATE, label: '按创建时间' },
  { value: SortBy.DUE_DATE, label: '按截止日期' },
  { value: SortBy.PRIORITY, label: '按优先级' },
];


/**
 * FilterBar 组件
 * 使用 memo 优化渲染性能
 */
export const FilterBar = memo(function FilterBar({
  filterOptions,
  onFilterChange,
}: FilterBarProps) {
  /**
   * 处理分类筛选变化
   * 需求: 6.3 - 按分类过滤任务列表
   */
  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as TaskCategory | 'all';
      onFilterChange({
        ...filterOptions,
        category: value,
      });
    },
    [filterOptions, onFilterChange]
  );

  /**
   * 处理状态筛选变化
   */
  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as TaskStatus | 'all';
      onFilterChange({
        ...filterOptions,
        status: value,
      });
    },
    [filterOptions, onFilterChange]
  );

  /**
   * 处理排序方式变化
   * 需求: 7.1, 7.2, 7.3 - 按优先级/截止日期/创建时间排序
   */
  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as SortBy;
      onFilterChange({
        ...filterOptions,
        sortBy: value,
      });
    },
    [filterOptions, onFilterChange]
  );

  /**
   * 重置筛选条件
   */
  const handleReset = useCallback(() => {
    onFilterChange({
      category: 'all',
      status: 'all',
      sortBy: SortBy.CREATED_DATE,
    });
  }, [onFilterChange]);

  // 检查是否有活跃的筛选条件
  const hasActiveFilters =
    filterOptions.category !== 'all' ||
    filterOptions.status !== 'all' ||
    filterOptions.sortBy !== SortBy.CREATED_DATE;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
      role="region"
      aria-label="任务筛选和排序"
    >
      {/* 响应式布局：移动端垂直排列，桌面端水平排列 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* 筛选控件组 */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* 分类筛选 - 需求 6.3 */}
          <div className="flex-1 sm:flex-initial sm:min-w-[140px]">
            <label
              htmlFor="category-filter"
              className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
            >
              分类
            </label>
            <select
              id="category-filter"
              value={filterOptions.category}
              onChange={handleCategoryChange}
              className="
                w-full px-3 py-2 rounded-md border border-gray-300 
                text-sm bg-white dark:bg-gray-700 
                dark:border-gray-600 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                transition-colors cursor-pointer
              "
              aria-label="按分类筛选"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 状态筛选 */}
          <div className="flex-1 sm:flex-initial sm:min-w-[140px]">
            <label
              htmlFor="status-filter"
              className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
            >
              状态
            </label>
            <select
              id="status-filter"
              value={filterOptions.status}
              onChange={handleStatusChange}
              className="
                w-full px-3 py-2 rounded-md border border-gray-300 
                text-sm bg-white dark:bg-gray-700 
                dark:border-gray-600 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                transition-colors cursor-pointer
              "
              aria-label="按状态筛选"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 排序方式 - 需求 7.1, 7.2, 7.3 */}
          <div className="flex-1 sm:flex-initial sm:min-w-[140px]">
            <label
              htmlFor="sort-by"
              className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
            >
              排序
            </label>
            <select
              id="sort-by"
              value={filterOptions.sortBy}
              onChange={handleSortChange}
              className="
                w-full px-3 py-2 rounded-md border border-gray-300 
                text-sm bg-white dark:bg-gray-700 
                dark:border-gray-600 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                transition-colors cursor-pointer
              "
              aria-label="排序方式"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 重置按钮 */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleReset}
              className="
                px-3 py-2 text-sm font-medium rounded-md
                text-gray-600 dark:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-700
                focus:outline-none focus:ring-2 focus:ring-blue-500
                transition-colors
              "
              aria-label="重置筛选条件"
            >
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                重置
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 当前筛选状态提示 */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            当前筛选：
            {filterOptions.category !== 'all' && (
              <span className="ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                {CATEGORY_OPTIONS.find((o) => o.value === filterOptions.category)?.label}
              </span>
            )}
            {filterOptions.status !== 'all' && (
              <span className="ml-1 px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                {STATUS_OPTIONS.find((o) => o.value === filterOptions.status)?.label}
              </span>
            )}
            {filterOptions.sortBy !== SortBy.CREATED_DATE && (
              <span className="ml-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                {SORT_OPTIONS.find((o) => o.value === filterOptions.sortBy)?.label}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
});

export default FilterBar;
