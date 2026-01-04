/**
 * 通知管理 Hook
 * 需求: 8.1, 8.5
 * 
 * 提供通知权限管理和定时检查逻辑，集成 NotificationService。
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Task } from '../types';
import { 
  notificationService, 
  NotificationPermissionStatus,
  InAppReminderCallback 
} from '../services/notificationService';

/**
 * Hook 配置选项
 */
export interface UseNotificationOptions {
  /** 检查间隔（毫秒），默认 60000（1分钟） */
  checkInterval?: number;
  /** 是否自动请求权限，默认 false */
  autoRequestPermission?: boolean;
  /** 应用内提醒回调 */
  onInAppReminder?: InAppReminderCallback;
  /** 任务通知发送后的回调（用于更新 notificationSent 状态） */
  onTasksNotified?: (taskIds: string[]) => void;
}

/**
 * Hook 返回值类型
 */
export interface UseNotificationReturn {
  /** 当前权限状态 */
  permissionStatus: NotificationPermissionStatus;
  /** 是否支持通知 */
  isSupported: boolean;
  /** 待提醒的任务列表 */
  pendingReminders: Task[];
  /** 请求通知权限 */
  requestPermission: () => Promise<NotificationPermissionStatus>;
  /** 手动检查任务提醒 */
  checkReminders: (tasks: Task[]) => void;
  /** 开始定时检查 */
  startChecking: (tasks: Task[]) => void;
  /** 停止定时检查 */
  stopChecking: () => void;
  /** 是否正在检查 */
  isChecking: boolean;
}

/** 默认检查间隔：1分钟 */
const DEFAULT_CHECK_INTERVAL = 60 * 1000;

/**
 * 通知管理 Hook
 * 
 * 功能：
 * - 通知权限管理
 * - 定时检查逻辑（useEffect + setInterval）
 * - 集成 NotificationService
 * 
 * @param options 配置选项
 * @returns UseNotificationReturn
 */
export function useNotification(options: UseNotificationOptions = {}): UseNotificationReturn {
  const {
    checkInterval = DEFAULT_CHECK_INTERVAL,
    autoRequestPermission = false,
    onInAppReminder,
    onTasksNotified,
  } = options;

  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>(
    notificationService.getPermissionStatus()
  );
  const [pendingReminders, setPendingReminders] = useState<Task[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tasksRef = useRef<Task[]>([]);

  // 检查是否支持通知
  const isSupported = notificationService.isSupported();

  /**
   * 请求通知权限
   * 需求: 8.2
   */
  const requestPermission = useCallback(async (): Promise<NotificationPermissionStatus> => {
    const status = await notificationService.requestPermission();
    setPermissionStatus(status);
    return status;
  }, []);

  /**
   * 检查任务提醒
   * 需求: 8.1, 8.5
   */
  const checkReminders = useCallback((tasks: Task[]) => {
    // 设置应用内提醒回调
    if (onInAppReminder) {
      notificationService.setInAppReminderCallback(onInAppReminder);
    }

    // 处理任务提醒
    const notifiedTasks = notificationService.processTaskReminders(tasks);
    
    // 更新待提醒列表
    setPendingReminders(notifiedTasks);

    // 如果有任务被通知，调用回调更新状态
    if (notifiedTasks.length > 0 && onTasksNotified) {
      onTasksNotified(notifiedTasks.map(t => t.id));
    }
  }, [onInAppReminder, onTasksNotified]);

  /**
   * 开始定时检查
   * 需求: 8.5
   */
  const startChecking = useCallback((tasks: Task[]) => {
    // 保存任务引用
    tasksRef.current = tasks;
    
    // 如果已经在检查，先停止
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // 立即执行一次检查
    checkReminders(tasks);

    // 设置定时检查
    intervalRef.current = setInterval(() => {
      checkReminders(tasksRef.current);
    }, checkInterval);

    setIsChecking(true);
  }, [checkInterval, checkReminders]);

  /**
   * 停止定时检查
   */
  const stopChecking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsChecking(false);
  }, []);

  // 自动请求权限
  useEffect(() => {
    if (autoRequestPermission && permissionStatus === 'default') {
      requestPermission();
    }
  }, [autoRequestPermission, permissionStatus, requestPermission]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // 监听权限变化（某些浏览器支持）
  useEffect(() => {
    if (!isSupported) return;

    // 定期检查权限状态（因为不是所有浏览器都支持权限变化事件）
    const checkPermission = () => {
      const currentStatus = notificationService.getPermissionStatus();
      if (currentStatus !== permissionStatus) {
        setPermissionStatus(currentStatus);
      }
    };

    const permissionCheckInterval = setInterval(checkPermission, 5000);

    return () => {
      clearInterval(permissionCheckInterval);
    };
  }, [isSupported, permissionStatus]);

  return {
    permissionStatus,
    isSupported,
    pendingReminders,
    requestPermission,
    checkReminders,
    startChecking,
    stopChecking,
    isChecking,
  };
}
