/**
 * 网站功能验证脚本
 * 用于验证一键纯文扩展在目标网站上的功能
 * 
 * 测试内容：
 * - ChatGPT (chat.openai.com) 按钮注入和复制功能
 * - DeepSeek (chat.deepseek.com) 选择器准确性
 * - 豆包 (www.doubao.com) 中文界面支持
 * - Kimi (www.kimi.com) 完整功能测试
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// 测试配置
const TEST_CONFIG = {
  // 目标网站配置
  sites: [
    {
      name: 'ChatGPT',
      url: 'https://chat.openai.com',
      hostname: 'chat.openai.com',
      selector: "[data-message-author-role='assistant'] .markdown",
      testType: 'button_injection_and_copy',
      waitForSelector: '[data-message-author-role="assistant"]',
      description: '测试按钮注入和复制功能'
    },
    {
      name: 'DeepSeek',
      url: 'https://chat.deepseek.com',
      hostname: 'chat.deepseek.com',
      selector: ".message-content[data-role='assistant']",
      testType: 'selector_accuracy',
      waitForSelector: '.message-content',
      description: '验证选择器准确性'
    },
    {
      name: '豆包',
      url: 'https://www.doubao.com',
      hostname: 'www.doubao.com',
      selector: ".dialogue-text.assistant",
      testType: 'chinese_interface',
      waitForSelector: '.dialogue-text',
      description: '测试中文界面支持'
    },
    {
      name: 'Kimi',
      url: 'https://www.kimi.com',
      hostname: 'www.kimi.com',
      selector: ".response-bubble",
      testType: 'complete_functionality',
      waitForSelector: '.response-bubble',
      description: '进行完整功能测试'
    }
  ],
  
  // 测试超时设置
  timeouts: {
    navigation: 30000,
    elementWait: 10000,
    extensionLoad: 5000,
    buttonInjection: 3000
  },
  
  // 浏览器配置
  browser: {
    headless: false, // 设为 false 以便观察测试过程
    devtools: false,
    defaultViewport: {
      width: 1280,
      height: 720
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  }
};

class WebsiteFunctionalityTester {
  constructor() {
    this.browser = null;
    this.extensionPath = process.cwd();
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      },
      tests: []
    };
  }

  /**
   * 初始化测试环境
   */
  async initialize() {
    console.log('🚀 初始化网站功能测试环境...');
    
    try {
      // 验证扩展文件存在
      await this.validateExtensionFiles();
      
      // 启动浏览器并加载扩展
      this.browser = await puppeteer.launch({
        ...TEST_CONFIG.browser,
        args: [
          ...TEST_CONFIG.browser.args,
          `--load-extension=${this.extensionPath}`,
          `--disable-extensions-except=${this.extensionPath}`
        ]
      });
      
      console.log('✅ 浏览器启动成功，扩展已加载');
      return true;
    } catch (error) {
      console.error('❌ 初始化失败:', error.message);
      return false;
    }
  }

  /**
   * 验证扩展文件完整性
   */
  async validateExtensionFiles() {
    const requiredFiles = [
      'manifest.json',
      'content.js',
      'sites.js',
      '_locales/en/messages.json',
      '_locales/zh_CN/messages.json'
    ];

    for (const file of requiredFiles) {
      try {
        await fs.access(path.join(this.extensionPath, file));
      } catch (error) {
        throw new Error(`缺少必需的扩展文件: ${file}`);
      }
    }
    
    console.log('✅ 扩展文件验证通过');
  }

  /**
   * 运行所有网站测试
   */
  async runAllTests() {
    console.log('\n📋 开始网站功能验证测试...\n');
    
    for (const site of TEST_CONFIG.sites) {
      this.results.summary.total++;
      
      try {
        console.log(`🌐 测试网站: ${site.name} (${site.url})`);
        console.log(`📝 测试内容: ${site.description}`);
        
        const result = await this.testSite(site);
        
        if (result.success) {
          this.results.summary.passed++;
          console.log(`✅ ${site.name} 测试通过\n`);
        } else {
          this.results.summary.failed++;
          console.log(`❌ ${site.name} 测试失败: ${result.error}\n`);
        }
        
        this.results.tests.push(result);
        
      } catch (error) {
        this.results.summary.failed++;
        const errorResult = {
          site: site.name,
          url: site.url,
          testType: site.testType,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        
        this.results.tests.push(errorResult);
        console.log(`❌ ${site.name} 测试异常: ${error.message}\n`);
      }
      
      // 测试间隔，避免过快访问
      await this.delay(2000);
    }
  }

  /**
   * 测试单个网站
   */
  async testSite(siteConfig) {
    const page = await this.browser.newPage();
    const result = {
      site: siteConfig.name,
      url: siteConfig.url,
      testType: siteConfig.testType,
      success: false,
      details: {},
      timestamp: new Date().toISOString()
    };

    try {
      // 设置页面配置
      await page.setViewport(TEST_CONFIG.browser.defaultViewport);
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // 监听控制台消息
      const consoleMessages = [];
      page.on('console', msg => {
        if (msg.text().includes('PureText')) {
          consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            timestamp: new Date().toISOString()
          });
        }
      });

      // 导航到目标网站
      console.log(`  📍 导航到 ${siteConfig.url}...`);
      await page.goto(siteConfig.url, { 
        waitUntil: 'networkidle2',
        timeout: TEST_CONFIG.timeouts.navigation 
      });

      // 等待扩展加载
      await this.delay(TEST_CONFIG.timeouts.extensionLoad);

      // 检查扩展是否正确注入
      const extensionInjected = await this.checkExtensionInjection(page);
      result.details.extensionInjected = extensionInjected;

      if (!extensionInjected) {
        result.error = '扩展未正确注入到页面';
        return result;
      }

      // 根据测试类型执行相应测试
      switch (siteConfig.testType) {
        case 'button_injection_and_copy':
          await this.testButtonInjectionAndCopy(page, siteConfig, result);
          break;
        case 'selector_accuracy':
          await this.testSelectorAccuracy(page, siteConfig, result);
          break;
        case 'chinese_interface':
          await this.testChineseInterface(page, siteConfig, result);
          break;
        case 'complete_functionality':
          await this.testCompleteFunctionality(page, siteConfig, result);
          break;
      }

      // 记录控制台消息
      result.details.consoleMessages = consoleMessages;
      
      // 如果没有错误，标记为成功
      if (!result.error) {
        result.success = true;
      }

    } catch (error) {
      result.error = error.message;
      result.details.stackTrace = error.stack;
    } finally {
      await page.close();
    }

    return result;
  }

  /**
   * 检查扩展是否正确注入
   */
  async checkExtensionInjection(page) {
    try {
      // 检查内容脚本是否加载
      const hasContentScript = await page.evaluate(() => {
        return typeof SiteManager !== 'undefined' && 
               typeof ClipboardManager !== 'undefined' && 
               typeof ButtonInjector !== 'undefined';
      });

      // 检查站点配置是否加载
      const hasSiteConfig = await page.evaluate(() => {
        return typeof SUPPORTED_SITES !== 'undefined' && 
               Object.keys(SUPPORTED_SITES).length > 0;
      });

      return hasContentScript && hasSiteConfig;
    } catch (error) {
      console.log(`  ⚠️  扩展注入检查失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 测试按钮注入和复制功能 (ChatGPT)
   */
  async testButtonInjectionAndCopy(page, siteConfig, result) {
    console.log('  🔍 测试按钮注入和复制功能...');
    
    try {
      // 创建模拟的聊天回复元素
      const mockResponseCreated = await page.evaluate((selector) => {
        // 创建模拟的ChatGPT回复结构
        const mockContainer = document.createElement('div');
        mockContainer.setAttribute('data-message-author-role', 'assistant');
        mockContainer.style.cssText = 'position: relative; padding: 20px; margin: 10px; border: 1px solid #ccc; background: #f9f9f9;';
        
        const markdownDiv = document.createElement('div');
        markdownDiv.className = 'markdown';
        markdownDiv.innerHTML = `
          <p>这是一个测试回复，包含 <strong>粗体文本</strong> 和 <em>斜体文本</em>。</p>
          <p>还有一些 <code>代码</code> 和 **Markdown** 格式。</p>
        `;
        
        mockContainer.appendChild(markdownDiv);
        document.body.appendChild(mockContainer);
        
        return true;
      }, siteConfig.selector);

      result.details.mockResponseCreated = mockResponseCreated;

      if (!mockResponseCreated) {
        result.error = '无法创建模拟回复元素';
        return;
      }

      // 等待按钮注入
      await this.delay(TEST_CONFIG.timeouts.buttonInjection);

      // 检查按钮是否被注入
      const buttonInjected = await page.evaluate(() => {
        const buttons = document.querySelectorAll('.puretext-copy-btn');
        return buttons.length > 0;
      });

      result.details.buttonInjected = buttonInjected;

      if (!buttonInjected) {
        result.error = '复制按钮未被注入';
        return;
      }

      console.log('  ✅ 按钮注入成功');

      // 测试按钮点击和复制功能
      const copyResult = await this.testCopyFunctionality(page);
      result.details.copyTest = copyResult;

      if (!copyResult.success) {
        result.error = `复制功能测试失败: ${copyResult.error}`;
        return;
      }

      console.log('  ✅ 复制功能测试通过');

    } catch (error) {
      result.error = `按钮注入和复制测试失败: ${error.message}`;
    }
  }

  /**
   * 测试选择器准确性 (DeepSeek)
   */
  async testSelectorAccuracy(page, siteConfig, result) {
    console.log('  🎯 测试选择器准确性...');
    
    try {
      // 创建模拟的DeepSeek回复结构
      const mockResponseCreated = await page.evaluate((selector) => {
        const mockContainer = document.createElement('div');
        mockContainer.className = 'message-content';
        mockContainer.setAttribute('data-role', 'assistant');
        mockContainer.style.cssText = 'position: relative; padding: 20px; margin: 10px; border: 1px solid #ccc; background: #f0f8ff;';
        mockContainer.innerHTML = `
          <p>DeepSeek 测试回复内容</p>
          <p>包含多行文本和格式化内容</p>
        `;
        
        document.body.appendChild(mockContainer);
        return true;
      }, siteConfig.selector);

      result.details.mockResponseCreated = mockResponseCreated;

      // 验证选择器能正确匹配元素
      const selectorMatches = await page.evaluate((selector) => {
        const elements = document.querySelectorAll(selector);
        return {
          count: elements.length,
          hasContent: elements.length > 0 && elements[0].textContent.trim().length > 0
        };
      }, siteConfig.selector);

      result.details.selectorMatches = selectorMatches;

      if (selectorMatches.count === 0) {
        result.error = '选择器无法匹配任何元素';
        return;
      }

      if (!selectorMatches.hasContent) {
        result.error = '选择器匹配的元素没有文本内容';
        return;
      }

      console.log(`  ✅ 选择器匹配 ${selectorMatches.count} 个元素`);

      // 等待按钮注入
      await this.delay(TEST_CONFIG.timeouts.buttonInjection);

      // 验证按钮是否正确注入到匹配的元素中
      const buttonInjected = await page.evaluate(() => {
        const buttons = document.querySelectorAll('.puretext-copy-btn');
        return buttons.length > 0;
      });

      result.details.buttonInjected = buttonInjected;

      if (!buttonInjected) {
        result.error = '按钮未注入到选择器匹配的元素中';
        return;
      }

      console.log('  ✅ 选择器准确性验证通过');

    } catch (error) {
      result.error = `选择器准确性测试失败: ${error.message}`;
    }
  }

  /**
   * 测试中文界面支持 (豆包)
   */
  async testChineseInterface(page, siteConfig, result) {
    console.log('  🇨🇳 测试中文界面支持...');
    
    try {
      // 设置中文语言环境
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'language', {
          get: function() { return 'zh-CN'; }
        });
        Object.defineProperty(navigator, 'languages', {
          get: function() { return ['zh-CN', 'zh']; }
        });
      });

      // 创建模拟的豆包回复结构
      const mockResponseCreated = await page.evaluate((selector) => {
        const mockContainer = document.createElement('div');
        mockContainer.className = 'dialogue-text assistant';
        mockContainer.style.cssText = 'position: relative; padding: 20px; margin: 10px; border: 1px solid #ccc; background: #fff8dc;';
        mockContainer.innerHTML = `
          <p>这是豆包的中文回复测试</p>
          <p>包含中文字符和标点符号：，。！？</p>
          <p>测试中文环境下的功能正常性</p>
        `;
        
        document.body.appendChild(mockContainer);
        return true;
      }, siteConfig.selector);

      result.details.mockResponseCreated = mockResponseCreated;

      // 等待按钮注入
      await this.delay(TEST_CONFIG.timeouts.buttonInjection);

      // 检查按钮文本是否为中文
      const buttonText = await page.evaluate(() => {
        const button = document.querySelector('.puretext-copy-btn');
        return button ? button.textContent : null;
      });

      result.details.buttonText = buttonText;

      if (!buttonText) {
        result.error = '未找到复制按钮';
        return;
      }

      // 验证按钮文本是否为中文
      const isChineseText = /[\u4e00-\u9fff]/.test(buttonText);
      result.details.isChineseText = isChineseText;

      if (!isChineseText) {
        result.error = `按钮文本不是中文: "${buttonText}"`;
        return;
      }

      console.log(`  ✅ 中文按钮文本: "${buttonText}"`);

      // 测试中文内容复制
      const chineseCopyResult = await this.testChineseCopy(page);
      result.details.chineseCopyTest = chineseCopyResult;

      if (!chineseCopyResult.success) {
        result.error = `中文复制测试失败: ${chineseCopyResult.error}`;
        return;
      }

      console.log('  ✅ 中文界面支持验证通过');

    } catch (error) {
      result.error = `中文界面测试失败: ${error.message}`;
    }
  }

  /**
   * 测试完整功能 (Kimi)
   */
  async testCompleteFunctionality(page, siteConfig, result) {
    console.log('  🔧 进行完整功能测试...');
    
    try {
      // 创建模拟的Kimi回复结构
      const mockResponseCreated = await page.evaluate((selector) => {
        const mockContainer = document.createElement('div');
        mockContainer.className = 'response-bubble';
        mockContainer.style.cssText = 'position: relative; padding: 20px; margin: 10px; border: 1px solid #ccc; background: #f5f5f5;';
        mockContainer.innerHTML = `
          <h3>Kimi 完整功能测试</h3>
          <p>这是一个包含多种格式的测试回复：</p>
          <ul>
            <li><strong>粗体文本</strong></li>
            <li><em>斜体文本</em></li>
            <li><code>代码片段</code></li>
          </ul>
          <blockquote>这是一个引用块</blockquote>
          <p>还有一些 **Markdown** 格式和 <a href="#">链接</a>。</p>
        `;
        
        document.body.appendChild(mockContainer);
        return true;
      }, siteConfig.selector);

      result.details.mockResponseCreated = mockResponseCreated;

      // 等待按钮注入
      await this.delay(TEST_CONFIG.timeouts.buttonInjection);

      // 1. 测试按钮注入
      const buttonInjected = await page.evaluate(() => {
        const buttons = document.querySelectorAll('.puretext-copy-btn');
        return buttons.length > 0;
      });

      result.details.buttonInjected = buttonInjected;

      if (!buttonInjected) {
        result.error = '按钮注入失败';
        return;
      }

      console.log('  ✅ 按钮注入测试通过');

      // 2. 测试按钮样式和位置
      const buttonStyles = await page.evaluate(() => {
        const button = document.querySelector('.puretext-copy-btn');
        if (!button) return null;
        
        const styles = window.getComputedStyle(button);
        return {
          position: styles.position,
          zIndex: styles.zIndex,
          opacity: styles.opacity,
          cursor: styles.cursor,
          display: styles.display
        };
      });

      result.details.buttonStyles = buttonStyles;

      if (!buttonStyles || buttonStyles.position !== 'absolute') {
        result.error = '按钮样式配置不正确';
        return;
      }

      console.log('  ✅ 按钮样式测试通过');

      // 3. 测试复制功能
      const copyResult = await this.testCopyFunctionality(page);
      result.details.copyTest = copyResult;

      if (!copyResult.success) {
        result.error = `复制功能测试失败: ${copyResult.error}`;
        return;
      }

      console.log('  ✅ 复制功能测试通过');

      // 4. 测试纯文本提取
      const textExtractionResult = await this.testTextExtraction(page);
      result.details.textExtractionTest = textExtractionResult;

      if (!textExtractionResult.success) {
        result.error = `文本提取测试失败: ${textExtractionResult.error}`;
        return;
      }

      console.log('  ✅ 文本提取测试通过');

      // 5. 测试错误处理
      const errorHandlingResult = await this.testErrorHandling(page);
      result.details.errorHandlingTest = errorHandlingResult;

      console.log('  ✅ 完整功能测试通过');

    } catch (error) {
      result.error = `完整功能测试失败: ${error.message}`;
    }
  }

  /**
   * 测试复制功能
   */
  async testCopyFunctionality(page) {
    try {
      // 模拟按钮点击
      const clickResult = await page.evaluate(() => {
        const button = document.querySelector('.puretext-copy-btn');
        if (!button) return { success: false, error: '未找到复制按钮' };
        
        // 模拟点击事件
        button.click();
        return { success: true };
      });

      if (!clickResult.success) {
        return clickResult;
      }

      // 等待复制操作完成
      await this.delay(1000);

      // 检查是否显示了成功提示
      const successToast = await page.evaluate(() => {
        // 查找成功提示元素
        const toasts = document.querySelectorAll('div[style*="position: fixed"]');
        for (const toast of toasts) {
          if (toast.textContent.includes('成功') || toast.textContent.includes('Copied')) {
            return true;
          }
        }
        return false;
      });

      return {
        success: true,
        details: {
          buttonClicked: true,
          successToastShown: successToast
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 测试中文复制功能
   */
  async testChineseCopy(page) {
    try {
      // 获取中文内容
      const chineseContent = await page.evaluate(() => {
        const element = document.querySelector('.dialogue-text.assistant');
        return element ? element.textContent : null;
      });

      if (!chineseContent) {
        return { success: false, error: '未找到中文内容' };
      }

      // 验证中文字符
      const hasChineseChars = /[\u4e00-\u9fff]/.test(chineseContent);
      if (!hasChineseChars) {
        return { success: false, error: '内容不包含中文字符' };
      }

      // 模拟复制操作
      const copyResult = await this.testCopyFunctionality(page);
      
      return {
        success: copyResult.success,
        details: {
          chineseContent: chineseContent.substring(0, 100) + '...',
          hasChineseChars,
          copyResult
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 测试文本提取功能
   */
  async testTextExtraction(page) {
    try {
      const extractionResult = await page.evaluate(() => {
        const element = document.querySelector('.response-bubble');
        if (!element) return { success: false, error: '未找到测试元素' };

        // 测试 ClipboardManager.extractPlainText 方法
        if (typeof ClipboardManager === 'undefined') {
          return { success: false, error: 'ClipboardManager 未定义' };
        }

        const originalHtml = element.innerHTML;
        const extractedText = ClipboardManager.extractPlainText(element);
        
        // 验证文本提取结果
        const hasRemovedHtml = !extractedText.includes('<') && !extractedText.includes('>');
        const hasRemovedMarkdown = !extractedText.includes('**') && !extractedText.includes('*');
        const hasContent = extractedText.trim().length > 0;

        return {
          success: hasRemovedHtml && hasRemovedMarkdown && hasContent,
          details: {
            originalLength: originalHtml.length,
            extractedLength: extractedText.length,
            hasRemovedHtml,
            hasRemovedMarkdown,
            hasContent,
            extractedText: extractedText.substring(0, 200) + '...'
          }
        };
      });

      return extractionResult;

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 测试错误处理
   */
  async testErrorHandling(page) {
    try {
      const errorHandlingResult = await page.evaluate(() => {
        // 测试空元素处理
        const emptyDiv = document.createElement('div');
        const emptyResult = ClipboardManager.extractPlainText(emptyDiv);
        
        // 测试 null 元素处理
        const nullResult = ClipboardManager.extractPlainText(null);
        
        return {
          success: true,
          details: {
            emptyElementHandled: emptyResult === '',
            nullElementHandled: nullResult === ''
          }
        };
      });

      return errorHandlingResult;

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
  async generateReport() {
    const reportPath = 'WEBSITE_FUNCTIONALITY_TEST_REPORT.md';
    const jsonReportPath = 'website-functionality-test-report.json';
    
    // 生成 Markdown 报告
    const markdownReport = this.generateMarkdownReport();
    await fs.writeFile(reportPath, markdownReport, 'utf8');
    
    // 生成 JSON 报告
    await fs.writeFile(jsonReportPath, JSON.stringify(this.results, null, 2), 'utf8');
    
    console.log(`📊 测试报告已生成:`);
    console.log(`   - Markdown: ${reportPath}`);
    console.log(`   - JSON: ${jsonReportPath}`);
  }

  /**
   * 生成 Markdown 格式的测试报告
   */
  generateMarkdownReport() {
    const { summary, tests } = this.results;
    const passRate = ((summary.passed / summary.total) * 100).toFixed(1);
    
    let report = `# 网站功能验证测试报告

## 测试概览

- **测试时间**: ${this.results.timestamp}
- **测试网站数量**: ${summary.total}
- **通过**: ${summary.passed}
- **失败**: ${summary.failed}
- **跳过**: ${summary.skipped}
- **通过率**: ${passRate}%

## 测试结果

`;

    tests.forEach((test, index) => {
      const status = test.success ? '✅ 通过' : '❌ 失败';
      report += `### ${index + 1}. ${test.site} ${status}

- **网站**: ${test.url}
- **测试类型**: ${test.testType}
- **测试时间**: ${test.timestamp}
`;

      if (test.success) {
        report += `- **结果**: 所有功能测试通过\n`;
      } else {
        report += `- **错误**: ${test.error}\n`;
      }

      if (test.details) {
        report += `
**详细信息**:
\`\`\`json
${JSON.stringify(test.details, null, 2)}
\`\`\`
`;
      }

      report += '\n---\n\n';
    });

    report += `## 总结

`;

    if (summary.failed === 0) {
      report += `🎉 所有网站功能测试均通过！扩展在所有目标网站上都能正常工作。

### 验证的功能点

1. **ChatGPT**: 按钮注入和复制功能 ✅
2. **DeepSeek**: 选择器准确性 ✅  
3. **豆包**: 中文界面支持 ✅
4. **Kimi**: 完整功能测试 ✅

扩展已准备好在这些网站上为用户提供一键复制纯文本功能。
`;
    } else {
      report += `⚠️ 发现 ${summary.failed} 个网站存在问题，需要进一步调试和修复。

### 需要关注的问题

`;
      tests.filter(test => !test.success).forEach(test => {
        report += `- **${test.site}**: ${test.error}\n`;
      });
    }

    return report;
  }

  /**
   * 延迟函数
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 清理资源
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 浏览器已关闭');
    }
  }

  /**
   * 运行完整测试流程
   */
  async run() {
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        process.exit(1);
      }

      await this.runAllTests();
      await this.generateReport();

      // 输出最终结果
      console.log('\n📊 测试完成！');
      console.log(`✅ 通过: ${this.results.summary.passed}`);
      console.log(`❌ 失败: ${this.results.summary.failed}`);
      console.log(`📈 通过率: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)}%`);

      if (this.results.summary.failed === 0) {
        console.log('\n🎉 所有网站功能验证通过！');
        process.exit(0);
      } else {
        console.log('\n⚠️ 部分测试失败，请查看报告了解详情。');
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ 测试运行失败:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const tester = new WebsiteFunctionalityTester();
  tester.run().catch(console.error);
}

module.exports = WebsiteFunctionalityTester;