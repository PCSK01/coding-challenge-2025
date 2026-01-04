/**
 * 任务业务逻辑服务
 * 需求: 1.1, 1.2, 1.3, 2.1, 3.1
 * 
 * 提供任务的创建、更新、删除、状态切换等业务逻辑。
 * 包含输入验证（标题非空、日期有效性）。
 */

import { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from '../types';

/**
 * 任务验证错误类型
 */
export class TaskValidationError extends Error {
  constructor(
    message: string,
    public readonly code: 'EMPTY_TITLE' | 'INVALID_DATE' | 'TASK_NOT_FOUND'
  ) {
    super(message);
    this.name = 'TaskValidationError';
  }
}

/**
 * 生成 UUID v4
 * @returns UUID 字符串
 */
export function generateUUID(): string {
  // 使用 crypto.randomUUID() 如果可用，否则使用 polyfill
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Polyfill for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 验证任务标题
 * @param title 任务标题
 * @returns 是否有效
 */
export function isValidTitle(title: string): boolean {
  return typeof title === 'string' && title.trim().length > 0;
}

/**
 * 验证截止日期
 * @param date 截止日期
 * @returns 是否有效（null 或有效的 Date 对象）
 */
export function isValidDueDate(date: Date | null): boolean {
  if (date === null) {
    return true;
  }
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * TaskService 类
 * 
 * 提供任务业务逻辑操作：
 * - 创建任务（生成 UUID、设置时间戳）
 * - 更新任务
 * - 删除任务
 * - 切换任务状态
 * - 输入验证
 */
export class TaskService {
  /**
   * 创建新任务
   * @param taskData 任务数据（不包含自动生成的字段）
   * @returns 完整的任务对象
   * @throws TaskValidationError 如果标题为空或日期无效
   */
  createTask(taskData: CreateTaskInput): Task {
    // 验证标题
    if (!isValidTitle(taskData.title)) {
      throw new TaskValidationError('任务标题不能为空', 'EMPTY_TITLE');
    }

    // 验证截止日期
    if (!isValidDueDate(taskData.dueDate)) {
      throw new TaskValidationError('截止日期无效', 'INVALID_DATE');
    }

    const now = new Date();
    
    const task: Task = {
      id: generateUUID(),
      title: taskData.title.trim(),
      description: taskData.description || '',
      category: taskData.category,
      priority: taskData.priority,
      status: taskData.status,
      dueDate: taskData.dueDate,
      createdAt: now,
      updatedAt: now,
      notificationSent: false,
    };

    return task;
  }

  /**
   * 更新任务
   * @param taskId 任务 ID
   * @param updates 要更新的字段
   * @param tasks 当前任务列表
   * @returns 更新后的任务列表
   * @throws TaskValidationError 如果任务不存在或验证失败
   */
  updateTask(taskId: string, updates: UpdateTaskInput, tasks: Task[]): Task[] {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      throw new TaskValidationError(`任务不存在: ${taskId}`, 'TASK_NOT_FOUND');
    }

    // 如果更新标题，验证标题
    if (updates.title !== undefined && !isValidTitle(updates.title)) {
      throw new TaskValidationError('任务标题不能为空', 'EMPTY_TITLE');
    }

    // 如果更新截止日期，验证日期
    if (updates.dueDate !== undefined && !isValidDueDate(updates.dueDate)) {
      throw new TaskValidationError('截止日期无效', 'INVALID_DATE');
    }

    const updatedTask: Task = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: new Date(),
    };

    // 如果更新了标题，去除首尾空格
    if (updates.title !== undefined) {
      updatedTask.title = updatedTask.title.trim();
    }

    const newTasks = [...tasks];
    newTasks[taskIndex] = updatedTask;
    
    return newTasks;
  }

  /**
   * 删除任务
   * @param taskId 要删除的任务 ID
   * @param tasks 当前任务列表
   * @returns 删除后的任务列表
   */
  deleteTask(taskId: string, tasks: Task[]): Task[] {
    return tasks.filter(t => t.id !== taskId);
  }

  /**
   * 切换任务完成状态
   * @param taskId 任务 ID
   * @param tasks 当前任务列表
   * @returns 更新后的任务列表
   * @throws TaskValidationError 如果任务不存在
   */
  toggleTaskStatus(taskId: string, tasks: Task[]): Task[] {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      throw new TaskValidationError(`任务不存在: ${taskId}`, 'TASK_NOT_FOUND');
    }

    const task = tasks[taskIndex];
    const newStatus = task.status === TaskStatus.PENDING 
      ? TaskStatus.COMPLETED 
      : TaskStatus.PENDING;

    const updatedTask: Task = {
      ...task,
      status: newStatus,
      updatedAt: new Date(),
    };

    const newTasks = [...tasks];
    newTasks[taskIndex] = updatedTask;
    
    return newTasks;
  }

  /**
   * 添加任务到列表
   * @param task 要添加的任务
   * @param tasks 当前任务列表
   * @returns 添加后的任务列表
   */
  addTask(task: Task, tasks: Task[]): Task[] {
    return [...tasks, task];
  }

  /**
   * 根据 ID 获取任务
   * @param taskId 任务 ID
   * @param tasks 任务列表
   * @returns 任务对象，如果不存在则返回 undefined
   */
  getTaskById(taskId: string, tasks: Task[]): Task | undefined {
    return tasks.find(t => t.id === taskId);
  }
}

// 导出单例实例
export const taskService = new TaskService();
