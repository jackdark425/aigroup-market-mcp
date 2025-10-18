# MCP 协议升级和文档优化方案

## 🔴 发现的问题

### 1. MCP SDK 版本严重过时

**当前版本**: `0.6.0`  
**最新版本**: `1.20.1`  
**版本差距**: 跨越了 20+ 个版本，从 0.x 到 1.x

### 2. 潜在的兼容性问题

从 0.6.0 到 1.20.1 的重大变化：
- ✅ API 可能有破坏性更改
- ✅ 新增了更多功能和特性
- ✅ 性能优化和 Bug 修复
- ✅ 类型定义可能有变化

---

## 📋 升级计划

### Phase 1: 依赖升级（优先）

#### 1.1 更新 package.json

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.20.1",  // 从 0.6.0 升级
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.19.2",
    "node-fetch": "^3.3.2"
  }
}
```

#### 1.2 检查 API 变更

需要审查以下文件的 API 使用：
- ✅ `src/index.ts` - Server 初始化和请求处理
- ✅ `src/httpServer.ts` - HTTP transport
- ✅ `src/core/ToolManager.ts` - 工具定义结构

可能的 API 变更：
1. **Server 构造函数参数**
2. **RequestHandler 签名**
3. **Tool 定义结构**
4. **Transport 初始化**

### Phase 2: 代码适配

#### 2.1 检查点清单

- [ ] Server 初始化方式是否变更
- [ ] ListToolsRequestSchema 结构是否变更
- [ ] CallToolRequestSchema 结构是否变更
- [ ] Tool 返回格式是否变更
- [ ] Error 处理方式是否变更
- [ ] Transport 连接方式是否变更

#### 2.2 建议的代码审查

**src/index.ts**:
```typescript
// 当前代码
const server = new Server(
  {
    name: "aigroup-market-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 可能需要检查的点：
// 1. Server 构造函数参数格式是否正确
// 2. capabilities 结构是否完整
// 3. 是否需要添加新的 capabilities（如 resources, prompts）
```

### Phase 3: 文档优化

#### 3.1 工具说明文档改进

**当前问题**：
- ❌ 工具描述可能不够详细
- ❌ 参数说明可能不够清晰
- ❌ 缺少使用示例
- ❌ 错误处理说明不完善

**优化建议**：

1. **增强工具描述**
```typescript
// 优化前
description: "获取股票数据"

// 优化后
description: `获取指定股票/加密资产的历史行情数据

支持的市场类型：
- A股（cn）: 日线、周线、月线、分钟线
- 美股（us）: 日线行情
- 港股（hk）: 日线行情
- 外汇（fx）: 外汇行情
- 期货（futures）: 期货行情
- 基金（fund）: 基金净值
- 债券逆回购（repo）: 逆回购行情
- 可转债（convertible_bond）: 可转债行情
- 期权（options）: 期权行情
- 加密货币（crypto）: 通过 Binance API 获取

技术指标支持：
- MACD、RSI、KDJ、BOLL、MA（需明确指定参数）

输出格式：
- Markdown 表格（默认）
- CSV 文件导出
- JSON 文件导出`
```

2. **改进参数说明**
```typescript
// 优化参数描述，添加更多示例和说明
parameters: {
  type: "object",
  properties: {
    code: {
      type: "string",
      description: `股票/合约/加密资产代码

示例：
- A股：000001.SZ（平安银行）、600000.SH（浦发银行）
- 美股：AAPL（苹果）、TSLA（特斯拉）
- 港股：00700.HK（腾讯）、09988.HK（阿里巴巴）
- 外汇：USDCNH.FXCM（美元人民币）
- 期货：CU2501.SHF（铜期货）
- 基金：159919.SZ（沪深300ETF）
- 逆回购：204001.SH（GC001）
- 可转债：113008.SH（电气转债）
- 期权：10001313.SH（50ETF期权）
- 加密：BTCUSDT、ETHUSDT（推荐标准写法）

注意：
- 加密货币支持 BTC-USDT 或 BTC/USDT 格式，会自动转换
- USD 会自动映射为 USDT（如 BTC-USD → BTCUSDT）
- 常见报价币：USDT、USDC、FDUSD、TUSD、BTC、ETH`,
      examples: [
        "000001.SZ",
        "AAPL", 
        "00700.HK",
        "BTCUSDT"
      ]
    },
    market_type: {
      type: "string",
      description: `市场类型（必需）

可选值详解：
- cn: A股市场（上交所、深交所、北交所）
- us: 美股市场（纳斯达克、纽交所）
- hk: 港股市场（港交所）
- fx: 外汇市场
- futures: 期货市场（商品期货、金融期货）
- fund: 基金市场（场内基金、ETF）
- repo: 债券逆回购市场
- convertible_bond: 可转债市场
- options: 期权市场
- crypto: 加密货币市场（Binance）`,
      enum: [
        "cn", "us", "hk", "fx", "futures", 
        "fund", "repo", "convertible_bond", 
        "options", "crypto"
      ]
    },
    indicators: {
      type: "string",
      description: `技术指标计算（可选）

支持的指标及参数格式：
1. MACD: macd(快线,慢线,信号线)
   - 示例: macd(12,26,9)
   - 说明: 默认参数 12、26、9

2. RSI: rsi(周期)
   - 示例: rsi(14)
   - 说明: 默认周期 14

3. KDJ: kdj(K周期,K平滑,D平滑)
   - 示例: kdj(9,3,3)
   - 说明: 默认参数 9、3、3

4. 布林带: boll(周期,标准差倍数)
   - 示例: boll(20,2)
   - 说明: 默认参数 20、2

5. 移动平均: ma(周期)
   - 示例: ma(5) ma(10) ma(20)
   - 说明: 可多次指定不同周期

组合使用示例：
- "macd(12,26,9) rsi(14)"
- "kdj(9,3,3) boll(20,2) ma(30)"
- "macd(5,10,5) ma(5) ma(10) ma(20)"

注意：必须明确指定所有参数，不支持省略`,
      examples: [
        "macd(12,26,9)",
        "rsi(14) macd(12,26,9)",
        "ma(5) ma(10) ma(20)"
      ]
    }
  },
  required: ["code", "market_type"]
}
```

#### 3.2 添加工具分类和标签

```typescript
// 为每个工具添加分类和标签，便于用户理解
export interface EnhancedToolDefinition extends ToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
  
  // 新增字段
  category?: string;  // 分类：stock, fund, macro, news, trading
  tags?: string[];    // 标签：real-time, historical, analysis
  version?: string;   // 工具版本
  examples?: Array<{  // 使用示例
    description: string;
    input: any;
    output?: string;
  }>;
}
```

#### 3.3 README 优化建议

**添加内容**：

1. **快速开始示例**
```markdown
## 🚀 快速开始示例

### 示例1：查询 A股行情
```json
{
  "tool": "stock_data",
  "arguments": {
    "code": "000001.SZ",
    "market_type": "cn",
    "start_date": "20241001",
    "end_date": "20241017"
  }
}
```

### 示例2：查询美股行情并计算技术指标
```json
{
  "tool": "stock_data",
  "arguments": {
    "code": "AAPL",
    "market_type": "us",
    "start_date": "20241001",
    "end_date": "20241017",
    "indicators": "macd(12,26,9) rsi(14)"
  }
}
```

### 示例3：查询加密货币
```json
{
  "tool": "stock_data",
  "arguments": {
    "code": "BTCUSDT",
    "market_type": "crypto",
    "start_date": "20241001",
    "end_date": "20241017"
  }
}
```
```

2. **工具使用最佳实践**
```markdown
## 💡 最佳实践

### 1. 选择合适的市场类型
- 确保 `code` 格式与 `market_type` 匹配
- A股必须带后缀 .SZ 或 .SH
- 港股必须带后缀 .HK
- 美股直接使用股票代码（如 AAPL）

### 2. 技术指标计算
- 指标计算需要历史数据，建议查询时间范围 >= 30天
- 多个指标用空格分隔
- 必须明确指定所有参数

### 3. 数据导出
- CSV 适合大量数据分析
- JSON 适合程序化处理
- Markdown 适合直接查看

### 4. 错误处理
- 检查股票代码格式是否正确
- 确认交易日期范围有效
- 验证市场类型参数
```

3. **完整的工具列表和分类**
```markdown
## 📚 完整工具列表

### 📈 行情数据类

#### stock_data - 万能行情工具 ⭐⭐⭐⭐⭐
支持 10 种市场类型的历史行情查询
- A股、美股、港股
- 外汇、期货、期权
- 基金、逆回购、可转债
- 加密货币

#### stock_data_minutes - 分钟K线
支持 A股和加密货币的分钟级行情
- 1分钟、5分钟、15分钟
- 30分钟、60分钟

#### index_data - 指数行情
查询股票指数的历史数据
- 上证指数、深证成指
- 沪深300、中证500

### 💰 财务数据类

#### company_performance - A股财务
全面的上市公司财务数据
- 利润表、资产负债表、现金流量表
- 业绩预告、业绩快报
- 财务指标、分红送股

#### company_performance_hk - 港股财务
港股上市公司财务报表

#### company_performance_us - 美股财务
美股上市公司财务报表

### 📰 新闻资讯类

#### finance_news - 财经新闻搜索
通过关键词搜索财经新闻

#### hot_news_7x24 - 7×24热点
实时热点新闻推送

### 📊 基金数据类

#### fund_data - 公募基金
基金净值、持仓、分红等信息

#### fund_manager_by_name - 基金经理
根据姓名查询基金经理信息

### 💸 市场交易类

#### block_trade - 大宗交易
大宗交易成交明细

#### money_flow - 资金流向
个股和大盘资金流向

#### margin_trade - 融资融券
融资融券交易数据

#### dragon_tiger_inst - 龙虎榜
龙虎榜机构成交明细

### 📉 宏观经济类

#### macro_econ - 宏观数据
CPI、GDP、利率等宏观经济指标

### 🔧 其他工具

#### convertible_bond - 可转债
可转债发行和基本信息

#### csi_index_constituents - 指数成分股
中证指数成分股和权重

#### current_timestamp - 时间戳
获取当前东八区时间
```

---

## 🎯 实施步骤

### 立即执行（P0）

1. **升级 MCP SDK**
   ```bash
   npm install @modelcontextprotocol/sdk@^1.20.1
   npm run build
   npm test  # 如果有测试
   ```

2. **验证兼容性**
   - 测试所有工具是否正常工作
   - 检查错误处理是否正确
   - 验证与 Claude Desktop / Cline 的兼容性

3. **更新版本号**
   - package.json version: 1.0.1 → 1.1.0
   - 反映重大升级

### 短期优化（P1 - 1周内）

1. **优化工具文档**
   - 为每个工具添加详细描述
   - 增加使用示例
   - 添加参数说明和约束

2. **更新 README**
   - 添加快速开始示例
   - 完善工具列表和分类
   - 增加最佳实践指南

3. **添加 CHANGELOG**
   - 记录版本变更
   - 说明新功能和修复

### 中期改进（P2 - 2周内）

1. **添加工具分类和标签**
   - 实现 EnhancedToolDefinition
   - 为所有工具添加分类

2. **完善错误提示**
   - 提供更友好的错误信息
   - 添加常见问题的解决建议

3. **性能优化**
   - 缓存策略优化
   - 并发请求优化

---

## 📝 检查清单

### 升级前检查
- [ ] 备份当前代码（git commit）
- [ ] 记录当前版本的工作状态
- [ ] 准备回滚方案

### 升级中检查
- [ ] package.json 更新成功
- [ ] npm install 无错误
- [ ] TypeScript 编译成功
- [ ] 所有依赖版本兼容

### 升级后验证
- [ ] 所有工具正常工作
- [ ] MCP 协议通信正常
- [ ] 错误处理正确
- [ ] 性能无明显下降
- [ ] 与客户端兼容性良好

### 文档更新
- [ ] README.md 更新完成
- [ ] 工具描述优化完成
- [ ] CHANGELOG.md 创建
- [ ] API 文档更新

---

## 🚨 风险评估

### 高风险项
1. **API 破坏性变更** - 可能导致工具无法正常工作
   - 缓解：详细测试每个工具
   - 回滚：保留旧版本代码

2. **类型定义变更** - 可能导致 TypeScript 编译错误
   - 缓解：逐步修复类型错误
   - 回滚：使用旧版本 SDK

### 中风险项
1. **性能变化** - 新版本可能有性能差异
   - 缓解：进行性能测试对比

2. **依赖冲突** - 新版本可能引入依赖冲突
   - 缓解：使用 npm ls 检查依赖树

---

## 📊 预期收益

### 技术收益
- ✅ 使用最新的 MCP 协议特性
- ✅ 获得性能优化和 Bug 修复
- ✅ 更好的类型支持
- ✅ 未来兼容性保证

### 用户体验收益
- ✅ 更清晰的工具说明
- ✅ 更好的错误提示
- ✅ 更完善的文档
- ✅ 更多的使用示例

### 维护性收益
- ✅ 跟上官方更新节奏
- ✅ 减少技术债务
- ✅ 便于社区贡献
- ✅ 更好的长期支持

---

**优先级**: 🔴 高优先级 - 建议尽快执行
**预计时间**: 2-3 天（升级 + 测试 + 文档）
**影响范围**: 全局（所有工具和文档）