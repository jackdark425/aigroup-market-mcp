# 项目架构文档

## 架构演进

本项目经过系统性重构，从单体架构演进为模块化架构。

### 优化前的问题

1. **代码重复严重**
   - stdio和HTTP模式存在350+行重复代码
   - 两种模式各自维护工具注册和处理逻辑
   - 修改功能需要在两处同步更新

2. **大文件问题**
   - `stockData.ts` 达到1360行，职责过多
   - 单个文件包含10+种市场类型的处理逻辑
   - 代码可读性和可维护性差

3. **错误处理不统一**
   - 缺乏标准化的错误类型体系
   - 错误信息格式不一致
   - 难以追踪和调试问题

4. **配置硬编码**
   - 配置分散在代码各处
   - 缺乏环境变量支持
   - 多环境部署困难

### 优化后的改进

#### Phase 1: 工具管理器架构 ✅
- ✅ 创建统一的 `ToolManager` 类
- ✅ 提取公共工具注册逻辑到 `toolRegistry.ts`
- ✅ 消除350+行重复代码
- ✅ stdio和HTTP模式共享相同的工具处理逻辑

#### Phase 2: 模块化拆分 ✅
- ✅ 将1360行的 `stockData.ts` 拆分为8个模块
- ✅ 按市场类型组织代码（A股、美股、港股、加密等）
- ✅ 提取公共逻辑到独立模块
- ✅ 改善代码可读性和可维护性

#### Phase 3: 统一错误处理 ✅
- ✅ 实施标准化的错误类型层次结构
- ✅ 统一错误响应格式
- ✅ 增强错误上下文信息
- ✅ 改进错误日志记录

#### Phase 4: 配置管理 ✅
- ✅ 集中化配置管理
- ✅ 支持环境变量配置
- ✅ 添加配置验证机制
- ✅ 创建配置文档

## 核心架构

### 1. 工具管理器架构

#### ToolManager类

`ToolManager` 是核心的工具管理类，负责统一管理所有MCP工具的注册、执行和错误处理。

```typescript
class ToolManager {
  private tools: Map<string, ToolHandler>;
  
  // 注册工具
  registerTool(name: string, handler: ToolHandler): void;
  
  // 获取工具列表
  getTools(): ToolDefinition[];
  
  // 执行工具
  async executeTool(name: string, args: any): Promise<ToolResult>;
}
```

**关键特性：**
- 统一的工具注册接口
- 标准化的工具执行流程
- 自动错误处理和日志记录
- 支持异步工具处理

#### 工具注册中心

`toolRegistry.ts` 作为中央注册表，管理所有可用工具：

```typescript
// 工具定义
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JSONSchema;
}

// 工具处理器
type ToolHandler = (args: any) => Promise<any>;

// 注册所有工具
export function registerAllTools(manager: ToolManager): void {
  manager.registerTool('stock_data', handleStockData);
  manager.registerTool('finance_news', handleFinanceNews);
  // ... 其他工具
}
```

**优势：**
- 集中管理所有工具定义
- 统一的注册流程
- 易于添加新工具
- stdio和HTTP模式共享

### 2. 模块化工具设计

#### stockData模块结构

```
src/tools/stockData/
├── index.ts              # 统一入口，路由分发
├── types.ts              # 类型定义
├── formatter.ts          # 通用格式化逻辑
├── common-tushare.ts     # Tushare通用逻辑
├── cn-market.ts          # A股市场
├── crypto-market.ts      # 加密货币市场
├── simple-markets.ts     # 简单市场（美股、港股等）
└── special-markets.ts    # 特殊市场（期权等）
```

#### 模块职责划分

**index.ts - 路由分发**
```typescript
export async function handleStockData(args: StockDataArgs) {
  const { market_type, code } = args;
  
  switch(market_type) {
    case 'cn':
      return await handleCnMarket(args);
    case 'crypto':
      return await handleCryptoMarket(args);
    case 'us':
    case 'hk':
      return await handleSimpleMarkets(args);
    // ...
  }
}
```

**各市场模块 - 独立实现**
- 每个市场类型有独立的处理逻辑
- 专注于特定市场的数据获取和处理
- 可以独立测试和维护

**公共模块 - 共享逻辑**
- `formatter.ts`: 数据格式化
- `common-tushare.ts`: Tushare API通用调用
- `types.ts`: TypeScript类型定义

### 3. 错误处理体系

#### 错误类型层次

```typescript
// 基础错误类
class BaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// 具体错误类型
class ValidationError extends BaseError {}
class ApiError extends BaseError {}
class ConfigurationError extends BaseError {}
class DataProcessingError extends BaseError {}
```

#### 错误处理流程

```
工具调用
    ↓
参数验证 → ValidationError
    ↓
API调用 → ApiError
    ↓
数据处理 → DataProcessingError
    ↓
返回结果
```

#### 错误响应格式

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

**统一错误处理的好处：**
- 标准化的错误信息
- 详细的错误上下文
- 便于调试和追踪
- 改善用户体验

### 4. 配置管理

#### 配置结构

```typescript
interface Config {
  // API配置
  tushareToken: string;
  binanceApiUrl: string;
  
  // 服务配置
  port: number;
  host: string;
  
  // 功能配置
  defaultPageSize: number;
  csvExportPath: string;
  
  // 环境配置
  nodeEnv: 'development' | 'production';
}
```

#### 配置加载

```typescript
// 1. 从环境变量加载
const config = {
  tushareToken: process.env.TUSHARE_TOKEN,
  binanceApiUrl: process.env.BINANCE_API_URL || DEFAULT_BINANCE_URL,
  // ...
};

// 2. 配置验证
function validateConfig(config: Config): void {
  if (!config.tushareToken) {
    throw new ConfigurationError('TUSHARE_TOKEN is required');
  }
  // ...
}

// 3. 导出配置
export const appConfig = validateConfig(config);
```

#### 配置优先级

1. 环境变量（最高优先级）
2. `.env` 文件
3. 默认值（最低优先级）

## 双模式运行架构

### stdio模式

**入口：** `src/index.ts`

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({ name: 'aigroup-market-mcp' });
const toolManager = new ToolManager();

// 注册所有工具
registerAllTools(toolManager);

// 设置工具处理
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: toolManager.getTools()
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => ({
  content: await toolManager.executeTool(request.params.name, request.params.arguments)
}));

// 启动stdio传输
const transport = new StdioServerTransport();
await server.connect(transport);
```

**特点：**
- 进程间通信，延迟低（1-2ms）
- 无需管理端口
- 自动进程管理
- 适合本地开发

### HTTP模式

**入口：** `src/httpServer.ts`

```typescript
import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

const app = express();
const toolManager = new ToolManager();

// 注册所有工具（与stdio模式共享）
registerAllTools(toolManager);

// MCP端点
app.get('/mcp', async (req, res) => {
  const transport = new SSEServerTransport('/mcp', res);
  await server.connect(transport);
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(3000);
```

**特点：**
- 支持远程访问
- 支持多客户端
- 完整的HTTP日志
- 适合云端部署

## 扩展指南

### 添加新工具

#### 步骤1：创建工具实现

```typescript
// src/tools/newTool.ts
export async function handleNewTool(args: NewToolArgs) {
  try {
    // 1. 参数验证
    validateArgs(args);
    
    // 2. 业务逻辑
    const data = await fetchData(args);
    
    // 3. 数据处理
    const result = processData(data);
    
    // 4. 返回结果
    return formatResult(result);
  } catch (error) {
    throw new ApiError('New tool failed', { error });
  }
}
```

#### 步骤2：在工具注册中心注册

```typescript
// src/core/toolRegistry.ts
import { handleNewTool } from '../tools/newTool.js';

export function registerAllTools(manager: ToolManager) {
  // ... 现有工具
  
  manager.registerTool('new_tool', {
    description: '新工具描述',
    inputSchema: {
      type: 'object',
      properties: {
        param1: { type: 'string', description: '参数1' },
        param2: { type: 'number', description: '参数2' }
      },
      required: ['param1']
    }
  }, handleNewTool);
}
```

#### 步骤3：测试

两种运行模式自动支持新工具，无需额外配置。

### 添加新市场类型

#### 步骤1：创建市场模块

```typescript
// src/tools/stockData/new-market.ts
export async function handleNewMarket(args: StockDataArgs) {
  // 实现新市场的数据获取和处理逻辑
  const data = await fetchMarketData(args);
  return formatMarketData(data);
}
```

#### 步骤2：在index.ts中添加路由

```typescript
// src/tools/stockData/index.ts
import { handleNewMarket } from './new-market.js';

export async function handleStockData(args: StockDataArgs) {
  switch(args.market_type) {
    // ... 现有市场
    case 'new_market':
      return await handleNewMarket(args);
  }
}
```

#### 步骤3：更新类型定义

```typescript
// src/tools/stockData/types.ts
export type MarketType = 
  | 'cn' | 'us' | 'hk' 
  | 'new_market'  // 新增
  | ...;
```

### 自定义错误类型

```typescript
// src/core/errors.ts
export class CustomError extends BaseError {
  constructor(message: string, details?: any) {
    super(message, 'CUSTOM_ERROR', details);
  }
}

// 使用
throw new CustomError('自定义错误', { context: 'some context' });
```

## 性能优化建议

### 已实施的优化

1. **基金数据查询优化**（85%性能提升）
   - 优化数据查询逻辑
   - 减少不必要的API调用
   - 改进数据处理算法

2. **模块化加载**
   - 按需加载市场模块
   - 减少初始化时间

3. **错误处理优化**
   - 避免重复错误处理
   - 统一错误日志格式

### 未来优化方向

1. **缓存机制**
   - 实施Redis缓存
   - 缓存常用数据查询
   - 设置合理的过期时间

2. **连接池**
   - 复用HTTP连接
   - 减少连接开销

3. **并发控制**
   - 限制并发API调用
   - 实施请求队列

4. **数据预加载**
   - 预加载热门股票数据
   - 后台更新缓存

## 最佳实践

### 代码规范

1. **使用TypeScript严格模式**
   ```typescript
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true
     }
   }
   ```

2. **错误处理**
   ```typescript
   // ✅ 推荐
   try {
     const result = await apiCall();
     return processResult(result);
   } catch (error) {
     throw new ApiError('操作失败', { originalError: error });
   }
   
   // ❌ 避免
   const result = await apiCall().catch(() => null);
   ```

3. **参数验证**
   ```typescript
   // ✅ 推荐
   function validateArgs(args: Args): void {
     if (!args.required) {
       throw new ValidationError('缺少必需参数', { field: 'required' });
     }
   }
   ```

### 模块设计

1. **单一职责**
   - 每个模块只负责一个功能
   - 避免过大的文件

2. **明确依赖**
   - 使用显式导入
   - 避免循环依赖

3. **接口优先**
   - 定义清晰的接口
   - 面向接口编程

### 测试策略

1. **单元测试**
   - 测试单个函数
   - 模拟外部依赖

2. **集成测试**
   - 测试模块间交互
   - 验证端到端流程

3. **错误场景测试**
   - 测试各种错误情况
   - 验证错误处理逻辑

## 总结

通过系统性的架构重构，本项目实现了：

1. **代码质量提升**
   - 消除重复代码
   - 改善可读性和可维护性
   - 增强类型安全

2. **开发效率提升**
   - 易于添加新功能
   - 统一的开发模式
   - 完善的错误处理

3. **运维友好**
   - 灵活的配置管理
   - 双模式支持
   - 详细的日志记录

4. **扩展性强**
   - 模块化设计
   - 清晰的扩展点
   - 开闭原则

这些改进为项目的长期发展奠定了坚实的基础。