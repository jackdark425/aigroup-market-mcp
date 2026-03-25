import { TUSHARE_CONFIG } from '../config.js';
import { createLogger } from './logger.js';

const logger = createLogger(process.env.MCP_TRANSPORT === 'stdio' ? 'stdio' : 'http');

export interface TushareRequestPayload {
  api_name: string;
  token?: string;
  params?: Record<string, unknown>;
  fields?: string;
}

export interface TushareResponse<T = Record<string, unknown>> {
  data: T[];
  fields: string[];
}

export function requireTushareToken(): string {
  const token = TUSHARE_CONFIG.API_TOKEN;
  if (!token) {
    throw new Error('缺少 Tushare Token：请在请求头 X-Tushare-Token 或环境变量 TUSHARE_TOKEN 中提供');
  }
  return token;
}

export async function requestTushare<T = Record<string, unknown>>(
  payload: TushareRequestPayload,
  options?: {
    allowEmpty?: boolean;
    logLabel?: string;
  }
): Promise<TushareResponse<T>> {
  const requestPayload: TushareRequestPayload = {
    ...payload,
    token: payload.token || requireTushareToken(),
    params: payload.params || {}
  };

  const label = options?.logLabel || requestPayload.api_name;
  logger.info(`请求 Tushare API[${label}]，参数:`, requestPayload.params);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TUSHARE_CONFIG.TIMEOUT);

  try {
    const response = await fetch(TUSHARE_CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Tushare API请求失败: ${response.status}`);
    }

    const result = await response.json();
    if (result.code !== 0) {
      throw new Error(`Tushare API错误: ${result.msg}`);
    }

    const fields = Array.isArray(result.data?.fields) ? result.data.fields : [];
    const items = Array.isArray(result.data?.items) ? result.data.items : [];

    if (!items.length && !options?.allowEmpty) {
      throw new Error(`未找到${label}数据`);
    }

    const data = items.map((item: unknown[]) => {
      const row: Record<string, unknown> = {};
      fields.forEach((field: string, index: number) => {
        row[field] = item[index];
      });
      return row as T;
    });

    logger.info(`成功获取到${data.length}条${label}数据记录`);
    return { data, fields };
  } finally {
    clearTimeout(timeoutId);
  }
}
