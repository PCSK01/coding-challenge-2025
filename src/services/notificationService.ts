/**
 * 通知服务
 * 需求: 8.1, 8.2, 8.3, 8.4
 * 
 * 实现浏览器通知功能，包括：
 * - 请求通知权限
 * - 发送浏览器通知
 * - 检查需要提醒的任务
 * - 权限被拒绝时的降级方案
 */

import { Task, TaskStatus } from '../types/task';

/**
 * 通知权限状态类型
 */
export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * 应用内提醒回调类型
 */
export type InAppReminderCallback = (tasks: Task[]) => void;

/**
 * 通知服务配置
 */
export interface NotificationServiceConfig {
  /** 提前提醒时间（毫秒），默认 1 小时 */
  reminderAdvanceTime: number;
  /** 应用内提醒回调（降级方案） */
  inAppReminderCallback?: InAppReminderCallback;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: NotificationServiceConfig = {
  reminderAdvanceTime: 60 * 60 * 1000, // 1 小时
};

/**
 * 通知服务类
 * 
 * 提供浏览器通知功能，当权限被拒绝或不支持时自动降级到应用内提醒
 */
export class NotificationService {
  private config: NotificationServiceConfig;
  private inAppReminderCallback?: InAppReminderCallback;

  constructor(config: Partial<NotificationServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.inAppReminderCallback = config.inAppReminderCallback;
  }

  /**
   * 检查浏览器是否支持 Notification API
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * 获取当前通知权限状态
   * 需求: 8.2
   */
  getPermissionStatus(): NotificationPermissionStatus {
    if (!this.isSupported()) {
      return 'unsupported';
    }
    return Notification.permission as NotificationPermissionStatus;
  }

  /**
   * 请求通知权限
   * 需求: 8.2
   * 
   * @returns 权限状态
   */
  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    // 如果已经授权或拒绝，直接返回当前状态
    if (Notification.permission !== 'default') {
      return Notification.permission as NotificationPermissionStatus;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission as NotificationPermissionStatus;
    } catch {
      // 某些浏览器可能不支持 Promise 版本的 requestPermission
      return 'unsupported';
    }
  }

  /**
   * 发送浏览器通知
   * 需求: 8.1
   * 
   * @param title 通知标题
   * @param options 通知选项
   * @returns 是否成功发送
   */
  sendNotification(title: string, options?: NotificationOptions): boolean {
    if (!this.isSupported()) {
      return false;
    }

    if (Notification.permission !== 'granted') {
      return false;
    }

    try {
      new Notification(title, {
        icon: '/vite.svg',
        badge: '/vite.svg',
        ...options,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 检查需要提醒的任务
   * 需求: 8.1, 8.4
   * 
   * 筛选条件：
   * 1. 任务设置了截止日期
   * 2. 任务未完成（status !== completed）
   * 3. 当前时间接近截止日期（在提前提醒时间范围内）
   * 4. 尚未发送过通知
   * 
   * @param tasks 任务列表
   * @returns 需要提醒的任务列表
   */
  checkTasksForNotification(tasks: Task[]): Task[] {
    const now = new Date().getTime();
    const reminderThreshold = this.config.reminderAdvanceTime;

    return tasks.filter((task) => {
      // 已完成的任务不通知 (需求 8.4)
      if (task.status === TaskStatus.COMPLETED) {
        return false;
      }

      // 没有截止日期的任务不通知
      if (!task.dueDate) {
        return false;
      }

      // 已经发送过通知的任务不再通知
      if (task.notificationSent) {
        return false;
      }

      const dueTime = new Date(task.dueDate).getTime();
      const timeUntilDue = dueTime - now;

      // 截止日期已过或在提醒时间范围内
      return timeUntilDue <= reminderThreshold && timeUntilDue > -reminderThreshold;
    });
  }

  /**
   * 为任务发送提醒通知
   * 需求: 8.1, 8.3
   * 
   * 如果浏览器通知不可用或权限被拒绝，会触发应用内提醒回调
   * 
   * @param task 需要提醒的任务
   * @returns 是否成功发送浏览器通知
   */
  sendTaskReminder(task: Task): boolean {
    const title = '任务提醒';
    const body = `任务「${task.title}」即将到期`;
    const options: NotificationOptions = {
      body,
      tag: `task-${task.id}`,
      requireInteraction: true,
    };

    return this.sendNotification(title, options);
  }

  /**
   * 批量处理任务提醒
   * 需求: 8.1, 8.3
   * 
   * 检查任务列表，发送浏览器通知或触发应用内提醒
   * 
   * @param tasks 任务列表
   * @returns 需要提醒的任务列表（用于更新 notificationSent 状态）
   */
  processTaskReminders(tasks: Task[]): Task[] {
    const tasksToRemind = this.checkTasksForNotification(tasks);

    if (tasksToRemind.length === 0) {
      return [];
    }

    const permissionStatus = this.getPermissionStatus();

    // 如果权限被授予，发送浏览器通知
    if (permissionStatus === 'granted') {
      tasksToRemind.forEach((task) => {
        this.sendTaskReminder(task);
      });
    } 
    // 权限被拒绝或不支持时，触发应用内提醒回调 (需求 8.3)
    else if (this.inAppReminderCallback) {
      this.inAppReminderCallback(tasksToRemind);
    }

    return tasksToRemind;
  }

  /**
   * 设置应用内提醒回调
   * 需求: 8.3
   * 
   * @param callback 回调函数
   */
  setInAppReminderCallback(callback: InAppReminderCallback): void {
    this.inAppReminderCallback = callback;
  }

  /**
   * 更新配置
   * 
   * @param config 新配置
   */
  updateConfig(config: Partial<NotificationServiceConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.inAppReminderCallback !== undefined) {
      this.inAppReminderCallback = config.inAppReminderCallback;
    }
  }

  /**
   * 获取提前提醒时间（毫秒）
   */
  getReminderAdvanceTime(): number {
    return this.config.reminderAdvanceTime;
  }
}

/**
 * 默认通知服务实例
 */
export const notificationService = new NotificationService();
