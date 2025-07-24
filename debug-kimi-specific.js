// 专门针对 Kimi 网站 AI 回复的精确定位脚本
(function() {
  console.log('🎯 专门定位 Kimi AI 回复元素...');
  
  // 清除之前的高亮
  document.querySelectorAll('*').forEach(el => {
    el.style.outline = '';
    el.style.outlineOffset = '';
  });

  // 查找包含特定 AI 回复文本的元素
  function findSpecificAIReply() {
    const targetText = "收到测试";
    const candidates = [];
    
    // 查找所有包含目标文本的元素
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(element => {
      const text = element.textContent?.trim();
      if (!text) return;
      
      // 检查是否包含目标文本
      if (text.includes(targetText)) {
        // 计算文本匹配度
        const isExactMatch = text.startsWith(targetText) && text.includes("请问你想测试");
        const textLength = text.length;
        const hasExtraContent = text.includes("复制") || text.includes("重试") || text.includes("分享");
        
        candidates.push({
          element,
          text: text.substring(0, 200),
          textLength,
          tagName: element.tagName,
          className: element.className,
          isExactMatch,
          hasExtraContent,
          selector: generateDetailedSelector(element),
          score: calculatePreciseScore(element, text, isExactMatch, hasExtraContent)
        });
      }
    });
    
    return candidates.sort((a, b) => b.score - a.score);
  }
  
  function generateDetailedSelector(element) {
    const selectors = [];
    
    // 方法1: ID选择器
    if (element.id) {
      selectors.push(`#${element.id}`);
    }
    
    // 方法2: 类名选择器
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ')
        .filter(c => c.trim() && !c.match(/^(css-|_|\d)/))
        .slice(0, 3);
      
      if (classes.length > 0) {
        selectors.push(`.${classes.join('.')}`);
        
        // 也尝试单个类名
        classes.forEach(cls => {
          selectors.push(`.${cls}`);
        });
      }
    }
    
    // 方法3: 属性选择器
    const meaningfulAttrs = ['data-role', 'data-type', 'data-id', 'role'];
    meaningfulAttrs.forEach(attr => {
      const value = element.getAttribute(attr);
      if (value) {
        selectors.push(`[${attr}="${value}"]`);
      }
    });
    
    // 方法4: 结构选择器
    const parent = element.parentElement;
    if (parent && parent.className) {
      const parentClass = parent.className.split(' ')[0];
      if (parentClass && parentClass.length > 2) {
        selectors.push(`[class*="${parentClass}"] > ${element.tagName.toLowerCase()}`);
      }
    }
    
    // 方法5: 标签名
    selectors.push(element.tagName.toLowerCase());
    
    return selectors[0] || 'unknown';
  }
  
  function calculatePreciseScore(element, text, isExactMatch, hasExtraContent) {
    let score = 0;
    
    // 精确匹配加分
    if (isExactMatch) {
      score += 1.0;
    }
    
    // 文本长度合理加分
    if (text.length > 30 && text.length < 200) {
      score += 0.5;
    }
    
    // 没有额外内容（按钮等）加分
    if (!hasExtraContent) {
      score += 0.8;
    }
    
    // 标签类型加分
    if (element.tagName === 'DIV' || element.tagName === 'P') {
      score += 0.2;
    }
    
    // 类名相关加分
    const className = element.className?.toLowerCase() || '';
    if (/(?:content|text|message|response|reply)/.test(className)) {
      score += 0.3;
    }
    
    // 层级深度适中加分
    let depth = 0;
    let current = element;
    while (current.parentElement && depth < 20) {
      depth++;
      current = current.parentElement;
    }
    
    if (depth >= 5 && depth <= 15) {
      score += 0.1;
    }
    
    return score;
  }
  
  // 执行查找
  const candidates = findSpecificAIReply();
  
  console.log(`\n📊 找到 ${candidates.length} 个包含目标文本的元素:`);
  
  candidates.forEach((candidate, index) => {
    console.log(`\n${index + 1}. ${candidate.tagName} - ${candidate.selector}`);
    console.log(`   得分: ${candidate.score.toFixed(2)}`);
    console.log(`   类名: ${candidate.className}`);
    console.log(`   文本长度: ${candidate.textLength}`);
    console.log(`   精确匹配: ${candidate.isExactMatch}`);
    console.log(`   有额外内容: ${candidate.hasExtraContent}`);
    console.log(`   文本预览: ${candidate.text}...`);
    
    // 高亮显示 - 不同颜色表示不同质量
    let color;
    if (candidate.score >= 2.0) {
      color = '#10B981'; // 绿色 - 最佳
    } else if (candidate.score >= 1.5) {
      color = '#F59E0B'; // 黄色 - 良好
    } else if (candidate.score >= 1.0) {
      color = '#EF4444'; // 红色 - 一般
    } else {
      color = '#6B7280'; // 灰色 - 较差
    }
    
    candidate.element.style.outline = `3px solid ${color}`;
    candidate.element.style.outlineOffset = '2px';
    
    // 为前3个候选添加标签
    if (index < 3) {
      const label = document.createElement('div');
      label.textContent = `${index + 1}`;
      label.style.cssText = `
        position: absolute;
        top: -10px;
        left: -10px;
        background: ${color};
        color: white;
        width: 20px;
        height: 20px;
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
    }
  });
  
  // 推荐最佳选择器
  if (candidates.length > 0) {
    const best = candidates[0];
    console.log(`\n🏆 推荐选择器: ${best.selector}`);
    console.log(`   理由: 得分最高 (${best.score.toFixed(2)})`);
    
    // 测试选择器的通用性
    console.log('\n🧪 测试选择器通用性:');
    try {
      const testElements = document.querySelectorAll(best.selector);
      console.log(`选择器匹配了 ${testElements.length} 个元素`);
      
      testElements.forEach((el, i) => {
        const text = el.textContent?.trim();
        const isAIReply = text && text.length > 20 && !text.includes("我想") && !text.includes("能行吗");
        console.log(`  元素 ${i + 1}: ${text?.length || 0} 字符, 疑似AI回复: ${isAIReply}`);
        if (text && text.length > 20) {
          console.log(`    预览: ${text.substring(0, 80)}...`);
        }
      });
    } catch (error) {
      console.error('选择器测试失败:', error);
    }
    
    // 生成备选选择器
    console.log('\n🔄 生成备选选择器:');
    const alternatives = generateAlternativeSelectors(best.element);
    alternatives.forEach((alt, i) => {
      try {
        const altElements = document.querySelectorAll(alt);
        console.log(`  备选 ${i + 1}: ${alt} (匹配 ${altElements.length} 个元素)`);
      } catch (error) {
        console.log(`  备选 ${i + 1}: ${alt} (无效选择器)`);
      }
    });
    
    // 保存结果
    window.kimiDebugResult = {
      bestSelector: best.selector,
      alternatives: alternatives,
      allCandidates: candidates
    };
  }
  
  function generateAlternativeSelectors(element) {
    const alternatives = [];
    
    // 基于类名的不同组合
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      
      // 单个类名
      classes.forEach(cls => {
        if (cls.length > 2 && !cls.match(/^(css-|_|\d)/)) {
          alternatives.push(`.${cls}`);
        }
      });
      
      // 类名包含匹配
      classes.forEach(cls => {
        if (cls.length > 3) {
          alternatives.push(`[class*="${cls}"]`);
        }
      });
    }
    
    // 基于父元素的选择器
    const parent = element.parentElement;
    if (parent) {
      if (parent.className) {
        const parentClass = parent.className.split(' ')[0];
        if (parentClass) {
          alternatives.push(`[class*="${parentClass}"] > ${element.tagName.toLowerCase()}`);
        }
      }
    }
    
    return [...new Set(alternatives)]; // 去重
  }
  
  // 清除高亮函数
  window.clearKimiHighlights = function() {
    document.querySelectorAll('*').forEach(el => {
      el.style.outline = '';
      el.style.outlineOffset = '';
      // 移除添加的标签
      const labels = el.querySelectorAll('div[style*="position: absolute"][style*="top: -10px"]');
      labels.forEach(label => label.remove());
    });
    console.log('✅ 已清除所有高亮');
  };
  
  console.log('\n💡 使用说明:');
  console.log('- 绿色边框: 最佳候选 (得分 ≥ 2.0)');
  console.log('- 黄色边框: 良好候选 (得分 ≥ 1.5)');
  console.log('- 红色边框: 一般候选 (得分 ≥ 1.0)');
  console.log('- 灰色边框: 较差候选');
  console.log('- 数字标签: 候选排名');
  console.log('- 运行 clearKimiHighlights() 清除高亮');
  console.log('- 结果保存在 window.kimiDebugResult');
  
})();