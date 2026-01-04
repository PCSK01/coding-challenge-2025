/**
 * 任务管理 Hook
 * 需求: 1.1, 2.1, 3.1, 4.1, 5.1
 * 
 * 提供任务状态管理和 CRUD 操作，集成 StorageService 进行数据持久化。
 */

import { useState, useEffect, useCallback } from 'react';
import { Task, CreateTaskInput, UpdateTaskInput } from '../types';
import { storageService, StorageError } from '../services/storageService';
import { taskService, TaskValidationError } from '../services/taskService';

/**
 * Hook 返回值类型
 */
export interface UseTasksReturn {
  /** 任务列表 */
  tasks: Task[];
  /** 是否正在加载 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 添加任务 */
  addTask: (taskData: CreateTaskInput) => Promise<Task | null>;
  /** 更新任务 */
  updateTask: (taskId: string, updates: UpdateTaskInput) => Promise<boolean>;
  /** 删除任务 */
  deleteTask: (taskId: string) => Promise<boolean>;
  /** 切换任务状态 */
  toggleTaskStatus: (taskId: string) => Promise<boolean>;
  /** 清除错误 */
  clearError: () => void;
  /** 重新加载任务 */
  reloadTasks: () => Promise<void>;
}

/**
 * 任务管理 Hook
 * 
 * 功能：
 * - 任务状态管理（useState）
 * - 任务加载（useEffect + loadTasks）
 * - 任务 CRUD 操作（add, update, delete, toggle）
 * - 集成 StorageService 进行数据持久化
 * 
 * @returns UseTasksReturn
 */
export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载任务列表
   * 需求: 4.1, 5.4
   */
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await storageService.initDB();
      const loadedTasks = await storageService.loadTasks();
      setTasks(loadedTasks);
    } catch (err) {
      const message = err instanceof StorageError 
        ? err.message 
        : '加载任务失败';
      setError(message);
      console.error('加载任务失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化时加载任务
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  /**
   * 添加任务
   * 需求: 1.1, 5.1
   */
  const addTask = useCallback(async (taskData: CreateTaskInput): Promise<Task | null> => {
    try {
      setError(null);
      // 创建任务
      const newTask = taskService.createTask(taskData);
      
      // 保存到存储
      await storageService.saveTask(newTask);
      
      // 更新状态
      setTasks(prev => taskService.addTask(newTask, prev));
      
      return newTask;
    } catch (err) {
      const message = err instanceof TaskValidationError 
        ? err.message 
        : err instanceof StorageError 
          ? err.message 
          : '添加任务失败';
      setError(message);
      console.error('添加任务失败:', err);
      return null;
    }
  }, []);

  /**
   * 更新任务
   * 需求: 5.2
   */
  const updateTask = useCallback(async (
    taskId: string, 
    updates: UpdateTaskInput
  ): Promise<boolean> => {
    try {
      setError(null);
      
      // 更新任务列表
      const updatedTasks = taskService.updateTask(taskId, updates, tasks);
      const updatedTask = updatedTasks.find(t => t.id === taskId);
      
      if (!updatedTask) {
        throw new TaskValidationError('任务不存在', 'TASK_NOT_FOUND');
      }
      
      // 保存到存储
      await storageService.updateTask(updatedTask);
      
      // 更新状态
      setTasks(updatedTasks);
      
      return true;
    } catch (err) {
      const message = err instanceof TaskValidationError 
        ? err.message 
        : err instanceof StorageError 
          ? err.message 
          : '更新任务失败';
      setError(message);
      console.error('更新任务失败:', err);
      return false;
    }
  }, [tasks]);

  /**
   * 删除任务
   * 需求: 2.1, 5.3
   */
  const deleteTask = useCallback(async (taskId: string): Promise<boolean> => {
    try {
      setError(null);
      
      // 从存储中删除
      await storageService.deleteTask(taskId);
      
      // 更新状态
      setTasks(prev => taskService.deleteTask(taskId, prev));
      
      return true;
    } catch (err) {
      const message = err instanceof StorageError 
        ? err.message 
        : '删除任务失败';
      setError(message);
      console.error('删除任务失败:', err);
      return false;
    }
  }, []);

  /**
   * 切换任务状态
   * 需求: 3.1, 3.3
   */
  const toggleTaskStatus = useCallback(async (taskId: string): Promise<boolean> => {
    try {
      setError(null);
      
      // 切换状态
      const updatedTasks = taskService.toggleTaskStatus(taskId, tasks);
      const updatedTask = updatedTasks.find(t => t.id === taskId);
      
      if (!updatedTask) {
        throw new TaskValidationError('任务不存在', 'TASK_NOT_FOUND');
      }
      
      // 保存到存储
      await storageService.updateTask(updatedTask);
      
      // 更新状态
      setTasks(updatedTasks);
      
      return true;
    } catch (err) {
      const message = err instanceof TaskValidationError 
        ? err.message 
        : err instanceof StorageError 
          ? err.message 
          : '切换任务状态失败';
      setError(message);
      console.error('切换任务状态失败:', err);
      return false;
    }
  }, [tasks]);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 重新加载任务
   */
  const reloadTasks = useCallback(async () => {
    await loadTasks();
  }, [loadTasks]);

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    clearError,
    reloadTasks,
  };
}
