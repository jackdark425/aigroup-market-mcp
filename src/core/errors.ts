/**
 * 统一错误处理机制
 * 提供标准化的错误类型和工具函数
 */

// ==================== 基础错误类 ====================

/**
 * 财经MCP服务基础错误类
 * 所有自定义错误都应继承此类
 */
export class FinanceMCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    // 保持正确的原型链
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ==================== 具体错误类型 ====================

/**
 * 验证错误 - 用于参数验证失败
 */
export class ValidationError extends FinanceMCPError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * API错误 - 用于外部API调用失败
 */
export class ApiError extends FinanceMCPError {
  constructor(message: string, details?: any) {
    super(message, 'API_ERROR', 502, details);
  }
}

/**
 * 网络错误 - 用于网络连接问题
 */
export class NetworkError extends FinanceMCPError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', 503, details);
  }
}

/**
 * 配置错误 - 用于配置缺失或无效
 */
export class ConfigError extends FinanceMCPError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIG_ERROR', 500, details);
  }
}

/**
 * 数据未找到错误 - 用于请求的数据不存在
 */
export class NotFoundError extends FinanceMCPError {
  constructor(message: string, details?: any) {
    super(message, 'NOT_FOUND', 404, details);
  }
}

// ==================== 工具函数 ====================

/**
 * 格式化错误信息
 * @param error 错误对象
 * @param context 上下文描述
 * @returns 格式化后的错误信息
 */
export function formatErrorMessage(error: Error, context?: string): string {
  if (error instanceof FinanceMCPError) {
    return `[${error.code}] ${context ? context + ': ' : ''}${error.message}`;
  }
  return `${context ? context + ': ' : ''}${error.message}`;
}

/**
 * 创建Tushare API错误
 * @param apiName API接口名称
 * @param code 错误代码
 * @param params 请求参数
 * @returns ApiError实例
 */
export function createTushareError(
  apiName: string,
  code?: string,
  params?: any
): ApiError {
  const message = `Tushare API调用失败 - ${apiName}`;
  const details = { api: apiName, code, params };
  return new ApiError(message, details);
}

/**
 * 创建市场数据错误
 * @param market 市场类型
 * @param symbol 股票代码
 * @param reason 失败原因
 * @returns ApiError实例
 */
export function createMarketError(
  market: string,
  symbol: string,
  reason: string
): ApiError {
  const message = `${market}市场数据获取失败 - ${symbol}: ${reason}`;
  return new ApiError(message, { market, symbol, reason });
}

/**
 * 创建验证错误
 * @param field 字段名称
 * @param value 字段值
 * @param requirement 验证要求
 * @returns ValidationError实例
 */
export function createValidationError(
  field: string,
  value: any,
  requirement: string
): ValidationError {
  const message = `参数验证失败 - ${field}: ${requirement}`;
  return new ValidationError(message, { field, value, requirement });
}

/**
 * 创建数据格式错误
 * @param dataType 数据类型
 * @param reason 错误原因
 * @returns ApiError实例
 */
export function createDataFormatError(
  dataType: string,
  reason: string
): ApiError {
  const message = `数据格式错误 - ${dataType}: ${reason}`;
  return new ApiError(message, { dataType, reason });
}

/**
 * 创建配置缺失错误
 * @param configKey 配置键名
 * @returns ConfigError实例
 */
export function createConfigMissingError(configKey: string): ConfigError {
  const message = `缺少必需的配置项: ${configKey}`;
  return new ConfigError(message, { configKey });
}

/**
 * 包装未知错误为标准错误
 * @param error 原始错误
 * @param context 上下文描述
 * @returns FinanceMCPError实例
 */
export function wrapUnknownError(error: unknown, context?: string): FinanceMCPError {
  if (error instanceof FinanceMCPError) {
    return error;
  }
  
  const err = error as Error;
  return new FinanceMCPError(
    formatErrorMessage(err, context),
    'UNKNOWN_ERROR',
    500,
    { originalError: err.message, stack: err.stack }
  );
}