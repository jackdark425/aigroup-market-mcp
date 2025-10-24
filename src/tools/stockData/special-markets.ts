/**
 * 特殊格式市场处理模块（fx, futures, repo, convertible_bond, options）
 * 这些市场需要特殊的表格列和格式
 */

import { TUSHARE_CONFIG, config } from '../../config.js';
import {
  MarketProcessParams,
  MarketProcessResult,
  Indicators,
  StockDataRecord,
  MarketType,
  MARKET_TITLE_MAP
} from './types.js';
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
  'fx': 'fx_daily',
  'futures': 'fut_daily',
  'repo': 'repo_daily',
  'convertible_bond': 'cb_daily',
  'options': 'opt_daily'
};

/**
 * 处理特殊格式市场
 */
async function processSpecialMarket(
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
  
  // 期权特殊处理
  let tushareParams: any;
  if (marketType === 'options') {
    tushareParams = {
      api_name: API_NAME_MAP[marketType],
      token: TUSHARE_API_KEY,
      params: requestedIndicators.length > 0 || (start_date && end_date)
        ? { ts_code: code, start_date: actualStartDate, end_date: userEndDate }
        : { trade_date: userEndDate }
    };
    if (code) tushareParams.params.ts_code = code;
  } else {
    tushareParams = {
      api_name: API_NAME_MAP[marketType],
      token: TUSHARE_API_KEY,
      params: { ts_code: code, start_date: actualStartDate, end_date: userEndDate }
    };
  }
  
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
      const mid = (a: any, b: any): number => {
        const x = parseFloat(a);
        const y = parseFloat(b);
        if (!isNaN(x) && !isNaN(y)) return (x + y) / 2;
        if (!isNaN(x)) return x;
        if (!isNaN(y)) return y;
        return NaN;
      };

      let closes = marketType === 'fx'
        ? stockData.map(d => mid(d.bid_close, d.ask_close)).reverse()
        : stockData.map(d => parseFloat(String(d.close))).reverse();
      let highs = marketType === 'fx'
        ? stockData.map(d => mid(d.bid_high, d.ask_high)).reverse()
        : stockData.map(d => parseFloat(String(d.high))).reverse();
      let lows = marketType === 'fx'
        ? stockData.map(d => mid(d.bid_low, d.ask_low)).reverse()
        : stockData.map(d => parseFloat(String(d.low))).reverse();
      
      for (const indicator of requestedIndicators) {
        const { name, params } = parseIndicatorParams(indicator);
        switch (name) {
          case 'macd':
            indicators.macd = calculateMACD(closes, params[0], params[1], params[2]);
            break;
          case 'rsi':
            indicators.rsi = calculateRSI(closes, params[0]);
            break;
          case 'kdj':
            indicators.kdj = calculateKDJ(highs, lows, closes, params[0], params[1], params[2]);
            break;
          case 'boll':
            indicators.boll = calculateBOLL(closes, params[0], params[1]);
            break;
          case 'ma':
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
      
      stockData = filterDataToUserRange(stockData, userStartDate, userEndDate);
    }
    
    // 输出格式处理
    const outputFormat = output_format || 'markdown';
    
    // CSV/JSON导出处理
    if (outputFormat === 'csv' || outputFormat === 'json') {
      const fs = await import('fs');
      const path = await import('path');

      let filepath: string;

      if (export_path) {
        // 检查是否为完整文件路径（包含扩展名）
        const hasExtension = path.extname(export_path).length > 0;

        if (hasExtension) {
          // 用户指定了完整文件路径
          if (path.isAbsolute(export_path)) {
            filepath = export_path;
          } else {
            filepath = path.resolve(process.cwd(), export_path);
          }

          // 确保父目录存在
          const parentDir = path.dirname(filepath);
          if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
          }
        } else {
          // 用户指定的是目录路径
          let exportDir = export_path
            ? (path.isAbsolute(export_path) ? export_path : path.resolve(process.cwd(), export_path))
            : path.join(process.cwd(), config.export.defaultExportPath);

          if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
          }

          // 生成带时间戳的文件名
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
          const filename = `${code}_${userStartDate}-${userEndDate}_${timestamp}.${outputFormat}`;
          filepath = path.join(exportDir, filename);
        }
      } else {
        // 使用默认导出目录
        const exportDir = path.join(process.cwd(), config.export.defaultExportPath);
        if (!fs.existsSync(exportDir)) {
          fs.mkdirSync(exportDir, { recursive: true });
        }

        // 生成带时间戳的文件名
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `${code}_${userStartDate}-${userEndDate}_${timestamp}.${outputFormat}`;
        filepath = path.join(exportDir, filename);
      }
      
      // 根据市场类型确定表头
      let baseHeaders: string[] = [];
      if (marketType === 'fx') {
        baseHeaders = ['交易日期', '买入开盘', '买入最高', '买入最低', '买入收盘', '卖出开盘', '卖出最高', '卖出最低', '卖出收盘', '报价笔数'];
      } else if (marketType === 'futures') {
        baseHeaders = ['交易日期', '开盘', '最高', '最低', '收盘', '结算', '涨跌1', '涨跌2', '成交量', '持仓量'];
      } else if (marketType === 'repo') {
        baseHeaders = ['交易日期', '品种名称', '利率(%)', '成交金额(万元)'];
      } else if (marketType === 'convertible_bond') {
        baseHeaders = ['交易日期', '开盘', '最高', '最低', '收盘', '涨跌', '涨跌幅(%)', '成交量(手)', '成交金额(万元)', '纯债价值', '纯债溢价率(%)', '转股价值', '转股溢价率(%)'];
      } else if (marketType === 'options') {
        baseHeaders = ['交易日期', '交易所', '昨结算', '前收盘', '开盘', '最高', '最低', '收盘', '结算', '成交量(手)', '成交金额(万元)', '持仓量(手)'];
      }
      
      if (outputFormat === 'csv') {
        const csvContent = generateCSVContent(stockData, indicators, baseHeaders);
        fs.writeFileSync(filepath, csvContent, 'utf8');
      } else {
        const jsonData = generateJSONData(code, marketType, userStartDate, userEndDate, stockData, indicators);
        fs.writeFileSync(filepath, JSON.stringify(jsonData, null, 2), 'utf8');
      }
      
      const stats = fs.statSync(filepath);
      const fileSizeKB = (stats.size / 1024).toFixed(2);
      
      return {
        content: [{
          type: "text",
          text: `# ${code} ${MARKET_TITLE_MAP[marketType]}行情数据 - ${outputFormat.toUpperCase()}导出\n\n✅ 文件已生成：\n**文件路径**: ${filepath}\n**文件大小**: ${fileSizeKB} KB\n**数据条数**: ${stockData.length}条\n**包含指标**: ${Object.keys(indicators).length > 0 ? '是' : '否'}\n**日期范围**: ${userStartDate} 至 ${userEndDate}\n\n文件已保存到本地目录。`
        }]
      };
    }
    
    // Markdown格式输出：生成特殊格式表格
    let formattedData = '';
    const indicatorHeaders = getIndicatorHeaders(indicators);
    
    if (marketType === 'fx') {
      const baseHeaders = ['交易日期','买入开盘','买入最高','买入最低','买入收盘','卖出开盘','卖出最高','卖出最低','卖出收盘','报价笔数'];
      const headers = [...baseHeaders, ...indicatorHeaders];
      formattedData = `| ${headers.join(' | ')} |\n|${headers.map(() => '--------').join('|')}|\n`;
      stockData.forEach((data, index) => {
        const baseRow = [data.trade_date, data.bid_open || 'N/A', data.bid_high || 'N/A', data.bid_low || 'N/A', data.bid_close || 'N/A', data.ask_open || 'N/A', data.ask_high || 'N/A', data.ask_low || 'N/A', data.ask_close || 'N/A', data.tick_qty || 'N/A'];
        const indicatorRow = getIndicatorRow(indicators, index);
        formattedData += `| ${[...baseRow, ...indicatorRow].join(' | ')} |\n`;
      });
    } else if (marketType === 'futures') {
      const baseHeaders = ['交易日期','开盘','最高','最低','收盘','结算','涨跌1','涨跌2','成交量','持仓量'];
      const headers = [...baseHeaders, ...indicatorHeaders];
      formattedData = `| ${headers.join(' | ')} |\n|${headers.map(() => '--------').join('|')}|\n`;
      stockData.forEach((data, index) => {
        const baseRow = [data.trade_date, data.open || 'N/A', data.high || 'N/A', data.low || 'N/A', data.close || 'N/A', data.settle || 'N/A', data.change1 || 'N/A', data.change2 || 'N/A', data.vol || 'N/A', data.oi || 'N/A'];
        const indicatorRow = getIndicatorRow(indicators, index);
        formattedData += `| ${[...baseRow, ...indicatorRow].join(' | ')} |\n`;
      });
    } else if (marketType === 'repo') {
      formattedData = `| 交易日期 | 品种名称 | 利率(%) | 成交金额(万元) |\n|---------|---------|---------|---------------|\n`;
      stockData.forEach((data) => {
        formattedData += `| ${data.trade_date} | ${data.name || 'N/A'} | ${data.rate || 'N/A'} | ${formatAmountWan(data.amount)} |\n`;
      });
    } else if (marketType === 'convertible_bond') {
      const baseHeaders = ['交易日期','开盘','最高','最低','收盘','涨跌','涨跌幅(%)','成交量(手)','成交金额(万元)','纯债价值','纯债溢价率(%)','转股价值','转股溢价率(%)'];
      const headers = [...baseHeaders, ...indicatorHeaders];
      formattedData = `| ${headers.join(' | ')} |\n|${headers.map(() => '--------').join('|')}|\n`;
      stockData.forEach((data, index) => {
        const baseRow = [data.trade_date, data.open || 'N/A', data.high || 'N/A', data.low || 'N/A', data.close || 'N/A', data.change || 'N/A', data.pct_chg || 'N/A', data.vol || 'N/A', formatAmountWan(data.amount), data.bond_value || 'N/A', data.bond_over_rate || 'N/A', data.cb_value || 'N/A', data.cb_over_rate || 'N/A'];
        const indicatorRow = getIndicatorRow(indicators, index);
        formattedData += `| ${[...baseRow, ...indicatorRow].join(' | ')} |\n`;
      });
    } else if (marketType === 'options') {
      const baseHeaders = ['交易日期','交易所','昨结算','前收盘','开盘','最高','最低','收盘','结算','成交量(手)','成交金额(万元)','持仓量(手)'];
      const headers = [...baseHeaders, ...indicatorHeaders];
      formattedData = `| ${headers.join(' | ')} |\n|${headers.map(() => '--------').join('|')}|\n`;
      stockData.forEach((data, index) => {
        const baseRow = [data.trade_date, data.exchange || 'N/A', data.pre_settle || 'N/A', data.pre_close || 'N/A', data.open || 'N/A', data.high || 'N/A', data.low || 'N/A', data.close || 'N/A', data.settle || 'N/A', data.vol || 'N/A', formatAmountWan(data.amount), data.oi || 'N/A'];
        const indicatorRow = getIndicatorRow(indicators, index);
        formattedData += `| ${[...baseRow, ...indicatorRow].join(' | ')} |\n`;
      });
    }
    
    const indicatorData = generateIndicatorDocumentation(indicators, requestedIndicators);
    
    return {
      content: [{
        type: "text",
        text: `# ${code} ${MARKET_TITLE_MAP[marketType]}行情数据\n\n${formattedData}${indicatorData}`
      }]
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const processFxMarket = (params: MarketProcessParams) => processSpecialMarket(params, 'fx');
export const processFuturesMarket = (params: MarketProcessParams) => processSpecialMarket(params, 'futures');
export const processRepoMarket = (params: MarketProcessParams) => processSpecialMarket(params, 'repo');
export const processBondMarket = (params: MarketProcessParams) => processSpecialMarket(params, 'convertible_bond');
export const processOptionsMarket = (params: MarketProcessParams) => processSpecialMarket(params, 'options');