// Kimi 网站精确选择器调试工具
// 解决复制了整个对话而不是单个 AI 回复的问题

(function() {
  console.log('🔍 开始精确定位 Kimi AI 回复元素...');
  
  // 清除之前的高亮
  document.querySelectorAll('*').forEach(el => {
    el.style.outline = '';
    el.style.outlineOffset = '';
  });

  // 分析当前的问题
  console.log('\n📊 当前问题分析:');
  const currentSelector = 'div[class*="assistant"]';
  const currentElements = document.querySelectorAll(currentSelector);
  console.log(`当前选择器 "${currentSelector}" 匹配了 ${currentElements.length} 个元素`);
  
  currentElements.forEach((el, index) => {
    const text = el.textContent?.trim();
    console.log(`元素 ${index + 1}: 文本长度 ${text?.length || 0} 字符`);
    if (text && text.length > 100) {
      console.log(`  预览: ${text.substring(0, 100)}...`);
    }
  });

  // 寻找更精确的选择器
  console.log('\n🎯 寻找更精确的 AI 回复选择器...');
  
  function findPreciseAIReplies() {
    const candidates = [];
    
    // 方法1: 查找只包含 AI 回复内容的元素
    const allDivs = document.querySelectorAll('div');
    
    allDivs.forEach(div => {
      const text = div.textContent?.trim();
      if (!text || text.length < 50) return;
      
      // 检查是否包含 AI 回复特征但不包含用户输入
      const hasAIFeatures = /(?:收到|请问|能力|功能|测试|推理|知识|翻译)/i.test(text);
      const hasUserFeatures = /(?:我想|能行吗|试试|来一个)/i.test(text);
      
      // 如果只有 AI 特征，没有用户特征，可能是纯 AI 回复
      if (hasAIFeatures && !hasUserFeatures) {
        // 检查是否是叶子节点或接近叶子节点
        const textNodes = Array.from(div.childNodes).filter(node => 
          node.nodeType === Node.TEXT_NODE && node.textContent.trim()
        );
        const childDivs = div.querySelectorAll('div');
        
        // 如果有直接文本内容或子div不多，可能是目标元素
        if (textNodes.length > 0 || childDivs.length <= 3) {
          candidates.push({
            element: div,
            text: text.substring(0, 150),
            textLength: text.length,
            className: div.className,
            childDivCount: childDivs.length,
            hasDirectText: textNodes.length > 0,
            selector: generateSelector(div),
            score: calculateScore(div, text)
          });
        }
      }
    });
    
    return candidates.sort((a, b) => b.score - a.score);
  }
  
  function generateSelector(element) {
    // 生成更精确的选择器
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ')
        .filter(c => c.trim() && !c.match(/^(css-|_)/))
        .slice(0, 2);
      
      if (classes.length > 0) {
        return `.${classes.join('.')}`;
      }
    }
    
    // 使用父元素上下文
    const parent = element.parentElement;
    if (parent && parent.className) {
      const parentClass = parent.className.split(' ')[0];
      if (parentClass) {
        return `[class*="${parentClass}"] > div`;
      }
    }
    
    return 'div';
  }
  
  function calculateScore(element, text) {
    let score = 0;
    
    // 文本长度适中加分
    if (text.length > 20 && text.length < 500) {
      score += 0.4;
    }
    
    // 包含完整句子加分
    if (/[。！？]/.test(text) || /[.!?]/.test(text)) {
      score += 0.2;
    }
    
    // 不包含按钮文字加分
    if (!/(?:复制|重试|分享|编辑|搜索)/.test(text)) {
      score += 0.3;
    }
    
    // 类名相关加分
    const className = element.className.toLowerCase();
    if (/(?:content|text|message|response)/.test(className)) {
      score += 0.1;
    }
    
    return score;
  }
  
  // 执行分析
  const candidates = findPreciseAIReplies();
  
  console.log(`\n✅ 找到 ${candidates.length} 个精确候选元素:`);
  
  candidates.slice(0, 5).forEach((candidate, index) => {
    console.log(`\n${index + 1}. ${candidate.selector}`);
    console.log(`   得分: ${candidate.score.toFixed(2)}`);
    console.log(`   类名: ${candidate.className}`);
    console.log(`   文本长度: ${candidate.textLength}`);
    console.log(`   子div数量: ${candidate.childDivCount}`);
    console.log(`   有直接文本: ${candidate.hasDirectText}`);
    console.log(`   文本预览: ${candidate.text}...`);
    
    // 高亮显示
    const color = index === 0 ? '#10B981' : // 绿色 - 最佳
                 index === 1 ? '#F59E0B' : // 黄色 - 次佳  
                 '#EF4444'; // 红色 - 其他
    
    candidate.element.style.outline = `3px solid ${color}`;
    candidate.element.style.outlineOffset = '2px';
  });
  
  if (candidates.length > 0) {
    const best = candidates[0];
    console.log(`\n🏆 推荐选择器: ${best.selector}`);
    console.log(`   理由: 得分最高 (${best.score.toFixed(2)})，文本长度适中，不包含多余内容`);
    
    // 测试选择器
    console.log('\n🧪 测试推荐选择器:');
    const testElements = document.querySelectorAll(best.selector);
    console.log(`选择器匹配了 ${testElements.length} 个元素`);
    
    testElements.forEach((el, i) => {
      const text = el.textContent?.trim();
      console.log(`  元素 ${i + 1}: ${text?.length || 0} 字符`);
      if (text && text.length > 20) {
        console.log(`    预览: ${text.substring(0, 80)}...`);
      }
    });
    
    // 保存结果
    window.kimiSelectorResult = {
      bestSelector: best.selector,
      allCandidates: candidates,
      testElements: testElements
    };
    
  } else {
    console.log('\n❌ 未找到合适的精确选择器');
  }
  
  // 清除高亮函数
  window.clearHighlights = function() {
    document.querySelectorAll('*').forEach(el => {
      el.style.outline = '';
      el.style.outlineOffset = '';
    });
    console.log('✅ 已清除所有高亮');
  };
  
  console.log('\n💡 提示:');
  console.log('- 绿色边框: 最佳候选（推荐使用）');
  console.log('- 黄色边框: 次佳候选');
  console.log('- 红色边框: 其他候选');
  console.log('- 运行 clearHighlights() 清除高亮');
  console.log('- 结果保存在 window.kimiSelectorResult');
  
})();