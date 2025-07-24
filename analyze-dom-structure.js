// 修复版本 - 基于DOM结构分析用户输入和AI回复
(function() {
  console.log('🏗️ 分析DOM结构来区分用户和AI...');
  
  // 清除之前的高亮
  document.querySelectorAll('*').forEach(el => {
    el.style.outline = '';
    el.style.outlineOffset = '';
  });

  // 分析DOM结构
  function analyzeDOMStructure() {
    const allBoxes = document.querySelectorAll('.segment-content-box');
    console.log(`找到 ${allBoxes.length} 个 .segment-content-box 元素`);
    
    const results = [];
    
    allBoxes.forEach((box, index) => {
      const text = box.textContent?.trim();
      if (!text || text.length < 10) return;
      
      console.log(`\n=== 分析元素 ${index + 1} ===`);
      console.log(`文本预览: ${text.substring(0, 80)}...`);
      
      // 分析DOM结构特征
      const domAnalysis = analyzeDOMFeatures(box);
      
      results.push({
        element: box,
        index: index + 1,
        text: text.substring(0, 150),
        ...domAnalysis
      });
      
      console.log(`DOM路径: ${domAnalysis.path}`);
      console.log(`附近头像: ${domAnalysis.nearbyAvatar}`);
      console.log(`特殊标识: ${domAnalysis.specialMarkers}`);
      console.log(`推测类型: ${domAnalysis.predictedType.type} (得分: ${domAnalysis.predictedType.score})`);
      console.log(`判断依据: ${domAnalysis.predictedType.reasons.join(', ')}`);
    });
    
    return results;
  }
  
  // 分析DOM特征
  function analyzeDOMFeatures(element) {
    const features = {};
    
    features.path = getDOMPath(element);
    features.nearbyAvatar = findNearbyAvatar(element);
    features.specialMarkers = findSpecialMarkers(element);
    features.parentInfo = analyzeParentElements(element);
    features.predictedType = predictTypeFromDOM(features);
    
    return features;
  }
  
  // 获取DOM路径
  function getDOMPath(element) {
    const path = [];
    let current = element;
    
    while (current && current !== document.body && path.length < 6) {
      let selector = current.tagName.toLowerCase();
      
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.split(' ').filter(c => c.trim()).slice(0, 2);
        if (classes.length > 0) {
          selector += `.${classes.join('.')}`;
        }
      }
      
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }
  
  // 查找附近的头像 - 修复版本
  function findNearbyAvatar(element) {
    const searchRadius = 4;
    let current = element;
    
    for (let i = 0; i < searchRadius && current; i++) {
      const avatars = current.querySelectorAll('img, div[class*="avatar"], div[class*="icon"], svg');
      
      for (const avatar of avatars) {
        const src = avatar.src || '';
        const className = avatar.className || '';
        const alt = avatar.alt || '';
        
        // 确保转换为字符串
        const classStr = String(className).toLowerCase();
        const altStr = String(alt).toLowerCase();
        const srcStr = String(src).toLowerCase();
        
        if (/(?:user|human|person)/.test(classStr) ||
            /(?:user|human|person)/.test(altStr) ||
            /(?:user|human|person)/.test(srcStr)) {
          return 'user';
        }
        
        if (/(?:ai|bot|assistant|kimi)/.test(classStr) ||
            /(?:ai|bot|assistant|kimi)/.test(altStr) ||
            /(?:ai|bot|assistant|kimi)/.test(srcStr)) {
          return 'ai';
        }
      }
      
      current = current.parentElement;
    }
    
    return 'none';
  }
  
  // 查找特殊标识
  function findSpecialMarkers(element) {
    const markers = [];
    const searchArea = element.parentElement?.parentElement || element.parentElement || element;
    
    const roleElements = searchArea.querySelectorAll('[data-role], [role], [data-author], [data-type]');
    roleElements.forEach(el => {
      const role = el.getAttribute('data-role') || 
                  el.getAttribute('role') || 
                  el.getAttribute('data-author') ||
                  el.getAttribute('data-type');
      if (role) {
        markers.push(`${role}`);
      }
    });
    
    return markers.join(', ') || 'none';
  }
  
  // 分析父元素信息
  function analyzeParentElements(element) {
    const info = [];
    let current = element.parentElement;
    let depth = 0;
    
    while (current && depth < 3) {
      const className = String(current.className || '').toLowerCase();
      const tagName = current.tagName.toLowerCase();
      
      info.push({
        tag: tagName,
        classes: className,
        hasUserFeatures: /(?:user|human|person)/.test(className),
        hasAIFeatures: /(?:ai|bot|assistant|kimi)/.test(className)
      });
      
      current = current.parentElement;
      depth++;
    }
    
    return info;
  }
  
  // 基于DOM特征预测类型
  function predictTypeFromDOM(features) {
    let score = 0;
    const reasons = [];
    
    // 基于头像判断
    if (features.nearbyAvatar === 'user') {
      score -= 2;
      reasons.push('附近有用户头像');
    } else if (features.nearbyAvatar === 'ai') {
      score += 2;
      reasons.push('附近有AI头像');
    }
    
    // 基于特殊标识判断
    if (features.specialMarkers.includes('user')) {
      score -= 2;
      reasons.push('有用户角色标识');
    } else if (features.specialMarkers.includes('assistant') || features.specialMarkers.includes('ai')) {
      score += 2;
      reasons.push('有AI角色标识');
    }
    
    // 基于DOM路径判断
    const pathLower = features.path.toLowerCase();
    if (/user|human/.test(pathLower)) {
      score -= 1;
      reasons.push('DOM路径包含用户特征');
    } else if (/ai|bot|assistant/.test(pathLower)) {
      score += 1;
      reasons.push('DOM路径包含AI特征');
    }
    
    // 基于父元素判断
    const hasUserParent = features.parentInfo.some(p => p.hasUserFeatures);
    const hasAIParent = features.parentInfo.some(p => p.hasAIFeatures);
    
    if (hasUserParent) {
      score -= 1;
      reasons.push('父元素有用户特征');
    } else if (hasAIParent) {
      score += 1;
      reasons.push('父元素有AI特征');
    }
    
    let type = 'uncertain';
    if (score > 0.5) {
      type = 'ai';
    } else if (score < -0.5) {
      type = 'user';
    }
    
    return { type, score, reasons };
  }
  
  // 执行分析
  const results = analyzeDOMStructure();
  
  // 显示结果并高亮
  results.forEach(result => {
    const prediction = result.predictedType;
    
    let color = prediction.type === 'ai' ? '#10B981' : 
               prediction.type === 'user' ? '#EF4444' : '#F59E0B';
    
    result.element.style.outline = `3px solid ${color}`;
    result.element.style.outlineOffset = '2px';
    
    const label = document.createElement('div');
    label.textContent = prediction.type === 'ai' ? 'AI' : 
                       prediction.type === 'user' ? 'USER' : '?';
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
  
  // 统计结果
  const aiElements = results.filter(r => r.predictedType.type === 'ai');
  const userElements = results.filter(r => r.predictedType.type === 'user');
  const uncertainElements = results.filter(r => r.predictedType.type === 'uncertain');
  
  console.log(`\n🎯 DOM分析结果:`);
  console.log(`AI回复: ${aiElements.length} 个`);
  console.log(`用户输入: ${userElements.length} 个`);
  console.log(`不确定: ${uncertainElements.length} 个`);
  
  if (aiElements.length > 0) {
    console.log('\n💡 AI元素的DOM特征:');
    aiElements.forEach((ai, i) => {
      console.log(`  AI${i+1}: ${ai.predictedType.reasons.join(', ')}`);
      console.log(`    路径: ${ai.path}`);
    });
  }
  
  if (userElements.length > 0) {
    console.log('\n💡 用户元素的DOM特征:');
    userElements.forEach((user, i) => {
      console.log(`  USER${i+1}: ${user.predictedType.reasons.join(', ')}`);
      console.log(`    路径: ${user.path}`);
    });
  }
  
  // 简单的手动检查建议
  console.log('\n🔍 手动检查建议:');
  console.log('1. 右键点击用户输入 -> 检查元素，查看其父元素结构');
  console.log('2. 右键点击AI回复 -> 检查元素，查看其父元素结构');
  console.log('3. 对比两者的差异，寻找可靠的区分特征');
  
  // 保存结果
  window.domAnalysisResult = {
    aiElements,
    userElements,
    uncertainElements,
    allResults: results
  };
  
})();