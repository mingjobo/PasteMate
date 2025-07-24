/**
 * 手动浏览器测试脚本
 * 在浏览器控制台中运行此脚本来测试扩展兼容性
 */

(function() {
  'use strict';

  // 测试结果收集器
  const TestResults = {
    browser: '',
    version: '',
    tests: [],
    issues: [],
    startTime: Date.now(),
    
    addTest(name, status, details = '') {
      this.tests.push({
        name,
        status, // 'pass', 'fail', 'warn'
        details,
        timestamp: Date.now()
      });
    },
    
    addIssue(issue) {
      this.issues.push({
        issue,
        timestamp: Date.now()
      });
    },
    
    generateReport() {
      const duration = Date.now() - this.startTime;
      const passCount = this.tests.filter(t => t.status === 'pass').length;
      const failCount = this.tests.filter(t => t.status === 'fail').length;
      const warnCount = this.tests.filter(t => t.status === 'warn').length;
      
      console.log('\n' + '='.repeat(60));
      console.log('🔍 PureText 扩展浏览器兼容性测试报告');
      console.log('='.repeat(60));
      console.log(`浏览器: ${this.browser} ${this.version}`);
      console.log(`测试时间: ${new Date().toLocaleString()}`);
      console.log(`测试耗时: ${duration}ms`);
      console.log(`总测试数: ${this.tests.length}`);
      console.log(`✅ 通过: ${passCount}`);
      console.log(`❌ 失败: ${failCount}`);
      console.log(`⚠️ 警告: ${warnCount}`);
      console.log(`🐛 问题: ${this.issues.length}`);
      
      if (this.tests.length > 0) {
        console.log('\n📋 详细测试结果:');
        this.tests.forEach((test, index) => {
          const icon = test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : '⚠️';
          console.log(`${index + 1}. ${icon} ${test.name}${test.details ? ` - ${test.details}` : ''}`);
        });
      }
      
      if (this.issues.length > 0) {
        console.log('\n🐛 发现的问题:');
        this.issues.forEach((issue, index) => {
          console.log(`${index + 1}. ${issue.issue}`);
        });
      }
      
      // 生成兼容性评分
      const score = Math.round((passCount / this.tests.length) * 100);
      console.log(`\n🎯 兼容性评分: ${score}%`);
      
      if (score >= 90) {
        console.log('🟢 兼容性状态: 优秀');
      } else if (score >= 75) {
        console.log('🟡 兼容性状态: 良好');
      } else if (score >= 60) {
        console.log('🟠 兼容性状态: 一般');
      } else {
        console.log('🔴 兼容性状态: 需要改进');
      }
      
      console.log('='.repeat(60));
      
      return {
        browser: this.browser,
        version: this.version,
        score,
        tests: this.tests,
        issues: this.issues,
        duration
      };
    }
  };

  // 浏览器检测
  function detectBrowser() {
    const userAgent = navigator.userAgent;
    const userAgentLower = userAgent.toLowerCase();
    
    let browser = 'Unknown';
    let version = 'Unknown';
    
    if (userAgentLower.includes('edg/')) {
      browser = 'Microsoft Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (userAgentLower.includes('firefox')) {
      browser = 'Mozilla Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (userAgentLower.includes('chrome')) {
      browser = 'Google Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (userAgentLower.includes('safari')) {
      browser = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    }
    
    TestResults.browser = browser;
    TestResults.version = version;
    
    return { browser, version };
  }

  // 测试扩展环境
  function testExtensionEnvironment() {
    console.log('🔧 测试扩展环境...');
    
    if (typeof chrome === 'undefined') {
      TestResults.addTest('Chrome 扩展 API', 'fail', 'chrome 对象不存在');
      TestResults.addIssue('扩展可能未加载或不在扩展环境中运行');
      return false;
    }
    
    TestResults.addTest('Chrome 扩展 API', 'pass', 'chrome 对象可用');
    
    // 测试 runtime API
    if (chrome.runtime) {
      TestResults.addTest('Runtime API', 'pass');
      
      if (chrome.runtime.getManifest) {
        try {
          const manifest = chrome.runtime.getManifest();
          if (manifest.manifest_version === 3) {
            TestResults.addTest('Manifest V3', 'pass', `版本 ${manifest.version}`);
          } else {
            TestResults.addTest('Manifest V3', 'warn', `使用 Manifest V${manifest.manifest_version}`);
          }
        } catch (error) {
          TestResults.addTest('Manifest 读取', 'fail', error.message);
        }
      }
    } else {
      TestResults.addTest('Runtime API', 'fail');
    }
    
    return true;
  }

  // 测试剪贴板 API
  async function testClipboardAPI() {
    console.log('📋 测试剪贴板 API...');
    
    if (!navigator.clipboard) {
      TestResults.addTest('现代剪贴板 API', 'fail', 'navigator.clipboard 不存在');
      TestResults.addIssue('需要使用降级的 execCommand 方法');
      
      // 测试降级方案
      if (document.execCommand) {
        TestResults.addTest('降级剪贴板方案', 'pass', 'execCommand 可用');
      } else {
        TestResults.addTest('降级剪贴板方案', 'fail', 'execCommand 不可用');
        TestResults.addIssue('剪贴板功能完全不可用');
      }
      return;
    }
    
    TestResults.addTest('现代剪贴板 API', 'pass', 'navigator.clipboard 存在');
    
    if (!navigator.clipboard.writeText) {
      TestResults.addTest('剪贴板写入 API', 'fail', 'writeText 方法不存在');
      return;
    }
    
    try {
      const testText = `PureText 兼容性测试 - ${Date.now()}`;
      await navigator.clipboard.writeText(testText);
      TestResults.addTest('剪贴板写入功能', 'pass', '成功写入测试文本');
      
      // 尝试读取验证（可能会失败，这是正常的）
      if (navigator.clipboard.readText) {
        try {
          const readText = await navigator.clipboard.readText();
          if (readText === testText) {
            TestResults.addTest('剪贴板读取验证', 'pass', '读取内容匹配');
          } else {
            TestResults.addTest('剪贴板读取验证', 'warn', '读取内容不匹配');
          }
        } catch (error) {
          TestResults.addTest('剪贴板读取验证', 'warn', '权限不足（正常现象）');
        }
      }
    } catch (error) {
      TestResults.addTest('剪贴板写入功能', 'fail', error.message);
      TestResults.addIssue(`剪贴板写入失败: ${error.message}`);
    }
  }

  // 测试国际化 API
  function testInternationalizationAPI() {
    console.log('🌐 测试国际化 API...');
    
    if (!chrome.i18n) {
      TestResults.addTest('国际化 API', 'fail', 'chrome.i18n 不存在');
      return;
    }
    
    TestResults.addTest('国际化 API', 'pass');
    
    if (chrome.i18n.getMessage) {
      try {
        const extensionName = chrome.i18n.getMessage('extensionName');
        const copyText = chrome.i18n.getMessage('copyPlainText');
        
        TestResults.addTest('消息获取功能', 'pass', `扩展名: ${extensionName || '未定义'}`);
        
        if (copyText) {
          TestResults.addTest('按钮文案', 'pass', `复制按钮: ${copyText}`);
        } else {
          TestResults.addTest('按钮文案', 'warn', '复制按钮文案未定义');
        }
      } catch (error) {
        TestResults.addTest('消息获取功能', 'fail', error.message);
      }
    }
    
    if (chrome.i18n.getUILanguage) {
      try {
        const language = chrome.i18n.getUILanguage();
        TestResults.addTest('语言检测', 'pass', `当前语言: ${language}`);
      } catch (error) {
        TestResults.addTest('语言检测', 'fail', error.message);
      }
    }
  }

  // 测试存储 API
  async function testStorageAPI() {
    console.log('💾 测试存储 API...');
    
    if (!chrome.storage) {
      TestResults.addTest('存储 API', 'fail', 'chrome.storage 不存在');
      return;
    }
    
    TestResults.addTest('存储 API', 'pass');
    
    if (chrome.storage.sync) {
      try {
        const testKey = 'puretext_test_' + Date.now();
        const testValue = 'test_value_' + Date.now();
        
        // 测试写入
        await chrome.storage.sync.set({ [testKey]: testValue });
        TestResults.addTest('存储写入', 'pass');
        
        // 测试读取
        const result = await chrome.storage.sync.get([testKey]);
        if (result[testKey] === testValue) {
          TestResults.addTest('存储读取', 'pass', '数据一致');
        } else {
          TestResults.addTest('存储读取', 'fail', '数据不一致');
        }
        
        // 清理测试数据
        await chrome.storage.sync.remove([testKey]);
        TestResults.addTest('存储清理', 'pass');
        
      } catch (error) {
        TestResults.addTest('存储操作', 'fail', error.message);
        TestResults.addIssue(`存储 API 失败: ${error.message}`);
      }
    } else {
      TestResults.addTest('同步存储', 'fail', 'chrome.storage.sync 不存在');
    }
  }

  // 测试 DOM 操作
  function testDOMOperations() {
    console.log('🏗️ 测试 DOM 操作...');
    
    try {
      // 测试元素创建
      const testElement = document.createElement('div');
      testElement.id = 'puretext-compatibility-test';
      testElement.textContent = '兼容性测试元素';
      testElement.style.display = 'none';
      
      document.body.appendChild(testElement);
      TestResults.addTest('DOM 元素创建', 'pass');
      
      // 测试元素查找
      const foundElement = document.getElementById('puretext-compatibility-test');
      if (foundElement) {
        TestResults.addTest('DOM 元素查找', 'pass');
      } else {
        TestResults.addTest('DOM 元素查找', 'fail');
      }
      
      // 测试样式设置
      testElement.style.position = 'absolute';
      testElement.style.top = '10px';
      testElement.style.right = '10px';
      TestResults.addTest('CSS 样式设置', 'pass');
      
      // 测试事件监听
      let eventTriggered = false;
      const testHandler = () => { eventTriggered = true; };
      testElement.addEventListener('click', testHandler);
      
      // 模拟点击
      testElement.click();
      if (eventTriggered) {
        TestResults.addTest('事件处理', 'pass');
      } else {
        TestResults.addTest('事件处理', 'warn', '事件未触发');
      }
      
      // 清理
      testElement.removeEventListener('click', testHandler);
      document.body.removeChild(testElement);
      TestResults.addTest('DOM 清理', 'pass');
      
    } catch (error) {
      TestResults.addTest('DOM 操作', 'fail', error.message);
      TestResults.addIssue(`DOM 操作失败: ${error.message}`);
    }
  }

  // 测试 MutationObserver
  function testMutationObserver() {
    console.log('👁️ 测试 MutationObserver...');
    
    if (typeof MutationObserver === 'undefined') {
      TestResults.addTest('MutationObserver', 'fail', 'MutationObserver 不存在');
      TestResults.addIssue('无法监听 DOM 变化，按钮注入功能将受影响');
      return;
    }
    
    TestResults.addTest('MutationObserver 支持', 'pass');
    
    try {
      let changeDetected = false;
      const observer = new MutationObserver((mutations) => {
        if (mutations.length > 0) {
          changeDetected = true;
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // 创建测试变化
      const testDiv = document.createElement('div');
      testDiv.textContent = 'MutationObserver 测试';
      document.body.appendChild(testDiv);
      
      // 等待观察器触发
      setTimeout(() => {
        observer.disconnect();
        document.body.removeChild(testDiv);
        
        if (changeDetected) {
          TestResults.addTest('DOM 变化监听', 'pass', '成功检测到变化');
        } else {
          TestResults.addTest('DOM 变化监听', 'warn', '未检测到变化');
        }
      }, 100);
      
    } catch (error) {
      TestResults.addTest('MutationObserver 功能', 'fail', error.message);
    }
  }

  // 测试 CSS 特性支持
  function testCSSFeatures() {
    console.log('🎨 测试 CSS 特性...');
    
    const testElement = document.createElement('div');
    testElement.style.display = 'none';
    document.body.appendChild(testElement);
    
    const features = [
      { name: 'transform', value: 'translateX(10px)' },
      { name: 'transition', value: 'all 0.3s ease' },
      { name: 'boxShadow', value: '0 2px 8px rgba(0,0,0,0.1)' },
      { name: 'borderRadius', value: '6px' },
      { name: 'opacity', value: '0.8' },
      { name: 'backdropFilter', value: 'blur(8px)' },
      { name: 'filter', value: 'blur(2px)' }
    ];
    
    features.forEach(feature => {
      try {
        testElement.style[feature.name] = feature.value;
        if (testElement.style[feature.name]) {
          TestResults.addTest(`CSS ${feature.name}`, 'pass');
        } else {
          TestResults.addTest(`CSS ${feature.name}`, 'warn', '不支持或部分支持');
        }
      } catch (error) {
        TestResults.addTest(`CSS ${feature.name}`, 'fail', error.message);
      }
    });
    
    document.body.removeChild(testElement);
  }

  // 测试扩展功能
  function testExtensionFeatures() {
    console.log('🔌 测试扩展功能...');
    
    // 检查是否有复制按钮
    const copyButtons = document.querySelectorAll('.puretext-copy-btn');
    if (copyButtons.length > 0) {
      TestResults.addTest('复制按钮注入', 'pass', `发现 ${copyButtons.length} 个按钮`);
      
      // 测试按钮样式
      copyButtons.forEach((button, index) => {
        const styles = window.getComputedStyle(button);
        if (styles.position === 'absolute') {
          TestResults.addTest(`按钮 ${index + 1} 定位`, 'pass');
        } else {
          TestResults.addTest(`按钮 ${index + 1} 定位`, 'warn', `位置: ${styles.position}`);
        }
      });
    } else {
      TestResults.addTest('复制按钮注入', 'warn', '未发现按钮（可能页面不支持）');
    }
    
    // 检查站点配置
    if (typeof window.siteManager !== 'undefined') {
      TestResults.addTest('站点管理器', 'pass');
      
      if (window.siteManager.isSupported && window.siteManager.isSupported()) {
        TestResults.addTest('当前站点支持', 'pass');
      } else {
        TestResults.addTest('当前站点支持', 'warn', '当前站点可能不在支持列表中');
      }
    } else {
      TestResults.addTest('站点管理器', 'warn', '未检测到站点管理器');
    }
  }

  // 主测试函数
  async function runCompatibilityTest() {
    console.clear();
    console.log('🚀 开始 PureText 扩展浏览器兼容性测试...');
    
    const browserInfo = detectBrowser();
    console.log(`检测到浏览器: ${browserInfo.browser} ${browserInfo.version}`);
    
    // 运行所有测试
    const hasExtension = testExtensionEnvironment();
    
    if (hasExtension) {
      await testClipboardAPI();
      testInternationalizationAPI();
      await testStorageAPI();
    }
    
    testDOMOperations();
    testMutationObserver();
    testCSSFeatures();
    testExtensionFeatures();
    
    // 等待异步测试完成
    setTimeout(() => {
      const report = TestResults.generateReport();
      
      // 提供下载报告的选项
      if (typeof Blob !== 'undefined') {
        const reportData = JSON.stringify(report, null, 2);
        const blob = new Blob([reportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        console.log('\n📄 测试报告已生成，可以下载:');
        console.log(`%c点击这里下载 JSON 报告`, 'color: blue; text-decoration: underline; cursor: pointer;');
        
        // 创建下载链接
        const a = document.createElement('a');
        a.href = url;
        a.download = `puretext-compatibility-${browserInfo.browser.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
        a.style.display = 'none';
        document.body.appendChild(a);
        
        // 提供手动下载方法
        window.downloadCompatibilityReport = () => {
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        };
        
        console.log('或在控制台运行: downloadCompatibilityReport()');
      }
      
    }, 500);
  }

  // 导出到全局作用域
  window.PureTextCompatibilityTest = {
    run: runCompatibilityTest,
    results: TestResults
  };

  // 自动运行测试
  console.log('PureText 兼容性测试工具已加载');
  console.log('运行 PureTextCompatibilityTest.run() 开始测试');
  
  // 如果检测到扩展环境，自动运行测试
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('检测到扩展环境，自动开始测试...');
    setTimeout(runCompatibilityTest, 1000);
  }

})();