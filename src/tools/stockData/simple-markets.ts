/**
 * 简单市场处理模块（us, hk, fund）
 * 这些市场使用标准的Tushare API和标准表格格式
 */

import { TUSHARE_CONFIG, config } from '../../config.js';
import { 
  MarketProcessParams, 
  MarketProcessResult, 
  Indicators,
  StockDataRecord,
  MarketType,
  MARKET_TITLE_MAP,
  FIELD_NAME_MAP
} from './types.js';
import { resolveStockCodes } from '../../utils/stockCodeResolver.js';
import { 
  calculateMACD, 
  calculateKDJ, 
  calculateRSI, 
  calculateBOLL, 
  calculateSMA,
  parseIndicatorParams,
  calculateRequiredDays,
  calculateExtendedStartDate,
  filterDataToUserRange
} from '../stockDataDetail/index.js';
import { 
  generateIndicatorDocumentation,
  generateCSVContent,
  generateJSONData,
  formatAmountWan,
  getIndicatorHeaders,
  getIndicatorRow
} from './formatter.js';

const API_NAME_MAP: Record<string, string> = {
  'us': 'us_daily',
  'hk': 'hk_daily',
  'fund': 'fund_daily'
};

/**
 * 通用简单市场处理函数
 */
async function processSimpleMarket(
  params: MarketProcessParams,
  marketType: MarketType
): Promise<MarketProcessResult> {
  const { code, start_date, end_date, indicators: indicatorsParam, output_format, export_path } = params;
  
  const requestedIndicators = indicatorsParam ? indicatorsParam.trim().split(/\s+/) : [];
  const TUSHARE_API_KEY = TUSHARE_CONFIG.API_TOKEN;
  const TUSHARE_API_URL = TUSHARE_CONFIG.API_URL;
  
  const today = new Date();
  const defaultEndDate = today.toISOString().slice(0, 10).replace(/-/g, '');
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const defaultStartDate = oneMonthAgo.toISOString().slice(0, 10).replace(/-/g, '');
  
  const userStartDate = start_date || defaultStartDate;
  const userEndDate = end_date || defaultEndDate;
  
  let actualStartDate = userStartDate;
  if (requestedIndicators.length > 0) {
    const requiredDays = calculateRequiredDays(requestedIndicators);
    actualStartDate = calculateExtendedStartDate(userStartDate, requiredDays);
  }
  
  const tushareParams = {
    api_name: API_NAME_MAP[marketType],
    token: TUSHARE_API_KEY,
    params: {
      ts_code: code,
      start_date: actualStartDate,
      end_date: userEndDate
    }
  };
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TUSHARE_CONFIG.TIMEOUT);
  
  try {
    const response = await fetch(TUSHARE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tushareParams),
      signal: controller.signal
    });
    
    if (!response.ok) throw new Error(`Tushare API请求失败: ${response.status}`);
    const data = await response.json();
    if (data.code !== 0) throw new Error(`Tushare API错误: ${data.msg}`);
    if (!data.data || !data.data.items || data.data.items.length === 0) {
      throw new Error(`未找到${MARKET_TITLE_MAP[marketType]}${code}的行情数据`);
    }
    
    const fields = data.data.fields;
    let stockData: StockDataRecord[] = data.data.items.map((item: any) => {
      const result: Record<string, any> = {};
      fields.forEach((field: string, index: number) => {
        result[field] = item[index];
      });
      return result;
    });
    
    // 计算技术指标
    let indicators: Indicators = {};
    if (requestedIndicators.length > 0) {
      let closes = stockData.map(d => parseFloat(String(d.close))).reverse();
      let highs = stockData.map(d => parseFloat(String(d.high))).reverse();
      let lows = stockData.map(d => parseFloat(String(d.low))).reverse();
      
      for (const indicator of requestedIndicators) {
        const { name, params } = parseIndicatorParams(indicator);
        switch (name) {
          case 'macd':
            if (params.length !== 3) throw new Error('MACD指标需要3个参数');
            indicators.macd = calculateMACD(closes, params[0], params[1], params[2]);
            break;
          case 'rsi':
            if (params.length !== 1) throw new Error('RSI指标需要1个参数');
            indicators.rsi = calculateRSI(closes, params[0]);
            break;
          case 'kdj':
            if (params.length !== 3) throw new Error('KDJ指标需要3个参数');
            indicators.kdj = calculateKDJ(highs, lows, closes, params[0], params[1], params[2]);
            break;
          case 'boll':
            if (params.length !== 2) throw new Error('布林带指标需要2个参数');
            indicators.boll = calculateBOLL(closes, params[0], params[1]);
            break;
          case 'ma':
            if (params.length !== 1) throw new Error('移动平均线需要1个参数');
            indicators[`ma${params[0]}`] = calculateSMA(closes, params[0]);
            break;
        }
      }
      
      Object.keys(indicators).forEach(key => {
        if (typeof indicators[key] === 'object' && indicators[key] !== null) {
          if (Array.isArray(indicators[key])) {
            indicators[key] = indicators[key].reverse();
          } else {
            Object.keys(indicators[key]).forEach(subKey => {
              if (Array.isArray(indicators[key][subKey])) {
                indicators[key][subKey] = indicators[key][subKey].reverse();
              }
            });
          }
        }
      });
    }
    
    if (requestedIndicators.length > 0) {
      stockData = filterDataToUserRange(stockData, userStartDate, userEndDate);
    }
    
    const outputFormat = output_format || 'markdown';
    
    if (outputFormat === 'csv' || outputFormat === 'json') {
      const fs = await import('fs');
      const path = await import('path');
      
      let exportDir = export_path
        ? (path.isAbsolute(export_path) ? export_path : path.resolve(process.cwd(), export_path))
        : path.join(process.cwd(), config.export.defaultExportPath);
      if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `${code}_${userStartDate}-${userEndDate}_${timestamp}.${outputFormat}`;
      const filepath = path.join(exportDir, filename);
      
      if (outputFormat === 'csv') {
        const csvContent = generateCSVContent(stockData, indicators, ['交易日期', '开盘', '收盘', '最高', '最低', '成交量', '成交额(万元)']);
        fs.writeFileSync(filepath, csvContent, 'utf8');
      } else {
        const jsonData = generateJSONData(code, marketType, userStartDate, userEndDate, stockData, indicators);
        fs.writeFileSync(filepath, JSON.stringify(jsonData, null, 2), 'utf8');
      }
      
      let stockExplanation = '';
      if (['us', 'hk'].includes(marketType)) {
        stockExplanation = '\n\n' + await resolveStockCodes([code]);
      }
      
      return {
        content: [{
          type: "text",
          text: `# ${code} ${MARKET_TITLE_MAP[marketType]}行情数据 - ${outputFormat.toUpperCase()}导出\n\n✅ 文件已生成：\n**文件路径**: ${filepath}\n**数据条数**: ${stockData.length}条\n\n文件已保存到本地目录。${stockExplanation}`
        }]
      };
    }
    
    // Markdown输出
    let formattedData = '';
    if (stockData.length > 0) {
      const coreFields = ['trade_date', 'open', 'close', 'high', 'low', 'vol', 'amount'];
      const displayFields = coreFields.filter(field => Object.keys(stockData[0]).includes(field));
      const indicatorHeaders = getIndicatorHeaders(indicators);
      const allHeaders = [
        ...displayFields.map(f => f === 'amount' ? '成交额(万元)' : (FIELD_NAME_MAP[f] || f)),
        ...indicatorHeaders
      ];
      
      formattedData = `| ${allHeaders.join(' | ')} |\n|${allHeaders.map(() => '--------').join('|')}|\n`;
      stockData.forEach((data, index) => {
        const basicRow = displayFields.map(f => f === 'amount' ? formatAmountWan(data.amount) : (data[f] || 'N/A'));
        const indicatorRow = getIndicatorRow(indicators, index);
        formattedData += `| ${[...basicRow, ...indicatorRow].join(' | ')} |\n`;
      });
    }
    
    const indicatorData = generateIndicatorDocumentation(indicators, requestedIndicators);
    let stockExplanation = '';
    if (['us', 'hk'].includes(marketType)) {
      stockExplanation = await resolveStockCodes([code]);
    }
    
    return {
      content: [{
        type: "text",
        text: `# ${code} ${MARKET_TITLE_MAP[marketType]}行情数据\n\n${formattedData}${indicatorData}${stockExplanation}`
      }]
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const processUsMarket = (params: MarketProcessParams) => processSimpleMarket(params, 'us');
export const processHkMarket = (params: MarketProcessParams) => processSimpleMarket(params, 'hk');
export const processFundMarket = (params: MarketProcessParams) => processSimpleMarket(params, 'fund');