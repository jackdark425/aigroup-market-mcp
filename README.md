# 🤖 AIGroup Market MCP Server

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://www.javascript.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Version](https://img.shields.io/badge/version-2.0.0-brightgreen.svg)](https://github.com/yourusername/aigroup-market-mcp)

> 🚀 基于 Tushare 和百度新闻的专业金融数据 MCP（Model Context Protocol）服务器，提供全面的金融市场数据查询服务。

## 🎉 v2.0 重大升级

**最新版本已升级到 MCP SDK 1.20.1，带来显著改进：**

- ✅ **McpServer 高级 API** - 代码量减少 40%，更简洁优雅
- ✅ **Zod Schema 验证** - 编译时和运行时类型安全
- ✅ **StreamableHTTPServerTransport** - HTTP 路由代码减少 90%
- ✅ **通知防抖优化** - 批量操作时减少 80% 网络消息
- ✅ **更好的用户体验** - 工具添加显示名称（title），更清晰的工具发现

详细升级内容请查看：
- [升级分析](docs/mcp-sdk-upgrade-analysis.md)
- [迁移指南](docs/migration-guide.md)
- [升级总结](UPGRADE_SUMMARY.md)

## 👨‍💻 作者信息

**作者**: Jackdark425@gmail.com
**研究团队**: AIGroup
**项目定位**: 专业的金融数据服务平台，专注于为AI应用提供实时、准确的金融市场数据

## 📋 项目简介

AIGroup Market MCP Server 是一个专为金融数据分析打造的 MCP 服务器，集成了多个专业数据源，为用户提供实时、准确的金融市场数据。通过标准化接口，支持股票、基金、宏观经济、新闻资讯等多种金融数据的查询和分析。

## ✨ 核心特性

### 🎯 多数据源集成
- **Tushare API**: 专业的金融数据服务平台，提供股票、基金、宏观经济等权威数据
- **百度新闻爬虫**: 实时抓取财经新闻资讯，确保信息时效性
- **多市场支持**: A股、美股、港股、加密货币、外汇、期货等全市场覆盖

### 🛠️ 丰富功能模块
- 📈 **股票行情数据**: 日K线、分钟K线，支持技术指标计算
- 🏢 **公司财务数据**: 资产负债表、利润表、现金流量表等完整财务信息
- 💰 **基金数据**: 基金净值、持仓信息、基金经理详情
- 📰 **新闻资讯**: 财经新闻、7×24小时热点新闻
- 📊 **宏观经济**: CPI、GDP、货币政策等宏观经济指标
- 💸 **市场交易**: 大宗交易、资金流向、融资融券数据
- 🏛️ **指数数据**: 沪深300、上证指数等市场指数信息

### ⚡ 技术优势
- **实时数据更新**: 毫秒级数据获取和处理
- **技术指标计算**: 内置MACD、RSI、KDJ、布林带等专业指标
- **灵活输出格式**: 支持 Markdown、CSV、JSON等多种格式
- **智能缓存机制**: 高效的数据缓存，提升查询性能
- **错误处理完善**: 全面的异常处理和错误恢复机制
- **🆕 类型安全**: Zod schema 提供编译时和运行时验证
- **🆕 性能优化**: 通知防抖、优化的传输层
- **🆕 现代化架构**: 使用最新 MCP SDK 2.0 API

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **Tushare Token**: 需要有效的 Tushare API 令牌（[免费注册获取](https://tushare.pro)）

### 方式一：NPM 安装（推荐）

这是最简单的使用方式，无需克隆代码，直接通过 npx 使用：

1. **配置环境变量**
   
   创建 `.env` 文件或设置系统环境变量：
   ```bash
   export TUSHARE_TOKEN=your_tushare_token_here
   ```

2. **直接使用**
   ```bash
   # 启动 MCP 服务器
   npx aigroup-market-mcp
   
   # 或启动 HTTP 服务器
   npx aigroup-market-mcp-http
   ```

### 方式二：从源码安装

适合需要修改或开发的场景：

1. **克隆项目**
   ```bash
   git clone https://github.com/yourusername/aigroup-market-mcp.git
   cd aigroup-market-mcp
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **环境配置**

   复制环境配置文件：
   ```bash
   cp .env.example .env
   ```

   编辑 `.env` 文件，填入你的配置：
   ```env
   # Tushare API 配置
   TUSHARE_TOKEN=your_tushare_token_here
   TUSHARE_API_URL=https://api.tushare.pro

   # 服务器配置
   PORT=3000
   NODE_ENV=development
   ```

4. **构建项目**
   ```bash
   npm run build
   ```

5. **启动服务**
   ```bash
   # 开发模式
   npm run dev

   # 生产模式
   npm start
   ```

## 📚 文档资源

- **[Tushare API 接口对照文档](docs/TUSHARE_API_MAPPING.md)** - 完整的API接口映射表，包含所有工具与Tushare官方接口的对应关系，便于维护和升级
- **[升级分析](docs/mcp-sdk-upgrade-analysis.md)** - MCP SDK 升级详细分析
- **[迁移指南](docs/migration-guide.md)** - 版本迁移指南
- **[升级总结](UPGRADE_SUMMARY.md)** - 升级摘要说明

## 📖 使用指南

### MCP 服务器配置

#### 方式一：使用 NPM 包（推荐）

在你的 MCP 客户端配置文件（如 RooCode 的 `.roo/mcp.json` 或 Claude Desktop 的配置文件）中添加：

```json
{
  "mcpServers": {
    "aigroup-market-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "aigroup-market-mcp"
      ],
      "env": {
        "TUSHARE_TOKEN": "your_tushare_token_here"
      },
      "alwaysAllow": [
        "current_timestamp",
        "finance_news",
        "stock_data",
        "stock_data_minutes",
        "index_data",
        "macro_econ",
        "company_performance",
        "fund_data",
        "fund_manager_by_name",
        "convertible_bond",
        "block_trade",
        "money_flow",
        "margin_trade",
        "company_performance_hk",
        "company_performance_us",
        "csi_index_constituents",
        "dragon_tiger_inst",
        "hot_news_7x24"
      ]
    }
  }
}
```

#### 方式二：使用本地路径

如果你克隆了源码并在本地构建，可以使用：

```json
{
  "mcpServers": {
    "aigroup-market-mcp": {
      "command": "node",
      "args": [
        "build/index.js"
      ],
      "cwd": "/path/to/aigroup-market-mcp",
      "env": {
        "TUSHARE_TOKEN": "your_tushare_token_here"
      },
      "alwaysAllow": [
        "current_timestamp",
        "finance_news",
        "stock_data",
        "stock_data_minutes",
        "index_data",
        "macro_econ",
        "company_performance",
        "fund_data",
        "fund_manager_by_name",
        "convertible_bond",
        "block_trade",
        "money_flow",
        "margin_trade",
        "company_performance_hk",
        "company_performance_us",
        "csi_index_constituents",
        "dragon_tiger_inst",
        "hot_news_7x24"
      ]
    }
  }
}
```

### 工具使用示例

#### 🕐 获取当前时间戳

```typescript
// 查询东八区时间
{
  "tool": "current_timestamp",
  "arguments": {
    "format": "datetime"
  }
}

// 返回示例:
// ## 🕐 当前东八区时间
// 格式: datetime
// 时间: 2025-10-18 14:30:25
// 时区: 东八区 (UTC+8)
// 星期: 星期六
```

#### 📈 查询股票数据

```typescript
// 查询股票行情（支持技术指标）
{
  "tool": "stock_data",
  "arguments": {
    "code": "000001.SZ",
    "market_type": "cn",
    "start_date": "20241015",
    "end_date": "20241017",
    "indicators": "macd(12,26,9) rsi(14)"
  }
}
```

#### 📰 搜索财经新闻

```typescript
// 搜索特定关键词新闻
{
  "tool": "finance_news",
  "arguments": {
    "query": "腾讯 股票"
  }
}
```

#### 🏢 查询公司财务数据

```typescript
// 查询公司财务指标
{
  "tool": "company_performance",
  "arguments": {
    "ts_code": "000001.SZ",
    "data_type": "indicators",
    "start_date": "20240901",
    "end_date": "20241017"
  }
}
```

## 🛠️ 工具清单

| 工具名称 | 功能描述 | 数据来源 |
|---------|---------|---------|
| `current_timestamp` | 获取当前东八区时间戳 | 系统生成 |
| `finance_news` | 财经媒体新闻搜索 | 百度新闻爬虫 |
| `stock_data` | 股票历史行情数据 | Tushare |
| `stock_data_minutes` | 分钟K线数据 | Tushare |
| `index_data` | 股票指数数据 | Tushare |
| `macro_econ` | 宏观经济数据 | Tushare |
| `company_performance` | A股公司综合表现数据 | Tushare |
| `fund_data` | 公募基金数据 | Tushare |
| `fund_manager_by_name` | 基金经理信息查询 | Tushare |
| `convertible_bond` | 可转债数据 | Tushare |
| `block_trade` | 大宗交易数据 | Tushare |
| `money_flow` | 资金流向数据 | Tushare |
| `margin_trade` | 融资融券数据 | Tushare |
| `company_performance_us` | 美股公司业绩数据 | Tushare |
| `csi_index_constituents` | 中证指数成分股数据 | Tushare |
| `dragon_tiger_inst` | 龙虎榜机构成交明细 | Tushare |
| `hot_news_7x24` | 7×24热点新闻 | Tushare |

## 📊 数据源说明

### Tushare 数据源

Tushare 是专业的金融数据服务平台，提供以下类型数据：

- **股票数据**: A股、美股、港股日K线、分钟K线
- **财务数据**: 资产负债表、利润表、现金流量表、财务指标
- **基金数据**: 基金净值、持仓信息、基金经理信息
- **宏观经济**: CPI、PPI、GDP、货币政策等
- **市场数据**: 大宗交易、资金流向、融资融券
- **指数数据**: 沪深300、上证指数等市场指数

### 百度新闻爬虫

自主研发的百度新闻爬虫系统：

- **实时抓取**: 实时抓取百度新闻搜索结果
- **智能解析**: 自动解析新闻标题、摘要、发布时间、来源
- **关键词匹配**: 支持多关键词组合搜索
- **去重机制**: 智能去重，避免重复内容

## 🏗️ 项目架构

```
aigroup-market-mcp/
├── 📁 src/
│   ├── index.ts                 # 🆕 McpServer stdio 入口
│   ├── httpServer.ts            # 🆕 StreamableHTTP 服务器
│   ├── config.ts                # 配置文件
│   │
│   ├── 📁 core/                 # 核心模块
│   │   └── errors.ts            # 错误处理
│   │
│   ├── 📁 tools/                # 工具模块
│   │   ├── stockData/           # 股票数据工具集
│   │   ├── companyPerformanceDetail/  # 财务详情工具
│   │   ├── crawler/             # 新闻爬虫模块
│   │   └── *.ts                 # 各个工具文件
│   │
│   └── 📁 utils/                # 工具函数
│
├── 📁 .roo/                     # MCP配置
├── 📁 docs/                     # 文档
│   ├── mcp-sdk-upgrade-analysis.md  # 升级分析
│   ├── migration-guide.md           # 迁移指南
│   └── upgrade-recommendations.md   # 升级建议
├── 📁 exports/                 # 数据导出目录
└── 📁 csv_exports/             # CSV导出目录
```

### 架构特点（v2.0）

1. **🆕 McpServer 高级 API**: 使用 SDK 提供的高级 API，自动处理工具注册和调用
2. **🆕 Zod Schema 验证**: 所有工具参数都通过 Zod 进行类型验证
3. **🆕 StreamableHTTP 传输**: HTTP 服务器使用 StreamableHTTPServerTransport
4. **🆕 通知防抖**: 批量操作时自动合并通知，减少网络开销
5. **模块化设计**: 每个工具都是独立的模块，便于维护和扩展
6. **错误隔离**: 完善的错误处理机制，确保服务稳定性

## 🔧 开发指南

### 添加新工具（v2.0）

1. **创建工具模块**
   ```typescript
   import { z } from 'zod';

   export const myNewTool = {
     name: 'my_new_tool',
     description: '新工具描述',
     parameters: {
       type: 'object',
       properties: {
         param1: { type: 'string', description: '参数说明' }
       },
       required: ['param1']
     },
     
     async run(args: { param1: string }) {
       // 工具实现逻辑
       return {
         content: [{ type: 'text', text: '执行结果' }]
       };
     }
   };
   ```

2. **注册工具**
   在 `src/index.ts` 和 `src/httpServer.ts` 中添加：
   ```typescript
   import { myNewTool } from './tools/myNewTool.js';
   
   // 添加到 tools 数组
   const tools = [
     // ... 现有工具
     { tool: myNewTool, handler: (args: any) => myNewTool.run(args) }
   ];
   ```

3. **更新MCP配置**
   在 `.roo/mcp.json` 的 `alwaysAllow` 数组中添加新工具名称。

### 使用 Zod Schema（推荐）

对于新工具，建议直接在 server.registerTool 中使用 Zod：

```typescript
server.registerTool(
  'my_new_tool',
  {
    title: '🆕 我的新工具',
    description: '新工具描述',
    inputSchema: {
      param1: z.string().min(1).describe('参数说明'),
      param2: z.number().optional().describe('可选参数')
    }
  },
  async ({ param1, param2 }) => {
    // TypeScript 会自动推导参数类型
    return {
      content: [{ type: 'text', text: `处理 ${param1}` }]
    };
  }
);
```

### 调试技巧

- 使用 `npm run dev` 启动开发模式，支持热重载
- 查看控制台日志，了解工具执行过程
- 使用环境变量 `DEBUG=true` 启用详细日志
- 通过 `ToolManager` 的 `getToolCount()` 方法检查工具注册状态

## 📝 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 获取详细的版本更新信息。

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！在贡献代码前，请：

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- **Tushare**: 优秀的金融数据服务平台
- **百度新闻**: 丰富的新闻资讯来源
- **MCP 社区**: 为跨平台工具集成提供的优秀协议

---

💡 **提示**: 如需获取 Tushare API 令牌，请访问 [https://tushare.pro](https://tushare.pro) 注册并申请免费额度。

📧 **联系我们**: 有任何问题或建议，请通过 Issue 或者邮件联系我们（作者邮箱：Jackdark425@gmail.com）。