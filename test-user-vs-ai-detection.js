// 测试用户消息 vs AI回复检测功能
(function() {
    console.log('🧪 测试用户消息 vs AI回复检测功能...');
    
    // 检查扩展是否正确加载
    function checkExtensionStatus() {
        console.log('\n=== 扩展状态检查 ===');
        
        const hasExtension = typeof pureTextExtension !== 'undefined' && pureTextExtension;
        const hasButtonInjector = hasExtension && pureTextExtension.buttonInjector;
        
        console.log(`扩展实例: ${hasExtension ? '✅' : '❌'}`);
        console.log(`按钮注入器: ${hasButtonInjector ? '✅' : '❌'}`);
        
        if (hasButtonInjector && typeof pureTextExtension.buttonInjector.isAIResponse === 'function') {
            console.log('✅ isAIResponse 函数可用');
            return pureTextExtension.buttonInjector;
        } else {
            console.log('❌ isAIResponse 函数不可用');
            return null;
        }
    }
    
    // 分析页面上的所有消息元素
    function analyzePageMessages() {
        console.log('\n=== 页面消息分析 ===');
        
        const buttonInjector = checkExtensionStatus();
        if (!buttonInjector) {
            console.log('❌ 无法获取按钮注入器，跳过分析');
            return;
        }
        
        // 查找所有可能的消息元素
        const selectors = [
            '.segment-content-box',
            '.markdown-container',
            '.markdown',
            'div[class*="message"]',
            'div[class*="chat"]',
            'div[class*="bubble"]',
            'div[class*="content"]'
        ];
        
        const allMessages = new Set();
        
        selectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    const text = el.textContent?.trim();
                    if (text && text.length > 20) {
                        allMessages.add(el);
                    }
                });
            } catch (error) {
                // 忽略无效选择器
            }
        });
        
        console.log(`找到 ${allMessages.size} 个潜在消息元素`);
        
        const results = [];
        let userCount = 0;
        let aiCount = 0;
        
        allMessages.forEach((element, index) => {
            const text = element.textContent?.trim();
            const isAI = buttonInjector.isAIResponse(element);
            const hasButton = element.querySelector('.puretext-copy-btn') !== null;
            
            const result = {
                index: index + 1,
                element,
                isAI,
                hasButton,
                textLength: text.length,
                textPreview: text.substring(0, 100) + '...',
                className: element.className,
                position: element.getBoundingClientRect()
            };
            
            results.push(result);
            
            if (isAI) {
                aiCount++;
            } else {
                userCount++;
            }
            
            console.log(`\n消息 ${index + 1}:`);
            console.log(`  类型: ${isAI ? 'AI回复' : '用户消息'}`);
            console.log(`  有按钮: ${hasButton ? '是' : '否'}`);
            console.log(`  文本长度: ${text.length}`);
            console.log(`  类名: ${element.className}`);
            console.log(`  预览: ${text.substring(0, 80)}...`);
            
            // 检查是否有错误的按钮放置
            if (!isAI && hasButton) {
                console.log(`  ❌ 错误：用户消息上有复制按钮！`);
            } else if (isAI && !hasButton) {
                console.log(`  ⚠️ 注意：AI回复上没有复制按钮`);
            } else if (isAI && hasButton) {
                console.log(`  ✅ 正确：AI回复上有复制按钮`);
            } else {
                console.log(`  ✅ 正确：用户消息上没有复制按钮`);
            }
        });
        
        console.log(`\n=== 统计结果 ===`);
        console.log(`AI回复: ${aiCount} 个`);
        console.log(`用户消息: ${userCount} 个`);
        console.log(`总计: ${allMessages.size} 个`);
        
        return results;
    }
    
    // 测试特定的文本内容
    function testSpecificTexts() {
        console.log('\n=== 特定文本测试 ===');
        
        const buttonInjector = checkExtensionStatus();
        if (!buttonInjector) {
            console.log('❌ 无法获取按钮注入器，跳过测试');
            return;
        }
        
        const testCases = [
            {
                name: '典型用户问题',
                text: '强平指的是那手资金全部没有了，还是说有余额？',
                expectedType: 'user'
            },
            {
                name: '典型AI回复',
                text: '强平（强制平仓）是指当投资者的保证金不足以维持其持仓时，交易所或经纪商强制平掉其部分或全部仓位的行为。根据您的问题，我来详细解释一下...',
                expectedType: 'ai'
            },
            {
                name: '短用户问题',
                text: '怎么办？',
                expectedType: 'user'
            },
            {
                name: '长AI回复',
                text: '根据您的情况，建议您采取以下措施：\n\n1. 首先检查账户余额\n2. 联系客服了解详情\n3. 及时补充保证金\n\n如果您还有其他问题，请随时告诉我。',
                expectedType: 'ai'
            }
        ];
        
        testCases.forEach((testCase, index) => {
            // 创建临时元素进行测试
            const testElement = document.createElement('div');
            testElement.textContent = testCase.text;
            testElement.className = 'test-message';
            
            const isAI = buttonInjector.isAIResponse(testElement);
            const actualType = isAI ? 'ai' : 'user';
            const isCorrect = actualType === testCase.expectedType;
            
            console.log(`\n测试 ${index + 1}: ${testCase.name}`);
            console.log(`  预期: ${testCase.expectedType}`);
            console.log(`  实际: ${actualType}`);
            console.log(`  结果: ${isCorrect ? '✅ 正确' : '❌ 错误'}`);
            console.log(`  文本: ${testCase.text.substring(0, 50)}...`);
        });
    }
    
    // 创建修复按钮
    function createFixButton() {
        console.log('\n=== 创建修复按钮 ===');
        
        const fixButton = document.createElement('button');
        fixButton.textContent = '🔧 重新扫描并修复按钮';
        fixButton.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        `;
        
        fixButton.addEventListener('click', () => {
            console.log('🔄 重新扫描页面...');
            
            // 移除所有现有按钮
            const existingButtons = document.querySelectorAll('.puretext-copy-btn');
            existingButtons.forEach(btn => {
                const container = btn.closest('.puretext-button-container');
                if (container) {
                    container.remove();
                } else {
                    btn.remove();
                }
            });
            
            console.log(`移除了 ${existingButtons.length} 个现有按钮`);
            
            // 触发重新扫描
            if (typeof pureTextExtension !== 'undefined' && 
                pureTextExtension && 
                pureTextExtension.buttonInjector) {
                pureTextExtension.buttonInjector.scanAndInjectButtons();
                console.log('✅ 重新扫描完成');
                
                // 重新分析
                setTimeout(() => {
                    analyzePageMessages();
                }, 1000);
            } else {
                console.log('❌ 无法触发重新扫描');
            }
        });
        
        document.body.appendChild(fixButton);
        
        // 10秒后自动移除
        setTimeout(() => {
            if (fixButton.parentNode) {
                fixButton.parentNode.removeChild(fixButton);
            }
        }, 30000);
    }
    
    // 执行所有测试
    function runAllTests() {
        const results = analyzePageMessages();
        testSpecificTexts();
        createFixButton();
        
        // 检查是否有错误的按钮放置
        if (results) {
            const wrongButtons = results.filter(r => !r.isAI && r.hasButton);
            const missingButtons = results.filter(r => r.isAI && !r.hasButton);
            
            console.log('\n=== 最终检查 ===');
            console.log(`错误放置的按钮: ${wrongButtons.length} 个`);
            console.log(`缺失的按钮: ${missingButtons.length} 个`);
            
            if (wrongButtons.length === 0 && missingButtons.length === 0) {
                console.log('🎉 所有按钮都正确放置！');
            } else {
                console.log('⚠️ 发现问题，需要进一步调试');
                
                wrongButtons.forEach((result, index) => {
                    console.log(`错误 ${index + 1}: 用户消息上有按钮`);
                    console.log(`  文本: ${result.textPreview}`);
                    
                    // 高亮显示问题元素
                    result.element.style.outline = '3px solid red';
                    result.element.style.outlineOffset = '2px';
                });
            }
        }
    }
    
    // 开始测试
    runAllTests();
    
    console.log('\n💡 使用说明:');
    console.log('- 查看控制台输出了解检测结果');
    console.log('- 红色边框标记了错误放置按钮的元素');
    console.log('- 点击左上角的修复按钮重新扫描');
    console.log('- 如果发现问题，请检查 isAIResponse 函数的逻辑');
    
})();