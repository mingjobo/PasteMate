// 简单的调试脚本，用于测试插件是否能正常工作

console.log('🔧 Debug script loaded');

// 检查基本环境
console.log('📍 Current URL:', window.location.href);
console.log('📍 Current hostname:', window.location.hostname);

// 检查Chrome扩展API是否可用
if (typeof chrome !== 'undefined') {
  console.log('✅ Chrome extension API available');
  if (chrome.i18n) {
    console.log('✅ Chrome i18n API available');
  }
} else {
  console.log('❌ Chrome extension API not available');
}

// 检查DOM是否准备好
if (document.readyState === 'loading') {
  console.log('⏳ DOM is still loading');
  document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded');
    testButtonInjection();
  });
} else {
  console.log('✅ DOM already loaded');
  testButtonInjection();
}

// 测试按钮注入功能
function testButtonInjection() {
  console.log('🧪 Testing button injection...');
  
  // 查找目标元素
  const targets = [
    '[data-message-author-role="assistant"] .markdown',
    '[data-role="assistant"]',
    '.message.assistant'
  ];
  
  targets.forEach((selector, index) => {
    const elements = document.querySelectorAll(selector);
    console.log(`🎯 Selector ${index + 1} (${selector}): found ${elements.length} elements`);
    
    if (elements.length > 0) {
      elements.forEach((element, i) => {
        console.log(`  Element ${i + 1}:`, element);
        
        // 尝试手动注入一个测试按钮
        if (!element.querySelector('.debug-test-btn')) {
          const testButton = document.createElement('button');
          testButton.textContent = 'Debug Test Button';
          testButton.className = 'debug-test-btn';
          testButton.style.cssText = `
            position: absolute;
            bottom: 8px;
            right: 8px;
            background: #ff6b6b;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 12px;
            cursor: pointer;
            z-index: 10000;
          `;
          
          // 确保父元素有相对定位
          if (window.getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
          }
          
          testButton.addEventListener('click', function() {
            alert('Debug button clicked! This means button injection works.');
          });
          
          element.appendChild(testButton);
          console.log(`✅ Debug button injected into element ${i + 1}`);
        }
      });
    }
  });
  
  // 检查是否有现有的插件按钮
  const existingButtons = document.querySelectorAll('.puretext-copy-btn');
  console.log(`🔍 Found ${existingButtons.length} existing plugin buttons`);
}

// 每5秒检查一次
setInterval(() => {
  const debugButtons = document.querySelectorAll('.debug-test-btn');
  const pluginButtons = document.querySelectorAll('.puretext-copy-btn');
  console.log(`📊 Status check - Debug buttons: ${debugButtons.length}, Plugin buttons: ${pluginButtons.length}`);
}, 5000);