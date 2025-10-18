import * as dotenv from 'dotenv';
import { AsyncLocalStorage } from 'node:async_hooks';

// 加载环境变量：
// 1. 本地开发时，从.env文件加载
// 2. 在Smithery部署时，从配置文件中加载
dotenv.config();

// 每请求上下文：用于透传用户在 Header 中提交的 Token（Tushare / CoinGecko）
type RequestContext = { tushareToken?: string; coingeckoApiKey?: string; coingeckoProApiKey?: string; coingeckoDemoApiKey?: string };
const requestContext = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(ctx: Partial<RequestContext>, fn: () => Promise<T>): Promise<T> {
  return requestContext.run({
    tushareToken: ctx.tushareToken,
    coingeckoApiKey: ctx.coingeckoApiKey,
    coingeckoProApiKey: ctx.coingeckoProApiKey,
    coingeckoDemoApiKey: ctx.coingeckoDemoApiKey
  }, fn);
}

export function getRequestToken(): string | undefined {
  return requestContext.getStore()?.tushareToken;
}

export function getCoinGeckoApiKey(): string | undefined {
  return requestContext.getStore()?.coingeckoApiKey ?? process.env.COINGECKO_API_KEY ?? undefined;
}

export function getCoinGeckoProApiKey(): string | undefined {
  return requestContext.getStore()?.coingeckoProApiKey ?? process.env.COINGECKO_PRO_API_KEY ?? undefined;
}

export function getCoinGeckoDemoApiKey(): string | undefined {
  return requestContext.getStore()?.coingeckoDemoApiKey ?? process.env.COINGECKO_DEMO_API_KEY ?? undefined;
}

function resolveApiToken(): string | undefined {
  // 优先使用请求上下文中的 Token，其次回退到环境变量
  return getRequestToken() ?? process.env.TUSHARE_TOKEN ?? undefined;
}

// 统一配置对象：API_TOKEN 改为 getter，动态读取每请求 Token
export const TUSHARE_CONFIG = {
  /**
   * Tushare API Token（优先使用请求头透传的 Token）
   */
  get API_TOKEN(): string {
    return resolveApiToken() ?? "";
  },

  /** Tushare 服务器地址 */
  API_URL: "https://api.tushare.pro",

  /** 超时 ms */
  TIMEOUT: 30000,
};

export const COINGECKO_CONFIG = {
  /** 优先使用请求头透传的 Pro Key；否则回退普通 Key；都没有则为空 */
  get API_KEY(): string | undefined {
    return getCoinGeckoApiKey();
  },
  get PRO_API_KEY(): string | undefined {
    return getCoinGeckoProApiKey();
  },
  get DEMO_API_KEY(): string | undefined {
    return getCoinGeckoDemoApiKey();
  },
  /** 自动选择基础域名：有 PRO_KEY 走 pro-api，否则走公共 api */
  get BASE_URL(): string {
    return (getCoinGeckoProApiKey() ? 'https://pro-api.coingecko.com/api/v3' : 'https://api.coingecko.com/api/v3');
  },
  /** 根据提供的 Key 生成请求头 */
  get HEADERS(): Record<string, string> {
    const headers: Record<string, string> = {};
    const pro = getCoinGeckoProApiKey();
    const demo = getCoinGeckoDemoApiKey();
    const std = getCoinGeckoApiKey();
    if (pro) headers['x-cg-pro-api-key'] = pro;
    else if (demo) headers['x-cg-demo-api-key'] = demo;
    else if (std) headers['x-cg-api-key'] = std;
    return headers;
  },
  /** 超时 ms */
  TIMEOUT: 30000,
};

// ========================================
// API配置接口
// ========================================

/** API配置 */
export interface ApiConfig {
  binance: {
    baseUrl: string;
    timeout: number;
  };
  tushare: {
    timeout: number;
    retryAttempts: number;
  };
}

/** 分页配置 */
export interface PaginationConfig {
  defaultPageSize: number;
  maxPageSize: number;
}

/** 导出配置 */
export interface ExportConfig {
  defaultExportPath: string;
  csvExportPath: string;
  jsonExportPath: string;
}

/** 应用配置接口 */
export interface AppConfig {
  api: ApiConfig;
  pagination: PaginationConfig;
  export: ExportConfig;
}

// ========================================
// 应用配置实例
// ========================================

/** 从环境变量或默认值加载配置 */
export const config: AppConfig = {
  api: {
    binance: {
      baseUrl: process.env.BINANCE_API_URL || 'https://api.binance.com',
      timeout: parseInt(process.env.BINANCE_TIMEOUT || '10000')
    },
    tushare: {
      timeout: parseInt(process.env.TUSHARE_TIMEOUT || '30000'),
      retryAttempts: parseInt(process.env.TUSHARE_RETRY_ATTEMPTS || '3')
    }
  },
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '1000'),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '5000')
  },
  export: {
    defaultExportPath: process.env.DEFAULT_EXPORT_PATH || './exports',
    csvExportPath: process.env.CSV_EXPORT_PATH || './csv_exports',
    jsonExportPath: process.env.JSON_EXPORT_PATH || './exports'
  }
};

// ========================================
// 配置验证
// ========================================

/**
 * 验证配置的合法性
 * @throws {Error} 当配置不合法时抛出错误
 */
export function validateConfig(cfg: AppConfig): void {
  // 验证分页配置
  if (cfg.pagination.defaultPageSize > cfg.pagination.maxPageSize) {
    throw new Error('配置错误：defaultPageSize 不能大于 maxPageSize');
  }
  
  if (cfg.pagination.defaultPageSize < 1) {
    throw new Error('配置错误：defaultPageSize 必须大于 0');
  }
  
  // 验证超时配置
  if (cfg.api.tushare.timeout < 1000) {
    throw new Error('配置错误：Tushare timeout 不能小于 1000ms');
  }
  
  if (cfg.api.binance.timeout < 1000) {
    throw new Error('配置错误：Binance timeout 不能小于 1000ms');
  }
  
  // 验证重试次数
  if (cfg.api.tushare.retryAttempts < 0) {
    throw new Error('配置错误：retryAttempts 不能为负数');
  }
  
  // 验证API地址
  if (!cfg.api.binance.baseUrl.startsWith('http')) {
    throw new Error('配置错误：Binance API URL 必须以 http:// 或 https:// 开头');
  }
}

// 启动时验证配置
try {
  validateConfig(config);
} catch (error) {
  console.error('配置验证失败:', error instanceof Error ? error.message : String(error));
  throw error;
}

// 开发态输出便于确认来源（不打印实际 Token 值）
if (process.env.NODE_ENV !== 'production') {
  const fromTs = getRequestToken() ? 'request-header' : (process.env.TUSHARE_TOKEN ? 'env' : 'none');
  const fromCg = getCoinGeckoProApiKey() ? 'request-pro-header/env' : (getCoinGeckoApiKey() ? 'request-std-header/env' : 'none');
  console.log('Tushare token source:', fromTs);
  console.log('CoinGecko key source:', fromCg);
  console.log('Configuration loaded successfully');
  console.log('- Binance API:', config.api.binance.baseUrl);
  console.log('- Default page size:', config.pagination.defaultPageSize);
  console.log('- Export path:', config.export.defaultExportPath);
}
