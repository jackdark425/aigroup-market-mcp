#!/usr/bin/env node
/**
 * aigroup-market-mcp Server - 使用 McpServer 高级 API
 */

import { z } from 'zod';
import { createLogger, redirectConsoleLogsToStderr } from './utils/logger.js';

process.env.MCP_TRANSPORT = 'stdio';

const logger = createLogger('stdio');

// 辅助函数：将 JSON Schema 转换为简单的 Zod schema
function jsonSchemaToZod(schema: any): any {
  const zodSchema: any = {};
  
  if (schema.properties) {
    for (const [key, prop] of Object.entries(schema.properties as Record<string, any>)) {
      let fieldSchema: any;
      
      // 根据类型创建 Zod schema
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
      
      // 添加描述
      if (prop.description) {
        fieldSchema = fieldSchema.describe(prop.description);
      }
      
      // 处理可选字段
      const isRequired = schema.required && schema.required.includes(key);
      if (!isRequired) {
        fieldSchema = fieldSchema.optional();
      }
      
      zodSchema[key] = fieldSchema;
    }
  }
  
  return zodSchema;
}

// 启动服务器
async function main() {
  redirectConsoleLogsToStderr();

  const [{ McpServer }, { StdioServerTransport }] = await Promise.all([
    import('@modelcontextprotocol/sdk/server/mcp.js'),
    import('@modelcontextprotocol/sdk/server/stdio.js')
  ]);

  const [
    { financeNews },
    { stockDataTool },
    { stockDataMinutes },
    { indexData },
    { macroEcon },
    { companyPerformance },
    { fundData },
    { fundManagerByName, runFundManagerByName },
    { convertibleBond },
    { blockTrade },
    { moneyFlow },
    { marginTrade },
    { companyPerformance_hk },
    { companyPerformance_us },
    { csiIndexConstituents },
    { dragonTigerInst },
    { hotNews },
    { basicInfo }
  ] = await Promise.all([
    import('./tools/financeNews.js'),
    import('./tools/stockData/index.js'),
    import('./tools/stockDataMinutes.js'),
    import('./tools/indexData.js'),
    import('./tools/macroEcon.js'),
    import('./tools/companyPerformance.js'),
    import('./tools/fundData.js'),
    import('./tools/fundManagerByName.js'),
    import('./tools/convertibleBond.js'),
    import('./tools/blockTrade.js'),
    import('./tools/moneyFlow.js'),
    import('./tools/marginTrade.js'),
    import('./tools/companyPerformance_hk.js'),
    import('./tools/companyPerformance_us.js'),
    import('./tools/csiIndexConstituents.js'),
    import('./tools/dragonTigerInst.js'),
    import('./tools/hotNews.js'),
    import('./tools/basicInfo.js')
  ]);

  // 创建 MCP Server 实例，启用通知防抖
  const server = new McpServer(
    {
      name: 'aigroup-market-mcp',
      version: '2.0.7'
    },
    {
      debouncedNotificationMethods: [
        'notifications/tools/list_changed'
      ]
    }
  );

  // 时间戳工具
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

  logger.info('🚀 aigroup-market-mcp Server v2.0 启动中...');
  logger.info('✅ 使用 McpServer 高级 API');
  logger.info('✅ Zod schema 验证已启用');
  logger.info('⚡ 通知防抖优化已启用');
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  logger.info('✅ aigroup-market-mcp Server 已成功连接（stdio 传输）');
  logger.info(`🔧 已注册工具数量: ${tools.length + 1}`);
}

main().catch((error) => {
  logger.error('❌ Server 启动失败:', error);
  logger.error('Stack trace:', error.stack);
  process.exit(1);
});
