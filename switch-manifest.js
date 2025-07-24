#!/usr/bin/env node

/**
 * 切换 manifest 配置的工具脚本
 * 用于在测试和生产环境之间切换
 */

import fs from 'fs';
import path from 'path';

const MANIFEST_PRODUCTION = 'manifest.json';
const MANIFEST_TEST = 'manifest-test.json';
const MANIFEST_BACKUP = 'manifest-production.json';

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (error) {
    return false;
  }
}

function copyFile(source, destination) {
  try {
    fs.copyFileSync(source, destination);
    return true;
  } catch (error) {
    console.error(`❌ 复制文件失败: ${error.message}`);
    return false;
  }
}

function switchToTest() {
  console.log('🔄 切换到测试模式...');
  
  // 备份当前的 manifest.json
  if (fileExists(MANIFEST_PRODUCTION)) {
    if (!copyFile(MANIFEST_PRODUCTION, MANIFEST_BACKUP)) {
      return false;
    }
    console.log('✅ 已备份当前 manifest.json');
  }
  
  // 检查测试版本是否存在
  if (!fileExists(MANIFEST_TEST)) {
    console.error('❌ 测试版 manifest-test.json 不存在');
    return false;
  }
  
  // 使用测试版本
  if (!copyFile(MANIFEST_TEST, MANIFEST_PRODUCTION)) {
    return false;
  }
  
  console.log('✅ 已切换到测试模式');
  console.log('💡 现在可以在本地文件上测试扩展了');
  console.log('📝 记得在 Chrome 扩展页面重新加载扩展');
  return true;
}

function switchToProduction() {
  console.log('🔄 切换到生产模式...');
  
  // 检查备份是否存在
  if (!fileExists(MANIFEST_BACKUP)) {
    console.error('❌ 生产版备份 manifest-production.json 不存在');
    console.log('💡 请手动检查 manifest.json 配置');
    return false;
  }
  
  // 恢复生产版本
  if (!copyFile(MANIFEST_BACKUP, MANIFEST_PRODUCTION)) {
    return false;
  }
  
  console.log('✅ 已切换到生产模式');
  console.log('💡 现在扩展只会在指定网站上运行');
  console.log('📝 记得在 Chrome 扩展页面重新加载扩展');
  return true;
}

function showStatus() {
  console.log('📊 当前状态:');
  
  if (!fileExists(MANIFEST_PRODUCTION)) {
    console.log('❌ manifest.json 不存在');
    return;
  }
  
  try {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PRODUCTION, 'utf8'));
    const contentScript = manifest.content_scripts[0];
    const matches = contentScript.matches;
    
    console.log('📄 当前 manifest.json 配置:');
    console.log('   匹配规则:');
    matches.forEach(match => {
      console.log(`     - ${match}`);
    });
    
    const hasFileProtocol = matches.some(match => match.startsWith('file://'));
    if (hasFileProtocol) {
      console.log('🧪 当前为测试模式 (支持本地文件)');
    } else {
      console.log('🚀 当前为生产模式 (仅支持指定网站)');
    }
    
  } catch (error) {
    console.error('❌ 读取 manifest.json 失败:', error.message);
  }
}

function showHelp() {
  console.log('🛠️  Manifest 切换工具');
  console.log('');
  console.log('用法:');
  console.log('  node switch-manifest.js test        # 切换到测试模式');
  console.log('  node switch-manifest.js production  # 切换到生产模式');
  console.log('  node switch-manifest.js status      # 显示当前状态');
  console.log('  node switch-manifest.js help        # 显示帮助');
  console.log('');
  console.log('说明:');
  console.log('  测试模式: 允许扩展在本地文件 (file://) 上运行');
  console.log('  生产模式: 扩展仅在指定的网站上运行');
}

// 主函数
function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'test':
      switchToTest();
      break;
    case 'production':
      switchToProduction();
      break;
    case 'status':
      showStatus();
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      console.log('❓ 未知命令，使用 "help" 查看帮助');
      showHelp();
      process.exit(1);
  }
}

// 运行主函数
main();

export {
  switchToTest,
  switchToProduction,
  showStatus
};