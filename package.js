#!/usr/bin/env node

import { createWriteStream, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const archiver = require('archiver');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = join(__dirname, 'dist');
const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));
const zipName = `puretext-one-click-v${packageJson.version}.zip`;

console.log('📦 Creating extension package...');

if (!existsSync(distDir)) {
  console.error('❌ Build directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Create a file to stream archive data to
const output = createWriteStream(zipName);
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
  console.log(`✅ Package created: ${zipName}`);
  console.log(`📊 Total size: ${archive.pointer()} bytes`);
  console.log('🚀 Ready for extension store submission!');
});

// Good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn('⚠️ ', err);
  } else {
    throw err;
  }
});

// Good practice to catch this error explicitly
archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add the entire dist directory to the archive
archive.directory(distDir, false);

// Finalize the archive (ie we are done appending files but streams have to finish yet)
archive.finalize();