/**
 * Tushare API 通用处理模块
 */

import { TUSHARE_CONFIG, config } from '../../config.js';
import { 
  MarketProcessParams, 
  MarketProcessResult, 
  Indicators,
  StockDataRecord,
  TushareParams,
  MarketType,
  MARKET_TITLE_MAP
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
  generateMarkdownTable
} from './formatter.js';

/**
 * 通用Tushare市场数据获取和处理
 */
export async function processTushareMarket(
  params: MarketProcessParams,
  marketType: MarketType,
  apiName: string,
  customApiParams?: (params: MarketProcessParams, actualStartDate: string, actualEndDate: string) => any
): Promise<MarketProcessResult> {
  const { code, start_date, end_date, indicators: indicatorsParam, output_format, export_path } = params;
  
  // 解析技术指标参数
  const requestedIndicators = indicatorsParam ? indicatorsParam.trim().split(/\s+/) : [];
  console.log('请求的技术指标:', requestedIndicators);
  
  // 使用全局配置中的Tushare API设置
  const TUSHARE_API_KEY = TUSHARE_CONFIG.API_TOKEN;
  const TUSHARE_API_URL = TUSHARE_CONFIG.API_URL;
  
  // 默认参数设置
  const today = new Date();
  const defaultEndDate = today.toISOString().slice(0, 10).replace(/-/g, '');
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const defaultStartDate = oneMonthAgo.toISOString().slice(0, 10).replace(/-/g, '');
  
  // 用户请求的时间范围
  const userStartDate = start_date || defaultStartDate;
  const userEndDate = end_date || defaultEndDate;
  
  // 如果有技术指标请求，计算需要的历史数据并扩展获取范围
  let actualStartDate = userStartDate;
  let actualEndDate = userEndDate;
  
  if (requestedIndicators.length > 0) {
    const requiredDays = calculateRequiredDays(requestedIndicators);
    actualStartDate = calculateExtendedStartDate(userStartDate, requiredDays);
    console.log(`技术指标需要${requiredDays}天历史数据，扩展开始日期从 ${userStartDate} 到 ${actualStartDate}`);
  }
  
  // 构建请求参数
  const tushareParams: TushareParams = {
    api_name: apiName,
    token: TUSHARE_API_KEY,
    params: customApiParams 
      ? customApiParams(params, actualStartDate, actualEndDate)
      : {
          ts_code: code,
          start_date: actualStartDate,
          end_date: actualEndDate
        }
  };
  
  console.log(`选择的API接口: ${apiName}`);
  console.log(`请求Tushare API参数:`, tushareParams.params);
  
  // 设置请求超时
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TUSHARE_CONFIG.TIMEOUT);
  
  try {
    // 发送请求
    const response = await fetch(TUSHARE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(tushareParams),
      signal: controller.signal
    });
    
    if (!response.ok) {
      throw new Error(`Tushare API请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 处理响应数据
    if (data.code !== 0) {
      throw new Error(`Tushare API错误: ${data.msg}`);
    }
    
    // 确保data.data和data.data.items存在
    if (!data.data || !data.data.items || data.data.items.length === 0) {
      throw new Error(`未找到${marketType}市场股票${code}的行情数据`);
    }
    
    // 获取字段名
    const fields = data.data.fields;
    
    // 将数据转换为对象数组
    let stockData: StockDataRecord[] = data.data.items.map((item: any) => {
      const result: Record<string, any> = {};
      fields.forEach((field: string, index: number) => {
        result[field] = item[index];
      });
      return result;
    });
    
    console.log(`成功获取到${stockData.length}条${code}股票数据记录（扩展数据范围）`);
    
    // 对A股强制应用前复权（qfq）
    if (marketType === 'cn' && stockData.length > 0) {
      try {
        const afParams = {
          api_name: 'adj_factor',
          token: TUSHARE_API_KEY,
          params: {
            ts_code: code,
            start_date: actualStartDate,
            end_date: actualEndDate
          },
          fields: 'trade_date,adj_factor'
        } as any;

        const afResp = await fetch(TUSHARE_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(afParams),
          signal: controller.signal
        });
        if (!afResp.ok) throw new Error(`adj_factor 请求失败: ${afResp.status}`);
        const afJson = await afResp.json();
        if (afJson.code !== 0) throw new Error(`adj_factor 返回错误: ${afJson.msg}`);
        const afFields: string[] = afJson.data?.fields ?? [];
        const afItems: any[] = afJson.data?.items ?? [];
        const idxDate = afFields.indexOf('trade_date');
        const idxFactor = afFields.indexOf('adj_factor');
        const factorMap = new Map<string, number>();
        for (const row of afItems) {
          const d = String(row[idxDate]);
          const f = Number(row[idxFactor]);
          if (!isNaN(f)) factorMap.set(d, f);
        }

        // 找到stockData中最新交易日的因子
        const latestDate = stockData
          .map((r: any) => String(r.trade_date))
          .sort((a: string, b: string) => b.localeCompare(a))[0];
        const latestFactor = factorMap.get(latestDate);

        if (latestFactor && !isNaN(latestFactor)) {
          stockData = stockData.map((row: any) => {
            const f = factorMap.get(String(row.trade_date));
            if (f && !isNaN(f)) {
              const ratio = f / latestFactor; // 前复权：price * f / f_latest
              const adj = (v: any) => (v == null || v === '' || isNaN(Number(v))) ? v : Number(v) * ratio;
              return {
                ...row,
                open: adj(row.open),
                high: adj(row.high),
                low: adj(row.low),
                close: adj(row.close)
              };
            }
            return row;
          });
          console.log(`已应用前复权(基于最新交易日因子)到 ${code} 的OHLC价格`);
        } else {
          console.warn('未找到最新交易日复权因子，跳过前复权');
        }
      } catch (e) {
        console.warn('应用前复权失败，继续返回未复权数据:', e);
      }
    }
    
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

      let closes: number[] = [];
      let highs: number[] = [];
      let lows: number[] = [];

      if (marketType === 'fx') {
        closes = stockData.map((d: StockDataRecord) => mid(d.bid_close, d.ask_close)).reverse();
        highs = stockData.map((d: StockDataRecord) => mid(d.bid_high, d.ask_high)).reverse();
        lows = stockData.map((d: StockDataRecord) => mid(d.bid_low, d.ask_low)).reverse();
      } else {
        closes = stockData.map((d: StockDataRecord) => parseFloat(String(d.close))).reverse();
        highs = stockData.map((d: StockDataRecord) => parseFloat(String(d.high))).reverse();
        lows = stockData.map((d: StockDataRecord) => parseFloat(String(d.low))).reverse();
      }
      
      for (const indicator of requestedIndicators) {
        try {
          const { name, params } = parseIndicatorParams(indicator);
          
          switch (name) {
            case 'macd':
              if (params.length !== 3) {
                throw new Error(`MACD指标需要3个参数，格式：macd(快线,慢线,信号线)，如：macd(12,26,9)`);
              }
              indicators.macd = calculateMACD(closes, params[0], params[1], params[2]);
              break;
            case 'rsi':
              if (params.length !== 1) {
                throw new Error(`RSI指标需要1个参数，格式：rsi(周期)，如：rsi(14)`);
              }
              indicators.rsi = calculateRSI(closes, params[0]);
              break;
            case 'kdj':
              if (params.length !== 3) {
                throw new Error(`KDJ指标需要3个参数，格式：kdj(K周期,K平滑,D平滑)，如：kdj(9,3,3)`);
              }
              indicators.kdj = calculateKDJ(highs, lows, closes, params[0], params[1], params[2]);
              break;
            case 'boll':
              if (params.length !== 2) {
                throw new Error(`布林带指标需要2个参数，格式：boll(周期,标准差倍数)，如：boll(20,2)`);
              }
              indicators.boll = calculateBOLL(closes, params[0], params[1]);
              break;
            case 'ma':
              if (params.length !== 1) {
                throw new Error(`移动平均线需要1个参数，格式：ma(周期)，如：ma(5)、ma(10)、ma(20)`);
              }
              const maPeriod = params[0];
              indicators[`ma${maPeriod}`] = calculateSMA(closes, maPeriod);
              break;
            default:
              throw new Error(`不支持的技术指标: ${name}，支持的指标：macd(12,26,9)、rsi(14)、kdj(9,3,3)、boll(20,2)、ma(周期)`);
          }
        } catch (error) {
          console.error(`解析技术指标 ${indicator} 时出错:`, error);
          throw new Error(`技术指标参数错误: ${indicator}`);
        }
      }
      
      // 将技术指标数据逆序回来，以匹配原始数据的时间顺序（最新日期在前）
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
    
    // 过滤数据到用户请求的时间范围
    if (requestedIndicators.length > 0) {
      stockData = filterDataToUserRange(stockData, userStartDate, userEndDate);
      console.log(`过滤到用户请求时间范围，剩余${stockData.length}条记录`);
    }
    
    // 输出格式处理
    const outputFormat = output_format || 'markdown';
    const titleSuffix = marketType === 'cn' ? '（前复权）' : '';
    
    // CSV/JSON输出处理
    if (outputFormat === 'csv' || outputFormat === 'json') {
      const fs = await import('fs');
      const path = await import('path');
      
      // 创建导出目录
      let exportDir: string;
      if (export_path) {
        if (path.isAbsolute(export_path)) {
          exportDir = export_path;
        } else {
          exportDir = path.resolve(process.cwd(), export_path);
        }
      } else {
        exportDir = path.join(process.cwd(), config.export.defaultExportPath);
      }
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
      
      // 生成改进的文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const dateRange = `${userStartDate}-${userEndDate}`;
      const indicatorInfo = Object.keys(indicators).length > 0 ? '_with_indicators' : '';
      const ext = outputFormat === 'csv' ? 'csv' : 'json';
      const filename = `${code}_${dateRange}${indicatorInfo}_${timestamp}.${ext}`;
      const filepath = path.join(exportDir, filename);
      
      if (outputFormat === 'csv') {
        const csvContent = generateCSVContent(
          stockData,
          indicators,
          ['交易日期', '开盘', '收盘', '最高', '最低', '成交量', '成交额(万元)']
        );
        fs.writeFileSync(filepath, csvContent, 'utf8');
      } else {
        const jsonData = generateJSONData(code, marketType, userStartDate, userEndDate, stockData, indicators);
        fs.writeFileSync(filepath, JSON.stringify(jsonData, null, 2), 'utf8');
      }
      
      // 获取文件统计信息
      const stats = fs.statSync(filepath);
      const fileSizeKB = (stats.size / 1024).toFixed(2);
      const columnCount = Object.keys(indicators).length > 0 ?
        7 + (indicators.macd ? 3 : 0) + (indicators.rsi ? 1 : 0) +
        (indicators.kdj ? 3 : 0) + (indicators.boll ? 3 : 0) +
        Object.keys(indicators).filter(k => k.startsWith('ma') && k !== 'macd').length : 7;
      
      // 收集股票代码并生成说明（仅对股票市场）
      let stockExplanation = '';
      if (['cn', 'us', 'hk'].includes(marketType)) {
        stockExplanation = '\n\n' + await resolveStockCodes([code]);
      }
      
      return {
        content: [
          {
            type: "text",
            text: `# ${code} ${MARKET_TITLE_MAP[marketType]}行情数据 - ${outputFormat.toUpperCase()}导出\n\n✅ 文件已生成：\n**文件路径**: ${filepath}\n**文件大小**: ${fileSizeKB} KB\n**数据条数**: ${stockData.length}条\n**数据列数**: ${columnCount}列\n**包含指标**: ${Object.keys(indicators).length > 0 ? '是 (' + Object.keys(indicators).join(', ') + ')' : '否'}\n**日期范围**: ${userStartDate} 至 ${userEndDate}\n\n文件已保存到本地目录，您可以使用${outputFormat === 'csv' ? 'Excel或其他表格' : 'JSON查看'}工具打开查看。${stockExplanation}`
          }
        ]
      };
    }
    
    // 收集股票代码并生成说明（仅对股票市场）
    let stockExplanation = '';
    if (['cn', 'us', 'hk'].includes(marketType)) {
      stockExplanation = await resolveStockCodes([code]);
    }
    
    // Markdown表格输出将由各个市场特定模块处理
    return {
      content: [
        {
          type: "text",
          text: '' // 由具体市场模块完成
        }
      ]
    };
  } finally {
    clearTimeout(timeoutId);
  }
}