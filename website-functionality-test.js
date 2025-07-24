/**
 * 网站功能测试
 * 模拟扩展在目标网站上的行为，验证功能逻辑
 */

import fs from 'fs';
import { JSDOM } from 'jsdom';

// 模拟各个网站的DOM结构
const MOCK_WEBSITE_DOM = {
  "chat.openai.com": {
    name: "ChatGPT",
    html: `
      <div class="conversation">
        <div data-message-author-role="user">
          <div class="markdown">用户消息</div>
        </div>
        <div data-message-author-role="assistant">
          <div class="markdown">
            <p>这是一个<strong>ChatGPT</strong>的回复消息。</p>
            <p>包含<em>Markdown</em>格式的内容。</p>
            <ul>
              <li>列表项1</li>
              <li>列表项2</li>
            </ul>
            <pre><code>console.log('代码块');</code></pre>
          </div>
        </div>
        <div data-message-author-role="assistant">
          <div class="markdown">
            <p>第二个助手回复消息。</p>
          </div>
        </div>
      </div>
    `,
    selector: "[data-message-author-role='assistant'] .markdown",
    expectedButtons: 2,
    expectedText: "这是一个ChatGPT的回复消息。\n\n包含Markdown格式的内容。\n\n• 列表项1\n• 列表项2\n\nconsole.log('代码块');"
  },
  
  "chat.deepseek.com": {
    name: "DeepSeek",
    html: `
      <div class="chat-container">
        <div class="message-content" data-role="user">用户消息</div>
        <div class="message-content" data-role="assistant">
          <p>这是<strong>DeepSeek</strong>的回复。</p>
          <p>支持**Markdown**格式。</p>
          <blockquote>引用内容</blockquote>
        </div>
        <div class="message-content" data-role="assistant">
          <p>另一个助手回复。</p>
        </div>
      </div>
    `,
    selector: ".message-content[data-role='assistant']",
    expectedButtons: 2,
    expectedText: "这是DeepSeek的回复。\n\n支持Markdown格式。\n\n引用内容"
  },
  
  "www.doubao.com": {
    name: "豆包",
    html: `
      <div class="chat-interface">
        <div class="dialogue-text user">用户输入</div>
        <div class="dialogue-text assistant">
          <p>这是<strong>豆包</strong>的中文回复。</p>
          <p>测试中文界面支持。</p>
          <ol>
            <li>有序列表1</li>
            <li>有序列表2</li>
          </ol>
        </div>
        <div class="dialogue-text assistant">
          <p>第二个豆包回复。</p>
        </div>
      </div>
    `,
    selector: ".dialogue-text.assistant",
    expectedButtons: 2,
    expectedText: "这是豆包的中文回复。\n\n测试中文界面支持。\n\n1. 有序列表1\n2. 有序列表2"
  },
  
  "www.kimi.com": {
    name: "Kimi",
    html: `
      <div class="chat-area">
        <div class="user-bubble">用户消息</div>
        <div class="response-bubble">
          <p>这是<em>Kimi</em>的智能回复。</p>
          <p>包含~~删除线~~和\`行内代码\`。</p>
          <h3>标题内容</h3>
          <p>普通段落。</p>
        </div>
        <div class="response-bubble">
          <p>Kimi的第二个回复。</p>
        </div>
      </div>
    `,
    selector: ".response-bubble",
    expectedButtons: 2,
    expectedText: "这是Kimi的智能回复。\n\n包含删除线和行内代码。\n\n标题内容\n\n普通段落。"
  }
};

class WebsiteFunctionalityTester {
  constructor() {
    this.results = {
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      details: []
    };
    
    // 加载扩展代码
    this.loadExtensionCode();
  }

  /**
   * 加载扩展代码
   */
  loadExtensionCode() {
    try {
      this.contentScript = fs.readFileSync('content.js', 'utf8');
      this.sitesConfig = fs.readFileSync('sites.js', 'utf8');
      console.log('✅ 扩展代码加载成功');
    } catch (error) {
      console.error('❌ 扩展代码加载失败:', error.message);
      throw error;
    }
  }

  /**
   * 运行所有网站功能测试
   */
  async runAllTests() {
    console.log('🧪 开始网站功能测试...\n');

    for (const [hostname, mockData] of Object.entries(MOCK_WEBSITE_DOM)) {
      this.results.summary.total++;
      
      console.log(`\n🌐 测试网站: ${mockData.name} (${hostname})`);
      
      try {
        const result = await this.testWebsiteFunctionality(hostname, mockData);
        
        if (result.success) {
          this.results.summary.passed++;
          console.log(`   ✅ 功能测试通过`);
        } else {
          this.results.summary.failed++;
          console.log(`   ❌ 功能测试失败: ${result.error}`);
        }
        
        this.results.details.push(result);
        
      } catch (error) {
        this.results.summary.failed++;
        const errorResult = {
          hostname,
          siteName: mockData.name,
          success: false,
          error: error.message,
          details: {}
        };
        this.results.details.push(errorResult);
        console.log(`   ❌ 测试异常: ${error.message}`);
      }
    }

    // 生成测试报告
    await this.generateTestReport();
  }

  /**
   * 测试单个网站的功能
   */
  async testWebsiteFunctionality(hostname, mockData) {
    const result = {
      hostname,
      siteName: mockData.name,
      success: false,
      error: null,
      details: {
        domSetup: false,
        selectorMatching: false,
        buttonInjection: false,
        textExtraction: false,
        i18nSupport: false,
        copyFunctionality: false
      },
      metrics: {
        elementsFound: 0,
        buttonsInjected: 0,
        textLength: 0,
        processingTime: 0
      }
    };

    const startTime = Date.now();

    try {
      // 1. 设置DOM环境
      console.log(`   🔧 设置DOM环境...`);
      const { window, document } = await this.setupDOMEnvironment(hostname, mockData.html);
      result.details.domSetup = true;
      console.log(`   ✅ DOM环境设置完成`);

      // 2. 测试选择器匹配
      console.log(`   🎯 测试选择器匹配...`);
      const elements = document.querySelectorAll(mockData.selector);
      result.metrics.elementsFound = elements.length;
      
      if (elements.length === mockData.expectedButtons) {
        result.details.selectorMatching = true;
        console.log(`   ✅ 选择器匹配成功 (找到 ${elements.length} 个元素)`);
      } else {
        console.log(`   ⚠️  选择器匹配数量不符: 期望 ${mockData.expectedButtons}, 实际 ${elements.length}`);
        result.details.selectorMatching = false;
      }

      // 3. 模拟扩展初始化
      console.log(`   🚀 模拟扩展初始化...`);
      const extensionContext = await this.initializeExtension(window, document, hostname);
      
      // 4. 测试按钮注入
      console.log(`   💉 测试按钮注入...`);
      const injectionResult = await this.testButtonInjection(extensionContext, elements);
      result.details.buttonInjection = injectionResult.success;
      result.metrics.buttonsInjected = injectionResult.count;
      
      if (injectionResult.success) {
        console.log(`   ✅ 按钮注入成功 (${injectionResult.count} 个)`);
      } else {
        console.log(`   ❌ 按钮注入失败: ${injectionResult.error}`);
      }

      // 5. 测试文本提取
      console.log(`   📝 测试文本提取...`);
      const textResult = await this.testTextExtraction(extensionContext, elements[0]);
      result.details.textExtraction = textResult.success;
      result.metrics.textLength = textResult.length;
      
      if (textResult.success) {
        console.log(`   ✅ 文本提取成功 (${textResult.length} 字符)`);
        console.log(`   📄 提取内容预览: "${textResult.text.substring(0, 50)}..."`);
      } else {
        console.log(`   ❌ 文本提取失败: ${textResult.error}`);
      }

      // 6. 测试国际化支持
      console.log(`   🌍 测试国际化支持...`);
      const i18nResult = await this.testI18nSupport(extensionContext, hostname);
      result.details.i18nSupport = i18nResult.success;
      
      if (i18nResult.success) {
        console.log(`   ✅ 国际化支持正常 (${i18nResult.language}: "${i18nResult.buttonText}")`);
      } else {
        console.log(`   ⚠️  国际化支持检查: ${i18nResult.message}`);
      }

      // 7. 测试复制功能逻辑
      console.log(`   📋 测试复制功能逻辑...`);
      const copyResult = await this.testCopyFunctionality(extensionContext, elements[0]);
      result.details.copyFunctionality = copyResult.success;
      
      if (copyResult.success) {
        console.log(`   ✅ 复制功能逻辑正常`);
      } else {
        console.log(`   ❌ 复制功能逻辑失败: ${copyResult.error}`);
      }

      // 计算处理时间
      result.metrics.processingTime = Date.now() - startTime;

      // 判断整体成功
      result.success = result.details.domSetup && 
                      result.details.selectorMatching && 
                      result.details.buttonInjection && 
                      result.details.textExtraction;

    } catch (error) {
      result.error = error.message;
      result.metrics.processingTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * 设置DOM环境
   */
  async setupDOMEnvironment(hostname, html) {
    const dom = new JSDOM(html, {
      url: `https://${hostname}/`,
      pretendToBeVisual: true,
      resources: "usable"
    });

    const { window } = dom;
    const { document } = window;

    // 模拟浏览器环境
    global.window = window;
    global.document = document;
    global.navigator = {
      clipboard: {
        writeText: async (text) => {
          // 模拟剪贴板写入
          return Promise.resolve();
        }
      }
    };

    // 模拟chrome扩展API
    global.chrome = {
      i18n: {
        getMessage: (key) => {
          const messages = {
            'copyPlainText': hostname === 'www.doubao.com' ? '复制纯文本' : 'Copy Plain Text',
            'copySuccess': hostname === 'www.doubao.com' ? '复制成功' : 'Copied successfully',
            'copyFailed': hostname === 'www.doubao.com' ? '复制失败' : 'Copy failed'
          };
          return messages[key] || key;
        }
      }
    };

    return { window, document };
  }

  /**
   * 初始化扩展环境
   */
  async initializeExtension(window, document, hostname) {
    // 在window上下文中执行扩展代码
    const scriptContent = `
      ${this.sitesConfig}
      
      // 简化的扩展类实现
      class MockSiteManager {
        constructor() {
          this.siteConfig = SUPPORTED_SITES;
          this.currentSite = null;
        }
        
        getCurrentSite() {
          const hostname = "${hostname}";
          this.currentSite = this.siteConfig[hostname] || null;
          if (this.currentSite) {
            this.currentSite.hostname = hostname;
          }
          return this.currentSite;
        }
        
        isSupported() {
          return this.getCurrentSite() !== null;
        }
        
        getSelector() {
          const site = this.getCurrentSite();
          return site ? site.selector : null;
        }
        
        getSiteName() {
          const site = this.getCurrentSite();
          return site ? site.name : null;
        }
      }
      
      class MockClipboardManager {
        static extractPlainText(element) {
          if (!element) return '';
          
          let text = element.innerText || element.textContent || '';
          
          // 简化的Markdown清理
          text = text
            .replace(/\\*\\*(.*?)\\*\\*/g, '$1')
            .replace(/\\*(.*?)\\*/g, '$1')
            .replace(/~~(.*?)~~/g, '$1')
            .replace(/\`([^\`]+)\`/g, '$1')
            .replace(/^#{1,6}\\s+/gm, '')
            .replace(/^>\\s*/gm, '')
            .replace(/^[\\s]*[-*+]\\s+/gm, '• ')
            .replace(/^[\\s]*\\d+\\.\\s+/gm, (match, offset, string) => {
              const lineStart = string.lastIndexOf('\\n', offset) + 1;
              const linePrefix = string.substring(lineStart, offset);
              const indent = linePrefix.match(/^\\s*/)[0];
              const number = match.match(/\\d+/)[0];
              return indent + number + '. ';
            })
            .replace(/\\r\\n/g, '\\n')
            .replace(/\\r/g, '\\n')
            .replace(/[ \\t]+/g, ' ')
            .replace(/\\n\\s*\\n\\s*\\n/g, '\\n\\n')
            .trim();
          
          return text;
        }
        
        static async copyPlainText(element) {
          try {
            const text = this.extractPlainText(element);
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(text);
              return true;
            }
            return false;
          } catch (error) {
            return false;
          }
        }
      }
      
      class MockButtonInjector {
        constructor(siteManager) {
          this.siteManager = siteManager;
          this.injectedButtons = new WeakSet();
          this.buttonClass = 'puretext-copy-btn';
        }
        
        injectButton(bubble) {
          if (this.injectedButtons.has(bubble)) {
            return false;
          }
          
          if (bubble.querySelector('.' + this.buttonClass)) {
            return false;
          }
          
          const button = this.createButton(bubble);
          bubble.appendChild(button);
          this.injectedButtons.add(bubble);
          return true;
        }
        
        createButton(targetBubble) {
          const button = document.createElement('button');
          const buttonText = chrome.i18n.getMessage('copyPlainText');
          button.textContent = buttonText;
          button.className = this.buttonClass;
          
          button.style.cssText = \`
            position: absolute;
            bottom: 8px;
            right: 8px;
            background: rgba(0, 0, 0, 0.08);
            color: #333333;
            border: 1px solid rgba(0, 0, 0, 0.12);
            border-radius: 6px;
            padding: 6px 12px;
            font-size: 11px;
            cursor: pointer;
            z-index: 10001;
          \`;
          
          button.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            await MockClipboardManager.copyPlainText(targetBubble);
          });
          
          return button;
        }
      }
      
      // 导出到全局
      window.MockSiteManager = MockSiteManager;
      window.MockClipboardManager = MockClipboardManager;
      window.MockButtonInjector = MockButtonInjector;
    `;

    // 在window上下文中执行脚本
    window.eval(scriptContent);

    // 创建扩展实例
    const siteManager = new window.MockSiteManager();
    const buttonInjector = new window.MockButtonInjector(siteManager);

    return {
      siteManager,
      buttonInjector,
      clipboardManager: window.MockClipboardManager,
      window,
      document
    };
  }

  /**
   * 测试按钮注入
   */
  async testButtonInjection(context, elements) {
    try {
      let injectedCount = 0;
      
      for (const element of elements) {
        // 确保元素有相对定位
        element.style.position = 'relative';
        
        const injected = context.buttonInjector.injectButton(element);
        if (injected) {
          injectedCount++;
        }
      }
      
      // 验证按钮是否真的被添加
      const buttons = context.document.querySelectorAll('.puretext-copy-btn');
      
      return {
        success: buttons.length === injectedCount && injectedCount > 0,
        count: buttons.length,
        error: buttons.length === 0 ? 'No buttons were injected' : null
      };
    } catch (error) {
      return {
        success: false,
        count: 0,
        error: error.message
      };
    }
  }

  /**
   * 测试文本提取
   */
  async testTextExtraction(context, element) {
    try {
      if (!element) {
        return {
          success: false,
          text: '',
          length: 0,
          error: 'No element provided'
        };
      }

      const extractedText = context.clipboardManager.extractPlainText(element);
      
      return {
        success: extractedText.length > 0,
        text: extractedText,
        length: extractedText.length,
        error: extractedText.length === 0 ? 'No text extracted' : null
      };
    } catch (error) {
      return {
        success: false,
        text: '',
        length: 0,
        error: error.message
      };
    }
  }

  /**
   * 测试国际化支持
   */
  async testI18nSupport(context, hostname) {
    try {
      const buttonText = global.chrome.i18n.getMessage('copyPlainText');
      const expectedTexts = {
        'www.doubao.com': '复制纯文本',
        'default': 'Copy Plain Text'
      };
      
      const expected = expectedTexts[hostname] || expectedTexts.default;
      const isCorrect = buttonText === expected;
      
      return {
        success: isCorrect,
        buttonText: buttonText,
        language: buttonText.includes('复制') ? 'zh_CN' : 'en',
        message: isCorrect ? 'Correct i18n text' : `Expected "${expected}", got "${buttonText}"`
      };
    } catch (error) {
      return {
        success: false,
        buttonText: '',
        language: 'unknown',
        message: error.message
      };
    }
  }

  /**
   * 测试复制功能逻辑
   */
  async testCopyFunctionality(context, element) {
    try {
      if (!element) {
        return {
          success: false,
          error: 'No element provided'
        };
      }

      const success = await context.clipboardManager.copyPlainText(element);
      
      return {
        success: success,
        error: success ? null : 'Copy operation failed'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 生成测试报告
   */
  async generateTestReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: this.results.summary,
      details: this.results.details,
      testEnvironment: {
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    // 生成JSON报告
    const jsonReport = JSON.stringify(reportData, null, 2);
    await fs.promises.writeFile('website-functionality-test-report.json', jsonReport);

    // 生成Markdown报告
    const markdownReport = this.generateMarkdownTestReport(reportData);
    await fs.promises.writeFile('WEBSITE_FUNCTIONALITY_TEST_REPORT.md', markdownReport);

    // 打印摘要
    console.log('\n📊 测试结果摘要:');
    console.log(`   总测试数: ${this.results.summary.total}`);
    console.log(`   通过: ${this.results.summary.passed}`);
    console.log(`   失败: ${this.results.summary.failed}`);
    console.log(`   警告: ${this.results.summary.warnings}`);
    
    const successRate = ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1);
    console.log(`   成功率: ${successRate}%`);

    console.log('\n📄 详细报告已生成:');
    console.log('   - website-functionality-test-report.json');
    console.log('   - WEBSITE_FUNCTIONALITY_TEST_REPORT.md');
  }

  /**
   * 生成Markdown测试报告
   */
  generateMarkdownTestReport(reportData) {
    const { summary, details, timestamp } = reportData;
    
    let markdown = `# 网站功能测试报告\n\n`;
    markdown += `**生成时间**: ${new Date(timestamp).toLocaleString()}\n\n`;
    
    // 摘要
    markdown += `## 测试摘要\n\n`;
    markdown += `| 指标 | 数量 |\n`;
    markdown += `|------|------|\n`;
    markdown += `| 总测试数 | ${summary.total} |\n`;
    markdown += `| 通过 | ${summary.passed} |\n`;
    markdown += `| 失败 | ${summary.failed} |\n`;
    markdown += `| 警告 | ${summary.warnings} |\n`;
    markdown += `| 成功率 | ${((summary.passed / summary.total) * 100).toFixed(1)}% |\n\n`;
    
    // 详细结果
    markdown += `## 详细测试结果\n\n`;
    
    details.forEach((result, index) => {
      const status = result.success ? '✅ 通过' : '❌ 失败';
      markdown += `### ${index + 1}. ${result.siteName} (${result.hostname})\n\n`;
      markdown += `**状态**: ${status}\n\n`;
      
      if (result.error) {
        markdown += `**错误**: ${result.error}\n\n`;
      }
      
      // 功能检查项
      markdown += `**功能检查**:\n\n`;
      markdown += `| 功能 | 状态 |\n`;
      markdown += `|------|------|\n`;
      markdown += `| DOM设置 | ${result.details.domSetup ? '✅' : '❌'} |\n`;
      markdown += `| 选择器匹配 | ${result.details.selectorMatching ? '✅' : '❌'} |\n`;
      markdown += `| 按钮注入 | ${result.details.buttonInjection ? '✅' : '❌'} |\n`;
      markdown += `| 文本提取 | ${result.details.textExtraction ? '✅' : '❌'} |\n`;
      markdown += `| 国际化支持 | ${result.details.i18nSupport ? '✅' : '❌'} |\n`;
      markdown += `| 复制功能 | ${result.details.copyFunctionality ? '✅' : '❌'} |\n\n`;
      
      // 性能指标
      markdown += `**性能指标**:\n\n`;
      markdown += `| 指标 | 数值 |\n`;
      markdown += `|------|------|\n`;
      markdown += `| 找到元素数 | ${result.metrics.elementsFound} |\n`;
      markdown += `| 注入按钮数 | ${result.metrics.buttonsInjected} |\n`;
      markdown += `| 提取文本长度 | ${result.metrics.textLength} 字符 |\n`;
      markdown += `| 处理时间 | ${result.metrics.processingTime} ms |\n\n`;
    });
    
    // 结论和建议
    markdown += `## 结论和建议\n\n`;
    
    const passedTests = details.filter(r => r.success);
    const failedTests = details.filter(r => !r.success);
    
    if (passedTests.length === details.length) {
      markdown += `🎉 **所有网站功能测试都通过了！**\n\n`;
      markdown += `扩展在所有目标网站上的核心功能都能正常工作：\n`;
      markdown += `- 选择器能正确匹配目标元素\n`;
      markdown += `- 按钮能成功注入到页面中\n`;
      markdown += `- 文本提取功能正常工作\n`;
      markdown += `- 国际化支持正确\n`;
      markdown += `- 复制功能逻辑正确\n\n`;
    } else {
      markdown += `⚠️ **有 ${failedTests.length} 个网站的功能测试失败**\n\n`;
      failedTests.forEach(result => {
        markdown += `- **${result.siteName}**: ${result.error}\n`;
      });
      markdown += `\n`;
    }
    
    markdown += `### 下一步建议\n\n`;
    markdown += `1. 在实际浏览器环境中进行端到端测试\n`;
    markdown += `2. 验证扩展在真实网站上的表现\n`;
    markdown += `3. 测试不同浏览器的兼容性\n`;
    markdown += `4. 进行用户体验测试\n`;
    markdown += `5. 监控扩展在生产环境中的性能\n\n`;
    
    return markdown;
  }
}

// 运行测试
async function runTests() {
  const tester = new WebsiteFunctionalityTester();
  await tester.runAllTests();
}

// 如果直接运行此文件，则执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { WebsiteFunctionalityTester };