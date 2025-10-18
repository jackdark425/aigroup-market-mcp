# 开发者指南

本指南旨在帮助开发者快速上手项目开发，了解代码规范、开发流程和最佳实践。

## 目录

- [环境准备](#环境准备)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [添加新功能](#添加新功能)
- [测试指南](#测试指南)
- [调试技巧](#调试技巧)
- [常见问题](#常见问题)
- [代码审查清单](#代码审查清单)

## 环境准备

### 必需软件

1. **Node.js >= 18**
   - 下载地址：[nodejs.org](https://nodejs.org/)
   - 推荐使用LTS版本
   - 验证安装：`node --version`

2. **TypeScript 5.3+**
   - 项目依赖中已包含
   - 全局安装：`npm install -g typescript`

3. **Git**
   - 用于版本控制
   - 下载地址：[git-scm.com](https://git-scm.com/)

### 开发工具推荐

1. **VS Code**
   - 推荐扩展：
     - ESLint
     - Prettier
     - TypeScript and JavaScript Language Features

2. **Postman** 或 **Thunder Client**
   - 用于测试HTTP接口

### 项目设置

```bash
# 1. 克隆项目
git clone https://github.com/aigroup/aigroup-market-mcp.git
cd aigroup-market-mcp

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，添加你的配置

# 4. 构建项目
npm run build

# 5. 运行项目
npm start  # stdio模式
# 或
npm run start:http  # HTTP模式
```

### 获取API令牌

#### Tushare Token（必需）

1. 访问 [tushare.pro](https://tushare.pro/register) 注册账户
2. 登录后在个人中心获取API Token
3. 将Token添加到 `.env` 文件：
   ```
   TUSHARE_TOKEN=your_token_here
   ```

#### 学生福利

申请2000免费积分：
- 关注Tushare官方小红书并互动
- 加入学生QQ群：290541801
- 完善个人信息（学校邮箱/学号）
- 向管理员提交申请材料

## 开发流程

### 分支管理

```bash
# 主分支
main          # 生产环境代码
develop       # 开发分支

# 功能分支
feature/xxx   # 新功能
bugfix/xxx    # Bug修复
hotfix/xxx    # 紧急修复
```

### 开发步骤

1. **创建功能分支**
   ```bash
   git checkout -b feature/new-tool
   ```

2. **开发功能**
   - 编写代码
   - 添加类型定义
   - 编写测试

3. **本地测试**
   ```bash
   npm run build
   npm start
   ```

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add new tool for xxx"
   ```

5. **推送并创建PR**
   ```bash
   git push origin feature/new-tool
   ```

### 提交信息规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type类型：**
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具链更新

**示例：**
```bash
feat(stock): add support for crypto market

- Implement Binance API integration
- Add crypto market type handling
- Update documentation

Closes #123
```

## 代码规范

### TypeScript规范

#### 1. 使用严格模式

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

#### 2. 类型定义

```typescript
// ✅ 推荐：明确的类型定义
interface StockDataArgs {
  code: string;
  market_type: MarketType;
  start_date?: string;
  end_date?: string;
}

function handleStockData(args: StockDataArgs): Promise<StockResult> {
  // ...
}

// ❌ 避免：使用any
function handleData(args: any): any {
  // ...
}
```

#### 3. 使用接口而非类型别名（对于对象）

```typescript
// ✅ 推荐
interface User {
  id: string;
  name: string;
}

// ✅ 适用场景：联合类型
type Status = 'pending' | 'success' | 'error';
```

#### 4. 可选属性和默认值

```typescript
// ✅ 推荐
interface Config {
  port?: number;
  host?: string;
}

function createServer(config: Config = {}): Server {
  const { port = 3000, host = 'localhost' } = config;
  // ...
}
```

### 错误处理规范

#### 1. 使用自定义错误类

```typescript
import { ValidationError, ApiError } from './core/errors.js';

// ✅ 推荐：使用具体的错误类型
function validateInput(input: string): void {
  if (!input) {
    throw new ValidationError('输入不能为空', {
      field: 'input',
      value: input
    });
  }
}

// ✅ 推荐：捕获并重新抛出具体错误
async function fetchData(url: string): Promise<Data> {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    throw new ApiError('数据获取失败', {
      url,
      originalError: error
    });
  }
}
```

#### 2. 错误处理层次

```typescript
// 工具层：捕获并转换错误
async function handleTool(args: Args): Promise<Result> {
  try {
    validateArgs(args);
    const data = await fetchData(args);
    return processData(data);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error; // 直接抛出验证错误
    }
    // 包装其他错误
    throw new ApiError('工具执行失败', { error });
  }
}

// 管理器层：统一错误处理
async function executeTool(name: string, args: any): Promise<any> {
  try {
    return await toolHandlers[name](args);
  } catch (error) {
    console.error(`Tool ${name} failed:`, error);
    return {
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message,
        details: error.details
      }
    };
  }
}
```

### 异步编程规范

#### 1. 使用async/await

```typescript
// ✅ 推荐：使用async/await
async function getData(): Promise<Data> {
  const response = await fetch(url);
  const data = await response.json();
  return processData(data);
}

// ❌ 避免：使用回调
function getData(callback: (data: Data) => void): void {
  fetch(url).then(res => {
    res.json().then(data => {
      callback(processData(data));
    });
  });
}
```

#### 2. 并发处理

```typescript
// ✅ 推荐：使用Promise.all处理并发
async function fetchMultipleStocks(codes: string[]): Promise<StockData[]> {
  const promises = codes.map(code => fetchStockData(code));
  return await Promise.all(promises);
}

// ✅ 推荐：使用Promise.allSettled处理部分失败
async function fetchWithFallback(codes: string[]): Promise<Result[]> {
  const results = await Promise.allSettled(
    codes.map(code => fetchStockData(code))
  );
  
  return results.map(result => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return { error: result.reason };
  });
}
```

### 命名规范

```typescript
// 变量和函数：camelCase
const userName = 'John';
function getUserData() {}

// 类和接口：PascalCase
class UserManager {}
interface UserData {}

// 常量：UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';

// 类型别名：PascalCase
type MarketType = 'cn' | 'us' | 'hk';

// 私有成员：前缀下划线（可选）
class Service {
  private _cache: Map<string, any>;
}
```

## 添加新功能

### 添加新工具

完整的工具添加流程：

#### 步骤1：定义类型

```typescript
// src/tools/newTool.ts

// 输入参数类型
interface NewToolArgs {
  param1: string;
  param2?: number;
  param3?: string;
}

// 返回结果类型
interface NewToolResult {
  success: boolean;
  data: any;
  message?: string;
}
```

#### 步骤2：实现工具逻辑

```typescript
// src/tools/newTool.ts
import { ValidationError, ApiError } from '../core/errors.js';

export async function handleNewTool(args: NewToolArgs): Promise<NewToolResult> {
  try {
    // 1. 参数验证
    validateArgs(args);
    
    // 2. 获取数据
    const rawData = await fetchData(args);
    
    // 3. 处理数据
    const processedData = processData(rawData);
    
    // 4. 格式化结果
    return formatResult(processedData);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ApiError('新工具执行失败', {
      args,
      originalError: error
    });
  }
}

// 参数验证
function validateArgs(args: NewToolArgs): void {
  if (!args.param1) {
    throw new ValidationError('param1是必需参数', {
      field: 'param1'
    });
  }
  
  if (args.param2 !== undefined && args.param2 < 0) {
    throw new ValidationError('param2必须为非负数', {
      field: 'param2',
      value: args.param2
    });
  }
}

// 数据获取
async function fetchData(args: NewToolArgs): Promise<any> {
  const url = buildUrl(args);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new ApiError('API调用失败', {
      status: response.status,
      statusText: response.statusText
    });
  }
  
  return await response.json();
}

// 数据处理
function processData(data: any): any {
  // 实现数据处理逻辑
  return data;
}

// 结果格式化
function formatResult(data: any): NewToolResult {
  return {
    success: true,
    data: data,
    message: '操作成功'
  };
}
```

#### 步骤3：注册工具

```typescript
// src/core/toolRegistry.ts
import { handleNewTool } from '../tools/newTool.js';

export function registerAllTools(manager: ToolManager): void {
  // ... 现有工具注册
  
  // 注册新工具
  manager.registerTool('new_tool', {
    description: '新工具的描述',
    inputSchema: {
      type: 'object',
      properties: {
        param1: {
          type: 'string',
          description: '参数1的描述'
        },
        param2: {
          type: 'number',
          description: '参数2的描述'
        },
        param3: {
          type: 'string',
          description: '参数3的描述'
        }
      },
      required: ['param1']
    }
  }, handleNewTool);
}
```

#### 步骤4：添加文档

更新README.md，在工具概览表格中添加新工具：

```markdown
| 🆕 **new_tool** | 新工具功能 | 核心特性说明 |
```

#### 步骤5：测试

```bash
# 构建
npm run build

# 启动服务
npm start

# 在Claude中测试
"使用new_tool，param1是xxx"
```

### 添加市场类型

#### 步骤1：创建市场模块

```typescript
// src/tools/stockData/new-market.ts
import { StockDataArgs } from './types.js';

export async function handleNewMarket(args: StockDataArgs): Promise<string> {
  const { code, start_date, end_date } = args;
  
  // 1. 获取市场数据
  const data = await fetchNewMarketData(code, start_date, end_date);
  
  // 2. 处理数据
  const processed = processMarketData(data);
  
  // 3. 格式化输出
  return formatAsMarkdown(processed);
}

async function fetchNewMarketData(
  code: string,
  startDate?: string,
  endDate?: string
): Promise<any> {
  // 实现数据获取逻辑
}

function processMarketData(data: any): any {
  // 实现数据处理逻辑
}

function formatAsMarkdown(data: any): string {
  // 实现Markdown格式化
}
```

#### 步骤2：更新路由

```typescript
// src/tools/stockData/index.ts
import { handleNewMarket } from './new-market.js';

export async function handleStockData(args: StockDataArgs): Promise<string> {
  const { market_type } = args;
  
  switch(market_type) {
    // ... 现有市场类型
    case 'new_market':
      return await handleNewMarket(args);
    default:
      throw new ValidationError(`不支持的市场类型: ${market_type}`);
  }
}
```

#### 步骤3：更新类型定义

```typescript
// src/tools/stockData/types.ts
export type MarketType = 
  | 'cn' | 'us' | 'hk' | 'fx'
  | 'futures' | 'fund' | 'repo'
  | 'convertible_bond' | 'options'
  | 'crypto'
  | 'new_market';  // 新增
```

## 测试指南

### 单元测试

```typescript
// tests/tools/newTool.test.ts
import { describe, it, expect } from 'vitest';
import { handleNewTool } from '../../src/tools/newTool';

describe('newTool', () => {
  it('应该正确处理有效输入', async () => {
    const args = {
      param1: 'test',
      param2: 123
    };
    
    const result = await handleNewTool(args);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
  
  it('应该在缺少必需参数时抛出错误', async () => {
    const args = { param2: 123 };
    
    await expect(handleNewTool(args as any))
      .rejects
      .toThrow(ValidationError);
  });
  
  it('应该正确处理API错误', async () => {
    // Mock API调用失败
    const args = { param1: 'invalid' };
    
    await expect(handleNewTool(args))
      .rejects
      .toThrow(ApiError);
  });
});
```

### 集成测试

```typescript
// tests/integration/tools.test.ts
import { ToolManager } from '../../src/core/ToolManager';
import { registerAllTools } from '../../src/core/toolRegistry';

describe('工具集成测试', () => {
  let manager: ToolManager;
  
  beforeEach(() => {
    manager = new ToolManager();
    registerAllTools(manager);
  });
  
  it('应该注册所有工具', () => {
    const tools = manager.getTools();
    expect(tools.length).toBeGreaterThan(0);
  });
  
  it('应该成功执行工具', async () => {
    const result = await manager.executeTool('new_tool', {
      param1: 'test'
    });
    
    expect(result).toBeDefined();
  });
});
```

### 手动测试

#### stdio模式测试

```bash
# 1. 构建项目
npm run build

# 2. 启动stdio模式
npm start

# 3. 在Claude Desktop中测试
# 配置 claude_desktop_config.json 后重启Claude
```

#### HTTP模式测试

```bash
# 1. 启动HTTP服务器
npm run start:http

# 2. 使用curl测试
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "new_tool",
      "arguments": {
        "param1": "test"
      }
    }
  }'
```

## 调试技巧

### 日志记录

```typescript
// 使用console.error进行调试日志
console.error('[DEBUG] 变量值:', variable);

// 在关键点添加日志
console.error(`[${new Date().toISOString()}] 开始处理请求:`, args);

// 记录错误堆栈
console.error('错误详情:', error.stack);
```

### VS Code调试配置

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug HTTP Server",
      "program": "${workspaceFolder}/build/httpServer.js",
      "preLaunchTask": "npm: build",
      "env": {
        "TUSHARE_TOKEN": "your_token"
      }
    }
  ]
}
```

### 常用调试命令

```bash
# 查看构建输出
npm run build -- --verbose

# 查看运行日志
npm start 2>&1 | tee debug.log

# 检查TypeScript错误
npx tsc --noEmit
```

## 常见问题

### Q: 如何解决依赖冲突？

```bash
# 清理缓存和重新安装
rm -rf node_modules package-lock.json
npm install
```

### Q: 如何处理TypeScript编译错误？

1. 检查 `tsconfig.json` 配置
2. 确保所有类型定义正确
3. 使用 `npx tsc --noEmit` 查看详细错误

### Q: 如何测试特定的工具？

```typescript
// 创建临时测试文件
// test.ts
import { handleNewTool } from './src/tools/newTool';

(async () => {
  const result = await handleNewTool({
    param1: 'test'
  });
  console.log(result);
})();
```

```bash
# 运行测试
npx tsx test.ts
```

### Q: 如何处理API限流？

```typescript
// 实现重试机制
async function fetchWithRetry(
  url: string,
  maxRetries = 3
): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.status === 429) {
        // 限流，等待后重试
        await sleep(1000 * (i + 1));
        continue;
      }
      return await response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

## 代码审查清单

提交代码前，请检查以下项目：

### 代码质量

- [ ] 所有函数都有类型定义
- [ ] 没有使用 `any` 类型（除非必要）
- [ ] 所有变量和函数命名清晰
- [ ] 代码遵循项目的命名规范
- [ ] 没有未使用的导入和变量
- [ ] 代码格式化（运行 `npm run format`）

### 错误处理

- [ ] 所有异步函数都有错误处理
- [ ] 使用适当的自定义错误类
- [ ] 错误信息清晰且有帮助
- [ ] 包含必要的错误上下文

### 功能完整性

- [ ] 功能按预期工作
- [ ] 边界情况已处理
- [ ] 参数验证完整
- [ ] 返回值格式正确

### 文档

- [ ] 添加了必要的代码注释
- [ ] 更新了README文档
- [ ] 更新了类型定义
- [ ] 提交信息清晰

### 测试

- [ ] 添加了单元测试
- [ ] 所有测试通过
- [ ] 手动测试过功能
- [ ] 测试覆盖主要场景

### 性能

- [ ] 没有不必要的API调用
- [ ] 避免了N+1查询问题
- [ ] 大数据集使用流式处理
- [ ] 考虑了缓存策略

### 安全

- [ ] 输入验证充分
- [ ] 没有敏感信息泄露
- [ ] API密钥安全存储
- [ ] SQL注入等安全问题已考虑

## 参考资源

### 官方文档

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tushare API Documentation](https://tushare.pro/document/1)

### 项目文档

- [架构文档](./architecture.md)
- [配置文档](./configuration.md)
- [README](../README.md)

### 社区

- GitHub Issues: 报告问题和建议
- Pull Requests: 贡献代码
- Discussions: 技术讨论

## 贡献指南

我们欢迎所有形式的贡献：

1. **报告问题**：在GitHub Issues中提交bug报告
2. **功能建议**：提出新功能想法
3. **代码贡献**：提交Pull Request
4. **文档改进**：完善项目文档

提交PR前，请确保：
- 代码通过所有测试
- 遵循代码规范
- 更新相关文档
- 提交信息符合规范

---

感谢你对项目的贡献！如有问题，欢迎在Issues中提问。