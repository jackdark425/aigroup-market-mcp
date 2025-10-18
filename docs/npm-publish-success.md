# 🎉 NPM 发布成功！

> 发布时间: 2025-10-18
> 
> aigroup-market-mcp v1.1.0 已成功发布到 npm registry

---

## ✅ 发布信息

### 包详情

- **包名**: `aigroup-market-mcp`
- **版本**: `1.1.0`
- **发布者**: jackdark425 <jackdark425@gmail.com>
- **许可证**: MIT
- **包大小**: 299.8 kB (压缩后)
- **解压大小**: 1.5 MB
- **文件数量**: 322 个
- **发布时间**: 刚刚

### NPM 链接

- **包主页**: https://www.npmjs.com/package/aigroup-market-mcp
- **下载地址**: https://registry.npmjs.org/aigroup-market-mcp/-/aigroup-market-mcp-1.1.0.tgz

### 依赖版本

```json
{
  "@modelcontextprotocol/sdk": "^1.20.1",
  "cors": "^2.8.5",
  "dotenv": "^16.6.1",
  "express": "^4.21.2",
  "node-fetch": "^3.3.2"
}
```

---

## 🚀 安装和使用

### 全局安装

```bash
npm install -g aigroup-market-mcp
```

### 项目中使用

```bash
npm install aigroup-market-mcp
```

### 直接运行（推荐）

```bash
# 运行 MCP 服务器
npx aigroup-market-mcp

# 运行 HTTP 服务器
npx aigroup-market-mcp-http
```

---

## 📦 包含的可执行文件

### 1. aigroup-market-mcp
MCP 协议服务器（stdio transport）

```bash
npx aigroup-market-mcp
```

### 2. aigroup-market-mcp-http
HTTP 服务器

```bash
npx aigroup-market-mcp-http
# 默认运行在 http://localhost:3000
```

---

## 🎯 主要功能

### 支持的市场类型（10种）

1. ✅ A股市场（cn）
2. ✅ 美股市场（us）
3. ✅ 港股市场（hk）
4. ✅ 外汇市场（fx）
5. ✅ 期货市场（futures）
6. ✅ 基金市场（fund）
7. ✅ 债券逆回购（repo）
8. ✅ 可转债市场（convertible_bond）
9. ✅ 期权市场（options）
10. ✅ 加密货币（crypto - Binance）

### 核心工具（18个）

| 工具名称 | 功能描述 |
|---------|---------|
| `stock_data` | 全市场行情数据（10种市场） |
| `stock_data_minutes` | 分钟K线数据 |
| `index_data` | 指数数据 |
| `company_performance` | A股财务数据 |
| `company_performance_hk` | 港股财务数据 |
| `company_performance_us` | 美股财务数据 |
| `fund_data` | 公募基金数据 |
| `fund_manager_by_name` | 基金经理信息 |
| `macro_econ` | 宏观经济数据 |
| `finance_news` | 财经新闻搜索 |
| `hot_news_7x24` | 7×24热点新闻 |
| `block_trade` | 大宗交易数据 |
| `money_flow` | 资金流向数据 |
| `margin_trade` | 融资融券数据 |
| `convertible_bond` | 可转债数据 |
| `csi_index_constituents` | 中证指数成分股 |
| `dragon_tiger_inst` | 龙虎榜机构明细 |
| `current_timestamp` | 当前时间戳 |

---

## 📝 配置示例

### Claude Desktop 配置

在 `claude_desktop_config.json` 中添加：

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

### Cline / RooCode 配置

在 `.roo/mcp.json` 中添加：

```json
{
  "mcpServers": {
    "aigroup-market-mcp": {
      "command": "npx",
      "args": ["-y", "aigroup-market-mcp"],
      "env": {
        "TUSHARE_TOKEN": "your_tushare_token_here"
      },
      "alwaysAllow": [
        "stock_data",
        "company_performance",
        "fund_data",
        "macro_econ",
        "finance_news"
      ]
    }
  }
}
```

---

## 🔄 版本历史

### v1.1.0 (当前版本) - 2025-10-18

**重大升级**:
- ✅ MCP SDK 升级: 0.6.0 → 1.20.1
- ✅ 所有依赖包升级到最新版本
- ✅ 依赖包数量减少 74%（527 → 139）
- ✅ 安装速度提升 63%
- ✅ 包体积减少 67%
- ✅ 0 个安全漏洞

**详细信息**: 查看 [CHANGELOG.md](../CHANGELOG.md)

### v1.0.1 - 2025-10-17

初始稳定版本发布

---

## 📊 下载统计

在 npm 上查看实时下载统计：
https://www.npmjs.com/package/aigroup-market-mcp

---

## 🌟 特色亮点

### 1. 强大的 stock_data 工具
- 一个工具支持 10 种市场
- 内置 5 种技术指标（MACD、RSI、KDJ、BOLL、MA）
- 支持 3 种输出格式（Markdown、CSV、JSON）

### 2. 完整的财务数据
- A股、港股、美股全覆盖
- 三大报表完整支持
- 财务指标详细分析

### 3. 自研新闻爬虫
- 百度新闻实时抓取
- 智能去重机制
- 关键词精准匹配

### 4. 开箱即用
- 无需安装，直接使用 npx
- 环境变量配置简单
- 支持多种 MCP 客户端

---

## 📚 文档资源

### 完整文档

1. **README.md** - 快速开始指南
2. **CHANGELOG.md** - 版本变更历史
3. **docs/analysis-summary.md** - 项目分析总结
4. **docs/upgrade-summary.md** - 升级详细报告
5. **docs/mcp-upgrade-plan.md** - MCP 升级计划
6. **docs/tushare-api-comparison.md** - API 对比分析

### 在线资源

- **GitHub**: https://github.com/yourusername/aigroup-market-mcp
- **Issues**: https://github.com/yourusername/aigroup-market-mcp/issues
- **NPM**: https://www.npmjs.com/package/aigroup-market-mcp

---

## 🙏 致谢

感谢以下项目和服务：

- **Tushare**: 优秀的金融数据服务平台
- **Model Context Protocol**: 强大的AI工具集成协议
- **NPM**: 可靠的包管理服务

---

## 📧 联系方式

- **作者**: jackdark425@gmail.com
- **GitHub Issues**: https://github.com/yourusername/aigroup-market-mcp/issues
- **NPM Profile**: https://www.npmjs.com/~jackdark425

---

## 🎯 下一步计划

### 即将推出的功能

1. **基础查询工具** (v1.2.0)
   - stock_list - 股票列表
   - trade_calendar - 交易日历
   - etf_list - ETF 列表

2. **文档优化** (v1.2.0)
   - 更多使用示例
   - 最佳实践指南
   - 视频教程

3. **市场扩展** (v1.3.0)
   - 更多市场支持
   - 更多技术指标
   - 更多数据维度

---

**发布状态**: ✅ **成功**  
**NPM 可用性**: ✅ **已上线**  
**推荐使用**: 🎉 **立即体验**

---

## 🚀 快速开始

```bash
# 1. 设置环境变量
export TUSHARE_TOKEN=your_token_here

# 2. 直接运行
npx -y aigroup-market-mcp

# 3. 或者全局安装
npm install -g aigroup-market-mcp
aigroup-market-mcp
```

**祝使用愉快！** 🎉