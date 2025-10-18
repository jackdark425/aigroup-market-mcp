/**
 * 通用格式化输出逻辑
 */

import { 
  Indicators, 
  StockDataRecord, 
  MarketType,
  MARKET_TITLE_MAP 
} from './types.js';
import { parseIndicatorParams, formatIndicatorParams } from '../stockDataDetail/index.js';

/**
 * 格式化金额：将千元转为万元
 */
export function formatAmountWan(val: any): string {
  const num = Number(val);
  if (val == null || val === '' || isNaN(num)) return 'N/A';
  return (num / 10).toFixed(2);
}

/**
 * 生成技术指标表头
 */
export function getIndicatorHeaders(indicators: Indicators): string[] {
  const headers: string[] = [];
  
  if (indicators.macd) headers.push('MACD_DIF', 'MACD_DEA', 'MACD');
  if (indicators.rsi) headers.push('RSI');
  if (indicators.kdj) headers.push('KDJ_K', 'KDJ_D', 'KDJ_J');
  if (indicators.boll) headers.push('BOLL_UP', 'BOLL_MID', 'BOLL_LOW');
  
  const maIndicators = Object.keys(indicators).filter(key => key.startsWith('ma') && key !== 'macd');
  maIndicators.forEach(ma => headers.push(ma.toUpperCase()));
  
  return headers;
}

/**
 * 生成技术指标数据行
 */
export function getIndicatorRow(indicators: Indicators, index: number): string[] {
  const row: string[] = [];
  
  if (indicators.macd) {
    row.push(
      isNaN(indicators.macd.dif[index]) ? 'N/A' : indicators.macd.dif[index].toFixed(4),
      isNaN(indicators.macd.dea[index]) ? 'N/A' : indicators.macd.dea[index].toFixed(4),
      isNaN(indicators.macd.macd[index]) ? 'N/A' : indicators.macd.macd[index].toFixed(4)
    );
  }
  
  if (indicators.rsi) {
    row.push(isNaN(indicators.rsi[index]) ? 'N/A' : indicators.rsi[index].toFixed(2));
  }
  
  if (indicators.kdj) {
    row.push(
      isNaN(indicators.kdj.k[index]) ? 'N/A' : indicators.kdj.k[index].toFixed(2),
      isNaN(indicators.kdj.d[index]) ? 'N/A' : indicators.kdj.d[index].toFixed(2),
      isNaN(indicators.kdj.j[index]) ? 'N/A' : indicators.kdj.j[index].toFixed(2)
    );
  }
  
  if (indicators.boll) {
    row.push(
      isNaN(indicators.boll.upper[index]) ? 'N/A' : indicators.boll.upper[index].toFixed(2),
      isNaN(indicators.boll.middle[index]) ? 'N/A' : indicators.boll.middle[index].toFixed(2),
      isNaN(indicators.boll.lower[index]) ? 'N/A' : indicators.boll.lower[index].toFixed(2)
    );
  }
  
  const maIndicators = Object.keys(indicators).filter(key => key.startsWith('ma') && key !== 'macd');
  maIndicators.forEach(ma => {
    row.push(isNaN(indicators[ma][index]) ? 'N/A' : indicators[ma][index].toFixed(2));
  });
  
  return row;
}

/**
 * 生成技术指标说明文档
 */
export function generateIndicatorDocumentation(
  indicators: Indicators, 
  requestedIndicators: string[]
): string {
  if (Object.keys(indicators).length === 0) {
    return '';
  }
  
  let indicatorData = `\n\n## 📊 技术指标说明\n`;
  
  // 记录实际使用的参数
  const indicatorParams: Record<string, string> = {};
  for (const indicator of requestedIndicators) {
    try {
      const { name, params } = parseIndicatorParams(indicator);
      indicatorParams[name] = formatIndicatorParams(name, params);
    } catch {
      // 忽略解析错误
    }
  }
  
  if (indicators.macd) {
    const params = indicatorParams.macd || '(参数未知)';
    indicatorData += `- **MACD${params}**: DIF(快线)、DEA(慢线)、MACD(柱状图)\n`;
  }
  if (indicators.rsi) {
    const params = indicatorParams.rsi || '(参数未知)';
    indicatorData += `- **RSI${params}**: 相对强弱指标，范围0-100，>70超买，<30超卖\n`;
  }
  if (indicators.kdj) {
    const params = indicatorParams.kdj || '(参数未知)';
    indicatorData += `- **KDJ${params}**: 随机指标，K线、D线、J线，>80超买，<20超卖\n`;
  }
  if (indicators.boll) {
    const params = indicatorParams.boll || '(参数未知)';
    indicatorData += `- **BOLL${params}**: 布林带，上轨、中轨、下轨\n`;
  }
  
  const maIndicators = Object.keys(indicators).filter(key => key.startsWith('ma') && key !== 'macd');
  if (maIndicators.length > 0) {
    maIndicators.forEach(ma => {
      const period = ma.replace('ma', '');
      indicatorData += `- **${ma.toUpperCase()}(${period})**: 移动平均线，常用判断趋势方向\n`;
    });
  }
  
  return indicatorData;
}

/**
 * 生成CSV内容
 */
export function generateCSVContent(
  stockData: StockDataRecord[],
  indicators: Indicators,
  baseHeaders: string[]
): string {
  let csvContent = '';
  const headers = [...baseHeaders];
  
  if (Object.keys(indicators).length > 0) {
    if (indicators.macd) headers.push('MACD_DIF', 'MACD_DEA', 'MACD');
    if (indicators.rsi) headers.push('RSI');
    if (indicators.kdj) headers.push('KDJ_K', 'KDJ_D', 'KDJ_J');
    if (indicators.boll) headers.push('BOLL_UP', 'BOLL_MID', 'BOLL_LOW');
    const maIndicators = Object.keys(indicators).filter(key => key.startsWith('ma') && key !== 'macd');
    maIndicators.forEach(ma => headers.push(ma.toUpperCase()));
  }
  
  csvContent += headers.join(',') + '\n';
  
  stockData.forEach((data: StockDataRecord, index: number) => {
    const row: any[] = [];
    
    // 基础数据列（根据 baseHeaders 动态生成）
    baseHeaders.forEach(header => {
      const field = getFieldKeyFromHeader(header);
      if (field === 'amount') {
        row.push(formatAmountWan(data.amount));
      } else {
        row.push(data[field] || '');
      }
    });
    
    // 技术指标列
    if (Object.keys(indicators).length > 0) {
      if (indicators.macd) {
        row.push(
          isNaN(indicators.macd.dif[index]) ? '' : indicators.macd.dif[index].toFixed(4),
          isNaN(indicators.macd.dea[index]) ? '' : indicators.macd.dea[index].toFixed(4),
          isNaN(indicators.macd.macd[index]) ? '' : indicators.macd.macd[index].toFixed(4)
        );
      }
      if (indicators.rsi) row.push(isNaN(indicators.rsi[index]) ? '' : indicators.rsi[index].toFixed(2));
      if (indicators.kdj) row.push(
        isNaN(indicators.kdj.k[index]) ? '' : indicators.kdj.k[index].toFixed(2),
        isNaN(indicators.kdj.d[index]) ? '' : indicators.kdj.d[index].toFixed(2),
        isNaN(indicators.kdj.j[index]) ? '' : indicators.kdj.j[index].toFixed(2)
      );
      if (indicators.boll) row.push(
        isNaN(indicators.boll.upper[index]) ? '' : indicators.boll.upper[index].toFixed(2),
        isNaN(indicators.boll.middle[index]) ? '' : indicators.boll.middle[index].toFixed(2),
        isNaN(indicators.boll.lower[index]) ? '' : indicators.boll.lower[index].toFixed(2)
      );
      const maIndicators = Object.keys(indicators).filter(key => key.startsWith('ma') && key !== 'macd');
      maIndicators.forEach(ma => {
        row.push(isNaN(indicators[ma][index]) ? '' : indicators[ma][index].toFixed(2));
      });
    }
    
    csvContent += row.join(',') + '\n';
  });
  
  return csvContent;
}

/**
 * 从中文表头获取字段键
 */
function getFieldKeyFromHeader(header: string): string {
  const map: Record<string, string> = {
    '交易日期': 'trade_date',
    '开盘': 'open',
    '收盘': 'close',
    '最高': 'high',
    '最低': 'low',
    '成交量': 'vol',
    '成交额(万元)': 'amount',
    '成交量(手)': 'vol',
    '成交金额(万元)': 'amount'
  };
  return map[header] || header.toLowerCase();
}

/**
 * 生成JSON数据
 */
export function generateJSONData(
  code: string,
  marketType: MarketType,
  userStartDate: string,
  userEndDate: string,
  stockData: StockDataRecord[],
  indicators: Indicators
): any {
  return {
    metadata: {
      code,
      market_type: marketType,
      start_date: userStartDate,
      end_date: userEndDate,
      data_count: stockData.length,
      has_indicators: Object.keys(indicators).length > 0,
      indicators: Object.keys(indicators),
      export_time: new Date().toISOString()
    },
    data: stockData.map((data: StockDataRecord, index: number) => {
      const row: Record<string, any> = {
        trade_date: data.trade_date,
        open: data.open,
        close: data.close,
        high: data.high,
        low: data.low,
        vol: data.vol,
        amount: data.amount
      };
      
      if (Object.keys(indicators).length > 0) {
        row.indicators = {};
        if (indicators.macd) {
          row.indicators.macd = {
            dif: indicators.macd.dif[index],
            dea: indicators.macd.dea[index],
            macd: indicators.macd.macd[index]
          };
        }
        if (indicators.rsi) row.indicators.rsi = indicators.rsi[index];
        if (indicators.kdj) {
          row.indicators.kdj = {
            k: indicators.kdj.k[index],
            d: indicators.kdj.d[index],
            j: indicators.kdj.j[index]
          };
        }
        if (indicators.boll) {
          row.indicators.boll = {
            upper: indicators.boll.upper[index],
            middle: indicators.boll.middle[index],
            lower: indicators.boll.lower[index]
          };
        }
        const maIndicators = Object.keys(indicators).filter(key => key.startsWith('ma') && key !== 'macd');
        maIndicators.forEach(ma => {
          row.indicators[ma] = indicators[ma][index];
        });
      }
      
      return row;
    })
  };
}

/**
 * 生成Markdown表格
 */
export function generateMarkdownTable(
  stockData: StockDataRecord[],
  indicators: Indicators,
  headers: string[],
  getRowData: (data: StockDataRecord) => any[]
): string {
  const indicatorHeaders = getIndicatorHeaders(indicators);
  const allHeaders = [...headers, ...indicatorHeaders];
  
  let table = `| ${allHeaders.join(' | ')} |\n`;
  table += `|${allHeaders.map(() => '--------').join('|')}|\n`;
  
  stockData.forEach((data: StockDataRecord, index: number) => {
    const baseRow = getRowData(data);
    const indicatorRow = getIndicatorRow(indicators, index);
    const fullRow = [...baseRow, ...indicatorRow];
    table += `| ${fullRow.join(' | ')} |\n`;
  });
  
  return table;
}