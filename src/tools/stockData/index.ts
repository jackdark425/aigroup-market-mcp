/**
 * 股票数据工具统一入口
 * 整合所有市场类型的处理逻辑
 */

import { MarketProcessParams, MarketProcessResult, MarketType } from './types.js';
import { processCnMarket } from './cn-market.js';
import { processUsMarket, processHkMarket, processFundMarket } from './simple-markets.js';
import { processCryptoMarket } from './crypto-market.js';
import { 
  processFxMarket, 
  processFuturesMarket, 
  processRepoMarket, 
  processBondMarket, 
  processOptionsMarket 
} from './special-markets.js';

/**
 * 主处理函数：根据市场类型分发到对应的处理模块
 */
export async function getStockData(params: MarketProcessParams & { market_type: string }): Promise<MarketProcessResult> {
  const marketType = params.market_type.trim().toLowerCase() as MarketType;
  
  console.log(`处理市场类型: ${marketType}, 代码: ${params.code}`);
  
  // 验证市场类型
  const validMarkets: MarketType[] = ['cn', 'us', 'hk', 'fx', 'futures', 'fund', 'repo', 'convertible_bond', 'options', 'crypto'];
  if (!validMarkets.includes(marketType)) {
    throw new Error(`不支持的市场类型: ${marketType}。支持的类型有: ${validMarkets.join(', ')}`);
  }
  
  // 根据市场类型分发到对应的处理函数
  switch (marketType) {
    case 'cn':
      return processCnMarket(params);
    
    case 'us':
      return processUsMarket(params);
    
    case 'hk':
      return processHkMarket(params);
    
    case 'crypto':
      return processCryptoMarket(params);
    
    case 'fx':
      return processFxMarket(params);
    
    case 'futures':
      return processFuturesMarket(params);
    
    case 'fund':
      return processFundMarket(params);
    
    case 'repo':
      return processRepoMarket(params);
    
    case 'convertible_bond':
      return processBondMarket(params);
    
    case 'options':
      return processOptionsMarket(params);
    
    default:
      throw new Error(`未实现的市场类型: ${marketType}`);
  }
}

/**
 * 工具定义导出
 */
export const stockDataTool = {
  name: "stock_data",
  description: "获取指定股票/加密资产的历史行情数据，支持A股、美股、港股、外汇、期货、基金、债券逆回购、可转债、期权、加密货币(通过Binance)",
  parameters: {
    type: "object",
    properties: {
      code: {
        type: "string",
        description: "股票/合约/加密资产代码。股票示例：'000001.SZ'(A股平安银行)、'AAPL'(美股)、'00700.HK'(港股)、'USDCNH.FXCM'(外汇)、'CU2501.SHF'(期货)、'159919.SZ'(基金)、'204001.SH'(逆回购)、'113008.SH'(可转债)、'10001313.SH'(期权)。加密示例(需 market_type=crypto，Binance)：推荐标准写法 'BTCUSDT'、'ETHUSDT'、'USDCUSDT'、'FDUSDUSDT' 等；也兼容 'BTC-USDT' 或 'BTC/USDT'。常见报价币：USDT、USDC、FDUSD、TUSD、BUSD、BTC、ETH。注意：若写 'USD' 会自动映射为 'USDT'（如 'BTC-USD' → 'BTCUSDT'）。"
      },
      market_type: {
        type: "string",
        description: "市场类型（必需），可选值：cn(A股),us(美股),hk(港股),fx(外汇),futures(期货),fund(基金),repo(债券逆回购),convertible_bond(可转债),options(期权),crypto(加密货币/Binance)"
      },
      start_date: {
        type: "string",
        description: "起始日期，格式为YYYYMMDD，如'20230101'"
      },
      end_date: {
        type: "string",
        description: "结束日期，格式为YYYYMMDD，如'20230131'"
      },
      indicators: {
        type: "string",
        description: "需要计算的技术指标，多个指标用空格分隔。支持的指标：macd(MACD指标)、rsi(相对强弱指标)、kdj(随机指标)、boll(布林带)、ma(均线指标)。必须明确指定参数，例如：'macd(12,26,9) rsi(14) kdj(9,3,3) boll(20,2) ma(10)'"
      },
      output_format: {
        type: "string",
        description: "输出格式，可选值：markdown(默认，返回markdown格式文本)、csv(生成CSV文件)、json(生成JSON文件)"
      },
      export_path: {
        type: "string",
        description: "导出文件保存路径（可选）。支持相对路径（相对于项目根目录）或绝对路径。如果不指定，默认保存到项目根目录的 exports 文件夹"
      }
    },
    required: ["code", "market_type"]
  },
  async run(args: { 
    code: string; 
    market_type: string; 
    start_date?: string; 
    end_date?: string; 
    indicators?: string; 
    output_format?: string; 
    export_path?: string 
  }) {
    try {
      console.log('接收到的参数:', args);
      
      // 检查market_type参数
      if (!args.market_type) {
        throw new Error('请指定market_type参数：cn(A股)、us(美股)、hk(港股)、fx(外汇)、futures(期货)、fund(基金)、repo(债券逆回购)、convertible_bond(可转债)、options(期权)、crypto(加密货币)');
      }
      
      return await getStockData(args);
    } catch (error) {
      console.error("获取股票数据失败:", error);
      
      return {
        content: [
          {
            type: "text",
            text: `# 获取股票${args.code}数据失败\n\n无法获取数据：${error instanceof Error ? error.message : String(error)}\n\n请检查股票代码和市场类型是否正确：\n- A股格式："000001.SZ"\n- 美股格式："AAPL"\n- 港股格式："00700.HK"\n- 外汇格式："USDCNH.FXCM"（美元人民币）\n- 期货格式："CU2501.SHF"\n- 基金格式："159919.SZ"\n- 债券逆回购格式："204001.SH"\n- 可转债格式："113008.SH"\n- 期权格式："10001313.SH"\n- 加密货币格式："BTCUSDT"、"ETHUSDT"\n\n技术指标使用说明（必须明确指定参数）：\n- **MACD**: macd(快线,慢线,信号线) - 例：macd(12,26,9)\n- **RSI**: rsi(周期) - 例：rsi(14)\n- **KDJ**: kdj(K周期,K平滑,D平滑) - 例：kdj(9,3,3)\n- **布林带**: boll(周期,标准差倍数) - 例：boll(20,2)\n- **移动平均线**: ma(周期) - 例：ma(5)、ma(10)、ma(20)\n\n使用示例：\n- "macd(12,26,9) rsi(14)"\n- "kdj(9,3,3) boll(20,2) ma(30)"\n- "macd(5,10,5) ma(5) ma(10)"`
          }
        ]
      };
    }
  }
};