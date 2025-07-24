// 区分用户输入和 AI 回复的调试脚本
(function() {
  console.log('🔍 分析用户输入 vs AI 回复...');
  
  // 清除之前的高亮
  document.querySelectorAll('*').forEach(el => {
    el.style.outline = '';
    el.style.outlineOffset = '';
  });

  // 分析所有 segment-content-box 元素
  function analyzeUserVsAI() {
    const allBoxes = document.querySelectorAll('.segment-content-box');
    console.log(`找到 ${allBoxes.length} 个 .segment-content-box 元素`);
    
    const results = [];
    
    allBoxes.forEach((box, index) => {
      const text = box.textContent?.trim();
      if (!text || text.length < 10) return;
      
      console.log(`\n=== 分析元素 ${index + 1} ===`);
      console.log(`文本长度: ${text.length}`);
      console.log(`文本预览: ${text.substring(0, 100)}...`);
      
      // 分析元素特征
      const analysis = analyzeElement(box, text);
      
      results.push({
        element: box,
        index: index + 1,
        text: text.substring(0, 200),
        textLength: text.length,
        ...analysis
      });
      
      console.log(`类型判断: ${analysis.type}`);
      console.log(`置信度: ${analysis.confidence.toFixed(2)}`);
      console.log(`判断依据: ${analysis.reasons.join(', ')}`);
    });
    
    return results;
  }
  
  // 分析单个元素是用户输入还是 AI 回复
  function analyzeElement(element, text) {
    const reasons = [];
    let confidence = 0;
    let type = 'unknown';
    
    // 检查父元素和兄弟元素的上下文
    const context = analyzeContext(element);
    
    // 特征1: 文本内容特征
    const hasAIIndicators = /(?:强平|期货|交易所|保证金|合约|风险|平仓|开仓|触发|账户|权益|维持|追加|违规|持仓|超仓|交割|减仓|浮亏|LIFO|FIFO|剩余|扣除|退给|螺纹钢|举个例子|假设|收到|请问|能力|功能|测试|推理|知识|翻译|尽管出题)/.test(text);
    
    const hasUserIndicators = /(?:我想|能行吗|试试|来一个|怎么|可以吗|行不行|好不好|对吗|是吗|呢|吧|啊|哦|嗯|那|这样|这个|那个)/.test(text);
    
    // 特征2: 长度特征
    const isLongText = text.length > 100; // AI 回复通常较长
    const isShortText = text.length < 50;  // 用户输入通常较短
    
    // 特征3: 结构特征
    const hasStructure = /(?:\d+\.|•|·|1\.|2\.|3\.|一、|二、|三、)/.test(text); // AI 回复常有结构
    const hasQuestions = /[？?]/.test(text);
    
    // 特征4: 语气特征
    const hasExplanationTone = /(?:通常|一般|可能|建议|推荐|需要|应该|可以|能够|如果|假如|比如|例如|总结|综上|因此|所以)/.test(text);
    const hasCasualTone = /(?:我觉得|我认为|我想|感觉|好像|应该是|可能是|不太|有点|挺|还行|不错|可以|行)/.test(text);
    
    // 特征5: DOM 结构特征
    const className = element.className || '';
    const hasAIClasses = /(?:assistant|ai|bot|response|reply|answer)/.test(className.toLowerCase());
    const hasUserClasses = /(?:user|human|input|question)/.test(className.toLowerCase());
    
    // 特征6: 位置特征（通过上下文分析）
    const positionHint = context.positionHint;
    
    // 开始评分
    if (hasAIIndicators) {
      confidence += 0.8;
      reasons.push('包含AI回复特征词汇');
    }
    
    if (hasUserIndicators) {
      confidence -= 0.6;
      reasons.push('包含用户输入特征词汇');
    }
    
    if (isLongText) {
      confidence += 0.4;
      reasons.push('文本较长（AI回复特征）');
    }
    
    if (isShortText) {
      confidence -= 0.3;
      reasons.push('文本较短（用户输入特征）');
    }
    
    if (hasStructure) {
      confidence += 0.3;
      reasons.push('有结构化内容');
    }
    
    if (hasExplanationTone) {
      confidence += 0.3;
      reasons.push('有解释性语气');
    }
    
    if (hasCasualTone) {
      confidence -= 0.4;
      reasons.push('有随意语气（用户特征）');
    }
    
    if (hasAIClasses) {
      confidence += 0.5;
      reasons.push('类名包含AI特征');
    }
    
    if (hasUserClasses) {
      confidence -= 0.5;
      reasons.push('类名包含用户特征');
    }
    
    // 根据上下文调整
    if (positionHint === 'ai') {
      confidence += 0.2;
      reasons.push('位置暗示为AI回复');
    } else if (positionHint === 'user') {
      confidence -= 0.2;
      reasons.push('位置暗示为用户输入');
    }
    
    // 最终判断
    if (confidence > 0.3) {
      type = 'ai';
    } else if (confidence < -0.3) {
      type = 'user';
    } else {
      type = 'uncertain';
    }
    
    return {
      type,
      confidence: Math.abs(confidence),
      reasons,
      features: {
        hasAIIndicators,
        hasUserIndicators,
        isLongText,
        isShortText,
        hasStructure,
        hasExplanationTone,
        hasCasualTone,
        hasAIClasses,
        hasUserClasses
      }
    };
  }
  
  // 分析元素的上下文
  function analyzeContext(element) {
    // 查找附近的头像或标识
    const parent = element.parentElement;
    const grandParent = parent?.parentElement;
    
    // 检查是否有用户头像或AI头像的指示
    const nearbyElements = [element, parent, grandParent].filter(Boolean);
    
    for (const el of nearbyElements) {
      const html = el.innerHTML || '';
      const className = el.className || '';
      
      // 查找头像或角色指示
      if (/(?:user|human|person)/.test(className.toLowerCase()) || 
          /(?:avatar.*user|user.*avatar)/.test(html.toLowerCase())) {
        return { positionHint: 'user' };
      }
      
      if (/(?:assistant|ai|bot)/.test(className.toLowerCase()) || 
          /(?:avatar.*ai|ai.*avatar|bot.*avatar)/.test(html.toLowerCase())) {
        return { positionHint: 'ai' };
      }
    }
    
    return { positionHint: 'unknown' };
  }
  
  // 执行分析
  const results = analyzeUserVsAI();
  
  // 显示结果
  console.log('\n📊 分析结果汇总:');
  
  results.forEach(result => {
    console.log(`\n${result.index}. ${result.type.toUpperCase()} (置信度: ${result.confidence.toFixed(2)})`);
    console.log(`   文本: ${result.text}...`);
    
    // 高亮显示
    let color;
    if (result.type === 'ai') {
      color = '#10B981'; // 绿色 - AI回复
    } else if (result.type === 'user') {
      color = '#EF4444'; // 红色 - 用户输入
    } else {
      color = '#F59E0B'; // 黄色 - 不确定
    }
    
    result.element.style.outline = `3px solid ${color}`;
    result.element.style.outlineOffset = '2px';
    
    // 添加标签
    const label = document.createElement('div');
    label.textContent = result.type === 'ai' ? 'AI' : 
                       result.type === 'user' ? 'USER' : '?';
    label.style.cssText = `
      position: absolute;
      top: -15px;
      left: -15px;
      background: ${color};
      color: white;
      width: 30px;
      height: 20px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      z-index: 10000;
    `;
    
    result.element.style.position = 'relative';
    result.element.appendChild(label);
  });
  
  // 生成更精确的选择器建议
  const aiElements = results.filter(r => r.type === 'ai');
  const userElements = results.filter(r => r.type === 'user');
  
  console.log(`\n🎯 发现 ${aiElements.length} 个AI回复，${userElements.length} 个用户输入`);
  
  if (aiElements.length > 0) {
    console.log('\n💡 AI回复选择器建议:');
    
    // 尝试找到区分AI回复的特征
    const suggestions = generateSelectorSuggestions(aiElements, userElements);
    suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion.selector}`);
      console.log(`   说明: ${suggestion.description}`);
      console.log(`   匹配AI: ${suggestion.aiMatches}, 匹配用户: ${suggestion.userMatches}`);
    });
  }
  
  // 保存结果
  window.userVsAIResult = {
    aiElements,
    userElements,
    allResults: results
  };
  
  // 清除高亮函数
  window.clearUserVsAIHighlights = function() {
    document.querySelectorAll('*').forEach(el => {
      el.style.outline = '';
      el.style.outlineOffset = '';
      // 移除标签
      const labels = el.querySelectorAll('div[style*="position: absolute"][style*="top: -15px"]');
      labels.forEach(label => label.remove());
    });
    console.log('✅ 已清除所有高亮');
  };
  
  function generateSelectorSuggestions(aiElements, userElements) {
    const suggestions = [];
    
    // 建议1: 基于上下文的选择器
    suggestions.push({
      selector: '.segment-content-box:not([class*="user"])',
      description: '排除包含user类名的元素',
      aiMatches: aiElements.length,
      userMatches: 0
    });
    
    // 建议2: 基于长度的选择器（需要JS辅助）
    suggestions.push({
      selector: '.segment-content-box (长度>100字符)',
      description: '只选择长文本内容（需要JS过滤）',
      aiMatches: aiElements.filter(ai => ai.textLength > 100).length,
      userMatches: userElements.filter(user => user.textLength > 100).length
    });
    
    // 建议3: 基于内容特征的选择器
    suggestions.push({
      selector: '.segment-content-box (包含AI特征词)',
      description: '只选择包含AI回复特征词的元素（需要JS过滤）',
      aiMatches: aiElements.filter(ai => ai.features.hasAIIndicators).length,
      userMatches: userElements.filter(user => user.features.hasAIIndicators).length
    });
    
    return suggestions;
  }
  
  console.log('\n💡 使用说明:');
  console.log('- 绿色边框 + AI标签: AI回复');
  console.log('- 红色边框 + USER标签: 用户输入');
  console.log('- 黄色边框 + ?标签: 不确定');
  console.log('- 运行 clearUserVsAIHighlights() 清除高亮');
  console.log('- 结果保存在 window.userVsAIResult');
  
})();