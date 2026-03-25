import { TUSHARE_CONFIG } from '../config.js';

export const basicInfo = {
  name: "basic_info",
  description: "获取基础信息数据，包括股票列表、交易日历、新股列表、港股列表、美股列表、指数列表、ETF列表",
  parameters: {
    type: "object",
    properties: {
      info_type: {
        type: "string",
        description: "信息类型，可选值：stock_basic(A股股票列表)、trade_cal(交易日历)、new_share(新股列表)、hk_basic(港股列表)、us_basic(美股列表)、index_basic(指数列表)、etf_basic(ETF列表)"
      },
      exchange: {
        type: "string",
        description: "交易所代码（可选），用于筛选特定交易所的数据。A股可选：SSE(上交所)、SZSE(深交所)、BSE(北交所)；港股：HKEX；美股：NASDAQ、NYSE、AMEX"
      },
      list_status: {
        type: "string",
        description: "上市状态（可选），可选值：L(上市)、D(退市)、P(暂停上市)，默认L"
      },
      start_date: {
        type: "string",
        description: "起始日期，格式为YYYYMMDD，如'20230101'。用于交易日历查询或新股上市日期筛选"
      },
      end_date: {
        type: "string",
        description: "结束日期，格式为YYYYMMDD，如'20231231'。用于交易日历查询或新股上市日期筛选"
      },
      ts_code: {
        type: "string",
        description: "股票代码（可选），用于查询特定股票的信息"
      },
      market: {
        type: "string",
        description: "市场类型（可选），用于指数列表查询。可选值：SSE(上交所)、SZSE(深交所)、CICC(中金所)、MSCI、CSI(中证)、CNI(国证)、OTH(其他)"
      }
    },
    required: ["info_type"]
  },
  async run(args: { 
    info_type: string; 
    exchange?: string; 
    list_status?: string; 
    start_date?: string; 
    end_date?: string;
    ts_code?: string;
    market?: string;
  }) {
    try {
      console.log(`使用Tushare API获取${args.info_type}基础信息数据`);
      
      // 使用全局配置中的Tushare API设置
      const TUSHARE_API_KEY = TUSHARE_CONFIG.API_TOKEN;
      const TUSHARE_API_URL = TUSHARE_CONFIG.API_URL;
      if (!TUSHARE_API_KEY) {
        throw new Error('缺少 Tushare Token：请在请求头 X-Tushare-Token 或环境变量 TUSHARE_TOKEN 中提供');
      }
      
      // 验证信息类型
      const validInfoTypes = ['stock_basic', 'trade_cal', 'new_share', 'hk_basic', 'us_basic', 'index_basic', 'etf_basic'];
      if (!validInfoTypes.includes(args.info_type)) {
        throw new Error(`不支持的信息类型: ${args.info_type}。支持的类型有: ${validInfoTypes.join(', ')}`);
      }

      // 设置默认日期范围
      const today = new Date();
      const defaultEndDate = today.toISOString().slice(0, 10).replace(/-/g, '');
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const defaultStartDate = oneYearAgo.toISOString().slice(0, 10).replace(/-/g, '');
      
      // 构建请求参数
      const params: any = {
        token: TUSHARE_API_KEY,
        params: {},
        fields: ""
      };

      // 根据不同信息类型设置不同的API名称、参数和字段
      switch(args.info_type) {
        case 'stock_basic':
          params.api_name = "stock_basic";
          params.fields = "ts_code,symbol,name,area,industry,market,list_date,list_status,is_hs";
          params.params = {
            list_status: args.list_status || 'L',
            exchange: args.exchange || ''
          };
          // 如果指定了ts_code，添加到参数中
          if (args.ts_code) {
            params.params.ts_code = args.ts_code;
          }
          break;
          
        case 'trade_cal':
          params.api_name = "trade_cal";
          params.fields = "exchange,cal_date,is_open,pretrade_date";
          params.params = {
            exchange: args.exchange || 'SSE',
            start_date: args.start_date || defaultStartDate,
            end_date: args.end_date || defaultEndDate
          };
          break;
          
        case 'new_share':
          params.api_name = "new_share";
          params.fields = "ts_code,name,ipo_date,issue_date,amount,market_amount,price,pe,limit_amount,funds,ballot";
          params.params = {
            start_date: args.start_date || defaultStartDate,
            end_date: args.end_date || defaultEndDate
          };
          break;
          
        case 'hk_basic':
          params.api_name = "hk_basic";
          params.fields = "ts_code,name,fullname,enname,cn_spell,market,list_status,list_date,delist_date,trade_unit,isin";
          params.params = {
            list_status: args.list_status || 'L'
          };
          // 如果指定了ts_code，添加到参数中
          if (args.ts_code) {
            params.params.ts_code = args.ts_code;
          }
          break;
          
        case 'us_basic':
          params.api_name = "us_basic";
          params.fields = "ts_code,name,market,list_date,list_status,exchange,curr_type,ipo_date,delist_date";
          params.params = {
            list_status: args.list_status || 'L',
            exchange: args.exchange || ''
          };
          // 如果指定了ts_code，添加到参数中
          if (args.ts_code) {
            params.params.ts_code = args.ts_code;
          }
          break;
          
        case 'index_basic':
          params.api_name = "index_basic";
          params.fields = "ts_code,name,market,publisher,category,base_date,base_point,list_date,weight_rule,desc,exp_date";
          params.params = {
            market: args.market || ''
          };
          // 如果指定了ts_code，添加到参数中
          if (args.ts_code) {
            params.params.ts_code = args.ts_code;
          }
          break;
          
        case 'etf_basic':
          params.api_name = "fund_basic";
          params.fields = "ts_code,name,management,custodian,fund_type,found_date,due_date,list_date,issue_date,delist_date,issue_amount,m_fee,c_fee,duration_year,p_value,min_amount,exp_return,benchmark,status,invest_type,type,trustee,purc_startdate,redm_startdate,market";
          params.params = {
            market: args.exchange || 'E'  // E表示ETF场内
          };
          // 如果指定了ts_code，添加到参数中
          if (args.ts_code) {
            params.params.ts_code = args.ts_code;
          }
          break;
      }
      
      // 设置请求超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TUSHARE_CONFIG.TIMEOUT);
      
      try {
        console.log(`请求Tushare API: ${params.api_name}，参数:`, params.params);
        
        // 发送请求
        const response = await fetch(TUSHARE_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(params),
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
        if (!data.data || !data.data.items) {
          throw new Error(`未找到${args.info_type}基础信息数据`);
        }
        
        // 如果没有数据，返回提示
        if (data.data.items.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `## 📊 ${getInfoTypeTitle(args.info_type)}\n\n未找到符合条件的数据。\n\n查询参数：\n${JSON.stringify(params.params, null, 2)}`
              }
            ]
          };
        }
        
        // 获取字段名
        const fields = data.data.fields;
        
        // 将数据转换为对象数组
        const infoData = data.data.items.map((item: any) => {
          const result: Record<string, any> = {};
          fields.forEach((field: string, index: number) => {
            result[field] = item[index];
          });
          return result;
        });
        
        // 格式化数据
        const formattedData = formatInfoData(args.info_type, infoData);
        
        return {
          content: [
            {
              type: "text",
              text: `## 📊 ${getInfoTypeTitle(args.info_type)}\n\n${getInfoTypeSummary(args, infoData.length)}\n\n---\n\n${formattedData}`
            }
          ]
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error("获取基础信息数据失败:", error);
      
      return {
        content: [
          {
            type: "text",
            text: `## ❌ 获取${args.info_type}基础信息失败\n\n错误信息: ${error instanceof Error ? error.message : String(error)}\n\n### 支持的信息类型:\n\n- **stock_basic**: A股股票列表\n- **trade_cal**: 交易日历\n- **new_share**: 新股列表\n- **hk_basic**: 港股列表\n- **us_basic**: 美股列表\n- **index_basic**: 指数列表\n- **etf_basic**: ETF列表\n\n### 使用示例:\n\n\`\`\`json\n{\n  "info_type": "stock_basic",\n  "exchange": "SSE",\n  "list_status": "L"\n}\n\`\`\`\n\n\`\`\`json\n{\n  "info_type": "trade_cal",\n  "exchange": "SSE",\n  "start_date": "20240101",\n  "end_date": "20241231"\n}\n\`\`\``
          }
        ],
        isError: true
      };
    }
  }
};

/**
 * 获取信息类型的标题
 */
function getInfoTypeTitle(infoType: string): string {
  const titleMap: Record<string, string> = {
    'stock_basic': 'A股股票列表',
    'trade_cal': '交易日历',
    'new_share': '新股列表',
    'hk_basic': '港股列表',
    'us_basic': '美股列表',
    'index_basic': '指数列表',
    'etf_basic': 'ETF列表'
  };
  return titleMap[infoType] || infoType;
}

/**
 * 获取查询摘要信息
 */
function getInfoTypeSummary(args: any, dataCount: number): string {
  const parts: string[] = [];
  
  if (args.exchange) {
    parts.push(`交易所: ${args.exchange}`);
  }
  if (args.list_status) {
    const statusMap: Record<string, string> = {
      'L': '上市',
      'D': '退市',
      'P': '暂停上市'
    };
    parts.push(`状态: ${statusMap[args.list_status] || args.list_status}`);
  }
  if (args.start_date || args.end_date) {
    parts.push(`时间范围: ${args.start_date || '不限'} ~ ${args.end_date || '不限'}`);
  }
  if (args.market) {
    parts.push(`市场: ${args.market}`);
  }
  if (args.ts_code) {
    parts.push(`代码: ${args.ts_code}`);
  }
  
  const summary = parts.length > 0 ? parts.join(' | ') : '全部数据';
  return `**查询条件**: ${summary}\n**数据条数**: ${dataCount}条`;
}

/**
 * 格式化基础信息数据
 */
function formatInfoData(infoType: string, data: Record<string, any>[]): string {
  switch(infoType) {
    case 'stock_basic':
      return formatStockBasic(data);
    case 'trade_cal':
      return formatTradeCal(data);
    case 'new_share':
      return formatNewShare(data);
    case 'hk_basic':
      return formatHkBasic(data);
    case 'us_basic':
      return formatUsBasic(data);
    case 'index_basic':
      return formatIndexBasic(data);
    case 'etf_basic':
      return formatEtfBasic(data);
    default:
      return JSON.stringify(data, null, 2);
  }
}

/**
 * 格式化A股股票列表
 */
function formatStockBasic(data: Record<string, any>[]): string {
  const header = '| 股票代码 | 股票名称 | 地域 | 行业 | 市场 | 上市日期 | 状态 | 沪深港通 |';
  const separator = '|---------|---------|------|------|------|----------|------|----------|';
  
  const rows = data.map(item => {
    const isHs = item.is_hs === 'H' ? '沪股通' : item.is_hs === 'S' ? '深股通' : item.is_hs === 'N' ? '港股通(沪)' : item.is_hs === 'P' ? '港股通(深)' : '-';
    return `| ${item.ts_code} | ${item.name} | ${item.area || '-'} | ${item.industry || '-'} | ${item.market || '-'} | ${formatDate(item.list_date)} | ${item.list_status === 'L' ? '上市' : item.list_status === 'D' ? '退市' : '暂停'} | ${isHs} |`;
  });
  
  return `${header}\n${separator}\n${rows.join('\n')}`;
}

/**
 * 格式化交易日历
 */
function formatTradeCal(data: Record<string, any>[]): string {
  const header = '| 日期 | 星期 | 是否交易 | 前一交易日 |';
  const separator = '|----------|------|----------|-----------|';
  
  const rows = data.map(item => {
    const date = new Date(item.cal_date.substring(0, 4) + '-' + item.cal_date.substring(4, 6) + '-' + item.cal_date.substring(6, 8));
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = '星期' + weekdays[date.getDay()];
    const isOpen = item.is_open === 1 ? '✅ 交易日' : '⛔ 休市';
    const pretradeDate = item.pretrade_date ? formatDate(item.pretrade_date) : '-';
    
    return `| ${formatDate(item.cal_date)} | ${weekday} | ${isOpen} | ${pretradeDate} |`;
  });
  
  return `${header}\n${separator}\n${rows.join('\n')}`;
}

/**
 * 格式化新股列表
 */
function formatNewShare(data: Record<string, any>[]): string {
  const header = '| 股票代码 | 股票名称 | 上市日期 | 发行日期 | 发行总量(万股) | 网上发行(万股) | 发行价格 | 市盈率 | 中签率(%) |';
  const separator = '|---------|---------|----------|----------|--------------|--------------|----------|---------|-----------|';
  
  const rows = data.map(item => {
    return `| ${item.ts_code} | ${item.name} | ${formatDate(item.ipo_date)} | ${formatDate(item.issue_date)} | ${item.amount?.toFixed(2) || '-'} | ${item.market_amount?.toFixed(2) || '-'} | ${item.price?.toFixed(2) || '-'} | ${item.pe?.toFixed(2) || '-'} | ${item.ballot || '-'} |`;
  });
  
  return `${header}\n${separator}\n${rows.join('\n')}`;
}

/**
 * 格式化港股列表
 */
function formatHkBasic(data: Record<string, any>[]): string {
  const header = '| 股票代码 | 中文名称 | 英文名称 | 市场 | 上市日期 | 状态 | 交易单位 |';
  const separator = '|---------|---------|----------|------|----------|------|----------|';
  
  const rows = data.map(item => {
    const status = item.list_status === 'L' ? '上市' : item.list_status === 'D' ? '退市' : '暂停';
    return `| ${item.ts_code} | ${item.name} | ${item.enname || '-'} | ${item.market || '-'} | ${formatDate(item.list_date)} | ${status} | ${item.trade_unit || '-'} |`;
  });
  
  return `${header}\n${separator}\n${rows.join('\n')}`;
}

/**
 * 格式化美股列表
 */
function formatUsBasic(data: Record<string, any>[]): string {
  const header = '| 股票代码 | 股票名称 | 市场 | 交易所 | 上市日期 | 状态 | 货币类型 |';
  const separator = '|---------|---------|------|--------|----------|------|----------|';
  
  const rows = data.map(item => {
    const status = item.list_status === 'L' ? '上市' : item.list_status === 'D' ? '退市' : '暂停';
    return `| ${item.ts_code} | ${item.name} | ${item.market || '-'} | ${item.exchange || '-'} | ${formatDate(item.list_date)} | ${status} | ${item.curr_type || '-'} |`;
  });
  
  return `${header}\n${separator}\n${rows.join('\n')}`;
}

/**
 * 格式化指数列表
 */
function formatIndexBasic(data: Record<string, any>[]): string {
  const header = '| 指数代码 | 指数名称 | 市场 | 发布方 | 类别 | 基期 | 基点 | 发布日期 |';
  const separator = '|---------|---------|------|------|------|------|------|----------|';
  
  const rows = data.map(item => {
    return `| ${item.ts_code} | ${item.name} | ${item.market || '-'} | ${item.publisher || '-'} | ${item.category || '-'} | ${formatDate(item.base_date)} | ${item.base_point || '-'} | ${formatDate(item.list_date)} |`;
  });
  
  return `${header}\n${separator}\n${rows.join('\n')}`;
}

/**
 * 格式化ETF列表
 */
function formatEtfBasic(data: Record<string, any>[]): string {
  const header = '| 基金代码 | 基金名称 | 管理人 | 托管人 | 类型 | 成立日期 | 上市日期 | 状态 |';
  const separator = '|---------|---------|--------|--------|------|----------|----------|------|';
  
  const rows = data.map(item => {
    return `| ${item.ts_code} | ${item.name} | ${item.management || '-'} | ${item.custodian || '-'} | ${item.fund_type || '-'} | ${formatDate(item.found_date)} | ${formatDate(item.list_date)} | ${item.status || '-'} |`;
  });
  
  return `${header}\n${separator}\n${rows.join('\n')}`;
}

/**
 * 格式化日期显示
 */
function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return dateStr || '-';
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${year}-${month}-${day}`;
}
