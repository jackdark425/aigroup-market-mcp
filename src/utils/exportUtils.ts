/**
 * 通用导出工具模块
 * 为所有工具提供统一的CSV/JSON导出功能
 */

import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

/**
 * 导出选项接口
 */
export interface ExportOptions {
  output_format?: string;
  export_path?: string;
}

/**
 * 导出结果接口
 */
export interface ExportResult {
  filepath: string;
  format: string;
  dataCount: number;
  success: boolean;
  message?: string;
}

/**
 * 通用导出函数
 */
export async function exportData(
  data: any[],
  fields: string[],
  filenamePrefix: string,
  options: ExportOptions
): Promise<ExportResult> {
  const { output_format = 'markdown', export_path } = options;
  
  // 如果不是CSV或JSON格式，直接返回
  if (output_format !== 'csv' && output_format !== 'json') {
    return {
      filepath: '',
      format: output_format,
      dataCount: data.length,
      success: true,
      message: '使用默认markdown格式输出'
    };
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    let filepath = '';

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
      } else {
        // 用户指定的是目录路径
        let exportDir = export_path
          ? (path.isAbsolute(export_path) ? export_path : path.resolve(process.cwd(), export_path))
          : path.join(process.cwd(), config.export.defaultExportPath);

        if (!fs.existsSync(exportDir)) {
          fs.mkdirSync(exportDir, { recursive: true });
        }

        const filename = `${filenamePrefix}_${timestamp}.${output_format}`;
        filepath = path.join(exportDir, filename);
      }
    } else {
      // 使用默认导出目录
      const exportDir = path.join(process.cwd(), config.export.defaultExportPath);
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const filename = `${filenamePrefix}_${timestamp}.${output_format}`;
      filepath = path.join(exportDir, filename);
    }

    // 确保目录存在
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let fileContent = '';
    if (output_format === 'csv') {
      fileContent = generateCSVContent(data, fields);
    } else {
      fileContent = generateJSONContent(data, fields, filenamePrefix);
    }

    fs.writeFileSync(filepath, fileContent, 'utf8');

    // 获取文件大小
    const stats = fs.statSync(filepath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);

    return {
      filepath,
      format: output_format,
      dataCount: data.length,
      success: true,
      message: `文件已生成：${filepath} (${fileSizeKB} KB, ${data.length}条记录)`
    };

  } catch (error) {
    console.error('导出数据失败:', error);
    return {
      filepath: '',
      format: output_format,
      dataCount: data.length,
      success: false,
      message: `导出失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 生成CSV内容
 */
function generateCSVContent(data: any[], fields: string[]): string {
  let csvContent = '';
  
  // 表头
  csvContent += fields.join(',') + '\n';
  
  // 数据行
  data.forEach(item => {
    const row = fields.map(field => {
      const value = item[field];
      if (value === null || value === undefined) return '';
      
      // 处理包含逗号或引号的字段
      let strValue = String(value);
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        strValue = `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
    });
    csvContent += row.join(',') + '\n';
  });
  
  return csvContent;
}

/**
 * 生成JSON内容
 */
function generateJSONContent(data: any[], fields: string[], source: string): string {
  const jsonData = {
    metadata: {
      source,
      data_count: data.length,
      fields,
      export_time: new Date().toISOString()
    },
    data
  };
  
  return JSON.stringify(jsonData, null, 2);
}

/**
 * 生成导出成功消息
 */
export function generateExportSuccessMessage(exportResult: ExportResult, toolName: string): string {
  if (!exportResult.success) {
    return `❌ ${toolName}导出失败: ${exportResult.message}`;
  }

  if (exportResult.format === 'markdown') {
    return `📊 ${toolName}数据已生成，使用markdown格式显示`;
  }

  return `✅ ${toolName}数据导出成功\n\n` +
         `**文件路径**: ${exportResult.filepath}\n` +
         `**文件格式**: ${exportResult.format.toUpperCase()}\n` +
         `**数据条数**: ${exportResult.dataCount}条\n` +
         `**导出时间**: ${new Date().toLocaleString()}\n\n` +
         `文件已保存到本地目录，您可以使用${exportResult.format === 'csv' ? 'Excel或其他表格' : 'JSON查看'}工具打开查看。`;
}

/**
 * 检查是否需要导出
 */
export function shouldExport(options: ExportOptions): boolean {
  return options.output_format === 'csv' || options.output_format === 'json';
}

/**
 * 获取导出参数定义
 */
export function getExportParameters() {
  return {
    output_format: {
      type: "string" as const,
      description: "输出格式，可选值：markdown(默认，返回markdown格式文本)、csv(生成CSV文件)、json(生成JSON文件)"
    },
    export_path: {
      type: "string" as const,
      description: "导出文件保存路径（可选）。支持相对路径（相对于项目根目录）或绝对路径。如果不指定，默认保存到项目根目录的 exports 文件夹"
    }
  };
}