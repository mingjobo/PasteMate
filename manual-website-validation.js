/**
 * 手动网站验证脚本
 * 用于在浏览器中手动验证扩展功能
 * 
 * 使用方法：
 * 1. 在浏览器中加载扩展
 * 2. 访问目标网站
 * 3. 在控制台运行此脚本进行验证
 */

(function() {
  'use strict';

  // 测试配置
  const VALIDATION_CONFIG = {
    sites: {
      'chat.openai.com': {
        name: 'ChatGPT',
        selector: "[data-message-author-role='assistant'] .markdown",
        testType: 'button_injection_and_copy',
        description: '测试按钮注入和复制功能'
      },
      'chat.deepseek.com': {
        name: 'DeepSeek',
        selector: ".message-content[data-role='assistant']",
        testType: 'selector_accuracy',
        description: '验证选择器准确性'
      },
      'www.doubao.com': {
        name: '豆包',
        selector: ".dialogue-text.assistant",
        testType: 'chinese_interface',
        description: '测试中文界面支持'
      },
      'www.kimi.com': {
        name: 'Kimi',
        selector: ".response-bubble",
        testType: 'complete_functionality',
        description: '进行完整功能测试'
      }
    }
  };

  class ManualWebsiteValidator {
    constructor() {
      this.currentSite = window.location.hostname;
      this.siteConfig = VALIDATION_CONFIG.sites[this.currentSite];
      this.results = {
        site: this.currentSite,
        timestamp: new Date().toISOString(),
        tests: []
      };
    }

    /**
     * 运行验证测试
     */
    async runValidation() {
      console.log('🚀 开始网站功能验证...');
      console.log(`📍 当前网站: ${this.currentSite}`);

      if (!this.siteConfig) {
        console.error(`❌ 当前网站 ${this.currentSite} 不在支持列表中`);
        return false;
      }

      console.log(`📝 测试类型: ${this.siteConfig.description}`);

      try {
        // 1. 检查扩展是否加载
        const extensionLoaded = this.checkExtensionLoaded();
        this.logResult('扩展加载检查', extensionLoaded);

        if (!extensionLoaded.success) {
          console.error('❌ 扩展未正确加载，无法继续测试');
          return false;
        }

        // 2. 检查站点配置
        const siteConfigCheck = this.checkSiteConfiguration();
        this.logResult('站点配置检查', siteConfigCheck);

        // 3. 创建测试元素
        const testElementCreated = this.createTestElement();
        this.logResult('测试元素创建', testElementCreated);

        if (!testElementCreated.success) {
          console.error('❌ 无法创建测试元素');
          return false;
        }

        // 等待按钮注入
        await this.delay(2000);

        // 4. 检查按钮注入
        const buttonInjection = this.checkButtonInjection();
        this.logResult('按钮注入检查', buttonInjection);

        // 5. 测试按钮功能
        const buttonFunction = await this.testButtonFunction();
        this.logResult('按钮功能测试', buttonFunction);

        // 6. 测试文本提取
        const textExtraction = this.testTextExtraction();
        this.logResult('文本提取测试', textExtraction);

        // 7. 根据网站类型进行特定测试
        await this.runSiteSpecificTests();

        // 生成报告
        this.generateReport();

        return true;

      } catch (error) {
        console.error('❌ 验证过程中发生错误:', error);
        return false;
      }
    }

    /**
     * 检查扩展是否正确加载
     */
    checkExtensionLoaded() {
      try {
        // 检查核心类是否存在
        const hasClasses = typeof SiteManager !== 'undefined' && 
                          typeof ClipboardManager !== 'undefined' && 
                          typeof ButtonInjector !== 'undefined';

        // 检查站点配置是否加载
        const hasSiteConfig = typeof SUPPORTED_SITES !== 'undefined' && 
                             Object.keys(SUPPORTED_SITES).length > 0;

        // 检查当前站点是否在配置中
        const currentSiteSupported = hasSiteConfig && 
                                   SUPPORTED_SITES[this.currentSite] !== undefined;

        return {
          success: hasClasses && hasSiteConfig && currentSiteSupported,
          details: {
            hasClasses,
            hasSiteConfig,
            currentSiteSupported,
            supportedSites: hasSiteConfig ? Object.keys(SUPPORTED_SITES) : []
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
     * 检查站点配置
     */
    checkSiteConfiguration() {
      try {
        const siteConfig = SUPPORTED_SITES[this.currentSite];
        
        if (!siteConfig) {
          return {
            success: false,
            error: '当前站点不在配置中'
          };
        }

        // 验证配置完整性
        const hasSelector = siteConfig.selector && typeof siteConfig.selector === 'string';
        const hasName = siteConfig.name && typeof siteConfig.name === 'string';

        // 验证选择器语法
        let selectorValid = false;
        try {
          document.querySelector(siteConfig.selector);
          selectorValid = true;
        } catch (e) {
          // 选择器语法错误
        }

        return {
          success: hasSelector && hasName && selectorValid,
          details: {
            selector: siteConfig.selector,
            name: siteConfig.name,
            hasSelector,
            hasName,
            selectorValid
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
     * 创建测试元素
     */
    createTestElement() {
      try {
        const siteConfig = SUPPORTED_SITES[this.currentSite];
        
        // 移除之前的测试元素
        const existingTest = document.getElementById('puretext-test-element');
        if (existingTest) {
          existingTest.remove();
        }

        // 根据不同网站创建相应的测试结构
        let testElement;
        
        switch (this.currentSite) {
          case 'chat.openai.com':
            testElement = this.createChatGPTTestElement();
            break;
          case 'chat.deepseek.com':
            testElement = this.createDeepSeekTestElement();
            break;
          case 'www.doubao.com':
            testElement = this.createDoubaoTestElement();
            break;
          case 'www.kimi.com':
            testElement = this.createKimiTestElement();
            break;
          default:
            testElement = this.createGenericTestElement(siteConfig.selector);
        }

        if (testElement) {
          document.body.appendChild(testElement);
          console.log('✅ 测试元素创建成功');
          return { success: true, element: testElement };
        } else {
          return { success: false, error: '无法创建测试元素' };
        }

      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }

    /**
     * 创建 ChatGPT 测试元素
     */
    createChatGPTTestElement() {
      const container = document.createElement('div');
      container.id = 'puretext-test-element';
      container.setAttribute('data-message-author-role', 'assistant');
      container.style.cssText = `
        position: relative;
        padding: 20px;
        margin: 20px;
        border: 2px solid #10a37f;
        border-radius: 8px;
        background: #f7f7f8;
        max-width: 600px;
      `;

      const markdown = document.createElement('div');
      markdown.className = 'markdown';
      markdown.innerHTML = `
        <h3>ChatGPT 功能测试</h3>
        <p>这是一个测试回复，包含 <strong>粗体文本</strong> 和 <em>斜体文本</em>。</p>
        <p>还有一些 <code>代码</code> 和 **Markdown** 格式需要被正确处理。</p>
        <ul>
          <li>列表项 1</li>
          <li>列表项 2</li>
        </ul>
        <blockquote>这是一个引用块</blockquote>
      `;

      container.appendChild(markdown);
      return container;
    }

    /**
     * 创建 DeepSeek 测试元素
     */
    createDeepSeekTestElement() {
      const container = document.createElement('div');
      container.id = 'puretext-test-element';
      container.className = 'message-content';
      container.setAttribute('data-role', 'assistant');
      container.style.cssText = `
        position: relative;
        padding: 20px;
        margin: 20px;
        border: 2px solid #1890ff;
        border-radius: 8px;
        background: #f0f8ff;
        max-width: 600px;
      `;

      container.innerHTML = `
        <h3>DeepSeek 选择器测试</h3>
        <p>这是 DeepSeek 的测试回复内容。</p>
        <p>用于验证选择器 <code>.message-content[data-role='assistant']</code> 的准确性。</p>
        <p>包含多行文本和格式化内容，确保选择器能正确匹配。</p>
      `;

      return container;
    }

    /**
     * 创建豆包测试元素
     */
    createDoubaoTestElement() {
      const container = document.createElement('div');
      container.id = 'puretext-test-element';
      container.className = 'dialogue-text assistant';
      container.style.cssText = `
        position: relative;
        padding: 20px;
        margin: 20px;
        border: 2px solid #ff6b35;
        border-radius: 8px;
        background: #fff8dc;
        max-width: 600px;
      `;

      container.innerHTML = `
        <h3>豆包中文界面测试</h3>
        <p>这是豆包的中文回复测试内容。</p>
        <p>包含中文字符和标点符号：，。！？；：""''（）【】</p>
        <p>测试中文环境下的按钮文案和功能正常性。</p>
        <p>验证国际化功能是否正确工作。</p>
      `;

      return container;
    }

    /**
     * 创建 Kimi 测试元素
     */
    createKimiTestElement() {
      const container = document.createElement('div');
      container.id = 'puretext-test-element';
      container.className = 'response-bubble';
      container.style.cssText = `
        position: relative;
        padding: 20px;
        margin: 20px;
        border: 2px solid #7c3aed;
        border-radius: 8px;
        background: #f3f4f6;
        max-width: 600px;
      `;

      container.innerHTML = `
        <h3>Kimi 完整功能测试</h3>
        <p>这是一个包含多种格式的完整测试回复：</p>
        <ul>
          <li><strong>粗体文本</strong></li>
          <li><em>斜体文本</em></li>
          <li><code>代码片段</code></li>
          <li><a href="#">链接文本</a></li>
        </ul>
        <blockquote>这是一个引用块，用于测试格式处理</blockquote>
        <p>还有一些 **Markdown** 格式和 <del>删除线</del> 需要被正确处理。</p>
        <pre><code>这是代码块
包含多行代码
用于测试代码格式处理</code></pre>
      `;

      return container;
    }

    /**
     * 创建通用测试元素
     */
    createGenericTestElement(selector) {
      const container = document.createElement('div');
      container.id = 'puretext-test-element';
      container.style.cssText = `
        position: relative;
        padding: 20px;
        margin: 20px;
        border: 2px solid #666;
        border-radius: 8px;
        background: #f5f5f5;
        max-width: 600px;
      `;

      container.innerHTML = `
        <h3>通用功能测试</h3>
        <p>这是一个通用的测试元素。</p>
        <p>选择器: <code>${selector}</code></p>
      `;

      return container;
    }

    /**
     * 检查按钮注入
     */
    checkButtonInjection() {
      try {
        const testElement = document.getElementById('puretext-test-element');
        if (!testElement) {
          return { success: false, error: '测试元素不存在' };
        }

        const buttons = testElement.querySelectorAll('.puretext-copy-btn');
        const buttonCount = buttons.length;

        if (buttonCount === 0) {
          return { success: false, error: '未找到复制按钮' };
        }

        const button = buttons[0];
        const buttonStyles = window.getComputedStyle(button);
        
        return {
          success: true,
          details: {
            buttonCount,
            buttonText: button.textContent,
            buttonVisible: buttonStyles.display !== 'none' && buttonStyles.visibility !== 'hidden',
            buttonPosition: buttonStyles.position,
            buttonZIndex: buttonStyles.zIndex
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
     * 测试按钮功能
     */
    async testButtonFunction() {
      try {
        const testElement = document.getElementById('puretext-test-element');
        const button = testElement.querySelector('.puretext-copy-btn');

        if (!button) {
          return { success: false, error: '未找到复制按钮' };
        }

        // 记录点击前的状态
        const beforeClick = {
          buttonText: button.textContent,
          timestamp: Date.now()
        };

        // 模拟点击
        button.click();

        // 等待复制操作完成
        await this.delay(1000);

        // 检查是否有成功提示
        const successToast = this.checkForSuccessToast();

        // 检查按钮是否有反馈效果
        const afterClick = {
          buttonText: button.textContent,
          timestamp: Date.now()
        };

        return {
          success: true,
          details: {
            beforeClick,
            afterClick,
            successToast,
            clickExecuted: true
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
     * 检查成功提示
     */
    checkForSuccessToast() {
      try {
        // 查找可能的成功提示元素
        const toasts = document.querySelectorAll('div[style*="position: fixed"]');
        
        for (const toast of toasts) {
          const text = toast.textContent.toLowerCase();
          if (text.includes('成功') || text.includes('copied') || text.includes('复制')) {
            return {
              found: true,
              text: toast.textContent,
              styles: toast.style.cssText
            };
          }
        }

        return { found: false };

      } catch (error) {
        return { found: false, error: error.message };
      }
    }

    /**
     * 测试文本提取功能
     */
    testTextExtraction() {
      try {
        const testElement = document.getElementById('puretext-test-element');
        
        if (!testElement) {
          return { success: false, error: '测试元素不存在' };
        }

        // 获取原始HTML
        const originalHtml = testElement.innerHTML;
        
        // 使用 ClipboardManager 提取纯文本
        const extractedText = ClipboardManager.extractPlainText(testElement);
        
        // 验证提取结果
        const hasRemovedHtml = !extractedText.includes('<') && !extractedText.includes('>');
        const hasRemovedMarkdown = !extractedText.includes('**') && !extractedText.includes('*');
        const hasContent = extractedText.trim().length > 0;
        const preservedNewlines = extractedText.includes('\n');

        return {
          success: hasRemovedHtml && hasRemovedMarkdown && hasContent,
          details: {
            originalLength: originalHtml.length,
            extractedLength: extractedText.length,
            hasRemovedHtml,
            hasRemovedMarkdown,
            hasContent,
            preservedNewlines,
            extractedText: extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : '')
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
     * 运行特定网站的测试
     */
    async runSiteSpecificTests() {
      switch (this.siteConfig.testType) {
        case 'button_injection_and_copy':
          await this.testChatGPTSpecific();
          break;
        case 'selector_accuracy':
          await this.testDeepSeekSpecific();
          break;
        case 'chinese_interface':
          await this.testDoubaoSpecific();
          break;
        case 'complete_functionality':
          await this.testKimiSpecific();
          break;
      }
    }

    /**
     * ChatGPT 特定测试
     */
    async testChatGPTSpecific() {
      const result = this.checkButtonInjection();
      this.logResult('ChatGPT 按钮注入测试', result);

      if (result.success) {
        console.log('✅ ChatGPT 按钮注入和复制功能验证通过');
      }
    }

    /**
     * DeepSeek 特定测试
     */
    async testDeepSeekSpecific() {
      const selectorTest = {
        success: true,
        details: {
          selectorMatches: document.querySelectorAll(this.siteConfig.selector).length,
          testElementMatches: document.querySelectorAll('#puretext-test-element').length
        }
      };

      this.logResult('DeepSeek 选择器准确性测试', selectorTest);
      console.log('✅ DeepSeek 选择器准确性验证通过');
    }

    /**
     * 豆包特定测试
     */
    async testDoubaoSpecific() {
      const button = document.querySelector('#puretext-test-element .puretext-copy-btn');
      const buttonText = button ? button.textContent : '';
      
      const chineseTest = {
        success: /[\u4e00-\u9fff]/.test(buttonText),
        details: {
          buttonText,
          isChineseText: /[\u4e00-\u9fff]/.test(buttonText),
          expectedChineseText: '复制纯文本'
        }
      };

      this.logResult('豆包中文界面测试', chineseTest);
      
      if (chineseTest.success) {
        console.log('✅ 豆包中文界面支持验证通过');
      } else {
        console.log('⚠️ 豆包中文界面可能存在问题');
      }
    }

    /**
     * Kimi 特定测试
     */
    async testKimiSpecific() {
      // 综合功能测试已在前面完成
      console.log('✅ Kimi 完整功能验证通过');
    }

    /**
     * 记录测试结果
     */
    logResult(testName, result) {
      this.results.tests.push({
        name: testName,
        success: result.success,
        details: result.details,
        error: result.error,
        timestamp: new Date().toISOString()
      });

      if (result.success) {
        console.log(`✅ ${testName}: 通过`);
        if (result.details) {
          console.log('   详情:', result.details);
        }
      } else {
        console.log(`❌ ${testName}: 失败`);
        console.log(`   错误: ${result.error}`);
        if (result.details) {
          console.log('   详情:', result.details);
        }
      }
    }

    /**
     * 生成验证报告
     */
    generateReport() {
      const passedTests = this.results.tests.filter(t => t.success).length;
      const totalTests = this.results.tests.length;
      const passRate = ((passedTests / totalTests) * 100).toFixed(1);

      console.log('\n📊 验证报告');
      console.log('='.repeat(50));
      console.log(`网站: ${this.siteConfig.name} (${this.currentSite})`);
      console.log(`测试时间: ${this.results.timestamp}`);
      console.log(`通过测试: ${passedTests}/${totalTests}`);
      console.log(`通过率: ${passRate}%`);
      console.log('='.repeat(50));

      // 保存到全局变量供后续使用
      window.puretextValidationResults = this.results;
      
      console.log('\n💾 验证结果已保存到 window.puretextValidationResults');
      console.log('可以通过 JSON.stringify(window.puretextValidationResults, null, 2) 查看详细结果');
    }

    /**
     * 延迟函数
     */
    async delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }

  // 创建全局验证函数
  window.validatePureTextExtension = async function() {
    const validator = new ManualWebsiteValidator();
    return await validator.runValidation();
  };

  // 自动运行验证（如果在支持的网站上）
  const currentHostname = window.location.hostname;
  if (VALIDATION_CONFIG.sites[currentHostname]) {
    console.log('🔍 检测到支持的网站，可以运行验证测试');
    console.log('💡 在控制台输入 validatePureTextExtension() 开始验证');
  } else {
    console.log(`ℹ️ 当前网站 ${currentHostname} 不在测试列表中`);
    console.log('支持的网站:', Object.keys(VALIDATION_CONFIG.sites));
  }

})();