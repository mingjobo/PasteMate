// 修复 Kimi 选择器 - 找到只包含纯文本的元素
(function() {
  console.log('🔧 修复 Kimi 选择器 - 查找纯文本元素...');
  
  // 清除之前的高亮
  document.querySelectorAll('*').forEach(el => {
    el.style.outline = '';
    el.style.outlineOffset = '';
  });

  // 查找当前 AI 回复中的纯文本元素
  function findPureTextElements() {
    const candidates = [];
    
    // 首先找到包含 AI 回复的容器
    const containers = document.querySelectorAll('.segment-content-box');
    console.log(`找到 ${containers.length} 个 .segment-content-box 容器`);
    
    containers.forEach((container, containerIndex) => {
      console.log(`\n分析容器 ${containerIndex + 1}:`);
      const containerText = container.textContent?.trim();
      console.log(`  容器文本长度: ${containerText?.length || 0}`);
      console.log(`  容器文本预览: ${containerText?.substring(0, 100)}...`);
      
      // 在容器内查找不包含按钮文字的子元素
      const allChildren = container.querySelectorAll('*');
      
      allChildren.forEach(child => {
        const text = child.textContent?.trim();
        if (!text || text.length < 20) return;
        
        // 检查是否包含按钮文字
        const hasButtonText = /(?:复制|重试|分享|编辑|搜索|点赞|踩|收藏)/.test(text);
        const hasUserText = /(?:我想|能行吗|试试|来一个)/.test(text);
        
        // 检查是否是纯 AI 回复文本
        const hasAIText = /(?:强平|保证金|触发|交易所|期货|合约|风险)/.test(text) || 
                         /(?:收到|请问|能力|功能|测试|推理|知识|翻译)/.test(text);
        
        // 如果包含 AI 文本但不包含按钮文字和用户文字
        if (hasAIText && !hasButtonText && !hasUserText) {
          // 检查元素的层级和类型
          const isLeafNode = child.children.length === 0 || 
                           Array.from(child.children).every(c => c.tagName === 'BR' || c.tagName === 'SPAN');
          
          candidates.push({
            element: child,
            text: text.substring(0, 200),
            textLength: text.length,
            tagName: child.tagName,
            className: child.className,
            isLeafNode,
            hasButtonText,
            hasUserText,
            hasAIText,
            containerIndex,
            selector: generatePreciseSelector(child),
            score: calculateTextPurity(child, text, hasAIText, hasButtonText, hasUserText, isLeafNode)
          });
        }
      });
    });
    
    return candidates.sort((a, b) => b.score - a.score);
  }
  
  function generatePreciseSelector(element) {
    const selectors = [];
    
    // ID 选择器
    if (element.id) {
      selectors.push(`#${element.id}`);
    }
    
    // 类名选择器
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ')
        .filter(c => c.trim() && !c.match(/^(css-|_|\d)/))
        .slice(0, 2);
      
      if (classes.length > 0) {
        selectors.push(`.${classes.join('.')}`);
        
        // 单个类名
        classes.forEach(cls => {
          if (cls.length > 3) {
            selectors.push(`.${cls}`);
          }
        });
      }
    }
    
    // 属性选择器
    const attrs = ['data-role', 'data-type', 'data-content'];
    attrs.forEach(attr => {
      const value = element.getAttribute(attr);
      if (value) {
        selectors.push(`[${attr}="${value}"]`);
      }
    });
    
    // 结构选择器
    if (element.parentElement && element.parentElement.className) {
      const parentClass = element.parentElement.className.split(' ')[0];
      if (parentClass && parentClass.length > 3) {
        selectors.push(`.${parentClass} > ${element.tagName.toLowerCase()}`);
      }
    }
    
    // 在 segment-content-box 内的选择器
    selectors.push(`.segment-content-box ${element.tagName.toLowerCase()}`);
    
    return selectors[0] || element.tagName.toLowerCase();
  }
  
  function calculateTextPurity(element, text, hasAIText, hasButtonText, hasUserText, isLeafNode) {
    let score = 0;
    
    // AI 文本内容加分
    if (hasAIText) {
      score += 1.0;
    }
    
    // 没有按钮文字加分
    if (!hasButtonText) {
      score += 1.5;
    }
    
    // 没有用户文字加分
    if (!hasUserText) {
      score += 0.5;
    }
    
    // 叶子节点加分（更可能是纯文本）
    if (isLeafNode) {
      score += 0.8;
    }
    
    // 文本长度适中加分
    if (text.length > 50 && text.length < 800) {
      score += 0.5;
    }
    
    // 包含完整句子加分
    if (/[。！？～]/.test(text) || /[.!?]/.test(text)) {
      score += 0.3;
    }
    
    // 标签类型加分
    if (element.tagName === 'P' || element.tagName === 'DIV') {
      score += 0.2;
    }
    
    return score;
  }
  
  // 执行查找
  const candidates = findPureTextElements();
  
  console.log(`\n📊 找到 ${candidates.length} 个纯文本候选元素:`);
  
  candidates.slice(0, 8).forEach((candidate, index) => {
    console.log(`\n${index + 1}. ${candidate.tagName} - ${candidate.selector}`);
    console.log(`   得分: ${candidate.score.toFixed(2)}`);
    console.log(`   类名: ${candidate.className}`);
    console.log(`   文本长度: ${candidate.textLength}`);
    console.log(`   叶子节点: ${candidate.isLeafNode}`);
    console.log(`   有按钮文字: ${candidate.hasButtonText}`);
    console.log(`   有用户文字: ${candidate.hasUserText}`);
    console.log(`   有AI文字: ${candidate.hasAIText}`);
    console.log(`   文本预览: ${candidate.text}...`);
    
    // 高亮显示
    let color;
    if (candidate.score >= 3.5) {
      color = '#10B981'; // 绿色 - 最佳
    } else if (candidate.score >= 2.5) {
      color = '#F59E0B'; // 黄色 - 良好
    } else if (candidate.score >= 1.5) {
      color = '#EF4444'; // 红色 - 一般
    } else {
      color = '#6B7280'; // 灰色 - 较差
    }
    
    candidate.element.style.outline = `3px solid ${color}`;
    candidate.element.style.outlineOffset = '2px';
    
    // 添加序号标签
    const label = document.createElement('div');
    label.textContent = `${index + 1}`;
    label.style.cssText = `
      position: absolute;
      top: -15px;
      left: -15px;
      background: ${color};
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      z-index: 10000;
    `;
    
    candidate.element.style.position = 'relative';
    candidate.element.appendChild(label);
  });
  
  // 推荐最佳选择器
  if (candidates.length > 0) {
    const best = candidates[0];
    console.log(`\n🏆 推荐选择器: ${best.selector}`);
    console.log(`   理由: 得分最高 (${best.score.toFixed(2)})，纯文本内容，无按钮文字`);
    
    // 测试选择器
    console.log('\n🧪 测试选择器通用性:');
    try {
      const testElements = document.querySelectorAll(best.selector);
      console.log(`选择器匹配了 ${testElements.length} 个元素`);
      
      testElements.forEach((el, i) => {
        const text = el.textContent?.trim();
        const hasButtons = /(?:复制|重试|分享)/.test(text);
        console.log(`  元素 ${i + 1}: ${text?.length || 0} 字符, 包含按钮: ${hasButtons}`);
        if (text && text.length > 20) {
          console.log(`    预览: ${text.substring(0, 80)}...`);
        }
      });
    } catch (error) {
      console.error('选择器测试失败:', error);
    }
    
    // 生成备选选择器
    const alternatives = generateAlternatives(candidates.slice(0, 3));
    console.log('\n🔄 备选选择器:');
    alternatives.forEach((alt, i) => {
      console.log(`  ${i + 1}. ${alt}`);
    });
    
    // 保存结果
    window.kimiFixResult = {
      bestSelector: best.selector,
      alternatives: alternatives,
      allCandidates: candidates
    };
  }
  
  function generateAlternatives(topCandidates) {
    const alternatives = [];
    
    topCandidates.forEach(candidate => {
      if (candidate.className) {
        const classes = candidate.className.split(' ').filter(c => c.trim());
        classes.forEach(cls => {
          if (cls.length > 3 && !cls.match(/^(css-|_|\d)/)) {
            alternatives.push(`.${cls}`);
            alternatives.push(`[class*="${cls}"]`);
          }
        });
      }
    });
    
    return [...new Set(alternatives)];
  }
  
  // 清除高亮函数
  window.clearKimiHighlights = function() {
    document.querySelectorAll('*').forEach(el => {
      el.style.outline = '';
      el.style.outlineOffset = '';
      // 移除标签
      const labels = el.querySelectorAll('div[style*="position: absolute"][style*="top: -15px"]');
      labels.forEach(label => label.remove());
    });
    console.log('✅ 已清除所有高亮');
  };
  
  console.log('\n💡 使用说明:');
  console.log('- 绿色边框: 最佳候选 (得分 ≥ 3.5) - 纯文本，无按钮');
  console.log('- 黄色边框: 良好候选 (得分 ≥ 2.5)');
  console.log('- 红色边框: 一般候选 (得分 ≥ 1.5)');
  console.log('- 数字标签: 候选排名');
  console.log('- 运行 clearKimiHighlights() 清除高亮');
  console.log('- 结果保存在 window.kimiFixResult');
  
})();