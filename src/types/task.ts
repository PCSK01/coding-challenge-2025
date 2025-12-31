/**
 * 任务相关类型定义
 * 需求: 1.1, 1.2, 1.4, 1.5, 1.6
 */

/**
 * 任务分类枚举
 */
export enum TaskCategory {
  WORK = 'work',      // 工作
  STUDY = 'study',    // 学习
  LIFE = 'life'       // 生活
}

/**
 * 任务优先级枚举
 */
export enum TaskPriority {
  HIGH = 'high',      // 高
  MEDIUM = 'medium',  // 中
  LOW = 'low'         // 低
}

/**
 * 任务状态枚举
 */
export enum TaskStatus {
  PENDING = 'pending',     // 待完成
  COMPLETED = 'completed'  // 已完成
}

/**
 * 任务接口
 */
export interface Task {
  id: string;                    // 唯一标识符 (UUID)
  title: string;                 // 任务标题（必填）
  description: string;           // 任务描述（可选）
  category: TaskCategory;        // 任务分类
  priority: TaskPriority;        // 优先级
  status: TaskStatus;            // 完成状态
  dueDate: Date | null;          // 截止日期（可选）
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
  notificationSent: boolean;     // 是否已发送通知
}

/**
 * 创建任务时的输入数据类型（不包含自动生成的字段）
 */
export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'notificationSent'>;

/**
 * 更新任务时的输入数据类型
 */
export type UpdateTaskInput = Partial<Omit<Task, 'id' | 'createdAt'>>;
