/**
 * 工具注册中心
 * 负责注册所有可用的工具到工具管理器
 */

import { BaseTool, ToolManager } from './ToolManager.js';

// 导入所有工具模块
import { financeNews } from '../tools/financeNews.js';
import { stockDataTool } from '../tools/stockData/index.js';
import { stockDataMinutes } from '../tools/stockDataMinutes.js';
import { indexData } from '../tools/indexData.js';
import { macroEcon } from '../tools/macroEcon.js';
import { companyPerformance } from '../tools/companyPerformance.js';
import { fundData } from '../tools/fundData.js';
import { fundManagerByName, runFundManagerByName } from '../tools/fundManagerByName.js';
import { convertibleBond } from '../tools/convertibleBond.js';
import { blockTrade } from '../tools/blockTrade.js';
import { moneyFlow } from '../tools/moneyFlow.js';
import { marginTrade } from '../tools/marginTrade.js';
import { companyPerformance_hk } from '../tools/companyPerformance_hk.js';
import { companyPerformance_us } from '../tools/companyPerformance_us.js';
import { csiIndexConstituents } from '../tools/csiIndexConstituents.js';
import { dragonTigerInst } from '../tools/dragonTigerInst.js';
import { hotNews } from '../tools/hotNews.js';

/**
 * 时间戳工具 - 获取当前东八区时间
 */
class TimestampTool extends BaseTool {
  readonly name = 'current_timestamp';
  readonly description = '获取当前东八区（中国时区）的时间戳，包括年月日时分秒信息';
  readonly parameters = {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        description: '时间格式，可选值：datetime(完整日期时间，默认)、date(仅日期)、time(仅时间)、timestamp(Unix时间戳)、readable(可读格式)'
      }
    }
  };

  async execute(args?: { format?: string }) {
    try {
      const now = new Date();
      const chinaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
      const format = args?.format || 'datetime';
      
      const formatNumber = (num: number): string => num.toString().padStart(2, '0');
      
      const year = chinaTime.getUTCFullYear();
      const month = formatNumber(chinaTime.getUTCMonth() + 1);
      const day = formatNumber(chinaTime.getUTCDate());
      const hour = formatNumber(chinaTime.getUTCHours());
      const minute = formatNumber(chinaTime.getUTCMinutes());
      const second = formatNumber(chinaTime.getUTCSeconds());
      
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      const weekday = weekdays[chinaTime.getUTCDay()];
      
      let result: string;
      
      switch (format) {
        case 'date':
          result = `${year}-${month}-${day}`;
          break;
        case 'time':
          result = `${hour}:${minute}:${second}`;
          break;
        case 'timestamp':
          result = Math.floor(chinaTime.getTime() / 1000).toString();
          break;
        case 'readable':
          result = `${year}年${month}月${day}日 ${weekday} ${hour}时${minute}分${second}秒`;
          break;
        case 'datetime':
        default:
          result = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
          break;
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `## 🕐 当前东八区时间\n\n格式: ${format}\n时间: ${result}\n\n时区: 东八区 (UTC+8)\n星期: ${weekday}\n\n---\n\n*时间戳获取于: ${year}-${month}-${day} ${hour}:${minute}:${second}*`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ 获取时间戳时发生错误: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
}

/**
 * 通用工具包装器 - 将现有工具包装为 BaseTool
 */
class ToolWrapper extends BaseTool {
  constructor(
    private toolName: string,
    private toolDescription: string,
    private toolParameters: any,
    private toolExecutor: (args: any) => Promise<any>
  ) {
    super();
  }

  get name(): string {
    return this.toolName;
  }

  get description(): string {
    return this.toolDescription;
  }

  get parameters(): any {
    return this.toolParameters;
  }

  async execute(args: any): Promise<any> {
    return await this.toolExecutor(args);
  }
}

/**
 * 注册所有工具到工具管理器
 * @param manager 工具管理器实例
 */
export function registerAllTools(manager: ToolManager): void {
  console.log('📦 Registering all tools...');

  // 注册时间戳工具
  manager.registerTool(new TimestampTool());

  // 注册财经新闻工具
  manager.registerTool(new ToolWrapper(
    financeNews.name,
    financeNews.description,
    financeNews.parameters,
    (args) => financeNews.run({ query: String(args?.query) })
  ));

  // 注册股票数据工具
  manager.registerTool(new ToolWrapper(
    stockDataTool.name,
    stockDataTool.description,
    stockDataTool.parameters,
    (args) => stockDataTool.run({
      code: String(args?.code),
      market_type: String(args?.market_type),
      start_date: args?.start_date ? String(args.start_date) : undefined,
      end_date: args?.end_date ? String(args.end_date) : undefined,
      indicators: args?.indicators ? String(args.indicators) : undefined,
      output_format: args?.output_format ? String(args.output_format) : undefined,
      export_path: args?.export_path ? String(args.export_path) : undefined
    })
  ));

  // 注册分钟K线工具
  manager.registerTool(new ToolWrapper(
    stockDataMinutes.name,
    stockDataMinutes.description,
    stockDataMinutes.parameters,
    (args) => stockDataMinutes.run({
      code: String(args?.code),
      market_type: String(args?.market_type),
      start_datetime: String(args?.start_datetime),
      end_datetime: String(args?.end_datetime),
      freq: String(args?.freq)
    })
  ));

  // 注册指数数据工具
  manager.registerTool(new ToolWrapper(
    indexData.name,
    indexData.description,
    indexData.parameters,
    (args) => indexData.run({
      code: String(args?.code),
      start_date: args?.start_date ? String(args.start_date) : undefined,
      end_date: args?.end_date ? String(args.end_date) : undefined
    })
  ));

  // 注册宏观经济工具
  manager.registerTool(new ToolWrapper(
    macroEcon.name,
    macroEcon.description,
    macroEcon.parameters,
    (args) => macroEcon.run({
      indicator: String(args?.indicator),
      start_date: args?.start_date ? String(args.start_date) : undefined,
      end_date: args?.end_date ? String(args.end_date) : undefined
    })
  ));

  // 注册公司业绩工具（A股）
  manager.registerTool(new ToolWrapper(
    companyPerformance.name,
    companyPerformance.description,
    companyPerformance.parameters,
    (args) => companyPerformance.run({
      ts_code: String(args?.ts_code),
      data_type: String(args?.data_type),
      start_date: String(args?.start_date),
      end_date: String(args?.end_date),
      period: args?.period ? String(args.period) : undefined
    })
  ));

  // 注册基金数据工具
  manager.registerTool(new ToolWrapper(
    fundData.name,
    fundData.description,
    fundData.parameters,
    (args) => fundData.run({
      ts_code: args?.ts_code ? String(args.ts_code) : undefined,
      data_type: String(args?.data_type),
      start_date: args?.start_date ? String(args.start_date) : undefined,
      end_date: args?.end_date ? String(args.end_date) : undefined,
      period: args?.period ? String(args.period) : undefined
    })
  ));

  // 注册基金经理查询工具
  manager.registerTool(new ToolWrapper(
    fundManagerByName.name,
    fundManagerByName.description,
    (fundManagerByName as any).inputSchema,
    (args) => runFundManagerByName({
      name: String(args?.name),
      ann_date: args?.ann_date ? String(args.ann_date) : undefined
    })
  ));

  // 注册可转债工具
  manager.registerTool(new ToolWrapper(
    convertibleBond.name,
    convertibleBond.description,
    convertibleBond.parameters,
    (args) => convertibleBond.run({
      ts_code: args?.ts_code ? String(args.ts_code) : undefined,
      data_type: String(args?.data_type),
      start_date: args?.start_date ? String(args.start_date) : undefined,
      end_date: args?.end_date ? String(args.end_date) : undefined
    })
  ));

  // 注册大宗交易工具
  manager.registerTool(new ToolWrapper(
    blockTrade.name,
    blockTrade.description,
    blockTrade.parameters,
    (args) => blockTrade.run({
      code: args?.code ? String(args.code) : undefined,
      start_date: String(args?.start_date),
      end_date: String(args?.end_date)
    })
  ));

  // 注册资金流向工具
  manager.registerTool(new ToolWrapper(
    moneyFlow.name,
    moneyFlow.description,
    moneyFlow.parameters,
    (args) => moneyFlow.run({
      ts_code: args?.ts_code ? String(args.ts_code) : undefined,
      start_date: String(args?.start_date),
      end_date: String(args?.end_date)
    })
  ));

  // 注册融资融券工具
  manager.registerTool(new ToolWrapper(
    marginTrade.name,
    marginTrade.description,
    marginTrade.parameters,
    (args) => marginTrade.run({
      data_type: String(args?.data_type),
      ts_code: args?.ts_code ? String(args.ts_code) : undefined,
      start_date: String(args?.start_date),
      end_date: args?.end_date ? String(args.end_date) : undefined,
      exchange: args?.exchange ? String(args.exchange) : undefined
    })
  ));

  // 注册公司业绩工具（港股）
  manager.registerTool(new ToolWrapper(
    companyPerformance_hk.name,
    companyPerformance_hk.description,
    companyPerformance_hk.parameters,
    (args) => companyPerformance_hk.run({
      ts_code: String(args?.ts_code),
      data_type: String(args?.data_type),
      start_date: String(args?.start_date),
      end_date: String(args?.end_date),
      period: args?.period ? String(args.period) : undefined,
      ind_name: args?.ind_name ? String(args.ind_name) : undefined
    })
  ));

  // 注册公司业绩工具（美股）
  manager.registerTool(new ToolWrapper(
    companyPerformance_us.name,
    companyPerformance_us.description,
    companyPerformance_us.parameters,
    (args) => companyPerformance_us.run({
      ts_code: String(args?.ts_code),
      data_type: String(args?.data_type),
      start_date: String(args?.start_date),
      end_date: String(args?.end_date),
      period: args?.period ? String(args.period) : undefined
    })
  ));

  // 注册中证指数成分工具
  manager.registerTool(new ToolWrapper(
    csiIndexConstituents.name,
    csiIndexConstituents.description,
    csiIndexConstituents.parameters,
    (args) => csiIndexConstituents.run({
      index_code: String(args?.index_code),
      start_date: String(args?.start_date),
      end_date: String(args?.end_date)
    })
  ));

  // 注册龙虎榜工具
  manager.registerTool(new ToolWrapper(
    dragonTigerInst.name,
    dragonTigerInst.description,
    dragonTigerInst.parameters,
    (args) => dragonTigerInst.run({
      trade_date: String(args?.trade_date),
      ts_code: args?.ts_code ? String(args.ts_code) : undefined
    })
  ));

  // 注册7x24热点新闻工具
  manager.registerTool(new ToolWrapper(
    hotNews.name,
    hotNews.description,
    hotNews.parameters,
    (args) => hotNews.run(args || {})
  ));

  console.log(`✅ Successfully registered ${manager.getToolCount()} tools`);
}