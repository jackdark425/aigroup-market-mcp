/**
 * 构建辅助脚本
 * 清理构建目录，执行构建并进行必要的后处理
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 确保build目录存在
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
  console.log('✅ 创建build目录');
}

// 确保build/services目录存在
const servicesDir = path.join(buildDir, 'services');
if (!fs.existsSync(servicesDir)) {
  fs.mkdirSync(servicesDir, { recursive: true });
  console.log('✅ 创建build/services目录');
}

// 执行构建
try {
  console.log('🔨 执行npm构建...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ 构建完成');
} catch (error) {
  console.error('❌ 构建失败:', error);
  process.exit(1);
}

// 显示Tushare统一配置提醒
console.log('\n🔔 提醒: Tushare API设置现在统一在 src/config.ts 文件中管理');
console.log('   如需修改API Token，请编辑该文件后重新运行本脚本\n');

// 完成
console.log('✨ 全部完成! 现在您可以运行服务器:');
console.log('   node build/index.js');
console.log('   或');
console.log('   npx supergateway --stdio "node build/index.js" --port 3100\n'); 