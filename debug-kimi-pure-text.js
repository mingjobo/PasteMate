// 专门找到 Kimi 纯文本内容的调试脚本
(function() {
  console.log('🎯 查找 Kimi 纯文本内容...');
  
  // 清除之前的高亮
  document.querySelectorAll('*').forEach(el => {
    el.style.outline = '';
    el.style.outlineOffset = '';
  });

  // 分析当前页面结构
  function analyzePureTextStructure() {
    const results = [];
    
    // 查找所有可能的容器
    const containers = document.querySelectorAll('.markdown-container, .markdown, .segment-content-box');
    
    console.log(`找到 ${containers.length} 个容器`);
    
    containers.forEach((container, index) => {
      console.log(`\n=== 分析容器 ${index + 1} ===`);
      console.log(`容器类名: ${container.className}`);
      console.log(`容器标签: ${container.tagName}`);
      
      const containerText = container.textContent?.trim();
      console.log(`容器总文本长度: ${containerText?.length || 0}`);
      
      // 检查是否包含多余内容
      const hasButtons = /(?:复制|重试|分享|搜索一下|本回答由 AI 生成|内容仅供参考)/.test(containerText);
      const hasUserQuestions = /(?:保证金比例是多少|强平后多久能拿回)/.test(containerText);
      
      console.log(`包含按钮文字: ${hasButtons}`);
      console.log(`包含用户问题: ${hasUserQuestions}`);
      
      if (hasButtons || hasUserQuestions) {
        console.log('❌ 此容器包含多余内容，需要查找子元素');
        
        // 在容器内查找纯文本子元素
        const children = container.querySelectorAll('*');
        
        children.forEach(child => {
          const childText = child.textContent?.trim();
          if (!childText || childText.length < 50) return;
          
          // 检查子元素是否是纯文本
          const childHasButtons = /(?:复制|重试|分享|搜索一下|本回答由 AI 生成|内容仅供参考)/.test(childText);
          const childHasUserQuestions = /(?:保证金比例是多少|强平后多久能拿回)/.test(childText);
          const childHasAIContent = /(?:强平|期货|交易所|保证金|合约)/.test(childText);
          
          if (childHasAIContent && !childHasButtons && !childHasUserQuestions) {
            // 检查是否是最小的纯文本容器
            const grandChildren = child.querySelectorAll('*');
            const hasComplexStructure = grandChildren.length > 5;
            
            results.push({
              element: child,
              text: childText.substring(0, 300),
              textLength: childText.length,
              tagName: child.tagName,
              className: child.className,
              hasButtons: childHasButtons,
              hasUserQuestions: childHasUserQuestions,
              hasAIContent: childHasAIContent,
              hasComplexStructure,
              parentContainer: container,
              selector: generateOptimalSelector(child),
              score: calculatePurityScore(child, childText, childHasAIContent, childHasButtons, childHasUserQuestions, hasComplexStructure)
            });
          }
        });
      } else {
        console.log('✅ 此容器可能是纯文本容器');
        
        results.push({
          element: container,
          text: containerText.substring(0, 300),
          textLength: containerText.length,
          tagName: container.tagName,
          className: container.className,
          hasButtons: false,
          hasUserQuestions: false,
          hasAIContent: true,
          hasComplexStructure: false,
          parentContainer: null,
          selector: generateOptimalSelector(container),
          score: calculatePurityScore(container, containerText, true, false, false, false)
        });
      }
    });
    
    return results.sort((a, b) => b.score - a.score);
  }
  
  function generateOptimalSelector(element) {
    const selectors = [];
    
    // 优先使用有意义的类名
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ')
        .filter(c => c.trim() && !c.match(/^(css-|_|\d|ng-)/))
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
    const attrs = ['data-role', 'data-type', 'data-content', 'role'];
    attrs.forEach(attr => {
      const value = element.getAttribute(attr);
      if (value) {
        selectors.push(`[${attr}="${value}"]`);
      }
    });
    
    // 结构选择器
    const parent = element.parentElement;
    if (parent && parent.className) {
      const parentClasses = parent.className.split(' ').filter(c => c.trim());
      if (parentClasses.length > 0) {
        const parentClass = parentClasses[0];
        selectors.push(`.${parentClass} > ${element.tagName.toLowerCase()}`);
        
        if (element.className) {
          const childClass = element.className.split(' ')[0];
          if (childClass) {
            selectors.push(`.${parentClass} .${childClass}`);
          }
        }
      }
    }
    
    return selectors[0] || element.tagName.toLowerCase();
  }
  
  function calculatePurityScore(element, text, hasAIContent, hasButtons, hasUserQuestions, hasComplexStructure) {
    let score = 0;
    
    // AI 内容加分
    if (hasAIContent) score += 2.0;
    
    // 没有按钮文字加分
    if (!hasButtons) score += 2.0;
    
    // 没有用户问题加分
    if (!hasUserQuestions) score += 1.0;
    
    // 文本长度适中加分
    if (text.length > 100 && text.length < 2000) {
      score += 1.0;
    }
    
    // 结构简单加分
    if (!hasComplexStructure) {
      score += 0.5;
    }
    
    // 包含完整句子加分
    if (/[。！？]/.test(text) && text.split(/[。！？]/).length > 2) {
      score += 0.5;
    }
    
    // 标签类型加分
    if (element.tagName === 'DIV' || element.tagName === 'P') {
      score += 0.3;
    }
    
    return score;
  }
  
  // 执行分析
  const results = analyzePureTextStructure();
  
  console.log(`\n📊 找到 ${results.length} 个纯文本候选:`);
  
  results.slice(0, 8).forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.tagName} - ${result.selector}`);
    console.log(`   得分: ${result.score.toFixed(2)}`);
    console.log(`   类名: ${result.className}`);
    console.log(`   文本长度: ${result.textLength}`);
    console.log(`   有按钮: ${result.hasButtons}`);
    console.log(`   有用户问题: ${result.hasUserQuestions}`);
    console.log(`   有AI内容: ${result.hasAIContent}`);
    console.log(`   结构复杂: ${result.hasComplexStructure}`);
    console.log(`   文本预览: ${result.text}...`);
    
    // 高亮显示
    let color;
    if (result.score >= 5.0) {
      color = '#10B981'; // 绿色 - 完美
    } else if (result.score >= 4.0) {
      color = '#F59E0B'; // 黄色 - 良好
    } else if (result.score >= 3.0) {
      color = '#EF4444'; // 红色 - 一般
    } else {
      color = '#6B7280'; // 灰色 - 较差
    }
    
    result.element.style.outline = `3px solid ${color}`;
    result.element.style.outlineOffset = '2px';
    
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
    
    result.element.style.position = 'relative';
    result.element.appendChild(label);
  });
  
  // 推荐最佳选择器
  if (results.length > 0) {
    const best = results[0];
    console.log(`\n🏆 推荐选择器: ${best.selector}`);
    console.log(`   理由: 得分最高 (${best.score.toFixed(2)})，纯AI内容，无多余文字`);
    
    // 测试选择器
    console.log('\n🧪 测试选择器:');
    try {
      const testElements = document.querySelectorAll(best.selector);
      console.log(`选择器匹配了 ${testElements.length} 个元素`);
      
      testElements.forEach((el, i) => {
        const text = el.textContent?.trim();
        const hasExtraContent = /(?:复制|重试|分享|本回答由 AI 生成)/.test(text);
        console.log(`  元素 ${i + 1}: ${text?.length || 0} 字符, 有多余内容: ${hasExtraContent}`);
        if (text && text.length > 50) {
          console.log(`    预览: ${text.substring(0, 100)}...`);
        }
      });
    } catch (error) {
      console.error('选择器测试失败:', error);
    }
    
    // 生成备选选择器
    const alternatives = generateAlternatives(results.slice(0, 3));
    console.log('\n🔄 备选选择器:');
    alternatives.forEach((alt, i) => {
      console.log(`  ${i + 1}. ${alt}`);
    });
    
    // 保存结果
    window.kimiPureTextResult = {
      bestSelector: best.selector,
      alternatives: alternatives,
      allResults: results
    };
  }
  
  function generateAlternatives(topResults) {
    const alternatives = [];
    
    topResults.forEach(result => {
      if (result.className) {
        const classes = result.className.split(' ').filter(c => c.trim());
        classes.forEach(cls => {
          if (cls.length > 3 && !cls.match(/^(css-|_|\d)/)) {
            alternatives.push(`.${cls}`);
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
  console.log('- 绿色边框: 完美候选 (得分 ≥ 5.0) - 纯AI内容，无多余文字');
  console.log('- 黄色边框: 良好候选 (得分 ≥ 4.0)');
  console.log('- 红色边框: 一般候选 (得分 ≥ 3.0)');
  console.log('- 数字标签: 候选排名');
  console.log('- 运行 clearKimiHighlights() 清除高亮');
  console.log('- 结果保存在 window.kimiPureTextResult');
  
})();