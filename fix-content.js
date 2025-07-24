#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

console.log('🔧 Fixing content.js syntax issues...');

let content = readFileSync('content.js', 'utf8');

// Remove malformed lines
content = content.replace(/\s*} \/ 2}px;\s*\n/g, '');
content = content.replace(/\s*`;\s*\n\s*\n\s*\/\/ 添加涟漪动画样式/g, '\n\n  // 添加涟漪动画样式');

// Fix any unclosed template strings in ripple styles
content = content.replace(
  /margin-top: \$\{-size \/ 2\}px;\s*\n\s*\/\/ 添加涟漪动画样式/g,
  'margin-top: ${-size / 2}px;\n      `;\n      \n      // 添加涟漪动画样式'
);

// Remove any duplicated sections by finding and removing repeated addRippleEffect content
const lines = content.split('\n');
const cleanLines = [];
let inDuplicatedSection = false;
let duplicateStartPattern = /^\s*\/\/ 添加涟漪动画样式$/;
let duplicateEndPattern = /^\s*button\.appendChild\(ripple\);$/;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Skip malformed lines
  if (line.includes('} / 2}px;') || line.trim() === '`;') {
    continue;
  }
  
  // Check for start of duplicated section (after the first occurrence)
  if (duplicateStartPattern.test(line) && cleanLines.some(l => duplicateStartPattern.test(l))) {
    inDuplicatedSection = true;
    continue;
  }
  
  // Check for end of duplicated section
  if (inDuplicatedSection && duplicateEndPattern.test(line)) {
    inDuplicatedSection = false;
    continue;
  }
  
  // Skip lines in duplicated section
  if (inDuplicatedSection) {
    continue;
  }
  
  cleanLines.push(line);
}

content = cleanLines.join('\n');

// Write the cleaned content
writeFileSync('content.js', content);

console.log('✅ Fixed content.js syntax issues');

// Verify syntax
try {
  const { execSync } = await import('child_process');
  execSync('node -c content.js', { stdio: 'pipe' });
  console.log('✅ Syntax validation passed');
} catch (error) {
  console.error('❌ Syntax validation failed:', error.message);
  process.exit(1);
}