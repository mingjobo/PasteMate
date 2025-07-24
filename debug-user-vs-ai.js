// 快速调试用户消息 vs AI回复检测
(function() {
    console.log('🔍 快速调试用户消息 vs AI回复检测...');
    
    // 查找所有有复制按钮的元素
    const buttonsWithContainers = document.querySelectorAll('.puretext-copy-btn');
    console.log(`\n找到 ${buttonsWithContainers.length} 个复制按钮`);
    
    buttonsWithContainers.forEach((button, index) => {
        console.log(`\n=== 按钮 ${index + 1} ===`);
        
        // 找到按钮对应的内容容器
        let container = button.closest('.segment-content-box');
        if (!container) {
            // 尝试向上查找包含文本内容的元素
            let current = button.parentElement;
            while (current && current !== document.body) {
                const text = current.textContent?.trim();
                if (text && text.length > 50) {
                    container = current;
                    break;
                }
                current = current.parentElement;
            }
        }
        
        if (container) {
            const text = container.textContent?.trim();
            console.log(`内容长度: ${text.length}`);
            console.log(`内容预览: ${text.substring(0, 100)}...`);
            
            // 简单的用户消息特征检测
            const isShortQuestion = text.length < 100 && (text.endsWith('？') || text.endsWith('?'));
            const hasUserWords = /^(强平指的是|怎么|请问|能否|可以吗|我想|我需要)/.test(text);
            const hasAIWords = /(根据|建议|您可以|以下是|首先|其次|需要注意)/.test(text);
            
            console.log(`短问题特征: ${isShortQuestion}`);
            console.log(`用户词汇: ${hasUserWords}`);
            console.log(`AI词汇: ${hasAIWords}`);
            
            // 判断可能的类型
            if (isShortQuestion && hasUserWords && !hasAIWords) {
                console.log('🚨 可能是用户消息！');
                
                // 高亮显示
                container.style.outline = '3px solid red';
                container.style.outlineOffset = '2px';
                
                // 添加标签
                const label = document.createElement('div');
                label.textContent = '用户消息';
                label.style.cssText = `
                    position: absolute;
                    top: -25px;
                    left: 0;
                    background: red;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    z-index: 10001;
                `;
                container.style.position = 'relative';
                container.appendChild(label);
                
            } else if (hasAIWords || text.length > 200) {
                console.log('✅ 可能是AI回复');
                
                // 绿色边框
                container.style.outline = '2px solid green';
                container.style.outlineOffset = '2px';
                
            } else {
                console.log('❓ 类型不确定');
                
                // 黄色边框
                container.style.outline = '2px solid orange';
                container.style.outlineOffset = '2px';
            }
            
        } else {
            console.log('❌ 未找到对应的内容容器');
        }
    });
    
    // 创建清除高亮的按钮
    const clearButton = document.createElement('button');
    clearButton.textContent = '清除高亮';
    clearButton.style.cssText = `
        position: fixed;
        top: 80px;
        left: 20px;
        background: #6B7280;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        z-index: 10000;
    `;
    
    clearButton.addEventListener('click', () => {
        document.querySelectorAll('*').forEach(el => {
            el.style.outline = '';
            el.style.outlineOffset = '';
            // 移除标签
            const labels = el.querySelectorAll('div[style*="position: absolute"][style*="top: -25px"]');
            labels.forEach(label => label.remove());
        });
        clearButton.remove();
        console.log('✅ 已清除所有高亮');
    });
    
    document.body.appendChild(clearButton);
    
    console.log('\n💡 说明:');
    console.log('- 红色边框: 可能是用户消息（不应该有复制按钮）');
    console.log('- 绿色边框: 可能是AI回复（应该有复制按钮）');
    console.log('- 橙色边框: 类型不确定');
    console.log('- 点击"清除高亮"按钮移除所有标记');
    
})();