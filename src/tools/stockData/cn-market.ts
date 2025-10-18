/**
 * A股市场处理模块
 */

import { TUSHARE_CONFIG, config } from '../../config.js';
import {
  ValidationError,
  ApiError,
  NetworkError,
  NotFoundError,
  createTushareError,
  createValidationError
} from '../../core/errors.js';
import { 
  MarketProcessParams, 
  MarketProcessResult, 
  Indicators,
  StockDataRecord,
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

/**
 * 处理A股市场数据
 */
export async function processCnMarket(params: MarketProcessParams): Promise<MarketProcessResult> {
  const { code, start_date, end_date, indicators: indicatorsParam, output_format, export_path } = params;
  
  // 解析技术指标参数
  const requestedIndicators = indicatorsParam ? indicatorsParam.trim().split(/\s+/) : [];
  
  // 使用全局配置
  const TUSHARE_API_KEY = TUSHARE_CONFIG.API_TOKEN;
  const TUSHARE_API_URL = TUSHARE_CONFIG.API_URL;
  
  // 默认参数设置
  const today = new Date();
  const defaultEndDate = today.toISOString().slice(0, 10).replace(/-/g, '');
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const defaultStartDate = oneMonthAgo.toISOString().slice(0, 10).replace(/-/g, '');
  
  const userStartDate = start_date || defaultStartDate;
  const userEndDate = end_date || defaultEndDate;
  
  // 计算扩展的开始日期
  let actualStartDate = userStartDate;
  if (requestedIndicators.length > 0) {
    const requiredDays = calculateRequiredDays(requestedIndicators);
    actualStartDate = calculateExtendedStartDate(userStartDate, requiredDays);
    console.log(`技术指标需要${requiredDays}天历史数据，扩展开始日期从 ${userStartDate} 到 ${actualStartDate}`);
  }
  
  // 构建请求参数
  const tushareParams = {
    api_name: "daily",
    token: TUSHARE_API_KEY,
    params: {
      ts_code: code,
      start_date: actualStartDate,
      end_date: userEndDate
    }
  };
  
  // 设置请求超时
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TUSHARE_CONFIG.TIMEOUT);
  
  try {
    console.log(`请求Tushare API: daily，参数:`, tushareParams.params);
    
    const response = await fetch(TUSHARE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tushareParams),
      signal: controller.signal
    });
    
    if (!response.ok) {
      throw new Error(`Tushare API请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code !== 0) {
      throw new Error(`Tushare API错误: ${data.msg}`);
    }
    
    if (!data.data || !data.data.items || data.data.items.length === 0) {
      throw new Error(`未找到A股${code}的行情数据`);
    }
    
    const fields = data.data.fields;
    let stockData: StockDataRecord[] = data.data.items.map((item: any) => {
      const result: Record<string, any> = {};
      fields.forEach((field: string, index: number) => {
        result[field] = item[index];
      });
      return result;
    });
    
    console.log(`成功获取到${stockData.length}条数据记录`);
    
    // 应用前复权
    try {
      const afParams = {
        api_name: 'adj_factor',
        token: TUSHARE_API_KEY,
        params: {
          ts_code: code,
          start_date: actualStartDate,
          end_date: userEndDate
        },
        fields: 'trade_date,adj_factor'
      };

      const afResp = await fetch(TUSHARE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(afParams),
        signal: controller.signal
      });
      
      if (afResp.ok) {
        const afJson = await afResp.json();
        if (afJson.code === 0) {
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

          const latestDate = stockData
            .map((r: any) => String(r.trade_date))
            .sort((a: string, b: string) => b.localeCompare(a))[0];
          const latestFactor = factorMap.get(latestDate);

          if (latestFactor && !isNaN(latestFactor)) {
            stockData = stockData.map((row: any) => {
              const f = factorMap.get(String(row.trade_date));
              if (f && !isNaN(f)) {
                const ratio = f / latestFactor;
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
            console.log(`已应用前复权到 ${code} 的OHLC价格`);
          }
        }
      }
    } catch (e) {
      console.warn('应用前复权失败，继续返回未复权数据:', e);
    }
    
    // 计算技术指标
    let indicators: Indicators = {};
    
    if (requestedIndicators.length > 0) {
      let closes: number[] = stockData.map(d => parseFloat(String(d.close))).reverse();
      let highs: number[] = stockData.map(d => parseFloat(String(d.high))).reverse();
      let lows: number[] = stockData.map(d => parseFloat(String(d.low))).reverse();
      
      for (const indicator of requestedIndicators) {
        try {
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
            default:
              throw new Error(`不支持的技术指标: ${name}`);
          }
        } catch (error) {
          console.error(`解析技术指标 ${indicator} 时出错:`, error);
          if (error instanceof ValidationError) {
            throw error; // 已经是标准错误，直接抛出
          }
          throw new ValidationError(`技术指标参数错误: ${indicator}`, {
            indicator,
            originalError: (error as Error).message
          });
        }
      }
      
      // 指标逆序
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
    
    // 过滤到用户请求的时间范围
    if (requestedIndicators.length > 0) {
      stockData = filterDataToUserRange(stockData, userStartDate, userEndDate);
      console.log(`过滤到用户请求时间范围，剩余${stockData.length}条记录`);
    }
    
    const outputFormat = output_format || 'markdown';
    
    // CSV/JSON导出
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
          let exportDir: string;
          if (export_path) {
            exportDir = path.isAbsolute(export_path) ? export_path : path.resolve(process.cwd(), export_path);
          } else {
            exportDir = path.join(process.cwd(), config.export.defaultExportPath);
          }

          if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
          }

          // 生成带时间戳的文件名
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
          const dateRange = `${userStartDate}-${userEndDate}`;
          const indicatorInfo = Object.keys(indicators).length > 0 ? '_with_indicators' : '';
          const ext = outputFormat === 'csv' ? 'csv' : 'json';
          const filename = `${code}_${dateRange}${indicatorInfo}_${timestamp}.${ext}`;
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
        const dateRange = `${userStartDate}-${userEndDate}`;
        const indicatorInfo = Object.keys(indicators).length > 0 ? '_with_indicators' : '';
        const ext = outputFormat === 'csv' ? 'csv' : 'json';
        const filename = `${code}_${dateRange}${indicatorInfo}_${timestamp}.${ext}`;
        filepath = path.join(exportDir, filename);
      }
      
      if (outputFormat === 'csv') {
        const csvContent = generateCSVContent(stockData, indicators, ['交易日期', '开盘', '收盘', '最高', '最低', '成交量', '成交额(万元)']);
        fs.writeFileSync(filepath, csvContent, 'utf8');
      } else {
        const jsonData = generateJSONData(code, 'cn', userStartDate, userEndDate, stockData, indicators);
        fs.writeFileSync(filepath, JSON.stringify(jsonData, null, 2), 'utf8');
      }
      
      const stats = fs.statSync(filepath);
      const fileSizeKB = (stats.size / 1024).toFixed(2);
      const stockExplanation = '\n\n' + await resolveStockCodes([code]);
      
      return {
        content: [{
          type: "text",
          text: `# ${code} ${MARKET_TITLE_MAP['cn']}行情数据 - ${outputFormat.toUpperCase()}导出\n\n✅ 文件已生成：\n**文件路径**: ${filepath}\n**文件大小**: ${fileSizeKB} KB\n**数据条数**: ${stockData.length}条\n**包含指标**: ${Object.keys(indicators).length > 0 ? '是' : '否'}\n**日期范围**: ${userStartDate} 至 ${userEndDate}\n\n文件已保存到本地目录。${stockExplanation}`
        }]
      };
    }
    
    // Markdown表格输出
    let formattedData = '';
    if (stockData.length > 0) {
      const coreFields = ['trade_date', 'open', 'close', 'high', 'low', 'vol', 'amount'];
      const availableFields = Object.keys(stockData[0]);
      const displayFields = coreFields.filter(field => availableFields.includes(field));
      const indicatorHeaders = getIndicatorHeaders(indicators);
      const allHeaders = [
        ...displayFields.map(field => field === 'amount' ? '成交额(万元)' : (FIELD_NAME_MAP[field] || field)),
        ...indicatorHeaders
      ];
      
      formattedData = `| ${allHeaders.join(' | ')} |\n`;
      formattedData += `|${allHeaders.map(() => '--------').join('|')}|\n`;
      
      stockData.forEach((data: StockDataRecord, index: number) => {
        const basicRow = displayFields.map(field => {
          if (field === 'amount') return formatAmountWan(data.amount);
          return data[field] || 'N/A';
        });
        const indicatorRow = getIndicatorRow(indicators, index);
        const fullRow = [...basicRow, ...indicatorRow];
        formattedData += `| ${fullRow.join(' | ')} |\n`;
      });
    }
    
    const indicatorData = generateIndicatorDocumentation(indicators, requestedIndicators);
    const stockExplanation = await resolveStockCodes([code]);
    
    return {
      content: [{
        type: "text",
        text: `# ${code} ${MARKET_TITLE_MAP['cn']}行情数据（前复权）\n\n${formattedData}${indicatorData}${stockExplanation}`
      }]
    };
  } finally {
    clearTimeout(timeoutId);
  }
}