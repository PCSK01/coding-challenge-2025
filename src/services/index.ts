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
