/**
 * StorageService 单元测试和属性测试
 * 需求: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { StorageService, StorageError } from './storageService';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '../types';

// 创建测试用的任务数据
function createTestTask(overrides: Partial<Task> = {}): Task {
  return {
    id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: '测试任务',
    description: '这是一个测试任务',
    category: TaskCategory.WORK,
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.PENDING,
    dueDate: new Date('2025-12-31'),
    createdAt: new Date(),
    updatedAt: new Date(),
    notificationSent: false,
    ...overrides,
  };
}

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(async () => {
    storageService = new StorageService();
    await storageService.initDB();
    await storageService.clearTasks();
  });

  afterEach(() => {
    storageService.close();
  });

  describe('initDB', () => {
    it('应该成功初始化数据库', async () => {
      const newService = new StorageService();
      await expect(newService.initDB()).resolves.not.toThrow();
      newService.close();
    });

    it('多次调用 initDB 应该是安全的', async () => {
      await storageService.initDB();
      await storageService.initDB();
      // 不应该抛出错误
    });
  });

  describe('saveTask', () => {
    it('应该成功保存任务', async () => {
      const task = createTestTask();
      await storageService.saveTask(task);
      
      const loadedTasks = await storageService.loadTasks();
      expect(loadedTasks).toHaveLength(1);
      expect(loadedTasks[0].id).toBe(task.id);
    });

    it('应该保存任务的所有属性', async () => {
      const task = createTestTask({
        title: '完整属性测试',
        description: '测试描述',
        category: TaskCategory.STUDY,
        priority: TaskPriority.HIGH,
      });
      
      await storageService.saveTask(task);
      const loaded = await storageService.getTask(task.id);
      
      expect(loaded).toBeDefined();
      expect(loaded!.title).toBe(task.title);
      expect(loaded!.description).toBe(task.description);
      expect(loaded!.category).toBe(task.category);
      expect(loaded!.priority).toBe(task.priority);
    });
  });

  describe('loadTasks', () => {
    it('空数据库应该返回空数组', async () => {
      const tasks = await storageService.loadTasks();
      expect(tasks).toEqual([]);
    });

    it('应该加载所有保存的任务', async () => {
      const task1 = createTestTask({ id: 'task-1' });
      const task2 = createTestTask({ id: 'task-2' });
      
      await storageService.saveTask(task1);
      await storageService.saveTask(task2);
      
      const tasks = await storageService.loadTasks();
      expect(tasks).toHaveLength(2);
    });
  });

  describe('updateTask', () => {
    it('应该成功更新已存在的任务', async () => {
      const task = createTestTask();
      await storageService.saveTask(task);
      
      const updatedTask = { ...task, title: '更新后的标题' };
      await storageService.updateTask(updatedTask);
      
      const loaded = await storageService.getTask(task.id);
      expect(loaded!.title).toBe('更新后的标题');
    });

    it('更新不存在的任务应该抛出错误', async () => {
      const task = createTestTask({ id: 'non-existent' });
      
      await expect(storageService.updateTask(task)).rejects.toThrow(StorageError);
    });
  });

  describe('deleteTask', () => {
    it('应该成功删除任务', async () => {
      const task = createTestTask();
      await storageService.saveTask(task);
      
      await storageService.deleteTask(task.id);
      
      const tasks = await storageService.loadTasks();
      expect(tasks).toHaveLength(0);
    });

    it('删除后任务不应该存在', async () => {
      const task = createTestTask();
      await storageService.saveTask(task);
      await storageService.deleteTask(task.id);
      
      const loaded = await storageService.getTask(task.id);
      expect(loaded).toBeUndefined();
    });
  });

  describe('clearTasks', () => {
    it('应该清空所有任务', async () => {
      await storageService.saveTask(createTestTask({ id: 'task-1' }));
      await storageService.saveTask(createTestTask({ id: 'task-2' }));
      
      await storageService.clearTasks();
      
      const tasks = await storageService.loadTasks();
      expect(tasks).toHaveLength(0);
    });
  });

  describe('queryTasks', () => {
    it('应该按分类筛选任务', async () => {
      await storageService.saveTask(createTestTask({ id: 'work-1', category: TaskCategory.WORK }));
      await storageService.saveTask(createTestTask({ id: 'study-1', category: TaskCategory.STUDY }));
      
      const workTasks = await storageService.queryTasks({ category: TaskCategory.WORK });
      expect(workTasks).toHaveLength(1);
      expect(workTasks[0].category).toBe(TaskCategory.WORK);
    });

    it('应该按状态筛选任务', async () => {
      await storageService.saveTask(createTestTask({ id: 'pending-1', status: TaskStatus.PENDING }));
      await storageService.saveTask(createTestTask({ id: 'completed-1', status: TaskStatus.COMPLETED }));
      
      const completedTasks = await storageService.queryTasks({ status: TaskStatus.COMPLETED });
      expect(completedTasks).toHaveLength(1);
      expect(completedTasks[0].status).toBe(TaskStatus.COMPLETED);
    });
  });
});


/**
 * 属性测试生成器
 */

// 任务分类生成器
const categoryArb = fc.constantFrom(TaskCategory.WORK, TaskCategory.STUDY, TaskCategory.LIFE);

// 任务优先级生成器
const priorityArb = fc.constantFrom(TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW);

// 任务状态生成器
const statusArb = fc.constantFrom(TaskStatus.PENDING, TaskStatus.COMPLETED);

// 任务标题生成器（非空字符串，1-100字符）
const titleArb = fc.string({ minLength: 1, maxLength: 100 });

// 任务描述生成器（0-500字符）
const descriptionArb = fc.string({ maxLength: 500 });

// 日期生成器（可选的未来日期）
const dueDateArb = fc.option(
  fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  { nil: null }
);

// 完整任务生成器
const taskArb: fc.Arbitrary<Task> = fc.record({
  id: fc.uuid(),
  title: titleArb,
  description: descriptionArb,
  category: categoryArb,
  priority: priorityArb,
  status: statusArb,
  dueDate: dueDateArb,
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  notificationSent: fc.boolean(),
});

// 任务列表生成器（0-20个任务，避免测试过慢）
const taskListArb = fc.array(taskArb, { minLength: 0, maxLength: 20 });

/**
 * 比较两个任务是否等价
 * 由于 Date 对象在 IndexedDB 中存储后可能变成时间戳，需要特殊处理
 */
function tasksAreEqual(task1: Task, task2: Task): boolean {
  // 比较基本属性
  if (task1.id !== task2.id) return false;
  if (task1.title !== task2.title) return false;
  if (task1.description !== task2.description) return false;
  if (task1.category !== task2.category) return false;
  if (task1.priority !== task2.priority) return false;
  if (task1.status !== task2.status) return false;
  if (task1.notificationSent !== task2.notificationSent) return false;

  // 比较日期（转换为时间戳比较）
  const date1DueDate = task1.dueDate ? new Date(task1.dueDate).getTime() : null;
  const date2DueDate = task2.dueDate ? new Date(task2.dueDate).getTime() : null;
  if (date1DueDate !== date2DueDate) return false;

  const date1CreatedAt = new Date(task1.createdAt).getTime();
  const date2CreatedAt = new Date(task2.createdAt).getTime();
  if (date1CreatedAt !== date2CreatedAt) return false;

  const date1UpdatedAt = new Date(task1.updatedAt).getTime();
  const date2UpdatedAt = new Date(task2.updatedAt).getTime();
  if (date1UpdatedAt !== date2UpdatedAt) return false;

  return true;
}

/**
 * 比较两个任务列表是否等价（不考虑顺序）
 */
function taskListsAreEqual(list1: Task[], list2: Task[]): boolean {
  if (list1.length !== list2.length) return false;

  // 按 id 排序后比较
  const sorted1 = [...list1].sort((a, b) => a.id.localeCompare(b.id));
  const sorted2 = [...list2].sort((a, b) => a.id.localeCompare(b.id));

  for (let i = 0; i < sorted1.length; i++) {
    if (!tasksAreEqual(sorted1[i], sorted2[i])) {
      return false;
    }
  }

  return true;
}

/**
 * StorageService 属性测试
 */
describe('StorageService 属性测试', () => {
  /**
   * Feature: todo-list-app, Property 9: 数据持久化往返一致性
   * 验证需求: 4.1, 5.4
   * 
   * 对于任何任务列表，保存到 IndexedDB 后重新加载，
   * 加载的任务列表应该与原始列表等价（包含相同的任务和所有属性）
   */
  it('属性 9: 数据持久化往返一致性 - 保存后加载应返回等价的任务列表', async () => {
    await fc.assert(
      fc.asyncProperty(taskListArb, async (tasks) => {
        // 为每个测试创建新的 StorageService 实例
        const storageService = new StorageService();
        
        try {
          // 初始化数据库
          await storageService.initDB();
          
          // 清空现有数据
          await storageService.clearTasks();
          
          // 保存所有任务
          for (const task of tasks) {
            await storageService.saveTask(task);
          }
          
          // 重新加载任务
          const loadedTasks = await storageService.loadTasks();
          
          // 验证往返一致性
          const isEqual = taskListsAreEqual(tasks, loadedTasks);
          
          return isEqual;
        } finally {
          // 清理
          await storageService.clearTasks();
          storageService.close();
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: todo-list-app, Property 10: 添加任务同步存储
   * 验证需求: 5.1
   * 
   * 对于任何新创建的任务，添加后应该立即出现在 IndexedDB 中，
   * 且数据完整准确。
   */
  it('属性 10: 添加任务同步存储 - 保存任务后应立即可从存储中获取且数据完整', async () => {
    await fc.assert(
      fc.asyncProperty(taskArb, async (task) => {
        // 为每个测试创建新的 StorageService 实例
        const storageService = new StorageService();
        
        try {
          // 初始化数据库
          await storageService.initDB();
          
          // 清空现有数据
          await storageService.clearTasks();
          
          // 保存任务
          await storageService.saveTask(task);
          
          // 立即从存储中获取该任务
          const retrievedTask = await storageService.getTask(task.id);
          
          // 验证任务存在
          if (!retrievedTask) {
            return false;
          }
          
          // 验证任务数据完整准确
          const isEqual = tasksAreEqual(task, retrievedTask);
          
          return isEqual;
        } finally {
          // 清理
          await storageService.clearTasks();
          storageService.close();
        }
      }),
      { numRuns: 100 }
    );
  });
});
