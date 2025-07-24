// 强力修复 Kimi 复制内容的脚本 - 智能去除推荐问题
(function() {
  console.log('🔧 强力修复 Kimi 复制内容（智能版）...');

  // 创建增强的文本清理函数
  function cleanKimiText(text) {
    if (!text) return '';
    
    console.log('原始文本长度:', text.length);
    console.log('原始文本预览:', text.substring(0, 200) + '...');
    
    let cleanedText = text;
    
    // 第一步：去除明确的界面元素
    cleanedText = cleanedText
      // 去除 AI 生成声明
      .replace(/\s*本回答由\s*AI\s*生成[，,，。]*\s*内容仅供参考\s*/g, '')
      
      // 去除按钮文字
      .replace(/\s*(复制|重试|分享|编辑|搜索一下|点赞|踩|收藏|删除|举报)\s*/g, '')
      
      // 去除其他界面元素
      .replace(/\s*(查看更多|展开全部|收起|相关推荐)\s*/g, '');
    
    // 第二步：智能识别和去除推荐问题
    cleanedText = removeRecommendedQuestions(cleanedText);
    
    // 第三步：清理多余的空白字符
    cleanedText = cleanedText
      .replace(/\n\s*\n\s*\n/g, '\n\n')  // 多个空行变成两个
      .replace(/[ \t]+/g, ' ')           // 多个空格变成一个
      .trim();                           // 去除首尾空白
    
    console.log('清理后文本长度:', cleanedText.length);
    console.log('清理后文本预览:', cleanedText.substring(0, 200) + '...');
    
    return cleanedText;
  }

  // 智能识别和去除推荐问题
  function removeRecommendedQuestions(text) {
    // 推荐问题的特征模式
    const questionPatterns = [
      // 1. 以问号结尾的短句（通常是推荐问题）
      /\s*[^\n。！]{10,50}[？?]\s*/g,
      
      // 2. 常见的推荐问题开头
      /\s*(?:如何|怎么|什么是|为什么|哪些|多少|何时|在哪|是否)[^\n。！]{5,40}[？?]\s*/g,
      
      // 3. 疑问词开头的问题
      /\s*(?:保证金|强平|期货|交易|风险|合约|平仓|开仓)[^\n。！]{5,40}[？?]\s*/g,
      
      // 4. 时间相关的问题
      /\s*[^\n。！]*(?:多久|什么时候|何时|时间)[^\n。！]*[？?]\s*/g,
      
      // 5. 数量/比例相关的问题
      /\s*[^\n。！]*(?:多少|比例|费用|成本|价格)[^\n。！]*[？?]\s*/g
    ];
    
    let cleanedText = text;
    
    // 应用所有模式
    questionPatterns.forEach((pattern, index) => {
      const matches = cleanedText.match(pattern);
      if (matches) {
        console.log(`模式 ${index + 1} 匹配到 ${matches.length} 个推荐问题:`, matches);
        cleanedText = cleanedText.replace(pattern, '');
      }
    });
    
    // 更精确的方法：分析文本结构
    cleanedText = removeQuestionsByStructure(cleanedText);
    
    return cleanedText;
  }

  // 基于文本结构去除推荐问题
  function removeQuestionsByStructure(text) {
    // 将文本按行分割
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    const cleanedLines = [];
    let foundMainContent = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 检查是否是推荐问题的特征
      const isQuestion = line.endsWith('？') || line.endsWith('?');
      const isShort = line.length < 60; // 推荐问题通常比较短
      const hasQuestionWords = /(?:如何|怎么|什么|为什么|哪些|多少|何时|在哪|是否)/.test(line);
      const isStandalone = i === lines.length - 1 || (i < lines.length - 1 && lines[i + 1].endsWith('？'));
      
      // 如果是问题且符合推荐问题特征，跳过
      if (isQuestion && isShort && (hasQuestionWords || isStandalone)) {
        console.log('跳过推荐问题:', line);
        continue;
      }
      
      // 检查是否是主要内容
      if (line.length > 20 && !isQuestion) {
        foundMainContent = true;
      }
      
      // 如果已经找到主要内容，且当前行是短问题，可能是推荐问题
      if (foundMainContent && isQuestion && isShort) {
        console.log('跳过末尾推荐问题:', line);
        continue;
      }
      
      cleanedLines.push(line);
    }
    
    return cleanedLines.join('\n');
  }

  // 测试当前页面的复制功能
  function testCopyFunction() {
    const elements = document.querySelectorAll('.segment-content-box');
    console.log(`找到 ${elements.length} 个 .segment-content-box 元素`);
    
    if (elements.length === 0) {
      console.log('❌ 未找到目标元素');
      return;
    }
    
    // 测试所有元素，找到包含推荐问题的
    elements.forEach((element, index) => {
      const originalText = element.textContent?.trim();
      if (originalText && originalText.length > 100) {
        console.log(`\n=== 测试元素 ${index + 1} ===`);
        
        const hasQuestions = /[？?]/.test(originalText);
        const hasButtons = /(?:复制|重试|分享|本回答由 AI 生成)/.test(originalText);
        
        console.log(`包含问号: ${hasQuestions}`);
        console.log(`包含按钮: ${hasButtons}`);
        
        if (hasQuestions || hasButtons) {
          const cleanedText = cleanKimiText(originalText);
          
          console.log('=== 清理效果 ===');
          console.log('原始文本包含问号:', /[？?]/.test(originalText));
          console.log('清理后包含问号:', /[？?]/.test(cleanedText));
          console.log('原始文本包含按钮:', /(?:复制|重试|分享)/.test(originalText));
          console.log('清理后包含按钮:', /(?:复制|重试|分享)/.test(cleanedText));
          
          // 为这个元素创建测试按钮
          createTestButton(element, cleanedText, index + 1);
        }
      }
    });
  }

  // 创建测试按钮
  function createTestButton(element, cleanedText, index) {
    const testButton = document.createElement('button');
    testButton.textContent = `🧪 测试${index}`;
    testButton.style.cssText = `
      position: fixed;
      top: ${20 + (index - 1) * 50}px;
      right: 20px;
      background: #10B981;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    
    testButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(cleanedText);
        testButton.textContent = `✅ 成功${index}`;
        testButton.style.background = '#059669';
        
        setTimeout(() => {
          testButton.textContent = `🧪 测试${index}`;
          testButton.style.background = '#10B981';
        }, 2000);
        
        console.log(`✅ 测试按钮 ${index} 复制成功！`);
        console.log('复制的内容:', cleanedText.substring(0, 150) + '...');
      } catch (error) {
        console.error(`❌ 测试按钮 ${index} 复制失败:`, error);
      }
    });
    
    document.body.appendChild(testButton);
    
    // 10秒后自动移除
    setTimeout(() => {
      if (testButton.parentNode) {
        testButton.parentNode.removeChild(testButton);
      }
    }, 15000);
  }

  // 修复现有的复制按钮
  function fixExistingButtons() {
    const existingButtons = document.querySelectorAll('.puretext-copy-btn');
    console.log(`找到 ${existingButtons.length} 个现有的复制按钮`);
    
    existingButtons.forEach((button, index) => {
      const container = button.closest('.segment-content-box');
      if (container) {
        console.log(`修复按钮 ${index + 1}`);
        
        // 移除旧的事件监听器
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // 添加新的事件监听器
        newButton.addEventListener('click', async (event) => {
          event.preventDefault();
          event.stopPropagation();
          
          try {
            const originalText = container.textContent?.trim();
            const cleanedText = cleanKimiText(originalText);
            
            await navigator.clipboard.writeText(cleanedText);
            
            const originalBtnText = newButton.textContent;
            newButton.textContent = '✅ 已复制';
            newButton.style.background = '#10B981';
            
            setTimeout(() => {
              newButton.textContent = originalBtnText;
              newButton.style.background = '';
            }, 1500);
            
            console.log(`✅ 按钮 ${index + 1} 复制成功`);
          } catch (error) {
            console.error(`❌ 按钮 ${index + 1} 复制失败:`, error);
          }
        });
      }
    });
  }

  // 执行修复
  testCopyFunction();
  fixExistingButtons();
  
  // 保存函数到全局
  window.cleanKimiText = cleanKimiText;
  window.removeRecommendedQuestions = removeRecommendedQuestions;
  
  console.log('\n💡 使用说明:');
  console.log('- 右侧会出现多个测试按钮，对应不同的内容块');
  console.log('- 点击测试按钮查看智能清理后的复制效果');
  console.log('- 现有的复制按钮已被修复，会自动去除推荐问题');
  console.log('- 智能识别模式：问号结尾的短句、疑问词开头、时间/数量相关问题');
  
})();