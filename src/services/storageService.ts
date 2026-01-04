/**
 * IndexedDB 存储服务
 * 需求: 5.1, 5.2, 5.3, 5.4, 5.5
 * 
 * 提供任务数据的持久化存储功能，使用 IndexedDB 作为底层存储。
 * 支持数据库初始化、任务的增删改查操作，以及错误处理和降级方案。
 */

import { openDB, IDBPDatabase } from 'idb';
import { Task } from '../types';

// 数据库配置常量
const DB_NAME = 'TodoListDB';
const DB_VERSION = 1;
const STORE_NAME = 'tasks';

/**
 * 存储服务错误类型
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: 'INIT_FAILED' | 'WRITE_FAILED' | 'READ_FAILED' | 'DELETE_FAILED' | 'NOT_SUPPORTED'
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * StorageService 类
 * 
 * 提供 IndexedDB 存储操作的封装，包括：
 * - 数据库初始化
 * - 任务的 CRUD 操作
 * - 错误处理和降级方案
 */
export class StorageService {
  private db: IDBPDatabase | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * 检查浏览器是否支持 IndexedDB
   */
  private isIndexedDBSupported(): boolean {
    try {
      return typeof indexedDB !== 'undefined' && indexedDB !== null;
    } catch {
      return false;
    }
  }

  /**
   * 初始化数据库
   * 创建 tasks 对象存储和必要的索引
   */
  async initDB(): Promise<void> {
    // 如果已经初始化，直接返回
    if (this.initialized && this.db) {
      return;
    }

    // 如果正在初始化，等待初始化完成
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInitDB();
    return this.initPromise;
  }

  private async doInitDB(): Promise<void> {
    // 检查 IndexedDB 支持
    if (!this.isIndexedDBSupported()) {
      throw new StorageError(
        '您的浏览器不支持 IndexedDB，数据将无法持久化保存',
        'NOT_SUPPORTED'
      );
    }

    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // 如果 tasks 存储已存在，先删除
          if (db.objectStoreNames.contains(STORE_NAME)) {
            db.deleteObjectStore(STORE_NAME);
          }

          // 创建 tasks 对象存储
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
          });

          // 创建索引
          store.createIndex('by-category', 'category', { unique: false });
          store.createIndex('by-priority', 'priority', { unique: false });
          store.createIndex('by-status', 'status', { unique: false });
          store.createIndex('by-dueDate', 'dueDate', { unique: false });
          store.createIndex('by-createdAt', 'createdAt', { unique: false });
        },
      });

      this.initialized = true;
    } catch (error) {
      this.initPromise = null;
      throw new StorageError(
        `无法初始化数据库: ${error instanceof Error ? error.message : '未知错误'}`,
        'INIT_FAILED'
      );
    }
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureDB(): Promise<IDBPDatabase> {
    if (!this.initialized || !this.db) {
      await this.initDB();
    }
    if (!this.db) {
      throw new StorageError('数据库未初始化', 'INIT_FAILED');
    }
    return this.db;
  }

  /**
   * 保存单个任务到 IndexedDB
   * @param task 要保存的任务
   */
  async saveTask(task: Task): Promise<void> {
    try {
      const db = await this.ensureDB();
      await db.put(STORE_NAME, task);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        `保存任务失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'WRITE_FAILED'
      );
    }
  }

  /**
   * 从 IndexedDB 加载所有任务
   * @returns 任务列表
   */
  async loadTasks(): Promise<Task[]> {
    try {
      const db = await this.ensureDB();
      return await db.getAll(STORE_NAME);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        `加载任务失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'READ_FAILED'
      );
    }
  }

  /**
   * 更新任务
   * @param task 要更新的任务（必须包含 id）
   */
  async updateTask(task: Task): Promise<void> {
    try {
      const db = await this.ensureDB();
      
      // 检查任务是否存在
      const existing = await db.get(STORE_NAME, task.id);
      if (!existing) {
        throw new StorageError(`任务不存在: ${task.id}`, 'WRITE_FAILED');
      }

      await db.put(STORE_NAME, task);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        `更新任务失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'WRITE_FAILED'
      );
    }
  }

  /**
   * 删除任务
   * @param taskId 要删除的任务 ID
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      const db = await this.ensureDB();
      await db.delete(STORE_NAME, taskId);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        `删除任务失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'DELETE_FAILED'
      );
    }
  }

  /**
   * 按条件查询任务
   * @param filter 查询条件
   * @returns 符合条件的任务列表
   */
  async queryTasks(filter: Partial<Task>): Promise<Task[]> {
    try {
      const db = await this.ensureDB();
      const allTasks = await db.getAll(STORE_NAME);
      
      return allTasks.filter(task => {
        for (const [key, value] of Object.entries(filter)) {
          if (task[key as keyof Task] !== value) {
            return false;
          }
        }
        return true;
      });
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        `查询任务失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'READ_FAILED'
      );
    }
  }

  /**
   * 清空所有任务数据
   */
  async clearTasks(): Promise<void> {
    try {
      const db = await this.ensureDB();
      await db.clear(STORE_NAME);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        `清空任务失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'DELETE_FAILED'
      );
    }
  }

  /**
   * 获取单个任务
   * @param taskId 任务 ID
   * @returns 任务对象，如果不存在则返回 undefined
   */
  async getTask(taskId: string): Promise<Task | undefined> {
    try {
      const db = await this.ensureDB();
      return await db.get(STORE_NAME, taskId);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        `获取任务失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'READ_FAILED'
      );
    }
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
      this.initPromise = null;
    }
  }
}

// 导出单例实例
export const storageService = new StorageService();
