/**
 * 服务层统一导出
 */

export { StorageService, StorageError, storageService } from './storageService';
export { 
  TaskService, 
  TaskValidationError, 
  taskService,
  generateUUID,
  isValidTitle,
  isValidDueDate
} from './taskService';
export {
  NotificationService,
  notificationService,
  type NotificationPermissionStatus,
  type InAppReminderCallback,
  type NotificationServiceConfig
} from './notificationService';
