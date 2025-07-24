#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const iconsDir = join(__dirname, 'icons');

// Ensure icons directory exists
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// SVG icon template - represents a document with a copy symbol
const createSVGIcon = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4285f4;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a73e8;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="url(#grad1)" stroke="#1a73e8" stroke-width="1"/>
  
  <!-- Document icon -->
  <rect x="${size*0.25}" y="${size*0.2}" width="${size*0.35}" height="${size*0.5}" fill="white" rx="2"/>
  <line x1="${size*0.3}" y1="${size*0.35}" x2="${size*0.55}" y2="${size*0.35}" stroke="#1a73e8" stroke-width="1"/>
  <line x1="${size*0.3}" y1="${size*0.45}" x2="${size*0.5}" y2="${size*0.45}" stroke="#1a73e8" stroke-width="1"/>
  <line x1="${size*0.3}" y1="${size*0.55}" x2="${size*0.55}" y2="${size*0.55}" stroke="#1a73e8" stroke-width="1"/>
  
  <!-- Copy symbol -->
  <rect x="${size*0.45}" y="${size*0.4}" width="${size*0.25}" height="${size*0.35}" fill="white" stroke="#1a73e8" stroke-width="1" rx="1"/>
  <rect x="${size*0.5}" y="${size*0.35}" width="${size*0.25}" height="${size*0.35}" fill="white" stroke="#1a73e8" stroke-width="1" rx="1"/>
</svg>`;

// Create PNG conversion function (simplified - creates SVG files that browsers can use)
const sizes = [16, 32, 48, 128];

console.log('🎨 Creating extension icons...');

sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const svgPath = join(iconsDir, `icon-${size}.svg`);
  writeFileSync(svgPath, svgContent);
  console.log(`✅ Created icon-${size}.svg`);
});

// Convert SVG to PNG using sharp
const convertToPNG = async () => {
  console.log('🔄 Converting SVG icons to PNG...');
  
  for (const size of sizes) {
    try {
      const svgContent = createSVGIcon(size);
      const pngPath = join(iconsDir, `icon-${size}.png`);
      
      await sharp(Buffer.from(svgContent))
        .png()
        .toFile(pngPath);
        
      console.log(`✅ Created icon-${size}.png`);
    } catch (error) {
      console.error(`❌ Failed to create icon-${size}.png:`, error.message);
    }
  }
};

// Run the conversion
convertToPNG().then(() => {
  console.log('🎉 Icons created successfully!');
}).catch(error => {
  console.error('❌ Icon creation failed:', error);
});