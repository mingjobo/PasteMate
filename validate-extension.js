#!/usr/bin/env node

import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 验证扩展构建结果...\n');

const errors = [];
const warnings = [];
const successes = [];

// 检查dist目录
const distDir = join(__dirname, 'dist');
if (!existsSync(distDir)) {
    errors.push('❌ dist目录不存在，请先运行 npm run build');
} else {
    successes.push('✅ dist目录存在');
}

// 检查manifest.json
const manifestPath = join(distDir, 'manifest.json');
if (!existsSync(manifestPath)) {
    errors.push('❌ manifest.json不存在');
} else {
    try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
        successes.push('✅ manifest.json格式正确');
        
        // 检查必要字段
        if (manifest.manifest_version !== 3) {
            errors.push('❌ manifest_version必须为3');
        }
        if (!manifest.content_scripts) {
            errors.push('❌ 缺少content_scripts配置');
        }
    } catch (e) {
        errors.push(`❌ manifest.json解析错误: ${e.message}`);
    }
}

// 检查content.js
const contentPath = join(distDir, 'content.js');
if (!existsSync(contentPath)) {
    errors.push('❌ content.js不存在');
} else {
    const content = readFileSync(contentPath, 'utf8');
    const firstLine = content.substring(0, 100);
    
    // 检查是否包含ES6 import语句（不应该有）
    if (firstLine.includes('import ') || firstLine.includes('export ')) {
        errors.push('❌ content.js包含ES6模块语法，将无法在扩展中运行');
    } else if (firstLine.startsWith('(() => {')) {
        successes.push('✅ content.js使用IIFE格式（esbuild）');
    } else if (firstLine.includes('webpackBootstrap')) {
        warnings.push('⚠️  content.js是webpack生成的，可能有兼容性问题');
    } else {
        successes.push('✅ content.js已打包');
    }
    
    // 检查文件大小
    const stats = statSync(contentPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    if (stats.size > 5 * 1024 * 1024) {
        warnings.push(`⚠️  content.js文件较大 (${sizeMB}MB)，可能影响加载性能`);
    } else {
        successes.push(`✅ content.js文件大小: ${sizeMB}MB`);
    }
}

// 检查必要的目录
const requiredDirs = ['_locales', 'icons'];
for (const dir of requiredDirs) {
    const dirPath = join(distDir, dir);
    if (!existsSync(dirPath)) {
        errors.push(`❌ 缺少必要目录: ${dir}`);
    } else {
        successes.push(`✅ ${dir}目录存在`);
    }
}

// 检查是否有webpack chunk文件（不应该有）
if (existsSync(distDir)) {
    const files = readdirSync(distDir);
    const chunkFiles = files.filter(f => f.includes('.chunk.js'));
    if (chunkFiles.length > 0) {
        errors.push(`❌ 发现webpack chunk文件: ${chunkFiles.join(', ')}，这些文件在扩展中无法加载`);
    }
}

// 输出结果
console.log('=== 验证结果 ===\n');

if (successes.length > 0) {
    console.log('成功项:');
    successes.forEach(s => console.log('  ' + s));
    console.log('');
}

if (warnings.length > 0) {
    console.log('警告:');
    warnings.forEach(w => console.log('  ' + w));
    console.log('');
}

if (errors.length > 0) {
    console.log('错误:');
    errors.forEach(e => console.log('  ' + e));
    console.log('\n❌ 扩展验证失败，请修复以上错误');
    process.exit(1);
} else {
    console.log('🎉 扩展验证通过！可以加载到Edge浏览器中了。');
    console.log('\n📋 加载步骤:');
    console.log('  1. 打开 Edge 浏览器，访问 edge://extensions/');
    console.log('  2. 开启"开发人员模式"');
    console.log('  3. 点击"加载解压的扩展"');
    console.log(`  4. 选择 ${distDir} 目录`);
    console.log('  5. 访问支持的网站测试功能');
}