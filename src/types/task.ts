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
 * 提醒时间选项枚举
 */
export enum ReminderOption {
  NONE = 'none',              // 不提醒
  AT_TIME = 'at_time',        // 到期时
  FIVE_MIN = '5min',          // 5分钟前
  FIFTEEN_MIN = '15min',      // 15分钟前
  THIRTY_MIN = '30min',       // 30分钟前
  ONE_HOUR = '1hour',         // 1小时前
  TWO_HOURS = '2hours',       // 2小时前
  ONE_DAY = '1day',           // 1天前
}

/**
 * 提醒选项配置（毫秒）
 */
export const REMINDER_ADVANCE_TIME: Record<ReminderOption, number> = {
  [ReminderOption.NONE]: -1,
  [ReminderOption.AT_TIME]: 0,
  [ReminderOption.FIVE_MIN]: 5 * 60 * 1000,
  [ReminderOption.FIFTEEN_MIN]: 15 * 60 * 1000,
  [ReminderOption.THIRTY_MIN]: 30 * 60 * 1000,
  [ReminderOption.ONE_HOUR]: 60 * 60 * 1000,
  [ReminderOption.TWO_HOURS]: 2 * 60 * 60 * 1000,
  [ReminderOption.ONE_DAY]: 24 * 60 * 60 * 1000,
};

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
  dueDate: Date | null;          // 截止日期时间（可选，精确到分钟）
  reminderOption: ReminderOption; // 提醒时间选项
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
  notificationSent: boolean;     // 是否已发送通知
}

/**
 * 创建任务时的输入数据类型（不包含自动生成的字段）
 */
export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'notificationSent' | 'reminderOption'> & {
  reminderOption?: ReminderOption;
};

/**
 * 更新任务时的输入数据类型
 */
export type UpdateTaskInput = Partial<Omit<Task, 'id' | 'createdAt'>>;
