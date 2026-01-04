/**
 * TaskForm 组件
 * 需求: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 * 
 * 提供任务添加/编辑表单，包含：
 * - 标题输入（必填）
 * - 描述输入（可选）
 * - 分类选择
 * - 优先级选择
 * - 截止日期选择
 * - 表单验证
 */

import { useState, useCallback, useEffect, FormEvent } from 'react';
import { Task, TaskCategory, TaskPriority, TaskStatus, CreateTaskInput } from '../types';

/**
 * TaskForm 组件属性
 */
export interface TaskFormProps {
  /** 提交回调 */
  onSubmit: (taskData: CreateTaskInput) => void | Promise<void>;
  /** 编辑模式时传入的初始任务 */
  initialTask?: Task;
  /** 是否正在提交 */
  isSubmitting?: boolean;
  /** 取消回调（编辑模式） */
  onCancel?: () => void;
}

/**
 * 表单数据类型
 */
interface FormData {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate: string; // 使用字符串格式便于 input[type="date"] 处理
}

/**
 * 表单错误类型
 */
interface FormErrors {
  title?: string;
  dueDate?: string;
}

/**
 * 分类选项
 */
const CATEGORY_OPTIONS: { value: TaskCategory; label: string }[] = [
  { value: TaskCategory.WORK, label: '工作' },
  { value: TaskCategory.STUDY, label: '学习' },
  { value: TaskCategory.LIFE, label: '生活' },
];


/**
 * 优先级选项
 */
const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: TaskPriority.HIGH, label: '高', color: 'text-red-600' },
  { value: TaskPriority.MEDIUM, label: '中', color: 'text-yellow-600' },
  { value: TaskPriority.LOW, label: '低', color: 'text-green-600' },
];

/**
 * 格式化日期为 input[type="date"] 格式 (YYYY-MM-DD)
 */
function formatDateForInput(date: Date | null): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 解析 input[type="date"] 格式的日期字符串
 */
function parseDateFromInput(dateStr: string): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr + 'T00:00:00');
  return isNaN(date.getTime()) ? null : date;
}

/**
 * 获取初始表单数据
 */
function getInitialFormData(initialTask?: Task): FormData {
  if (initialTask) {
    return {
      title: initialTask.title,
      description: initialTask.description,
      category: initialTask.category,
      priority: initialTask.priority,
      dueDate: formatDateForInput(initialTask.dueDate),
    };
  }
  return {
    title: '',
    description: '',
    category: TaskCategory.WORK,
    priority: TaskPriority.MEDIUM,
    dueDate: '',
  };
}


/**
 * TaskForm 组件
 */
export function TaskForm({ 
  onSubmit, 
  initialTask, 
  isSubmitting = false,
  onCancel 
}: TaskFormProps) {
  const [formData, setFormData] = useState<FormData>(() => getInitialFormData(initialTask));
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const isEditMode = !!initialTask;

  /**
   * 当 initialTask 变化时，更新表单数据
   * 修复：点击编辑时原始内容不呈现的问题
   */
  useEffect(() => {
    setFormData(getInitialFormData(initialTask));
    setErrors({});
    setTouched({});
  }, [initialTask]);

  /**
   * 验证表单
   * 需求: 1.3 - 空标题验证
   */
  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};

    // 验证标题（必填，不能为空或纯空格）
    if (!formData.title.trim()) {
      newErrors.title = '请输入任务标题';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = '标题不能超过 100 个字符';
    }

    // 验证截止日期（如果填写了，必须是有效日期）
    if (formData.dueDate) {
      const date = parseDateFromInput(formData.dueDate);
      if (!date) {
        newErrors.dueDate = '请输入有效的日期';
      }
    }

    return newErrors;
  }, [formData]);

  /**
   * 处理输入变化
   */
  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 清除该字段的错误
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  /**
   * 处理字段失焦
   */
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // 验证该字段
    const validationErrors = validateForm();
    if (validationErrors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: validationErrors[name as keyof FormErrors] }));
    }
  }, [validateForm]);


  /**
   * 处理表单提交
   * 需求: 1.1, 1.2, 1.4, 1.5, 1.6
   */
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    // 验证表单
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTouched({ title: true, dueDate: true });
      return;
    }

    // 构建任务数据
    const taskData: CreateTaskInput = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      priority: formData.priority,
      status: initialTask?.status ?? TaskStatus.PENDING,
      dueDate: parseDateFromInput(formData.dueDate),
    };

    // 调用提交回调
    await onSubmit(taskData);

    // 如果不是编辑模式，重置表单
    if (!isEditMode) {
      setFormData(getInitialFormData());
      setErrors({});
      setTouched({});
    }
  }, [formData, validateForm, onSubmit, isEditMode, initialTask?.status]);

  /**
   * 重置表单
   */
  const handleReset = useCallback(() => {
    setFormData(getInitialFormData(initialTask));
    setErrors({});
    setTouched({});
  }, [initialTask]);

  return (
    <form 
      onSubmit={handleSubmit} 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6"
      aria-label={isEditMode ? '编辑任务' : '添加任务'}
    >
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        {isEditMode ? '编辑任务' : '添加新任务'}
      </h2>


      {/* 标题输入 - 需求 1.1, 1.2, 1.3 */}
      <div className="mb-4">
        <label 
          htmlFor="title" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          任务标题 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="请输入任务标题"
          maxLength={100}
          disabled={isSubmitting}
          aria-required="true"
          aria-invalid={touched.title && !!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
          className={`
            w-full px-3 py-2 rounded-md border transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            dark:bg-gray-700 dark:text-white dark:placeholder-gray-400
            ${touched.title && errors.title 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-300 dark:border-gray-600'
            }
          `}
        />
        {touched.title && errors.title && (
          <p id="title-error" className="mt-1 text-sm text-red-500" role="alert">
            {errors.title}
          </p>
        )}
      </div>

      {/* 描述输入 - 需求 1.2 */}
      <div className="mb-4">
        <label 
          htmlFor="description" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          任务描述
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="请输入任务描述（可选）"
          maxLength={500}
          rows={3}
          disabled={isSubmitting}
          className="
            w-full px-3 py-2 rounded-md border border-gray-300 transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
            resize-none
          "
        />
      </div>


      {/* 分类和优先级 - 响应式布局 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* 分类选择 - 需求 1.4 */}
        <div>
          <label 
            htmlFor="category" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            分类
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            disabled={isSubmitting}
            className="
              w-full px-3 py-2 rounded-md border border-gray-300 transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              dark:bg-gray-700 dark:border-gray-600 dark:text-white
            "
          >
            {CATEGORY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 优先级选择 - 需求 1.5 */}
        <div>
          <label 
            htmlFor="priority" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            优先级
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            disabled={isSubmitting}
            className="
              w-full px-3 py-2 rounded-md border border-gray-300 transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              dark:bg-gray-700 dark:border-gray-600 dark:text-white
            "
          >
            {PRIORITY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>


      {/* 截止日期 - 需求 1.6 */}
      <div className="mb-6">
        <label 
          htmlFor="dueDate" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          截止日期
        </label>
        <input
          type="date"
          id="dueDate"
          name="dueDate"
          value={formData.dueDate}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isSubmitting}
          aria-invalid={touched.dueDate && !!errors.dueDate}
          aria-describedby={errors.dueDate ? 'dueDate-error' : undefined}
          className={`
            w-full sm:w-auto px-3 py-2 rounded-md border transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            dark:bg-gray-700 dark:text-white dark:border-gray-600
            ${touched.dueDate && errors.dueDate 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-300 dark:border-gray-600'
            }
          `}
        />
        {touched.dueDate && errors.dueDate && (
          <p id="dueDate-error" className="mt-1 text-sm text-red-500" role="alert">
            {errors.dueDate}
          </p>
        )}
      </div>

      {/* 按钮组 */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="
            flex-1 sm:flex-none px-4 py-2 rounded-md font-medium transition-colors
            bg-blue-600 text-white hover:bg-blue-700
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:bg-blue-400 disabled:cursor-not-allowed
          "
        >
          {isSubmitting ? '提交中...' : (isEditMode ? '保存修改' : '添加任务')}
        </button>

        {isEditMode && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="
              flex-1 sm:flex-none px-4 py-2 rounded-md font-medium transition-colors
              bg-gray-200 text-gray-700 hover:bg-gray-300
              dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500
              focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            取消
          </button>
        )}

        {!isEditMode && (
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="
              flex-1 sm:flex-none px-4 py-2 rounded-md font-medium transition-colors
              bg-gray-200 text-gray-700 hover:bg-gray-300
              dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500
              focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            重置
          </button>
        )}
      </div>
    </form>
  );
}

export default TaskForm;
