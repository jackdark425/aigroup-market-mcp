# aigroup-market-mcp Maintenance TODO

更新时间：2026-03-12

## 已完成

- 升级关键依赖：
  - `@modelcontextprotocol/sdk` → `1.27.1`
  - `express` → `4.22.1`
  - `cors` → `2.8.6`
  - `zod` → `3.25.76`
  - `@types/node` / `@types/express` 同步升级
- 修复仓库链接占位符（`yourusername` → `jackdark425`）
- 统一运行时代码中的版本号到 `2.0.6`
- 清理发布指南中的旧机器路径和错误前提
- 构建验证通过
- stdio 启动验证通过
- HTTP 启动验证通过
- `npm audit` 结果清零（0 vulnerabilities）

## 当前已知状态

- 本地路径：`/home/jack/.openclaw/workspace/github/aigroup-market-mcp`
- 默认分支：`main`
- 当前可确认注册工具数：19
- 项目支持两种运行模式：
  - stdio MCP：`node build/index.js`
  - HTTP MCP：`node build/httpServer.js`

## 待办 P0

- 使用真实 `TUSHARE_TOKEN` 做关键工具冒烟测试：
  - `stock_data`
  - `index_data`
  - `macro_econ`
  - `company_performance`
  - `money_flow`
  - `hot_news_7x24`
- 确认 HTTP 模式在真实 MCP 客户端中的兼容性
- 检查新版 `@modelcontextprotocol/sdk` 下是否需要进一步调整传输层用法

## 待办 P1

- 增加 `CHANGELOG.md`
- 增加发布前 checklist 脚本或文档化流程
- 在 README 中补充：
  - HTTP 模式调用示例
  - Token 透传说明
  - Binance / CoinGecko 能力边界
- 检查是否需要补 `.env.example` 的 CoinGecko 相关变量

## 待办 P2

- 抽取 `index.ts` 与 `httpServer.ts` 的公共工具注册逻辑，减少重复代码
- 统一 Tushare API 请求封装（超时、错误处理、字段映射）
- 为关键工具补最基础的自动化测试
- 评估是否需要把部分大工具拆分得更细

## 发布相关

- 当前机器 `npm whoami` 结果：未登录
- 若需要发布 npm 包，先执行：
  - `npm login`
  - `npm whoami`
  - `npm run build`
  - 启动验收后再 `npm publish`
