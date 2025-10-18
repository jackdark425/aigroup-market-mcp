#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// 导入工具管理器
import { ToolManager } from "./core/ToolManager.js";
import { registerAllTools } from "./core/toolRegistry.js";

// 创建工具管理器并注册所有工具
const toolManager = new ToolManager();
registerAllTools(toolManager);

// 创建 MCP server
const server = new Server(
  {
    name: "FinanceMCP",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 🛠️ 工具：列出财经分析工具
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: toolManager.getToolDefinitions()
  };
});

// 🛠️ 工具：执行工具
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const result = await toolManager.executeTool(
    request.params.name,
    request.params.arguments
  );
  return result;
});

// 启动 server
async function main() {
  console.error("FinanceMCP Server starting..."); // 使用stderr避免干扰stdio通信
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("FinanceMCP Server connected successfully via stdio transport");
}

main().catch((error) => {
  console.error("❌ Server error:", error);
  console.error("Stack trace:", error.stack);
  process.exit(1);
});
