/**
 * 共享类型定义
 */

// 技术指标结果类型
export interface MACDIndicator {
  dif: number[];
  dea: number[];
  macd: number[];
}

export interface KDJIndicator {
  k: number[];
  d: number[];
  j: number[];
}

export interface BOLLIndicator {
  upper: number[];
  middle: number[];
  lower: number[];
}

export interface Indicators {
  macd?: MACDIndicator;
  rsi?: number[];
  kdj?: KDJIndicator;
  boll?: BOLLIndicator;
  [key: string]: any; // 用于 ma5, ma10 等动态指标
}

// 股票数据记录
export interface StockDataRecord {
  trade_date: string;
  open?: number | string;
  close?: number | string;
  high?: number | string;
  low?: number | string;
  vol?: number | string;
  amount?: number | string;
  [key: string]: any; // 支持其他字段
}

// 市场处理函数参数
export interface MarketProcessParams {
  code: string;
  start_date?: string;
  end_date?: string;
  indicators?: string;
  output_format?: string;
  export_path?: string;
}

// 市场处理函数返回值
export interface MarketProcessResult {
  content: Array<{
    type: string;
    text: string;
  }>;
}

// Tushare API 参数
export interface TushareParams {
  api_name: string;
  token: string;
  params: {
    ts_code?: string;
    trade_date?: string;
    start_date?: string;
    end_date?: string;
    [key: string]: any;
  };
  fields?: string;
}

// 市场类型
export type MarketType = 
  | 'cn' 
  | 'us' 
  | 'hk' 
  | 'fx' 
  | 'futures' 
  | 'fund' 
  | 'repo' 
  | 'convertible_bond' 
  | 'options' 
  | 'crypto';

// 市场标题映射
export const MARKET_TITLE_MAP: Record<MarketType, string> = {
  'cn': 'A股',
  'us': '美股',
  'hk': '港股',
  'fx': '外汇',
  'futures': '期货',
  'fund': '基金',
  'repo': '债券逆回购',
  'convertible_bond': '可转债',
  'options': '期权',
  'crypto': '加密货币'
};

// 字段名映射
export const FIELD_NAME_MAP: Record<string, string> = {
  'trade_date': '交易日期',
  'open': '开盘',
  'close': '收盘',
  'high': '最高', 
  'low': '最低',
  'vol': '成交量',
  'amount': '成交额'
};