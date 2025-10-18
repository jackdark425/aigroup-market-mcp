/**
 * 工具管理器核心模块
 * 提供统一的工具注册、管理和执行机制
 */

import {
  FinanceMCPError,
  NotFoundError,
  formatErrorMessage
} from './errors.js';

/**
 * 工具定义接口 - 对外暴露的工具元数据
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
}

/**
 * 工具执行器接口 - 工具的执行函数签名
 */
export interface ToolExecutor<T = any, R = any> {
  (args: T): Promise<R>;
}

/**
 * 工具基类 - 所有工具必须继承此抽象类
 */
export abstract class BaseTool {
  /** 工具名称 */
  abstract readonly name: string;
  
  /** 工具描述 */
  abstract readonly description: string;
  
  /** 工具参数定义（JSON Schema） */
  abstract readonly parameters: any;
  
  /**
   * 执行工具逻辑
   * @param args 工具参数
   * @returns 执行结果
   */
  abstract execute(args: any): Promise<any>;
  
  /**
   * 获取工具定义（用于列表展示）
   */
  getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      inputSchema: this.parameters
    };
  }
}

/**
 * 工具管理器 - 统一管理所有工具的注册和执行
 */
export class ToolManager {
  private tools: Map<string, BaseTool> = new Map();
  
  /**
   * 注册一个工具
   * @param tool 工具实例
   */
  registerTool(tool: BaseTool): void {
    if (this.tools.has(tool.name)) {
      console.warn(`⚠️ Tool "${tool.name}" is already registered, overwriting...`);
    }
    this.tools.set(tool.name, tool);
    console.log(`✅ Registered tool: ${tool.name}`);
  }
  
  /**
   * 获取指定工具
   * @param name 工具名称
   * @returns 工具实例或undefined
   */
  getTool(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }
  
  /**
   * 获取所有已注册的工具
   * @returns 工具实例数组
   */
  getAllTools(): BaseTool[] {
    return Array.from(this.tools.values());
  }
  
  /**
   * 获取所有工具的定义（用于MCP tools/list）
   * @returns 工具定义数组
   */
  getToolDefinitions(): ToolDefinition[] {
    return this.getAllTools().map(tool => tool.getDefinition());
  }
  
  /**
   * 执行指定的工具
   * @param name 工具名称
   * @param args 工具参数
   * @returns 执行结果
   * @throws 如果工具不存在或执行失败
   */
  async executeTool(name: string, args: any): Promise<any> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new NotFoundError(`工具不存在: ${name}`, {
        toolName: name,
        availableTools: Array.from(this.tools.keys())
      });
    }
    
    console.log(`🔧 Executing tool: ${name}`);
    try {
      const result = await tool.execute(args);
      console.log(`✅ Tool ${name} executed successfully`);
      return result;
    } catch (error) {
      console.error(`❌ Tool ${name} execution failed:`, error);
      
      // 如果已经是标准错误，直接抛出
      if (error instanceof FinanceMCPError) {
        throw error;
      }
      
      // 包装未知错误为标准错误
      throw new FinanceMCPError(
        formatErrorMessage(error as Error, `执行工具 ${name}`),
        'TOOL_EXECUTION_ERROR',
        500,
        {
          tool: name,
          args,
          originalError: (error as Error).message,
          stack: (error as Error).stack
        }
      );
    }
  }
  
  /**
   * 获取已注册工具的数量
   */
  getToolCount(): number {
    return this.tools.size;
  }
  
  /**
   * 检查工具是否已注册
   * @param name 工具名称
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }
}