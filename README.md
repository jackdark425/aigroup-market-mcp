# 🤖 AIGroup Market MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Version](https://img.shields.io/badge/version-2.0.8-brightgreen.svg)](https://github.com/jackdark425/aigroup-market-mcp)

> 基于 Tushare 和百度新闻的金融数据 MCP（Model Context Protocol）服务器，面向股票、基金、宏观经济、财经资讯等多类查询场景。

## 📌 项目概览

`aigroup-market-mcp` 提供统一的金融数据 MCP 接口，适合在 Claude Desktop、RooCode、各类 MCP 客户端或自建 AI 工作流中使用。

核心能力包括：

- 股票、指数、基金、宏观经济等结构化金融数据查询
- 财经新闻与 7×24 热点资讯检索
- A 股 / 港股 / 美股等多市场支持
- 技术指标计算与格式化输出
- stdio 与 HTTP 两种接入方式

## ✨ 核心特性

### 数据能力
- **Tushare API**：股票、基金、宏观经济、财务等权威数据
- **百度新闻抓取**：补充财经新闻资讯与热点信息
- **多市场覆盖**：A 股、美股、港股、外汇、期货、加密货币等

### 工具能力
- **行情数据**：日 K、分钟 K、指数与技术指标
- **财务数据**：利润表、资产负债表、现金流、财务指标
- **基金与债券**：基金净值、基金经理、可转债等
- **市场交易数据**：大宗交易、资金流向、融资融券、龙虎榜
- **新闻与宏观数据**：财经新闻、7×24 热点、宏观经济指标

### 技术实现
- **MCP SDK 1.27.1**：使用现代 `McpServer` API
- **Zod 参数校验**：提高类型安全与输入可靠性
- **Streamable HTTP 传输**：更适合远程部署与服务化接入
- **通知防抖优化**：降低批量场景下的网络噪音

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm >= 8
- 可用的 `TUSHARE_TOKEN`

### 方式一：直接运行（推荐）

```bash
export TUSHARE_TOKEN=your_tushare_token_here
npx -y aigroup-market-mcp
```

如需 HTTP 模式：

```bash
export TUSHARE_TOKEN=your_tushare_token_here
npx -y aigroup-market-mcp-http
```

### 方式二：本地源码运行

```bash
git clone https://github.com/jackdark425/aigroup-market-mcp.git
cd aigroup-market-mcp
npm install
npm run build
export TUSHARE_TOKEN=your_tushare_token_here
npm run start:stdio
```

HTTP 模式：

```bash
npm run start:http
```

## ⚙️ 环境变量

```env
TUSHARE_TOKEN=your_tushare_token_here
TUSHARE_API_URL=https://api.tushare.pro
PORT=3000
NODE_ENV=development
```

获取 Tushare Token：<https://tushare.pro>

## 🔌 MCP 客户端配置

### 使用 npx

```json
{
  "mcpServers": {
    "aigroup-market-mcp": {
      "command": "npx",
      "args": ["-y", "aigroup-market-mcp"],
      "env": {
        "TUSHARE_TOKEN": "your_tushare_token_here"
      }
    }
  }
}
```

### 使用本地构建结果

```json
{
  "mcpServers": {
    "aigroup-market-mcp": {
      "command": "node",
      "args": ["build/index.js"],
      "cwd": "/path/to/aigroup-market-mcp",
      "env": {
        "TUSHARE_TOKEN": "your_tushare_token_here"
      }
    }
  }
}
```

## 🛠️ 主要工具

| 工具名称 | 功能描述 | 数据来源 |
|---------|---------|---------|
| `current_timestamp` | 获取当前东八区时间戳 | 系统生成 |
| `finance_news` | 财经媒体新闻搜索 | 百度新闻爬虫 |
| `stock_data` | 股票历史行情数据 | Tushare |
| `stock_data_minutes` | 分钟 K 线数据 | Tushare |
| `index_data` | 股票指数数据 | Tushare |
| `macro_econ` | 宏观经济数据 | Tushare |
| `company_performance` | A 股公司综合表现数据 | Tushare |
| `fund_data` | 公募基金数据 | Tushare |
| `fund_manager_by_name` | 基金经理信息查询 | Tushare |
| `convertible_bond` | 可转债数据 | Tushare |
| `block_trade` | 大宗交易数据 | Tushare |
| `money_flow` | 资金流向数据 | Tushare |
| `margin_trade` | 融资融券数据 | Tushare |
| `company_performance_us` | 美股公司业绩数据 | Tushare |
| `csi_index_constituents` | 中证指数成分股数据 | Tushare |
| `dragon_tiger_inst` | 龙虎榜机构成交明细 | Tushare |
| `hot_news_7x24` | 7×24 热点新闻 | Tushare |

## 📚 文档

- [Tushare API 接口对照文档](https://github.com/jackdark425/aigroup-market-mcp/blob/main/docs/TUSHARE_API_MAPPING.md)
- [发布指南](https://github.com/jackdark425/aigroup-market-mcp/blob/main/docs/PUBLISH_GUIDE.md)

## 🏗️ 项目结构

```text
aigroup-market-mcp/
├── src/
│   ├── index.ts
│   ├── httpServer.ts
│   ├── config.ts
│   ├── core/
│   ├── tools/
│   └── utils/
├── docs/
├── exports/
├── csv_exports/
└── README.md
```

## 🔧 开发

```bash
npm install
npm run build
npm run dev
```

常用脚本：

- `npm run start:stdio`
- `npm run start:http`
- `npm run dev`
- `npm run watch`

## 🤝 贡献

欢迎通过 Issue 或 Pull Request 提交改进建议。

基本流程：

1. Fork 仓库
2. 创建功能分支
3. 提交更改
4. 推送分支
5. 发起 Pull Request

## 📄 许可证与使用说明

本项目采用 **MIT License**。

这意味着你可以在遵守 MIT 许可证文本的前提下，自由地：

- 使用本项目进行个人或商业用途
- 复制、修改、合并和分发代码
- 将本项目作为更大系统的一部分进行二次开发
- 在保留原始版权与许可证声明的情况下发布衍生版本

请注意：

- **你必须保留** 原仓库中的版权声明与 MIT 许可证文本
- **本项目按“原样”提供（AS IS）**，作者不对适销性、特定用途适用性或非侵权提供担保
- **第三方数据源条款不等于 MIT**：使用 Tushare、新闻源等服务时，仍需自行遵守其服务条款、调用限制与数据合规要求

完整授权文本见 [LICENSE](LICENSE)。

## 🙏 致谢

### 参考项目

- **guangxiangdebizi/FinanceMCP**
  - 仓库地址: https://github.com/guangxiangdebizi/FinanceMCP
  - 参考范围: 整体产品方向、金融数据 MCP 组织方式、部分能力设计

### 数据与生态支持

- **Tushare**：优秀的金融数据服务平台
- **百度新闻**：丰富的财经资讯来源
- **MCP 社区**：为跨平台工具集成提供协议与生态支持

## 📞 支持

- Issues: https://github.com/jackdark425/aigroup-market-mcp/issues
- Repository: https://github.com/jackdark425/aigroup-market-mcp
- Email: Jackdark425@gmail.com
