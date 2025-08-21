#!/usr/bin/env node

import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Clean and create dist directory
const distDir = join(__dirname, 'dist');
if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true });
}
mkdirSync(distDir, { recursive: true });

console.log('🚀 Building PasteMate Extension...');

// Build configuration - 将所有模块打包到content.js中
const buildConfig = {
  entryPoints: ['content.js'],
  bundle: true,
  minify: false, // 暂时关闭压缩以便调试
  format: 'iife',
  target: ['chrome91', 'edge91', 'firefox91', 'safari14'], // 明确指定浏览器兼容性
  outfile: join(distDir, 'content.js'),
  platform: 'browser',
  define: {
    'process.env.NODE_ENV': '"production"',
    'global': 'window', // 确保global指向window
    'PURETEXT_DEBUG': process.env.PURETEXT_DEBUG ? '"true"' : '"false"' // 注入调试模式环境变量
  },
  // 处理Node.js polyfills
  alias: {
    'process': 'process/browser',
    'buffer': 'buffer',
    'util': 'util'
  },
  // 确保所有依赖都被打包
  external: [],
  // 添加额外的加载器配置
  loader: {
    '.js': 'js',
    '.mjs': 'js',
    '.json': 'json'
  },
  // 注入polyfills
  inject: [],
  // 保持函数名称（用于调试）
  keepNames: true,
  // 输出格式优化
  legalComments: 'none',
  charset: 'utf8'
};

try {
  // Build content script with all modules
  await build(buildConfig);
  console.log('✅ Content script with modules built successfully');

  // Copy static files
  const filesToCopy = [
    'manifest.json',
    'sites.js',
    'src',
    '_locales',
    'icons',
    'assets'
  ];

  filesToCopy.forEach(file => {
    const srcPath = join(__dirname, file);
    const destPath = join(distDir, file);

    if (existsSync(srcPath)) {
      if (file === '_locales' || file === 'icons' || file === 'src' || file === 'assets') {
        // Copy directories recursively
        copyDirectory(srcPath, destPath);
      } else {
        copyFileSync(srcPath, destPath);
      }
      console.log(`✅ Copied ${file}`);
    } else {
      console.log(`⚠️  ${file} not found, skipping`);
    }
  });

  // Update manifest version if needed
  const manifestPath = join(distDir, 'manifest.json');
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));
    manifest.version = packageJson.version;
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('✅ Updated manifest version');
  }

  console.log('🎉 Build completed successfully!');
  console.log(`📦 Extension files are in: ${distDir}`);

} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}

function copyDirectory(src, dest) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = readdirSync(src);

  entries.forEach(entry => {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);

    if (statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  });
}