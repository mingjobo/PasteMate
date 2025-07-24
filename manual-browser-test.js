/**
 * 手动浏览器测试脚本
 * 在浏览器控制台中运行，用于测试扩展功能
 */

(function() {
  'use strict';
  
  console.log('🧪 PureText 扩展手动测试工具');
  console.log('=====================================');
  
  // 测试配置
  const TEST_CONFIG = {
    buttonClass: 'puretext-copy-btn',
    testTimeout: 5000,
    retryInterval: 500
  };
  
  /**
   * 检查扩展环境
   */
  function checkExtensionEnvironment() {
    console.log('\n🔍 1. 检查扩展环境...');
    
    const results = {
      chromeAPI: typeof chrome !== 'undefined',
      contentScript: typeof SUPPORTED_SITES !== 'undefined',
      siteSupported: false,
      currentSite: null
    };
    
    if (results.chromeAPI) {
      console.log('   ✅ Chrome 扩展 API 可用');
    } else {
      console.log('   ❌ Chrome 扩展 API 不可用');
      console.log('   💡 请确保扩展已安装并启用');
    }
    
    if (results.contentScript) {
      console.log('   ✅ 内容脚本已加载');
      console.log('   📋 支持的网站:', Object.keys(SUPPORTED_SITES));
      
      const hostname = window.location.hostname;
      if (SUPPORTED_SITES[hostname]) {
        results.siteSupported = true;
        results.currentSite = SUPPORTED_SITES[hostname];
        console.log(`   ✅ 当前网站受支持: ${results.currentSite.name}`);
        console.log(`   🎯 选择器: ${results.currentSite.selector}`);
      } else {
        console.log(`   ⚠️  当前网站不受支持: ${hostname}`);
        console.log('   💡 要测试本地文件，请使用 manifest-test.json');
      }
    } else {
      console.log('   ❌ 内容脚本未加载');
      console.log('   💡 请检查 manifest.json 中的 matches 配置');
    }
    
    return results;
  }
  
  /**
   * 测试选择器匹配
   */
  function testSelectorMatching(siteConfig) {
    console.log('\n🎯 2. 测试选择器匹配...');
    
    if (!siteConfig) {
      console.log('   ❌ 无站点配置，跳过测试');
      return { success: false, elements: [] };
    }
    
    try {
      const elements = document.querySelectorAll(siteConfig.selector);
      console.log(`   📊 找到 ${elements.length} 个匹配元素`);
      
      if (elements.length > 0) {
        console.log('   ✅ 选择器匹配成功');
        elements.forEach((element, index) => {
          const text = element.textContent.substring(0, 50);
          console.log(`   📝 元素 ${index + 1}: "${text}..."`);
        });
        return { success: true, elements: Array.from(elements) };
      } else {
        console.log('   ⚠️  未找到匹配元素');
        console.log('   💡 可能原因:');
        console.log('      - 页面还未完全加载');
        console.log('      - 选择器不正确');
        console.log('      - 页面结构已变化');
        return { success: false, elements: [] };
      }
    } catch (error) {
      console.log('   ❌ 选择器测试失败:', error.message);
      return { success: false, elements: [] };
    }
  }
  
  /**
   * 测试按钮注入
   */
  function testButtonInjection(elements) {
    console.log('\n💉 3. 测试按钮注入...');
    
    if (elements.length === 0) {
      console.log('   ❌ 没有目标元素，跳过测试');
      return { success: false, buttons: [] };
    }
    
    // 检查现有按钮
    const existingButtons = document.querySelectorAll(`.${TEST_CONFIG.buttonClass}`);
    console.log(`   📊 现有按钮数量: ${existingButtons.length}`);
    
    // 手动触发按钮注入（如果可能）
    if (typeof window.buttonInjector !== 'undefined') {
      console.log('   🔄 手动触发按钮扫描...');
      window.buttonInjector.scanAndInjectButtons();
    }
    
    // 等待一段时间后检查结果
    setTimeout(() => {
      const newButtons = document.querySelectorAll(`.${TEST_CONFIG.buttonClass}`);
      console.log(`   📊 注入后按钮数量: ${newButtons.length}`);
      
      if (newButtons.length > 0) {
        console.log('   ✅ 按钮注入成功');
        newButtons.forEach((button, index) => {
          console.log(`   🔘 按钮 ${index + 1}: "${button.textContent}"`);
        });
        
        // 测试按钮样式
        testButtonStyles(newButtons[0]);
        
        return { success: true, buttons: Array.from(newButtons) };
      } else {
        console.log('   ❌ 按钮注入失败');
        console.log('   💡 可能原因:');
        console.log('      - 扩展未正确初始化');
        console.log('      - 目标元素缺少相对定位');
        console.log('      - JavaScript 错误阻止了注入');
        return { success: false, buttons: [] };
      }
    }, 1000);
  }
  
  /**
   * 测试按钮样式
   */
  function testButtonStyles(button) {
    console.log('\n🎨 4. 测试按钮样式...');
    
    if (!button) {
      console.log('   ❌ 没有按钮可测试');
      return;
    }
    
    const styles = window.getComputedStyle(button);
    const styleChecks = {
      position: styles.position === 'absolute',
      zIndex: parseInt(styles.zIndex) > 10000,
      cursor: styles.cursor === 'pointer',
      opacity: parseFloat(styles.opacity) > 0,
      display: styles.display !== 'none'
    };
    
    console.log('   📊 样式检查结果:');
    Object.entries(styleChecks).forEach(([property, passed]) => {
      const status = passed ? '✅' : '❌';
      console.log(`      ${status} ${property}: ${styles[property]}`);
    });
    
    const allPassed = Object.values(styleChecks).every(Boolean);
    if (allPassed) {
      console.log('   ✅ 按钮样式正常');
    } else {
      console.log('   ⚠️  按钮样式可能有问题');
    }
  }
  
  /**
   * 测试复制功能
   */
  function testCopyFunctionality(buttons, elements) {
    console.log('\n📋 5. 测试复制功能...');
    
    if (buttons.length === 0 || elements.length === 0) {
      console.log('   ❌ 缺少按钮或目标元素，跳过测试');
      return;
    }
    
    const button = buttons[0];
    const element = elements[0];
    
    console.log('   🔄 模拟按钮点击...');
    
    // 监听复制事件
    let copyAttempted = false;
    const originalWriteText = navigator.clipboard?.writeText;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText = async function(text) {
        copyAttempted = true;
        console.log('   📝 复制内容预览:', text.substring(0, 100) + '...');
        console.log('   📊 复制内容长度:', text.length);
        
        // 调用原始方法
        if (originalWriteText) {
          return originalWriteText.call(this, text);
        }
        return Promise.resolve();
      };
    }
    
    // 点击按钮
    try {
      button.click();
      
      setTimeout(() => {
        if (copyAttempted) {
          console.log('   ✅ 复制功能正常工作');
        } else {
          console.log('   ⚠️  未检测到复制操作');
          console.log('   💡 可能使用了降级方案或出现错误');
        }
        
        // 恢复原始方法
        if (navigator.clipboard && originalWriteText) {
          navigator.clipboard.writeText = originalWriteText;
        }
      }, 500);
      
    } catch (error) {
      console.log('   ❌ 按钮点击失败:', error.message);
    }
  }
  
  /**
   * 运行完整测试
   */
  function runFullTest() {
    console.log('🚀 开始完整测试...');
    
    // 1. 检查环境
    const envResult = checkExtensionEnvironment();
    
    // 2. 测试选择器
    const selectorResult = testSelectorMatching(envResult.currentSite);
    
    // 3. 测试按钮注入
    const injectionResult = testButtonInjection(selectorResult.elements);
    
    // 4. 延迟测试复制功能（等待按钮注入完成）
    setTimeout(() => {
      const buttons = document.querySelectorAll(`.${TEST_CONFIG.buttonClass}`);
      testCopyFunctionality(Array.from(buttons), selectorResult.elements);
      
      // 5. 生成测试报告
      generateTestReport(envResult, selectorResult, { buttons: Array.from(buttons) });
    }, 1500);
  }
  
  /**
   * 生成测试报告
   */
  function generateTestReport(envResult, selectorResult, injectionResult) {
    console.log('\n📊 测试报告');
    console.log('=====================================');
    
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      results: {
        environment: envResult.chromeAPI && envResult.contentScript,
        siteSupport: envResult.siteSupported,
        selectorMatching: selectorResult.success,
        buttonInjection: injectionResult.buttons.length > 0,
        elementsFound: selectorResult.elements.length,
        buttonsInjected: injectionResult.buttons.length
      }
    };
    
    console.log('🌐 测试环境:');
    console.log(`   URL: ${report.url}`);
    console.log(`   时间: ${new Date(report.timestamp).toLocaleString()}`);
    
    console.log('\n📋 测试结果:');
    Object.entries(report.results).forEach(([key, value]) => {
      const status = typeof value === 'boolean' ? (value ? '✅' : '❌') : '📊';
      console.log(`   ${status} ${key}: ${value}`);
    });
    
    const overallSuccess = report.results.environment && 
                          report.results.selectorMatching && 
                          report.results.buttonInjection;
    
    console.log('\n🎯 总体结果:');
    if (overallSuccess) {
      console.log('   ✅ 扩展功能正常工作');
    } else {
      console.log('   ❌ 扩展功能存在问题');
      console.log('   💡 请检查上述失败的测试项');
    }
    
    // 保存报告到全局变量（方便进一步分析）
    window.pureTextTestReport = report;
    console.log('\n💾 测试报告已保存到 window.pureTextTestReport');
  }
  
  // 导出测试函数到全局作用域
  window.pureTextTest = {
    runFullTest,
    checkExtensionEnvironment,
    testSelectorMatching,
    testButtonInjection,
    testCopyFunctionality
  };
  
  console.log('\n🛠️  测试工具已加载');
  console.log('💡 使用方法:');
  console.log('   pureTextTest.runFullTest()           - 运行完整测试');
  console.log('   pureTextTest.checkExtensionEnvironment() - 检查扩展环境');
  console.log('   pureTextTest.testSelectorMatching()  - 测试选择器');
  console.log('   pureTextTest.testButtonInjection()   - 测试按钮注入');
  
  // 自动运行测试（可选）
  if (window.location.search.includes('autotest=true')) {
    console.log('\n🚀 自动运行测试...');
    setTimeout(runFullTest, 1000);
  }
  
})();