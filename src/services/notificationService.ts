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

import { Task, TaskStatus, ReminderOption, REMINDER_ADVANCE_TIME } from '../types/task';

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
  /** 应用内提醒回调（降级方案） */
  inAppReminderCallback?: InAppReminderCallback;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: NotificationServiceConfig = {};

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
   * 3. 任务设置了提醒（reminderOption !== none）
   * 4. 当前时间达到提醒时间点
   * 5. 尚未发送过通知
   * 
   * @param tasks 任务列表
   * @returns 需要提醒的任务列表
   */
  checkTasksForNotification(tasks: Task[]): Task[] {
    const now = new Date().getTime();
    console.log('[NotificationService] Checking tasks for notification, count:', tasks.length, 'time:', new Date().toLocaleString());

    return tasks.filter((task) => {
      // 已完成的任务不通知 (需求 8.4)
      if (task.status === TaskStatus.COMPLETED) {
        console.log('[NotificationService] Task skipped (completed):', task.title);
        return false;
      }

      // 没有截止日期的任务不通知
      if (!task.dueDate) {
        console.log('[NotificationService] Task skipped (no dueDate):', task.title);
        return false;
      }

      // 没有设置提醒的任务不通知
      if (!task.reminderOption || task.reminderOption === ReminderOption.NONE) {
        console.log('[NotificationService] Task skipped (no reminder):', task.title, 'reminderOption:', task.reminderOption);
        return false;
      }

      // 已经发送过通知的任务不再通知
      if (task.notificationSent) {
        console.log('[NotificationService] Task skipped (already notified):', task.title);
        return false;
      }

      // 获取该任务的提前提醒时间
      const advanceTime = REMINDER_ADVANCE_TIME[task.reminderOption];
      if (advanceTime < 0) {
        console.log('[NotificationService] Task skipped (invalid advanceTime):', task.title);
        return false;
      }

      const dueTime = new Date(task.dueDate).getTime();
      const reminderTime = dueTime - advanceTime;
      
      console.log('[NotificationService] Task time check:', task.title, {
        now: new Date(now).toLocaleString(),
        dueTime: new Date(dueTime).toLocaleString(),
        reminderTime: new Date(reminderTime).toLocaleString(),
        advanceTime: advanceTime / 1000 / 60 + ' minutes',
        shouldNotify: now >= reminderTime && now <= dueTime + 60 * 60 * 1000,
      });
      
      // 当前时间已经到达或超过提醒时间，且还没超过截止时间太久（1小时内）
      return now >= reminderTime && now <= dueTime + 60 * 60 * 1000;
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
    const dueTimeStr = task.dueDate 
      ? new Date(task.dueDate).toLocaleString('zh-CN', { 
          month: 'numeric', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      : '';
    const body = `任务「${task.title}」${dueTimeStr ? `将于 ${dueTimeStr} 到期` : '即将到期'}`;
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

    console.log('[NotificationService] Tasks to remind:', tasksToRemind.length);

    if (tasksToRemind.length === 0) {
      return [];
    }

    const permissionStatus = this.getPermissionStatus();
    console.log('[NotificationService] Permission status:', permissionStatus);

    // 如果权限被授予，发送浏览器通知
    if (permissionStatus === 'granted') {
      tasksToRemind.forEach((task) => {
        const sent = this.sendTaskReminder(task);
        console.log('[NotificationService] Browser notification sent:', task.title, sent);
      });
    } 
    // 权限被拒绝或不支持时，触发应用内提醒回调 (需求 8.3)
    else if (this.inAppReminderCallback) {
      console.log('[NotificationService] Triggering in-app reminder callback');
      this.inAppReminderCallback(tasksToRemind);
    } else {
      console.log('[NotificationService] No in-app reminder callback set');
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
}

/**
 * 默认通知服务实例
 */
export const notificationService = new NotificationService();
