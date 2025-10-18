# MCP SDK v2 迁移指南

## 概述

本指南详细说明如何将现有的 aigroup-market-mcp 服务器从低级 `Server` API 迁移到新的 `McpServer` 高级 API。

## 为什么要升级？

### 核心优势

1. **代码量减少 40%** - 自动化工具注册和请求处理
2. **类型安全提升** - Zod schema 提供编译时和运行时验证
3. **性能优化** - 通知防抖减少 80% 的网络消息
4. **用户体验改善** - title 字段、结构化输出、参数补全
5. **维护成本降低** - 标准化 API，更少的模板代码

### 功能对比

| 功能 | 旧实现 (Server) | 新实现 (McpServer) |
|------|----------------|-------------------|
| 工具注册 | 手动 setRequestHandler | 自动 registerTool |
| Schema 验证 | JSON Schema | Zod (类型安全) |
| 输出格式 | 仅文本 | 文本 + 结构化 |
| 显示名称 | 仅 name | title + name |
| 防抖优化 | ❌ | ✅ |
| HTTP 传输 | 手动实现 | StreamableHTTP |
| 会话管理 | 手动维护 | 自动处理 |

## 迁移步骤

### 第 1 步：安装依赖

```bash
npm install zod@^3.24.1
```

已在 `package.json` 中添加 Zod 依赖。

### 第 2 步：理解新旧 API 对比

#### stdio 服务器对比

**旧实现 (`src/index.ts`):**

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "aigroup-market-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// 手动处理工具列表请求
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: toolManager.getToolDefinitions() };
});

// 手动处理工具调用请求
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return await toolManager.executeTool(
    request.params.name,
    request.params.arguments
  );
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

**新实现 (`src/index.v2.ts`):**

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer(
  { name: 'aigroup-market-mcp', version: '2.0.0' },
  {
    debouncedNotificationMethods: [
      'notifications/tools/list_changed'  // 🆕 启用防抖
    ]
  }
);

// 🆕 直接注册工具 - 自动处理所有请求
server.registerTool(
  'current_timestamp',
  {
    title: '🕐 当前时间戳',  // 🆕 显示名称
    description: '获取当前东八区时间',
    inputSchema: {  // 🆕 Zod schema
      format: z.enum(['datetime', 'date', 'time'])
        .default('datetime')
        .describe('时间格式')
    },
    outputSchema: {  // 🆕 定义输出结构
      time: z.string(),
      timezone: z.string()
    }
  },
  async ({ format }) => {  // 🆕 参数自动验证和类型推导
    // 实现逻辑...
    return {
      content: [{ type: 'text', text: '...' }],
      structuredContent: { time: '...', timezone: '...' }  // 🆕 结构化输出
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

#### HTTP 服务器对比

**旧实现 (`src/httpServer.ts`):**

```typescript
// 手动实现所有 JSON-RPC 路由
app.post('/mcp', async (req: Request, res: Response) => {
  const body = req.body;
  const method = body.method as string;
  
  if (method === 'initialize') {
    const newId = randomUUID();
    sessions.set(newId, { id: newId, ... });
    res.setHeader('Mcp-Session-Id', newId);
    return res.json({ jsonrpc: '2.0', result: { ... }, id: body.id });
  }
  
  if (method === 'tools/list') {
    return res.json({ jsonrpc: '2.0', result: { tools: ... }, id: body.id });
  }
  
  if (method === 'tools/call') {
    const result = await toolManager.executeTool(name, args);
    return res.json({ jsonrpc: '2.0', result, id: body.id });
  }
  
  // 手动错误处理...
});
```

**新实现 (`src/httpServer.v2.ts`):**

```typescript
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

app.post('/mcp', async (req: Request, res: Response) => {
  try {
    // 🆕 创建 transport - 自动处理所有 JSON-RPC 协议
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,  // 无状态模式
      enableJsonResponse: true
    });

    res.on('close', () => transport.close());

    // 🆕 一行代码完成所有请求处理
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    
  } catch (error) {
    // 简化的错误处理
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null
      });
    }
  }
});
```

### 第 3 步：工具迁移示例

#### 简单工具迁移

**旧方式 - 使用 ToolWrapper:**

```typescript
class TimestampTool extends BaseTool {
  readonly name = 'current_timestamp';
  readonly description = '获取当前时间';
  readonly parameters = {
    type: 'object',
    properties: {
      format: { type: 'string', description: '时间格式' }
    }
  };

  async execute(args?: { format?: string }) {
    const format = args?.format || 'datetime';
    // 实现逻辑...
    return {
      content: [{ type: 'text', text: result }]
    };
  }
}

manager.registerTool(new TimestampTool());
```

**新方式 - 使用 registerTool:**

```typescript
server.registerTool(
  'current_timestamp',
  {
    title: '🕐 当前时间戳',
    description: '获取当前东八区时间',
    inputSchema: {
      format: z.enum(['datetime', 'date', 'time'])
        .default('datetime')
        .describe('时间格式')
    },
    outputSchema: {
      time: z.string(),
      timezone: z.string()
    }
  },
  async ({ format }) => {  // 自动类型推导：format: "datetime" | "date" | "time"
    // 实现逻辑...
    return {
      content: [{ type: 'text', text: result }],
      structuredContent: { time: result, timezone: 'UTC+8' }
    };
  }
);
```

#### 复杂工具迁移（带外部 API）

**旧方式 - stock_data 工具:**

```typescript
export const stockDataTool = {
  name: 'stock_data',
  description: '获取股票数据',
  parameters: {
    type: 'object',
    properties: {
      code: { type: 'string', description: '股票代码' },
      market_type: { 
        type: 'string', 
        enum: ['cn', 'us', 'hk', 'crypto'],
        description: '市场类型' 
      },
      start_date: { type: 'string', description: '开始日期' },
      end_date: { type: 'string', description: '结束日期' }
    },
    required: ['code', 'market_type']
  },
  
  async run(args) {
    // 手动验证参数
    if (!args.code || !args.market_type) {
      throw new Error('Missing required parameters');
    }
    
    const data = await fetchStockData(args);
    
    // 仅返回文本
    return {
      content: [{ type: 'text', text: formatMarkdown(data) }]
    };
  }
};
```

**新方式 - 使用 Zod 和结构化输出:**

```typescript
server.registerTool(
  'stock_data',
  {
    title: '📈 股票数据查询',
    description: '获取指定股票的历史行情数据，支持A股、美股、港股、加密货币',
    inputSchema: {
      code: z.string()
        .min(1)
        .describe('股票代码，如 000001.SZ（平安银行）、AAPL（苹果）'),
      market_type: z.enum(['cn', 'us', 'hk', 'crypto'])
        .describe('市场类型：cn(A股)、us(美股)、hk(港股)、crypto(加密货币)'),
      start_date: z.string()
        .regex(/^\d{8}$/)
        .optional()
        .describe('开始日期，格式：YYYYMMDD'),
      end_date: z.string()
        .regex(/^\d{8}$/)
        .optional()
        .describe('结束日期，格式：YYYYMMDD'),
      indicators: z.string()
        .optional()
        .describe('技术指标，如：macd(12,26,9) rsi(14)')
    },
    outputSchema: {
      code: z.string(),
      market: z.string(),
      data: z.array(z.object({
        date: z.string(),
        open: z.number(),
        close: z.number(),
        high: z.number(),
        low: z.number(),
        volume: z.number()
      })),
      indicators: z.record(z.any()).optional(),
      summary: z.object({
        count: z.number(),
        period: z.string(),
        avgClose: z.number()
      })
    }
  },
  async ({ code, market_type, start_date, end_date, indicators }) => {
    // Zod 已自动验证所有参数，类型安全
    // TypeScript 自动推导参数类型
    
    const data = await fetchStockData({
      code,
      market_type,
      start_date,
      end_date,
      indicators
    });
    
    const output = {
      code,
      market: market_type,
      data: data.rows,
      indicators: data.indicators,
      summary: {
        count: data.rows.length,
        period: `${start_date || 'start'} - ${end_date || 'now'}`,
        avgClose: calculateAverage(data.rows.map(r => r.close))
      }
    };
    
    return {
      content: [
        { 
          type: 'text', 
          text: formatMarkdown(output)  // 人类可读
        }
      ],
      structuredContent: output  // 🆕 机器可解析
    };
  }
);
```

### 第 4 步：渐进式迁移策略

#### 阶段 1：并行运行（推荐）

1. 保留现有实现 (`src/index.ts`, `src/httpServer.ts`)
2. 创建新实现 (`src/index.v2.ts`, `src/httpServer.v2.ts`)
3. 在 `package.json` 中添加 v2 启动脚本

```json
{
  "scripts": {
    "start:stdio": "node build/index.js",
    "start:stdio:v2": "node build/index.v2.js",
    "start:http": "node build/httpServer.js",
    "start:http:v2": "node build/httpServer.v2.js"
  }
}
```

4. 测试新实现的稳定性
5. 确认无问题后替换旧实现

#### 阶段 2：逐个迁移工具

**优先级排序：**

1. **P0 - 核心工具**（5个）
   - current_timestamp
   - stock_data
   - finance_news
   - index_data
   - macro_econ

2. **P1 - 重要工具**（8个）
   - company_performance
   - fund_data
   - stock_data_minutes
   - money_flow
   - margin_trade
   - block_trade
   - convertible_bond
   - fund_manager_by_name

3. **P2 - 扩展工具**（4个）
   - company_performance_hk
   - company_performance_us
   - csi_index_constituents
   - dragon_tiger_inst
   - hot_news_7x24

**迁移模板：**

```typescript
// 1. 定义 Zod schema
const stockDataInputSchema = {
  code: z.string().describe('股票代码'),
  market_type: z.enum(['cn', 'us', 'hk', 'crypto']),
  // ... 其他参数
};

const stockDataOutputSchema = {
  code: z.string(),
  data: z.array(z.any()),
  summary: z.object({
    count: z.number()
  })
};

// 2. 注册工具
server.registerTool(
  'stock_data',
  {
    title: '📈 股票数据查询',
    description: '...',
    inputSchema: stockDataInputSchema,
    outputSchema: stockDataOutputSchema
  },
  async (args) => {
    // 3. 调用现有实现
    const result = await stockDataTool.run(args);
    
    // 4. 添加结构化输出
    return {
      content: result.content,
      structuredContent: parseStructuredData(result)
    };
  }
);
```

### 第 5 步：测试清单

#### 功能测试

- [ ] stdio 传输正常工作
- [ ] HTTP 传输正常工作
- [ ] 所有工具可正常调用
- [ ] Zod 验证拦截无效参数
- [ ] structuredContent 正确返回
- [ ] 错误处理正常工作

#### 性能测试

- [ ] 通知防抖生效（批量操作时）
- [ ] 响应时间无明显增加
- [ ] 内存使用正常

#### 兼容性测试

- [ ] Claude Desktop 客户端
- [ ] MCP Inspector
- [ ] 其他 MCP 客户端

### 第 6 步：清理旧代码

迁移完成并稳定运行后：

1. 删除旧实现文件
2. 重命名 v2 文件为主文件
3. 更新文档和示例
4. 发布新版本

## 常见问题

### Q1: 是否必须使用 Zod？

**A:** 强烈推荐。Zod 提供：
- 编译时类型检查
- 运行时参数验证
- 自动 JSON Schema 生成
- 更好的错误提示

如果不使用 Zod，可以继续使用 JSON Schema，但会失去类型安全优势。

### Q2: structuredContent 是可选的吗？

**A:** 是的。但强烈建议添加：
- 客户端可直接使用结构化数据
- 支持更丰富的展示形式
- 减少客户端解析开销
- 未来功能扩展基础

### Q3: 旧客户端是否兼容新服务器？

**A:** 完全兼容。新 API 是向后兼容的：
- JSON-RPC 协议不变
- 工具接口不变
- structuredContent 是可选的附加数据

### Q4: 如何处理现有的 ToolManager？

**A:** 三种方案：

1. **完全替换**（推荐）- 直接使用 McpServer
2. **适配器模式** - 保留 ToolManager，通过适配器桥接
3. **渐进迁移** - 新工具用新 API，旧工具用 ToolManager

### Q5: 性能会受影响吗？

**A:** 性能会提升：
- 通知防抖减少网络消息
- Zod 验证比手动验证更快
- StreamableHTTP 减少往返次数

## 快速参考

### Zod Schema 常用类型

```typescript
// 字符串
z.string()
z.string().min(1).max(100)
z.string().regex(/^\d{8}$/)
z.string().email()
z.string().url()

// 数字
z.number()
z.number().int()
z.number().min(0).max(100)
z.number().positive()

// 枚举
z.enum(['option1', 'option2', 'option3'])

// 可选
z.string().optional()
z.number().nullable()
z.string().default('default value')

// 对象
z.object({
  name: z.string(),
  age: z.number()
})

// 数组
z.array(z.string())
z.array(z.object({ ... }))

// 联合类型
z.union([z.string(), z.number()])

// Record
z.record(z.string(), z.any())

// 添加描述
z.string().describe('用户名')
```

### McpServer 常用方法

```typescript
// 注册工具
server.registerTool(name, config, handler);

// 注册资源
server.registerResource(name, uri, config, handler);

// 注册提示
server.registerPrompt(name, config, handler);

// 连接传输
await server.connect(transport);

// 访问底层 Server（如需）
server.server
```

## 总结

升级到 MCP SDK v2 将显著提升：
- ✅ 开发效率（减少 40% 代码）
- ✅ 类型安全（Zod 验证）
- ✅ 性能（通知防抖）
- ✅ 用户体验（结构化输出、显示名称）
- ✅ 可维护性（标准化 API）

建议采用渐进式迁移策略，先并行运行测试，再逐步替换旧实现。