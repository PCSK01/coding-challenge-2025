# TODO List 项目开发说明文档

## 1. 技术选型

### 核心技术栈

| 技术 | 选择 | 理由 |
|------|------|------|
| 编程语言 | TypeScript | 提供类型安全，减少运行时错误，IDE 智能提示更友好 |
| 前端框架 | React 18 | 成熟的组件化框架，Hooks API 简洁，生态丰富 |
| 构建工具 | Vite | 开发服务器启动快，HMR 热更新体验好，构建速度快 |
| 样式方案 | Tailwind CSS | 原子化 CSS，快速开发响应式 UI，无需写大量自定义 CSS |
| 数据存储 | IndexedDB (idb) | 支持大容量存储、索引查询、事务，比 LocalStorage 更强大 |
| 测试框架 | Vitest + fast-check | Vitest 与 Vite 无缝集成，fast-check 支持属性测试 |

### 替代方案对比

**为什么选择 IndexedDB 而非 LocalStorage？**
- LocalStorage 只支持字符串存储，需要 JSON 序列化/反序列化
- LocalStorage 容量限制约 5MB，IndexedDB 通常 50MB+
- IndexedDB 支持索引查询，筛选排序性能更好
- IndexedDB 支持事务，数据一致性更强

**为什么不使用 Redux/Zustand 等状态管理库？**
- 项目规模较小，React Hooks (useState, useCallback, useMemo) 足够
- 减少依赖，降低包体积
- 自定义 Hook (useTasks) 已经很好地封装了状态逻辑

## 2. 项目结构设计

### 整体架构

```
┌─────────────────────────────────────┐
│         UI Components Layer         │
│  (TaskList, TaskItem, TaskForm...)  │
└─────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────┐
│      Application State Layer        │
│    (useTasks, useNotification)      │
└─────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────┐
│        Service Layer                │
│  (StorageService, NotificationSvc)  │
└─────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────┐
│      Browser APIs Layer             │
│  (IndexedDB, Notification API)      │
└─────────────────────────────────────┘
```

### 目录结构

```
src/
├── components/           # React UI 组件
│   ├── TaskList.tsx     # 任务列表（支持虚拟滚动）
│   ├── TaskItem.tsx     # 单个任务项
│   ├── TaskForm.tsx     # 任务添加/编辑表单
│   └── FilterBar.tsx    # 筛选和排序控制栏
├── hooks/               # 自定义 Hooks
│   ├── useTasks.ts      # 任务 CRUD 状态管理
│   └── useNotification.ts # 通知权限和提醒管理
├── services/            # 业务服务层
│   ├── storageService.ts    # IndexedDB 存储封装
│   ├── notificationService.ts # 浏览器通知服务
│   └── taskService.ts       # 任务业务逻辑（创建、验证、排序）
├── types/               # TypeScript 类型定义
│   ├── task.ts          # 任务、分类、优先级等类型
│   └── filter.ts        # 筛选条件类型
├── utils/               # 工具函数
│   ├── filterUtils.ts   # 任务筛选逻辑
│   └── sortUtils.ts     # 任务排序逻辑
├── App.tsx              # 应用主组件
└── main.tsx             # 应用入口
```

### 模块职责

- **components**: 纯 UI 展示，接收 props，触发回调
- **hooks**: 状态管理和副作用处理，连接 UI 和 Service
- **services**: 业务逻辑和外部 API 交互，不依赖 React
- **types**: 类型定义，确保类型安全
- **utils**: 纯函数工具，无副作用，易于测试

## 3. 需求细节与决策

### 题目未明确的需求处理

| 问题 | 决策 | 理由 |
|------|------|------|
| 描述是否必填？ | 可选 | 快速添加任务时不想写描述 |
| 空标题如何处理？ | 阻止提交，显示错误提示 | 标题是任务的核心标识 |
| 已完成任务如何显示？ | 灰色文字 + 删除线 | 视觉上明显区分，但不隐藏 |
| 默认排序方式？ | 按创建时间（新→旧） | 最新任务最先看到 |
| 截止日期是否必填？ | 可选 | 不是所有任务都有明确截止时间 |
| 提醒时间如何设置？ | 提供多个预设选项（5分钟/15分钟/1小时/1天前等） | 用户可根据任务紧急程度选择 |

### 扩展功能设计

1. **任务提醒通知**
   - 支持浏览器 Notification API
   - 用户可选择提醒时间（到期时/5分钟前/1小时前等）
   - 权限被拒绝时降级为应用内 Toast 提醒

2. **响应式布局**
   - 桌面端：宽松布局，表单和列表并排或上下排列
   - 移动端：紧凑布局，触摸友好的按钮尺寸

3. **虚拟滚动**
   - 使用 @tanstack/react-virtual 优化大量任务的渲染性能

## 4. AI 使用说明

### 使用的 AI 工具

- **cusor (Claude4.5)**: 主要开发助手

### AI 辅助的环节

| 环节 | AI 贡献 | 人工修改 |
|------|---------|----------|
| 需求分析 | 生成需求文档初稿 | 补充业务细节和边界情况 |
| 架构设计 | 提供分层架构建议 | 根据项目规模简化 |
| 代码生成 | 生成组件和服务代码框架 | 调整实现细节，修复类型错误 |
| 测试编写 | 生成单元测试和属性测试 | 补充边界测试用例 |
| 文档编写 | 生成代码注释和文档 | 校对和补充说明 |

### AI 输出的修改示例

1. **存储方案调整**
   - AI 初始建议使用 LocalStorage
   - 修改为 IndexedDB 以支持更复杂的查询和更大的存储容量

2. **提醒时间设计**
   - AI 建议固定提前 1 小时提醒
   - 修改为用户可选的多个提醒时间选项

3. **错误处理增强**
   - AI 生成的基础错误处理
   - 增加了自定义错误类型（StorageError, TaskValidationError）和更友好的错误提示

## 5. 运行与测试方式

### 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 测试

```bash
# 运行所有测试
npm test

# 监听模式运行测试
npm run test:watch

# 代码检查
npm run lint
```

### 已测试环境

- Node.js v20+
- Windows 11 / macOS
- Chrome 120+ / Firefox 120+ / Edge 120+

### 已知问题与不足

1. **Safari 兼容性**: Safari 的 IndexedDB 实现有一些限制，可能需要额外处理
2. **离线支持**: 当前未实现 Service Worker，不支持完全离线使用
3. **数据导出**: 暂不支持导出任务数据为 JSON/CSV

## 6. 总结与反思

### 如果有更多时间，会如何改进？

1. **云端同步**: 添加后端 API，支持多设备数据同步
2. **PWA 支持**: 添加 Service Worker，支持离线使用和安装到桌面
3. **拖拽排序**: 支持拖拽调整任务顺序
4. **子任务**: 支持任务嵌套，创建子任务
5. **标签系统**: 除了分类外，支持自定义标签
6. **数据统计**: 任务完成率、时间分布等统计图表

### 实现的最大亮点

1. **类型安全**: 全面使用 TypeScript，从类型定义到组件 Props，减少运行时错误
2. **分层架构**: 清晰的 UI/Hook/Service 分层，职责分明，易于维护和测试
3. **用户体验**: 
   - Toast 通知反馈操作结果
   - 响应式布局适配多设备
   - 灵活的提醒时间选项
4. **数据可靠性**: IndexedDB 持久化 + 错误处理 + 降级方案
5. **测试覆盖**: 单元测试 + 属性测试，确保核心逻辑正确性
