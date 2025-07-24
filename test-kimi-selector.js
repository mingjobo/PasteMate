// Kimi 网站选择器测试脚本
// 在 Kimi 网站控制台中运行此脚本

console.log('🚀 开始测试 Kimi 网站选择器...');

// 测试所有可能的选择器
const testSelectors = [
  // 当前配置的选择器
  '.response-bubble',
  '[data-role="assistant"]',
  '.ai-message .content',
  '.message-content.assistant',
  '.chat-message.assistant',
  '.kimi-response',
  '.assistant-bubble',
  
  // 额外的可能选择器
  '.message.ai',
  '.chat-bubble.assistant',
  '.response-content',
  '.ai-response',
  '.assistant-message',
  '.bot-message',
  '.message:not(.user)',
  '.chat-item.ai',
  '.dialogue-content.assistant',
  '.conversation-message.ai',
  
  // 基于属性的选择器
  '[data-author="assistant"]',
  '[data-type="ai-response"]',
  '[data-sender="ai"]',
  '[role="assistant"]',
  
  // 通用模式
  'div[class*="response"]',
  'div[class*="assistant"]',
  'div[class*="ai"]',
  'div[class*="message"]:not([class*="user"])'
];

function testSelector(selector) {
  try {
    const elements = document.querySelectorAll(selector);
    const validElements = Array.from(elements).filter(el => {
      const text = el.textContent?.trim();
      return text && text.length > 20 && el.offsetWidth > 0 && el.offsetHeight > 0;
    });
    
    return {
      selector,
      totalCount: elements.length,
      validCount: validElements.length,
      elements: validElements,
      valid: validElements.length > 0
    };
  } catch (error) {
    return {
      selector,
      totalCount: 0,
      validCount: 0,
      elements: [],
      valid: false,
      error: error.message
    };
  }
}

// 测试所有选择器
const results = testSelectors.map(testSelector);

// 过滤出有效的选择器
const validResults = results.filter(r => r.valid);

console.log('\n📊 测试结果汇总:');
console.log(`总共测试了 ${results.length} 个选择器`);
console.log(`找到 ${validResults.length} 个有效选择器`);

if (validResults.length > 0) {
  console.log('\n✅ 有效的选择器:');
  validResults.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.selector}`);
    console.log(`   匹配元素: ${result.validCount} 个`);
    
    // 显示第一个元素的示例文本
    if (result.elements.length > 0) {
      const sampleText = result.elements[0].textContent?.trim().substring(0, 100);
      console.log(`   示例文本: ${sampleText}...`);
      
      // 高亮显示元素
      result.elements.forEach(el => {
        el.style.outline = `2px solid ${index === 0 ? '#4CAF50' : '#FFC107'}`;
        el.style.outlineOffset = '2px';
      });
    }
  });
  
  // 推荐最佳选择器
  const best = validResults[0];
  console.log(`\n🏆 推荐使用: ${best.selector}`);
  console.log(`   理由: 匹配 ${best.validCount} 个有效元素`);
  
} else {
  console.log('\n❌ 未找到有效的选择器');
  console.log('可能的原因:');
  console.log('1. 页面还没有 AI 回复内容');
  console.log('2. Kimi 使用了新的 DOM 结构');
  console.log('3. 需要手动检查页面结构');
}

// 智能分析页面结构
console.log('\n🔍 智能分析页面结构...');

function analyzePageStructure() {
  const candidates = [];
  
  // 查找包含大量文本的元素
  const allElements = document.querySelectorAll('div, section, article, p');
  
  allElements.forEach(el => {
    const text = el.textContent?.trim();
    if (text && text.length > 100 && text.length < 5000) {
      // 检查是否包含 AI 回复的特征
      const hasAIFeatures = /(?:我是|我可以|根据|基于|建议|推荐|总结|分析|Kimi)/i.test(text);
      
      if (hasAIFeatures) {
        candidates.push({
          element: el,
          text: text.substring(0, 150),
          className: el.className,
          tagName: el.tagName,
          attributes: Array.from(el.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ')
        });
      }
    }
  });
  
  if (candidates.length > 0) {
    console.log(`\n🎯 找到 ${candidates.length} 个可能的 AI 回复元素:`);
    candidates.forEach((candidate, index) => {
      console.log(`\n${index + 1}. <${candidate.tagName.toLowerCase()} class="${candidate.className}">`);
      console.log(`   属性: ${candidate.attributes}`);
      console.log(`   文本: ${candidate.text}...`);
      
      // 高亮显示
      candidate.element.style.outline = '3px solid #FF5722';
      candidate.element.style.outlineOffset = '2px';
    });
  } else {
    console.log('\n❌ 未找到包含 AI 特征的元素');
  }
}

analyzePageStructure();

// 清除高亮的函数
window.clearHighlights = function() {
  document.querySelectorAll('*').forEach(el => {
    el.style.outline = '';
    el.style.outlineOffset = '';
  });
  console.log('✅ 已清除所有高亮');
};

console.log('\n💡 提示:');
console.log('- 绿色边框: 最佳选择器匹配的元素');
console.log('- 黄色边框: 其他有效选择器匹配的元素');
console.log('- 红色边框: 智能分析发现的候选元素');
console.log('- 运行 clearHighlights() 清除所有高亮');

// 返回结果供进一步使用
return {
  validSelectors: validResults.map(r => r.selector),
  bestSelector: validResults.length > 0 ? validResults[0].selector : null,
  candidates: validResults
};