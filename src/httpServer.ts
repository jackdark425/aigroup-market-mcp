#!/usr/bin/env node
/**
 * aigroup-market-mcp HTTP Server - 使用 StreamableHTTPServerTransport
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { runWithRequestContext } from './config.js';

// 导入所有工具
import { financeNews } from './tools/financeNews.js';
import { stockDataTool } from './tools/stockData/index.js';
import { stockDataMinutes } from './tools/stockDataMinutes.js';
import { indexData } from './tools/indexData.js';
import { macroEcon } from './tools/macroEcon.js';
import { companyPerformance } from './tools/companyPerformance.js';
import { fundData } from './tools/fundData.js';
import { fundManagerByName, runFundManagerByName } from './tools/fundManagerByName.js';
import { convertibleBond } from './tools/convertibleBond.js';
import { blockTrade } from './tools/blockTrade.js';
import { moneyFlow } from './tools/moneyFlow.js';
import { marginTrade } from './tools/marginTrade.js';
import { companyPerformance_hk } from './tools/companyPerformance_hk.js';
import { companyPerformance_us } from './tools/companyPerformance_us.js';
import { csiIndexConstituents } from './tools/csiIndexConstituents.js';
import { dragonTigerInst } from './tools/dragonTigerInst.js';
import { hotNews } from './tools/hotNews.js';
import { basicInfo } from './tools/basicInfo.js';

const app = express();
const PORT = Number(process.env.PORT || 3000);

// CORS 配置
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Accept',
    'Authorization',
    'Mcp-Session-Id',
    'X-Api-Key',
    'X-Tushare-Token',
    'X-Smithery-Config',
    'X-Config',
    'X-Session-Config'
  ],
  exposedHeaders: ['Content-Type', 'Mcp-Session-Id']
}));

app.use(express.json({ limit: '10mb' }));

// 提取 Token 的辅助函数
function extractTokenFromHeaders(req: Request): string | undefined {
  const h = req.headers;
  
  const tokenHeader = (h['x-tushare-token'] || h['x-api-key']) as string | undefined;
  if (tokenHeader?.trim()) return tokenHeader.trim();
  
  const auth = h['authorization'];
  if (typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  
  const smitheryConfig = h['x-smithery-config'] || h['x-config'] || h['x-session-config'];
  if (smitheryConfig) {
    try {
      const config = JSON.parse(smitheryConfig as string);
      if (config.TUSHARE_TOKEN) return config.TUSHARE_TOKEN;
    } catch (e) {}
  }
  
  const query = req.query;
  if (query.tushare_token || query.TUSHARE_TOKEN) {
    return (query.tushare_token || query.TUSHARE_TOKEN) as string;
  }
  
  return undefined;
}

// JSON Schema 转 Zod 辅助函数
function jsonSchemaToZod(schema: any): any {
  const zodSchema: any = {};
  
  if (schema.properties) {
    for (const [key, prop] of Object.entries(schema.properties as Record<string, any>)) {
      let fieldSchema: any;
      
      if (prop.type === 'string') {
        fieldSchema = z.string();
        if (prop.enum) {
          fieldSchema = z.enum(prop.enum as [string, ...string[]]);
        }
      } else if (prop.type === 'number') {
        fieldSchema = z.number();
      } else if (prop.type === 'boolean') {
        fieldSchema = z.boolean();
      } else if (prop.type === 'array') {
        fieldSchema = z.array(z.any());
      } else if (prop.type === 'object') {
        fieldSchema = z.record(z.any());
      } else {
        fieldSchema = z.any();
      }
      
      if (prop.description) {
        fieldSchema = fieldSchema.describe(prop.description);
      }
      
      const isRequired = schema.required && schema.required.includes(key);
      if (!isRequired) {
        fieldSchema = fieldSchema.optional();
      }
      
      zodSchema[key] = fieldSchema;
    }
  }
  
  return zodSchema;
}

// 创建 MCP Server 实例
const server = new McpServer(
  {
    name: 'aigroup-market-mcp',
    version: '2.0.6'
  },
  {
    debouncedNotificationMethods: [
      'notifications/tools/list_changed'
    ]
  }
);

// 注册时间戳工具
server.registerTool(
  'current_timestamp',
  {
    title: '🕐 当前时间戳',
    description: '获取当前东八区（中国时区）的时间戳，包括年月日时分秒信息',
    inputSchema: {
      format: z.enum(['datetime', 'date', 'time', 'timestamp', 'readable'])
        .default('datetime')
        .describe('时间格式：datetime(完整日期时间)、date(仅日期)、time(仅时间)、timestamp(Unix时间戳)、readable(可读格式)')
    }
  },
  async ({ format }) => {
    const now = new Date();
    const chinaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    const formatNumber = (num: number): string => num.toString().padStart(2, '0');
    
    const year = chinaTime.getUTCFullYear();
    const month = formatNumber(chinaTime.getUTCMonth() + 1);
    const day = formatNumber(chinaTime.getUTCDate());
    const hour = formatNumber(chinaTime.getUTCHours());
    const minute = formatNumber(chinaTime.getUTCMinutes());
    const second = formatNumber(chinaTime.getUTCSeconds());
    
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[chinaTime.getUTCDay()];
    
    let timeString: string;
    switch (format || 'datetime') {
      case 'date':
        timeString = `${year}-${month}-${day}`;
        break;
      case 'time':
        timeString = `${hour}:${minute}:${second}`;
        break;
      case 'timestamp':
        timeString = Math.floor(chinaTime.getTime() / 1000).toString();
        break;
      case 'readable':
        timeString = `${year}年${month}月${day}日 ${weekday} ${hour}时${minute}分${second}秒`;
        break;
      default:
        timeString = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }
    
    return {
      content: [{
        type: 'text',
        text: `## 🕐 当前东八区时间\n\n**格式**: ${format}\n**时间**: ${timeString}\n**时区**: 东八区 (UTC+8)\n**星期**: ${weekday}`
      }]
    };
  }
);

// 注册所有其他工具
const tools = [
  { tool: financeNews, runner: (args: any) => financeNews.run({ query: String(args?.query) }) },
  { tool: stockDataTool, runner: (args: any) => stockDataTool.run(args) },
  { tool: stockDataMinutes, runner: (args: any) => stockDataMinutes.run(args) },
  { tool: indexData, runner: (args: any) => indexData.run(args) },
  { tool: macroEcon, runner: (args: any) => macroEcon.run(args) },
  { tool: companyPerformance, runner: (args: any) => companyPerformance.run(args) },
  { tool: fundData, runner: (args: any) => fundData.run(args) },
  { tool: fundManagerByName, runner: (args: any) => runFundManagerByName(args) },
  { tool: convertibleBond, runner: (args: any) => convertibleBond.run(args) },
  { tool: blockTrade, runner: (args: any) => blockTrade.run(args) },
  { tool: moneyFlow, runner: (args: any) => moneyFlow.run(args) },
  { tool: marginTrade, runner: (args: any) => marginTrade.run(args) },
  { tool: companyPerformance_hk, runner: (args: any) => companyPerformance_hk.run(args) },
  { tool: companyPerformance_us, runner: (args: any) => companyPerformance_us.run(args) },
  { tool: csiIndexConstituents, runner: (args: any) => csiIndexConstituents.run(args) },
  { tool: dragonTigerInst, runner: (args: any) => dragonTigerInst.run(args) },
  { tool: hotNews, runner: (args: any) => hotNews.run(args) },
  { tool: basicInfo, runner: (args: any) => basicInfo.run(args) }
];

tools.forEach(({ tool, runner }) => {
  const toolSchema = (tool as any).parameters || (tool as any).inputSchema || {};
  server.registerTool(
    tool.name,
    {
      title: tool.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      description: tool.description,
      inputSchema: jsonSchemaToZod(toolSchema)
    },
    async (args: Record<string, unknown>) => {
      const result = await runner(args);
      return result as any;
    }
  );
});

// 健康检查
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    version: '2.0.6',
    transport: 'streamable-http',
    features: ['McpServer', 'Zod validation', 'Notification debouncing'],
    tools: tools.length + 1
  });
});

// MCP 端点
app.post('/mcp', async (req: Request, res: Response) => {
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    });

    res.on('close', () => {
      transport.close();
    });

    const token = extractTokenFromHeaders(req);
    
    await runWithRequestContext({ tushareToken: token }, async () => {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    });
    
  } catch (error) {
    console.error('处理 MCP 请求时发生错误:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error'
        },
        id: null
      });
    }
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 aigroup-market-mcp Streamable HTTP Server v2.0 Started');
  console.log('='.repeat(70));
  console.log(`📍 Server URL:        http://localhost:${PORT}`);
  console.log(`📡 MCP Endpoint:      http://localhost:${PORT}/mcp`);
  console.log(`💚 Health Check:      http://localhost:${PORT}/health`);
  console.log('='.repeat(70));
  console.log('✨ 新功能:');
  console.log('   • McpServer 高级 API');
  console.log('   • StreamableHTTPServerTransport');
  console.log('   • Zod schema 验证');
  console.log('   • 通知防抖优化');
  console.log(`   • ${tools.length + 1} 个工具已注册`);
  console.log('='.repeat(70));
  console.log('📝 Server is ready to accept connections');
  console.log('='.repeat(70) + '\n');
});