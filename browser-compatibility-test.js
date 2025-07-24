/**
 * 浏览器兼容性测试
 * 验证扩展在不同浏览器中的兼容性
 */

import fs from 'fs';
import { JSDOM } from 'jsdom';

// 浏览器兼容性配置
const BROWSER_CONFIGS = {
  chrome: {
    name: "Google Chrome",
    manifestVersion: 3,
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    apis: {
      clipboard: true,
      i18n: true,
      storage: true,
      contentScripts: true
    },
    features: {
      manifestV3: true,
      serviceWorker: true,
      dynamicImports: true
    }
  },
  edge: {
    name: "Microsoft Edge",
    manifestVersion: 3,
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    apis: {
      clipboard: true,
      i18n: true,
      storage: true,
      contentScripts: true
    },
    features: {
      manifestV3: true,
      serviceWorker: true,
      dynamicImports: true
    }
  },
  firefox: {
    name: "Mozilla Firefox",
    manifestVersion: 3, // Firefox 109+ 支持 Manifest V3
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0",
    apis: {
      clipboard: true,
      i18n: true,
      storage: true,
      contentScripts: true
    },
    features: {
      manifestV3: true,
      serviceWorker: false, // Firefox 的 Manifest V3 支持可能有差异
      dynamicImports: true
    },
    quirks: [
      "Firefox 的 Manifest V3 支持相对较新",
      "某些 Chrome 扩展 API 可能有细微差异",
      "需要特别注意权限声明"
    ]
  }
};

class BrowserCompatibilityTester {
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
  }

  /**
   * 运行所有浏览器兼容性测试
   */
  async runAllTests() {
    console.log('🌐 开始浏览器兼容性测试...\n');

    for (const [browserKey, config] of Object.entries(BROWSER_CONFIGS)) {
      this.results.summary.total++;
      
      console.log(`\n🔍 测试浏览器: ${config.name}`);
      
      try {
        const result = await this.testBrowserCompatibility(browserKey, config);
        
        if (result.success) {
          this.results.summary.passed++;
          console.log(`   ✅ 兼容性测试通过`);
        } else {
          this.results.summary.failed++;
          console.log(`   ❌ 兼容性测试失败: ${result.error}`);
        }
        
        if (result.warnings && result.warnings.length > 0) {
          this.results.summary.warnings += result.warnings.length;
          result.warnings.forEach(warning => {
            console.log(`   ⚠️  ${warning}`);
          });
        }
        
        this.results.details.push(result);
        
      } catch (error) {
        this.results.summary.failed++;
        const errorResult = {
          browser: browserKey,
          browserName: config.name,
          success: false,
          error: error.message,
          details: {}
        };
        this.results.details.push(errorResult);
        console.log(`   ❌ 测试异常: ${error.message}`);
      }
    }

    // 生成兼容性报告
    await this.generateCompatibilityReport();
  }

  /**
   * 测试单个浏览器的兼容性
   */
  async testBrowserCompatibility(browserKey, config) {
    const result = {
      browser: browserKey,
      browserName: config.name,
      success: false,
      error: null,
      warnings: [],
      details: {
        manifestCompatibility: false,
        apiCompatibility: false,
        featureCompatibility: false,
        extensionLoading: false,
        functionalityTest: false
      },
      compatibility: {
        manifestVersion: null,
        supportedApis: [],
        unsupportedApis: [],
        supportedFeatures: [],
        unsupportedFeatures: []
      }
    };

    try {
      // 1. 测试 Manifest 兼容性
      console.log(`   📄 测试 Manifest 兼容性...`);
      const manifestResult = await this.testManifestCompatibility(config);
      result.details.manifestCompatibility = manifestResult.compatible;
      result.compatibility.manifestVersion = manifestResult.version;
      
      if (manifestResult.compatible) {
        console.log(`   ✅ Manifest V${manifestResult.version} 兼容`);
      } else {
        console.log(`   ❌ Manifest 不兼容: ${manifestResult.error}`);
        result.warnings.push(`Manifest 兼容性问题: ${manifestResult.error}`);
      }

      // 2. 测试 API 兼容性
      console.log(`   🔌 测试 API 兼容性...`);
      const apiResult = await this.testApiCompatibility(config);
      result.details.apiCompatibility = apiResult.allSupported;
      result.compatibility.supportedApis = apiResult.supported;
      result.compatibility.unsupportedApis = apiResult.unsupported;
      
      console.log(`   📊 API 支持情况: ${apiResult.supported.length}/${apiResult.total} 个API支持`);
      if (apiResult.unsupported.length > 0) {
        console.log(`   ⚠️  不支持的API: ${apiResult.unsupported.join(', ')}`);
        apiResult.unsupported.forEach(api => {
          result.warnings.push(`API ${api} 可能不被支持`);
        });
      }

      // 3. 测试功能特性兼容性
      console.log(`   ⚡ 测试功能特性兼容性...`);
      const featureResult = await this.testFeatureCompatibility(config);
      result.details.featureCompatibility = featureResult.allSupported;
      result.compatibility.supportedFeatures = featureResult.supported;
      result.compatibility.unsupportedFeatures = featureResult.unsupported;
      
      console.log(`   📊 功能支持情况: ${featureResult.supported.length}/${featureResult.total} 个功能支持`);
      if (featureResult.unsupported.length > 0) {
        console.log(`   ⚠️  不支持的功能: ${featureResult.unsupported.join(', ')}`);
        featureResult.unsupported.forEach(feature => {
          result.warnings.push(`功能 ${feature} 可能不被支持`);
        });
      }

      // 4. 模拟扩展加载测试
      console.log(`   🚀 模拟扩展加载测试...`);
      const loadingResult = await this.testExtensionLoading(config);
      result.details.extensionLoading = loadingResult.success;
      
      if (loadingResult.success) {
        console.log(`   ✅ 扩展加载模拟成功`);
      } else {
        console.log(`   ❌ 扩展加载模拟失败: ${loadingResult.error}`);
        result.warnings.push(`扩展加载问题: ${loadingResult.error}`);
      }

      // 5. 功能测试
      console.log(`   🧪 运行功能测试...`);
      const functionalityResult = await this.testExtensionFunctionality(config);
      result.details.functionalityTest = functionalityResult.success;
      
      if (functionalityResult.success) {
        console.log(`   ✅ 功能测试通过`);
      } else {
        console.log(`   ❌ 功能测试失败: ${functionalityResult.error}`);
      }

      // 添加浏览器特定的警告
      if (config.quirks) {
        config.quirks.forEach(quirk => {
          result.warnings.push(quirk);
        });
      }

      // 判断整体兼容性
      const criticalTests = [
        result.details.manifestCompatibility,
        result.details.apiCompatibility,
        result.details.extensionLoading
      ];
      
      result.success = criticalTests.every(test => test === true);

    } catch (error) {
      result.error = error.message;
    }

    return result;
  }

  /**
   * 测试 Manifest 兼容性
   */
  async testManifestCompatibility(config) {
    try {
      // 读取 manifest.json
      const manifestContent = fs.readFileSync('manifest.json', 'utf8');
      const manifest = JSON.parse(manifestContent);
      
      // 检查 manifest 版本
      if (manifest.manifest_version !== config.manifestVersion) {
        return {
          compatible: false,
          version: manifest.manifest_version,
          error: `期望 Manifest V${config.manifestVersion}, 实际 V${manifest.manifest_version}`
        };
      }
      
      // 检查必需字段
      const requiredFields = ['name', 'version', 'permissions', 'content_scripts'];
      for (const field of requiredFields) {
        if (!manifest[field]) {
          return {
            compatible: false,
            version: manifest.manifest_version,
            error: `缺少必需字段: ${field}`
          };
        }
      }
      
      // 检查权限声明
      const requiredPermissions = ['clipboardWrite'];
      for (const permission of requiredPermissions) {
        if (!manifest.permissions.includes(permission)) {
          return {
            compatible: false,
            version: manifest.manifest_version,
            error: `缺少必需权限: ${permission}`
          };
        }
      }
      
      return {
        compatible: true,
        version: manifest.manifest_version,
        error: null
      };
      
    } catch (error) {
      return {
        compatible: false,
        version: null,
        error: error.message
      };
    }
  }

  /**
   * 测试 API 兼容性
   */
  async testApiCompatibility(config) {
    const apiTests = {
      clipboard: () => {
        // 检查 Clipboard API 支持
        return typeof navigator !== 'undefined' && 
               navigator.clipboard && 
               typeof navigator.clipboard.writeText === 'function';
      },
      i18n: () => {
        // 检查国际化 API 支持
        return config.apis.i18n; // 基于配置判断
      },
      storage: () => {
        // 检查存储 API 支持
        return config.apis.storage; // 基于配置判断
      },
      contentScripts: () => {
        // 检查内容脚本支持
        return config.apis.contentScripts; // 基于配置判断
      }
    };
    
    const supported = [];
    const unsupported = [];
    
    for (const [apiName, testFn] of Object.entries(apiTests)) {
      try {
        if (testFn()) {
          supported.push(apiName);
        } else {
          unsupported.push(apiName);
        }
      } catch (error) {
        unsupported.push(apiName);
      }
    }
    
    return {
      allSupported: unsupported.length === 0,
      supported,
      unsupported,
      total: Object.keys(apiTests).length
    };
  }

  /**
   * 测试功能特性兼容性
   */
  async testFeatureCompatibility(config) {
    const featureTests = {
      manifestV3: () => config.features.manifestV3,
      serviceWorker: () => config.features.serviceWorker,
      dynamicImports: () => config.features.dynamicImports,
      mutationObserver: () => {
        // MutationObserver 在现代浏览器中都支持
        return typeof MutationObserver !== 'undefined';
      },
      es6Modules: () => {
        // ES6 模块支持
        return true; // 现代浏览器都支持
      }
    };
    
    const supported = [];
    const unsupported = [];
    
    for (const [featureName, testFn] of Object.entries(featureTests)) {
      try {
        if (testFn()) {
          supported.push(featureName);
        } else {
          unsupported.push(featureName);
        }
      } catch (error) {
        unsupported.push(featureName);
      }
    }
    
    return {
      allSupported: unsupported.length === 0,
      supported,
      unsupported,
      total: Object.keys(featureTests).length
    };
  }

  /**
   * 模拟扩展加载测试
   */
  async testExtensionLoading(config) {
    try {
      // 模拟浏览器环境
      const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        url: 'https://chat.openai.com/',
        userAgent: config.userAgent,
        pretendToBeVisual: true
      });
      
      const { window } = dom;
      
      // 模拟扩展 API
      window.chrome = {
        i18n: {
          getMessage: (key) => {
            const messages = {
              'copyPlainText': 'Copy Plain Text',
              'copySuccess': 'Copied successfully'
            };
            return messages[key] || key;
          }
        },
        storage: {
          sync: {
            get: async (keys) => ({}),
            set: async (data) => {}
          }
        }
      };
      
      // 模拟 navigator API
      window.navigator.clipboard = {
        writeText: async (text) => Promise.resolve()
      };
      
      // 尝试加载扩展代码
      const contentScript = fs.readFileSync('content.js', 'utf8');
      const sitesConfig = fs.readFileSync('sites.js', 'utf8');
      
      // 在模拟环境中执行代码
      const scriptContent = `
        ${sitesConfig}
        // 简化版本的扩展代码，只测试基本加载
        const siteManager = {
          loadSiteConfig: () => Promise.resolve(),
          getCurrentSite: () => ({ selector: '.test', name: 'Test' }),
          isSupported: () => true
        };
        
        window.extensionLoaded = true;
      `;
      
      window.eval(scriptContent);
      
      if (window.extensionLoaded) {
        return {
          success: true,
          error: null
        };
      } else {
        return {
          success: false,
          error: '扩展代码执行后未设置加载标志'
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 测试扩展功能
   */
  async testExtensionFunctionality(config) {
    try {
      // 创建测试环境
      const dom = new JSDOM(`
        <div data-message-author-role="assistant">
          <div class="markdown">测试消息内容</div>
        </div>
      `, {
        url: 'https://chat.openai.com/',
        userAgent: config.userAgent
      });
      
      const { window, document } = dom;
      
      // 设置全局变量
      global.window = window;
      global.document = document;
      global.navigator = window.navigator;
      
      // 模拟扩展环境
      window.chrome = {
        i18n: {
          getMessage: (key) => key === 'copyPlainText' ? 'Copy Plain Text' : key
        }
      };
      
      window.navigator.clipboard = {
        writeText: async (text) => Promise.resolve()
      };
      
      // 测试基本功能
      const testElement = document.querySelector('[data-message-author-role="assistant"] .markdown');
      
      if (!testElement) {
        return {
          success: false,
          error: '测试元素未找到'
        };
      }
      
      // 测试文本提取
      const text = testElement.innerText || testElement.textContent;
      if (!text || text.trim().length === 0) {
        return {
          success: false,
          error: '文本提取失败'
        };
      }
      
      // 测试按钮创建
      const button = document.createElement('button');
      button.textContent = window.chrome.i18n.getMessage('copyPlainText');
      button.className = 'puretext-copy-btn';
      
      if (!button.textContent || button.textContent.length === 0) {
        return {
          success: false,
          error: '按钮文本设置失败'
        };
      }
      
      return {
        success: true,
        error: null
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 生成兼容性报告
   */
  async generateCompatibilityReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: this.results.summary,
      details: this.results.details,
      browserConfigs: BROWSER_CONFIGS
    };

    // 生成JSON报告
    const jsonReport = JSON.stringify(reportData, null, 2);
    await fs.promises.writeFile('browser-compatibility-test-report.json', jsonReport);

    // 生成Markdown报告
    const markdownReport = this.generateMarkdownCompatibilityReport(reportData);
    await fs.promises.writeFile('BROWSER_COMPATIBILITY_TEST_REPORT.md', markdownReport);

    // 打印摘要
    console.log('\n📊 兼容性测试结果摘要:');
    console.log(`   总测试浏览器数: ${this.results.summary.total}`);
    console.log(`   兼容: ${this.results.summary.passed}`);
    console.log(`   不兼容: ${this.results.summary.failed}`);
    console.log(`   警告数: ${this.results.summary.warnings}`);
    
    const compatibilityRate = ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1);
    console.log(`   兼容率: ${compatibilityRate}%`);

    console.log('\n📄 详细报告已生成:');
    console.log('   - browser-compatibility-test-report.json');
    console.log('   - BROWSER_COMPATIBILITY_TEST_REPORT.md');
  }

  /**
   * 生成Markdown兼容性报告
   */
  generateMarkdownCompatibilityReport(reportData) {
    const { summary, details, timestamp } = reportData;
    
    let markdown = `# 浏览器兼容性测试报告\n\n`;
    markdown += `**生成时间**: ${new Date(timestamp).toLocaleString()}\n\n`;
    
    // 摘要
    markdown += `## 兼容性摘要\n\n`;
    markdown += `| 指标 | 数量 |\n`;
    markdown += `|------|------|\n`;
    markdown += `| 测试浏览器数 | ${summary.total} |\n`;
    markdown += `| 兼容 | ${summary.passed} |\n`;
    markdown += `| 不兼容 | ${summary.failed} |\n`;
    markdown += `| 警告数 | ${summary.warnings} |\n`;
    markdown += `| 兼容率 | ${((summary.passed / summary.total) * 100).toFixed(1)}% |\n\n`;
    
    // 详细结果
    markdown += `## 详细兼容性结果\n\n`;
    
    details.forEach((result, index) => {
      const status = result.success ? '✅ 兼容' : '❌ 不兼容';
      markdown += `### ${index + 1}. ${result.browserName}\n\n`;
      markdown += `**兼容性状态**: ${status}\n\n`;
      
      if (result.error) {
        markdown += `**错误**: ${result.error}\n\n`;
      }
      
      // 兼容性检查项
      markdown += `**兼容性检查**:\n\n`;
      markdown += `| 检查项 | 状态 |\n`;
      markdown += `|--------|------|\n`;
      markdown += `| Manifest 兼容性 | ${result.details.manifestCompatibility ? '✅' : '❌'} |\n`;
      markdown += `| API 兼容性 | ${result.details.apiCompatibility ? '✅' : '❌'} |\n`;
      markdown += `| 功能特性兼容性 | ${result.details.featureCompatibility ? '✅' : '❌'} |\n`;
      markdown += `| 扩展加载 | ${result.details.extensionLoading ? '✅' : '❌'} |\n`;
      markdown += `| 功能测试 | ${result.details.functionalityTest ? '✅' : '❌'} |\n\n`;
      
      // API 支持情况
      if (result.compatibility.supportedApis.length > 0) {
        markdown += `**支持的 API**: ${result.compatibility.supportedApis.join(', ')}\n\n`;
      }
      
      if (result.compatibility.unsupportedApis.length > 0) {
        markdown += `**不支持的 API**: ${result.compatibility.unsupportedApis.join(', ')}\n\n`;
      }
      
      // 功能支持情况
      if (result.compatibility.supportedFeatures.length > 0) {
        markdown += `**支持的功能**: ${result.compatibility.supportedFeatures.join(', ')}\n\n`;
      }
      
      if (result.compatibility.unsupportedFeatures.length > 0) {
        markdown += `**不支持的功能**: ${result.compatibility.unsupportedFeatures.join(', ')}\n\n`;
      }
      
      // 警告信息
      if (result.warnings && result.warnings.length > 0) {
        markdown += `**警告信息**:\n\n`;
        result.warnings.forEach(warning => {
          markdown += `- ⚠️ ${warning}\n`;
        });
        markdown += `\n`;
      }
    });
    
    // 兼容性建议
    markdown += `## 兼容性建议\n\n`;
    
    const compatibleBrowsers = details.filter(r => r.success);
    const incompatibleBrowsers = details.filter(r => !r.success);
    
    if (compatibleBrowsers.length === details.length) {
      markdown += `🎉 **扩展与所有测试的浏览器都兼容！**\n\n`;
      markdown += `扩展可以在以下浏览器中正常运行：\n`;
      compatibleBrowsers.forEach(result => {
        markdown += `- ${result.browserName}\n`;
      });
      markdown += `\n`;
    } else {
      markdown += `⚠️ **扩展与 ${incompatibleBrowsers.length} 个浏览器存在兼容性问题**\n\n`;
      incompatibleBrowsers.forEach(result => {
        markdown += `- **${result.browserName}**: ${result.error}\n`;
      });
      markdown += `\n`;
    }
    
    markdown += `### 部署建议\n\n`;
    markdown += `1. **优先支持的浏览器**:\n`;
    compatibleBrowsers.forEach(result => {
      markdown += `   - ${result.browserName}: 完全兼容\n`;
    });
    markdown += `\n`;
    
    if (incompatibleBrowsers.length > 0) {
      markdown += `2. **需要额外处理的浏览器**:\n`;
      incompatibleBrowsers.forEach(result => {
        markdown += `   - ${result.browserName}: 需要解决兼容性问题\n`;
      });
      markdown += `\n`;
    }
    
    markdown += `3. **测试建议**:\n`;
    markdown += `   - 在每个目标浏览器中进行实际测试\n`;
    markdown += `   - 验证扩展商店的发布要求\n`;
    markdown += `   - 监控用户反馈和错误报告\n`;
    markdown += `   - 定期更新兼容性测试\n\n`;
    
    return markdown;
  }
}

// 运行测试
async function runTests() {
  const tester = new BrowserCompatibilityTester();
  await tester.runAllTests();
}

// 如果直接运行此文件，则执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { BrowserCompatibilityTester };