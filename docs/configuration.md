# 配置说明

本文档描述 aigroup-market-mcp 项目的配置选项和环境变量。

## 环境变量

所有配置项都可以通过环境变量进行设置。建议复制 `.env.example` 文件为 `.env`，然后根据需要修改配置值。

### API配置

#### Binance API配置

| 环境变量 | 说明 | 默认值 | 示例 |
|---------|------|--------|------|
| `BINANCE_API_URL` | Binance API地址 | `https://api.binance.com` | `https://api.binance.com` |
| `BINANCE_TIMEOUT` | Binance请求超时时间（毫秒） | `10000` | `15000` |

**说明：**
- `BINANCE_API_URL`: 用于获取加密货币行情数据的Binance API端点
- `BINANCE_TIMEOUT`: 请求超时时间，建议根据网络情况调整

#### Tushare API配置

| 环境变量 | 说明 | 默认值 | 示例 |
|---------|------|--------|------|
| `TUSHARE_TOKEN` | Tushare API Token（必填） | 无 | `your_token_here` |
| `TUSHARE_TIMEOUT` | Tushare请求超时时间（毫秒） | `30000` | `60000` |
| `TUSHARE_RETRY_ATTEMPTS` | Tushare请求重试次数 | `3` | `5` |

**说明：**
- `TUSHARE_TOKEN`: 从 [Tushare官网](https://tushare.pro/) 注册后获取，此项为**必填**
- `TUSHARE_TIMEOUT`: Tushare数据量较大，建议设置较长的超时时间
- `TUSHARE_RETRY_ATTEMPTS`: 网络不稳定时的重试次数

### 分页配置

| 环境变量 | 说明 | 默认值 | 示例 |
|---------|------|--------|------|
| `DEFAULT_PAGE_SIZE` | 默认分页大小 | `1000` | `500` |
| `MAX_PAGE_SIZE` | 最大分页大小 | `5000` | `10000` |

**说明：**
- `DEFAULT_PAGE_SIZE`: 用于Binance等API的单次请求数据条数
- `MAX_PAGE_SIZE`: 限制单次请求的最大数据量，防止内存溢出
- 分页大小会影响请求性能和内存使用

### 导出配置

| 环境变量 | 说明 | 默认值 | 示例 |
|---------|------|--------|------|
| `DEFAULT_EXPORT_PATH` | 默认导出目录 | `./exports` | `./data/exports` |
| `CSV_EXPORT_PATH` | CSV导出目录 | `./csv_exports` | `./data/csv` |
| `JSON_EXPORT_PATH` | JSON导出目录 | `./exports` | `./data/json` |

**说明：**
- 支持相对路径（相对于项目根目录）或绝对路径
- 目录不存在时会自动创建
- 不同格式可配置不同的导出路径

### 其他配置

| 环境变量 | 说明 | 默认值 | 示例 |
|---------|------|--------|------|
| `NODE_ENV` | 运行环境 | `development` | `production` |

## 配置验证

项目启动时会自动验证配置的合法性，包括：

### 验证规则

1. **分页配置验证**
   - `DEFAULT_PAGE_SIZE` 必须 ≤ `MAX_PAGE_SIZE`
   - `DEFAULT_PAGE_SIZE` 必须 > 0

2. **超时配置验证**
   - `TUSHARE_TIMEOUT` 必须 ≥ 1000ms
   - `BINANCE_TIMEOUT` 必须 ≥ 1000ms

3. **重试次数验证**
   - `TUSHARE_RETRY_ATTEMPTS` 必须 ≥ 0

4. **API地址验证**
   - `BINANCE_API_URL` 必须以 `http://` 或 `https://` 开头

### 验证失败处理

如果配置验证失败，应用会：
1. 在控制台输出详细的错误信息
2. 抛出错误并终止启动
3. 提示需要修改的配置项

## 配置示例

### 开发环境

```bash
# .env 文件示例（开发环境）
TUSHARE_TOKEN=your_development_token

# 较短的超时时间，快速失败
BINANCE_TIMEOUT=5000
TUSHARE_TIMEOUT=15000

# 较小的分页，便于测试
DEFAULT_PAGE_SIZE=500
MAX_PAGE_SIZE=2000

# 开发环境标识
NODE_ENV=development
```

### 生产环境

```bash
# .env 文件示例（生产环境）
TUSHARE_TOKEN=your_production_token

# 较长的超时时间，应对网络波动
BINANCE_TIMEOUT=30000
TUSHARE_TIMEOUT=60000

# 更多的重试次数
TUSHARE_RETRY_ATTEMPTS=5

# 较大的分页，提高效率
DEFAULT_PAGE_SIZE=2000
MAX_PAGE_SIZE=5000

# 自定义导出路径
DEFAULT_EXPORT_PATH=/data/exports
CSV_EXPORT_PATH=/data/csv_exports
JSON_EXPORT_PATH=/data/json_exports

# 生产环境标识
NODE_ENV=production
```

### 高性能场景

```bash
# .env 文件示例（高性能场景）
TUSHARE_TOKEN=your_token

# 使用最大分页提高吞吐量
DEFAULT_PAGE_SIZE=5000
MAX_PAGE_SIZE=10000

# 更长的超时时间
BINANCE_TIMEOUT=60000
TUSHARE_TIMEOUT=120000

# 更多的重试
TUSHARE_RETRY_ATTEMPTS=10
```

## 使用建议

### 1. 超时时间设置

- **快速网络**: Binance 5-10秒，Tushare 15-30秒
- **一般网络**: Binance 10-15秒，Tushare 30-60秒
- **慢速网络**: Binance 20-30秒，Tushare 60-120秒

### 2. 分页大小设置

- **内存受限**: DEFAULT_PAGE_SIZE=500, MAX_PAGE_SIZE=2000
- **一般情况**: DEFAULT_PAGE_SIZE=1000, MAX_PAGE_SIZE=5000
- **高性能**: DEFAULT_PAGE_SIZE=2000, MAX_PAGE_SIZE=10000

### 3. 重试策略

- **稳定网络**: RETRY_ATTEMPTS=1-3
- **不稳定网络**: RETRY_ATTEMPTS=5-10
- **关键业务**: RETRY_ATTEMPTS=10+

### 4. 导出路径

- 使用绝对路径可避免路径问题
- 确保进程有写入权限
- 定期清理导出文件防止占用空间

## 配置优先级

配置值的加载优先级（从高到低）：

1. 环境变量（`process.env`）
2. `.env` 文件
3. 代码中的默认值

## 故障排查

### 配置加载失败

如果遇到配置加载问题：

1. 检查 `.env` 文件是否存在
2. 确认环境变量名称拼写正确
3. 查看控制台的配置验证输出
4. 确认数值类型的配置没有非数字字符

### 超时问题

如果频繁超时：

1. 增加相应API的超时时间
2. 检查网络连接
3. 增加重试次数
4. 考虑使用代理

### 导出失败

如果文件导出失败：

1. 检查目录权限
2. 确认磁盘空间充足
3. 验证路径配置正确
4. 查看错误日志

## 配置API

在代码中访问配置：

```typescript
import { config } from './config.js';

// 访问API配置
console.log(config.api.binance.baseUrl);
console.log(config.api.tushare.timeout);

// 访问分页配置
console.log(config.pagination.defaultPageSize);

// 访问导出配置
console.log(config.export.defaultExportPath);
```

## 更新记录

- **v1.1.0**: 添加配置管理系统
  - 新增 Binance API 配置
  - 新增分页配置
  - 新增导出路径配置
  - 添加配置验证功能