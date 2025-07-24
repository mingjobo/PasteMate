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

console.log('🚀 Building PureText One-Click Extension...');

// Build configuration
const buildConfig = {
  entryPoints: ['content.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  outdir: distDir,
  platform: 'browser',
  define: {
    'process.env.NODE_ENV': '"production"'
  }
};

try {
  // Build content script
  await build(buildConfig);
  console.log('✅ Content script built successfully');

  // Copy static files
  const filesToCopy = [
    'manifest.json',
    'sites.js',
    '_locales',
    'icons'
  ];

  filesToCopy.forEach(file => {
    const srcPath = join(__dirname, file);
    const destPath = join(distDir, file);
    
    if (existsSync(srcPath)) {
      if (file === '_locales' || file === 'icons') {
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