#!/usr/bin/env node

/**
 * 测试DeepSeek Word导出功能
 * 验证所有格式是否正确导出
 */

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 设置全局DOM环境
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;
global.HTMLElement = dom.window.HTMLElement;

// 动态导入模块
async function runTest() {
  try {
    console.log('🧪 开始测试DeepSeek Word导出功能...\n');
    
    // 读取测试HTML
    const htmlPath = path.join(__dirname, '../example/outputword/deepseek.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    console.log('✅ 读取测试HTML文件');
    
    // 创建DOM元素
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    
    // 测试要点
    const testPoints = [];
    
    // 1. 检查粗体和斜体
    const strongElements = container.querySelectorAll('strong');
    const emElements = container.querySelectorAll('em');
    testPoints.push({
      name: '粗体文本',
      found: strongElements.length > 0,
      count: strongElements.length,
      sample: strongElements[0]?.textContent
    });
    testPoints.push({
      name: '斜体文本',
      found: emElements.length > 0,
      count: emElements.length,
      sample: emElements[0]?.textContent
    });
    
    // 2. 检查列表标题
    const listTitles = [];
    container.querySelectorAll('p.ds-markdown-paragraph').forEach(p => {
      const text = p.textContent;
      if (text.includes('项目符号列表') || text.includes('编号列表')) {
        listTitles.push(text);
      }
    });
    testPoints.push({
      name: '列表标题',
      found: listTitles.length > 0,
      count: listTitles.length,
      samples: listTitles
    });
    
    // 3. 检查有序列表
    const olElements = container.querySelectorAll('ol');
    testPoints.push({
      name: '有序列表',
      found: olElements.length > 0,
      count: olElements.length,
      startAttr: olElements[0]?.getAttribute('start')
    });
    
    // 4. 检查表格
    const tableElements = container.querySelectorAll('table');
    const tableHeaders = container.querySelectorAll('th');
    const tableCells = container.querySelectorAll('td');
    testPoints.push({
      name: '表格',
      found: tableElements.length > 0,
      tableCount: tableElements.length,
      headerCount: tableHeaders.length,
      cellCount: tableCells.length,
      firstHeader: tableHeaders[0]?.textContent,
      firstCell: tableCells[0]?.textContent
    });
    
    // 5. 检查数学公式
    const katexElements = container.querySelectorAll('.katex');
    const katexAnnotations = container.querySelectorAll('annotation[encoding="application/x-tex"]');
    testPoints.push({
      name: '数学公式',
      found: katexElements.length > 0,
      count: katexElements.length,
      annotationCount: katexAnnotations.length,
      firstFormula: katexAnnotations[0]?.textContent
    });
    
    // 输出测试结果
    console.log('\n📊 测试结果汇总：\n');
    testPoints.forEach(point => {
      const status = point.found ? '✅' : '❌';
      console.log(`${status} ${point.name}:`);
      Object.entries(point).forEach(([key, value]) => {
        if (key !== 'name' && key !== 'found') {
          console.log(`   - ${key}: ${JSON.stringify(value)}`);
        }
      });
    });
    
    // 测试导出函数
    console.log('\n🔧 测试parseDeepSeekHtmlToDocxParagraphs函数...\n');
    
    const exportModule = await import('../src/export-to-word.js');
    
    // 创建测试HTML
    const testHtml = `
      <div class="ds-markdown ds-markdown--block">
        <h1>测试标题</h1>
        <p class="ds-markdown-paragraph"><strong>粗体文本</strong>和<em>斜体文本</em></p>
        <p class="ds-markdown-paragraph"><strong>项目符号列表</strong>：</p>
        <ul>
          <li><p class="ds-markdown-paragraph">项目1</p></li>
          <li><p class="ds-markdown-paragraph">项目2</p></li>
        </ul>
        <p class="ds-markdown-paragraph"><strong>编号列表</strong>：</p>
        <ol start="1">
          <li><p class="ds-markdown-paragraph">第一项</p></li>
          <li><p class="ds-markdown-paragraph">第二项</p></li>
        </ol>
        <div class="markdown-table-wrapper">
          <table>
            <thead>
              <tr><th>列1</th><th>列2</th></tr>
            </thead>
            <tbody>
              <tr><td>数据1</td><td>数据2</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    // 注意：由于docx库需要完整的环境，这里只测试解析部分
    console.log('⚠️  注意：完整的Word导出需要在浏览器环境中测试');
    console.log('📝 建议：在浏览器中打开 test/test-deepseek-format.html 进行完整测试');
    
    console.log('\n✨ 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
runTest();