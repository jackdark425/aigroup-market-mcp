# Tushare API 接口对照文档

> 本文档记录项目中所有工具与Tushare官方API接口的对应关系，便于维护和升级。
> 
> **最后更新时间**: 2025-11-08
> 
> **官方文档**: https://tushare.pro/document/2

---

## 📋 目录

- [基础信息类](#基础信息类)
- [行情数据类](#行情数据类)
- [财务数据类](#财务数据类)
- [基金数据类](#基金数据类)
- [宏观经济类](#宏观经济类)
- [资金流向类](#资金流向类)
- [融资融券类](#融资融券类)
- [特色数据类](#特色数据类)
- [港股数据类](#港股数据类)
- [美股数据类](#美股数据类)
- [债券数据类](#债券数据类)
- [新闻资讯类](#新闻资讯类)

---

## 基础信息类

### basicInfo.ts

| 工具函数 | Tushare API | 官方文档链接 | 积分要求 | 说明 |
|---------|------------|------------|---------|------|
| stock_basic | `stock_basic` | [doc_id=25](https://tushare.pro/document/2?doc_id=25) | 免费 | 获取A股股票列表 |
| trade_cal | `trade_cal` | [doc_id=26](https://tushare.pro/document/2?doc_id=26) | 免费 | 获取交易日历 |
| new_share | `new_share` | [doc_id=123](https://tushare.pro/document/2?doc_id=123) | 120积分 | 获取新股上市列表 |
| hk_basic | `hk_basic` | [doc_id=191](https://tushare.pro/document/2?doc_id=191) | 免费 | 获取港股股票列表 |
| us_basic | `us_basic` | [doc_id=210](https://tushare.pro/document/2?doc_id=210) | 免费 | 获取美股股票列表 |
| index_basic | `index_basic` | [doc_id=94](https://tushare.pro/document/2?doc_id=94) | 免费 | 获取指数基本信息 |
| fund_basic (ETF) | `fund_basic` | [doc_id=19](https://tushare.pro/document/2?doc_id=19) | 免费 | 获取公募基金列表 |

**参数说明**:
- `ts_code`: 股票代码（可选）
- `exchange`: 交易所代码（可选）
- `list_status`: 上市状态，L=上市 D=退市 P=暂停上市
- `start_date/end_date`: 日期范围，格式YYYYMMDD

---

## 行情数据类

### stockData.ts.backup / stockData/

| 工具函数 | Tushare API | 官方文档链接 | 积分要求 | 说明 |
|---------|------------|------------|---------|------|
| daily (A股) | `daily` | [doc_id=27](https://tushare.pro/document/2?doc_id=27) | 免费 | A股日线行情 |
| us_daily | `us_daily` | [doc_id=211](https://tushare.pro/document/2?doc_id=211) | 免费 | 美股日线行情 |
| hk_daily | `hk_daily` | [doc_id=192](https://tushare.pro/document/2?doc_id=192) | 免费 | 港股日线行情 |
| fx_daily | `fx_daily` | [doc_id=158](https://tushare.pro/document/2?doc_id=158) | 免费 | 外汇日线行情 |
| fut_daily | `fut_daily` | [doc_id=135](https://tushare.pro/document/2?doc_id=135) | 2000积分 | 期货日线行情 |
| fund_daily | `fund_daily` | [doc_id=127](https://tushare.pro/document/2?doc_id=127) | 免费 | 场内基金日线行情 |
| repo_daily | `repo_daily` | [doc_id=189](https://tushare.pro/document/2?doc_id=189) | 免费 | 债券逆回购日线 |
| cb_daily | `cb_daily` | [doc_id=186](https://tushare.pro/document/2?doc_id=186) | 免费 | 可转债日线行情 |
| opt_daily | `opt_daily` | [doc_id=159](https://tushare.pro/document/2?doc_id=159) | 2000积分 | 期权日线行情 |
| adj_factor | `adj_factor` | [doc_id=28](https://tushare.pro/document/2?doc_id=28) | 免费 | 复权因子 |

### indexData.ts

| 工具函数 | Tushare API | 官方文档链接 | 积分要求 | 说明 |
|---------|------------|------------|---------|------|
| index_daily | `index_daily` | [doc_id=95](https://tushare.pro/document/2?doc_id=95) | 免费 | 指数日线行情 |

### stockDataMinutes.ts

| 工具函数 | Tushare API | 官方文档链接 | 积分要求 | 说明 |
|---------|------------|------------|---------|------|
| stk_mins (A股分钟线) | `stk_mins` | [doc_id=109](https://tushare.pro/document/2?doc_id=109) | 2000积分 | A股分钟级行情 |

**参数说明**:
- `ts_code`: 股票代码（必填）
- `start_date/end_date`: 日期范围，格式YYYYMMDD
- `freq`: 分钟周期，支持1min/5min/15min/30min/60min

---

## 财务数据类

### companyPerformance.ts

| 工具函数 | Tushare API | 官方文档链接 | 积分要求 | 说明 |
|---------|------------|------------|---------|------|
| forecast | `forecast` | [doc_id=45](https://tushare.pro/document/2?doc_id=45) | 120积分 | 业绩预告 |
| express | `express` | [doc_id=46](https://tushare.pro/document/2?doc_id=46) | 120积分 | 业绩快报 |
| fina_indicator | `fina_indicator` | [doc_id=79](https://tushare.pro/document/2?doc_id=79) | 120积分 | 财务指标数据 |
| dividend | `dividend` | [doc_id=103](https://tushare.pro/document/2?doc_id=103) | 120积分 | 分红送股数据 |
| fina_mainbz | `fina_mainbz` | [doc_id=81](https://tushare.pro/document/2?doc_id=81) | 120积分 | 主营业务构成 |
| stk_holdernumber | `stk_holdernumber` | [doc_id=166](https://tushare.pro/document/2?doc_id=166) | 120积分 | 股东人数 |
| stk_holdertrade | `stk_holdertrade` | [doc_id=165](https://tushare.pro/document/2?doc_id=165) | 2000积分 | 股东增减持 |
| stk_managers | `stk_managers` | [doc_id=200](https://tushare.pro/document/2?doc_id=200) | 120积分 | 管理层薪酬和持股 |
| stock_company | `stock_company` | [doc_id=112](https://tushare.pro/document/2?doc_id=112) | 120积分 | 上市公司基本信息 |
| fina_audit | `fina_audit` | [doc_id=80](https://tushare.pro/document/2?doc_id=80) | 120积分 | 财务审计意见 |
| balancesheet | `balancesheet` | [doc_id=36](https://tushare.pro/document/2?doc_id=36) | 120积分 | 资产负债表 |
| cashflow | `cashflow` | [doc_id=44](https://tushare.pro/document/2?doc_id=44) | 120积分 | 现金流量表 |
| income | `income` | [doc_id=33](https://tushare.pro/document/2?doc_id=33) | 120积分 | 利润表 |
| share_float | `share_float` | [doc_id=160](https://tushare.pro/document/2?doc_id=160) | 120积分 | 限售股解禁 |
| repurchase | `repurchase` | [doc_id=124](https://tushare.pro/document/2?doc_id=124) | 2000积分 | 股票回购 |
| top10_holders | `top10_holders` | [doc_id=61](https://tushare.pro/document/2?doc_id=61) | 120积分 | 前十大股东 |
| top10_floatholders | `top10_floatholders` | [doc_id=62](https://tushare.pro/document/2?doc_id=62) | 120积分 | 前十大流通股东 |
| pledge_stat | `pledge_stat` | [doc_id=110](https://tushare.pro/document/2?doc_id=110) | 120积分 | 股权质押统计数据 |
| pledge_detail | `pledge_detail` | [doc_id=111](https://tushare.pro/document/2?doc_id=111) | 120积分 | 股权质押明细 |

**参数说明**:
- `ts_code`: 股票代码（必填）
- `period`: 报告期，格式YYYYMMDD，如20231231
- `start_date/end_date`: 公告日期范围

---

## 基金数据类

### fundData.ts

| 工具函数 | Tushare API | 官方文档链接 | 积分要求 | 说明 |
|---------|------------|------------|---------|------|
| fund_basic | `fund_basic` | [doc_id=19](https://tushare.pro/document/2?doc_id=19) | 免费 | 公募基金列表 |
| fund_manager | `fund_manager` | [doc_id=208](https://tushare.pro/document/2?doc_id=208) | 120积分 | 基金经理数据 |
| fund_nav | `fund_nav` | [doc_id=119](https://tushare.pro/document/2?doc_id=119) | 120积分 | 基金净值数据 |
| fund_div | `fund_div` | [doc_id=128](https://tushare.pro/document/2?doc_id=128) | 120积分 | 基金分红数据 |
| fund_portfolio | `fund_portfolio` | [doc_id=121](https://tushare.pro/document/2?doc_id=121) | 2000积分 | 基金持仓数据 |
| fund_share | `fund_share` | [doc_id=120](https://tushare.pro/document/2?doc_id=120) | 120积分 | 基金份额数据 |

### fundManagerByName.ts

| 工具函数 | Tushare API | 官方文档链接 | 积分要求 | 说明 |
|---------|------------|------------|---------|------|
| fund_manager | `fund_manager` | [doc_id=208](https://tushare.pro/document/2?doc_id=208) | 120积分 | 按姓名查询基金经理 |

---

## 宏观经济类

### macroEcon.ts

| 工具函数 | Tushare API | 官方文档链接 | 积分要求 | 说明 |
|---------|------------|------------|---------|------|
| shibor | `shibor` | [doc_id=149](https://tushare.pro/document/2?doc_id=149) | 免费 | Shibor利率数据 |
| shibor_lpr | `shibor_lpr` | [doc_id=150](https://tushare.pro/document/2?doc_id=150) | 免费 | LPR贷款市场报价利率 |
| cn_gdp | `cn_gdp` | [doc_id=227](https://tushare.pro/document/2?doc_id=227) | 免费 | 国内生产总值 |
| cn_cpi | `cn_cpi` | [doc_id=138](https://tushare.pro/document/2?doc_id=138) | 免费 | 居民消费价格指数 |
| cn_ppi | `cn_ppi` | [doc_id=139](https://tushare.pro/document/2?doc_id=139) | 免费 | 工业生产者出厂价格指数 |
| cn_m | `cn_m` | [doc_id=141](https://tushare.pro/document/2?doc_id=141) | 免费 | 货币供应量 |
| cn_pmi | `cn_pmi` | [doc_id=273](https://tushare.pro/document/2?doc_id=273) | 免费 | 采购经理指数 |
| sf_month | `sf_month` | [doc_id=228](https://tushare.pro/document/2?doc_id=228) | 免费 | 社会融资规模增量 |
| shibor_quote | `shibor_quote` | [doc_id=151](https://tushare.pro/document/2?doc_id=151) | 免费 | Shibor报价数据 |
| libor | `libor` | [doc_id=152](https://tushare.pro/document/2?doc_id=152) | 免费 | Libor利率 |
| hibor | `hibor` | [doc_id=154](https://tushare.pro/document/2?doc_id=154) | 免费 | Hibor利率 |

**参数说明**:
- `start_date/end_date`: 日期范围
- 不同指标使用不同时间格式：
  - 日度数据：YYYYMMDD
  - 月度数据：YYYYMM
  - 季度数据：YYYYQN (如2023Q1)

---

## 资金流向类

### moneyFlow.ts

| 工具函数 | Tushare API | 官方文档链接 | 积分要求 | 说明 |
|---------|------------|------------|---------|------|
| moneyflow_dc | `moneyflow_dc` | [doc_id=170](https://tushare.pro/document/2?doc_id=170) | 120积分 | 个股资金流向（东财） |
| moneyflow_mkt_dc | `moneyflow_mkt_dc` | [doc_id=322](https://tushare.pro/document/2?doc_id=322) | 120积分 | 大盘资金流向（东财） |

**参数说明**:
- `ts_code`: 股票代码（个股资金流向必填）
- `start_date/end_date`: 交易日期范围，格式YYYYMMDD

---

## 融资融券类

### marginTrade.ts

| 工具函数 | Tushare API | 官方文档链接 | 积分要求 | 说明 |
|---------|------------|------------|---------|------|
| margin_secs | `margin_secs` | [doc_id=59](https://tushare.pro/document/2?doc_id=59) | 免费 | 融资融券标的 |
| margin | `margin` | [doc_id=58](https://tushare.pro/document/2?doc_id=58) | 120积分 | 融资融券交易汇总 |
| margin_detail | `margin_detail` | [doc_id=60](https://tushare.pro/document/2?doc_id=60) | 120积分 | 融资融券交易明细 |
| slb_len_mm | `slb_len_mm` | [doc_id=310](https://tushare.pro/document/2?doc_id=310) | 5000积分 | 做市借券交易汇总 |

---

## 特色数据类

### blockTrade.ts

| 工具函数 | Tushare API | 官方文档链接 | 积分要求 | 说明 |
|---------|------------|------------|---------|------|
| block_trade | `block_trade` | [doc_id=65](https://tushare.pro/document/2?doc_id=65) | 2000积分 | 大宗交易数据 |

### dragonTigerInst.ts

| 工具函数 | Tushare API | 官方文档链接 | 积分要求 | 说明 |
|---------|------------|------------|---------|------|
| top_inst | `top_inst` | [doc_id=107](https://tushare.pro/document/2?doc_id=107) | 2000积分 | 龙虎榜机构成交明细 |

### csiIndexConstituents.ts

| 工具函数 | Tushare API | 官方文档链接 | 积分要求 | 说明 |
|---------|------------|------------|---------|------|
| index_weight | `index_weight` | [doc_id=96](https://tushare.pro/document/2?doc_id=96) | 2000积分 | 指数成分和权重 |
| daily_basic | `daily_basic` | [doc_id=32](https://tushare.pro/document/2?doc_id=32) | 120积分 | 每日指标（PE/PB等） |

---

## 港股数据类

### companyPerformance_hk.ts

| 工具函数 | Tushare API | 官方文档链接 | 积分要求 | 说明 |
|---------|------------|------------|---------|------|
| hk_income | `hk_income` | [doc_id=193](https://tushare.pro/document/2?doc_id=193) | 120积分 | 港股利润表 |
| hk_balancesheet | `hk_balancesheet` | [doc_id=194](https://tushare.pro/document/2?doc_id=194) | 120积分 | 港股资产负债表 |
| hk_cashflow | `hk_cashflow` | [doc_id=195](https://tushare.pro/document/2?doc_id=195) | 120积分 | 港股现金流量表 |

---

## 美股数据类

### companyPerformance_us.ts

| 工具函数 | Tushare API | 官方文档链接 | 积分要求 | 说明 |
|---------|------------|------------|---------|------|
| us_income | `us_income` | [doc_id=212](https://tushare.pro/document/2?doc_id=212) | 120积分 | 美股利润表 |
| us_balancesheet | `us_balancesheet` | [doc_id=213](https://tushare.pro/document/2?doc_id=213) | 120积分 | 美股资产负债表 |
| us_cashflow | `us_cashflow` | [doc_id=214](https://tushare.pro/document/2?doc_id=214) | 120积分 | 美股现金流量表 |
| us_fina_indicator | `us_fina_indicator` | [doc_id=215](https://tushare.pro/document/2?doc_id=215) | 120积分 | 美股财务指标 |

---

## 债券数据类

### convertibleBond.ts

| 工具函数 | Tushare API | 官方文档链接 | 积分要求 | 说明 |
|---------|------------|------------|---------|------|
| cb_basic | `cb_basic` | [doc_id=185](https://tushare.pro/document/2?doc_id=185) | 免费 | 可转债基本信息 |
| cb_issue | `cb_issue` | [doc_id=187](https://tushare.pro/document/2?doc_id=187) | 120积分 | 可转债发行数据 |

---

## 新闻资讯类

### hotNews.ts

| 工具函数 | Tushare API | 官方文档链接 | 积分要求 | 说明 |
|---------|------------|------------|---------|------|
| news | `news` | [doc_id=143](https://tushare.pro/document/2?doc_id=143) | 免费 | 新闻快讯 |

---

## 📝 维护指南

### 如何添加新接口

1. **查阅官方文档**：访问 https://tushare.pro/document/2 找到对应接口
2. **记录接口信息**：
   - API名称
   - 官方文档ID
   - 积分要求
   - 输入输出参数
3. **更新本文档**：在相应分类下添加新接口信息
4. **实现代码**：在相应工具文件中实现
5. **测试验证**：确保参数正确，返回数据格式符合预期

### 如何升级现有接口

1. **检查官方文档**：确认API是否有更新
2. **对比参数变化**：检查新增、修改或废弃的参数
3. **更新代码**：
   - 修改参数定义
   - 更新字段映射
   - 调整数据格式化逻辑
4. **更新文档**：同步更新本文档
5. **测试验证**：完整测试所有功能

### 常见问题

**Q: 如何确认API接口名称是否正确？**
A: 访问对应的官方文档链接，查看接口示例中的 `api_name` 字段。

**Q: 积分不足怎么办？**
A: 
- 免费接口：无需积分
- 120积分：可通过试用获取
- 2000/5000积分：需要捐助或购买

**Q: API返回错误码怎么处理？**
A: 参考官方文档的错误码说明：https://tushare.pro/document/1?doc_id=282

---

## 🔗 相关资源

- [Tushare官方文档](https://tushare.pro/document/2)
- [积分获取办法](https://tushare.pro/document/1?doc_id=13)
- [API错误码说明](https://tushare.pro/document/1?doc_id=282)
- [数据更新时间表](https://tushare.pro/document/1?doc_id=285)

---

**文档维护者**: AI Group Market MCP Team  
**最后更新**: 2025-11-08  
**版本**: 1.0.0