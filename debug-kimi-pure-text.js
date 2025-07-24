// 调试Kimi纯文本复制功能 - 综合测试
(function() {
    console.log('🔍 开始调试Kimi纯文本复制功能...');
    
    // 1. 检查扩展是否正确加载
    function checkExtensionStatus() {
        console.log('\n=== 1. 扩展状态检查 ===');
        
        // 检查全局变量
        const checks = {
            'SUPPORTED_SITES': typeof SUPPORTED_SITES !== 'undefined',
            'ClipboardManager': typeof ClipboardManager !== 'undefined',
            'CopyButton': typeof CopyButton !== 'undefined',
            'pureTextExtension': typeof pureTextExtension !== 'undefined'
        };
        
        Object.entries(checks).forEach(([name, exists]) => {
            console.log(`${exists ? '✅' : '❌'} ${name}: ${exists ? '已加载' : '未加载'}`);
        });
        
        // 检查扩展状态
        if (typeof pureTextExtension !== 'undefined' && pureTextExtension) {
            const status = pureTextExtension.getStatus();
            console.log('\n扩展状态:', status);
        }
        
        return checks;
    }
    
    // 2. 检查Kimi网站配置
    function checkKimiConfig() {
        console.log('\n=== 2. Kimi网站配置检查 ===');
        
        if (typeof SUPPORTED_SITES === 'undefined') {
            console.log('❌ SUPPORTED_SITES未定义');
            return null;
        }
        
        const kimiConfig = SUPPORTED_SITES['www.kimi.com'];
        if (!kimiConfig) {
            console.log('❌ Kimi配置不存在');
            return null;
        }
        
        console.log('✅ Kimi配置存在');
        console.log('站点名称:', kimiConfig.name);
        console.log('选择器数量:', kimiConfig.selectors?.length || 0);
        console.log('选择器列表:', kimiConfig.selectors);
        
        return kimiConfig;
    }
    
    // 3. 测试选择器有效性
    function testSelectors(config) {
        console.log('\n=== 3. 选择器有效性测试 ===');
        
        if (!config || !config.selectors) {
            console.log('❌ 无可用选择器');
            return [];
        }
        
        const results = [];
        
        config.selectors.forEach((selector, index) => {
            try {
                const elements = document.querySelectorAll(selector);
                const result = {
                    selector,
                    elementCount: elements.length,
                    hasContent: false,
                    hasQuestions: false,
                    elements: []
                };
                
                if (elements.length > 0) {
                    elements.forEach((el, elIndex) => {
                        const text = el.textContent?.trim();
                        if (text && text.length > 50) {
                            result.hasContent = true;
                            result.hasQuestions = /[？?]/.test(text);
                            result.elements.push({
                                index: elIndex,
                                textLength: text.length,
                                hasQuestions: /[？?]/.test(text),
                                preview: text.substring(0, 100) + '...'
                            });
                        }
                    });
                }
                
                results.push(result);
                
                console.log(`选择器 ${index + 1}: ${selector}`);
                console.log(`  元素数量: ${result.elementCount}`);
                console.log(`  有内容: ${result.hasContent}`);
                console.log(`  包含问题: ${result.hasQuestions}`);
                
                if (result.elements.length > 0) {
                    console.log(`  内容元素: ${result.elements.length}个`);
                    result.elements.forEach(el => {
                        console.log(`    元素${el.index}: 长度${el.textLength}, 问题${el.hasQuestions}`);
                    });
                }
                
            } catch (error) {
                console.log(`❌ 选择器 ${index + 1} 无效: ${selector}`);
                results.push({ selector, error: error.message });
            }
        });
        
        return results;
    }
    
    // 4. 测试文本清理功能
    function testTextCleaning() {
        console.log('\n=== 4. 文本清理功能测试 ===');
        
        if (typeof ClipboardManager === 'undefined' || !ClipboardManager.cleanKimiText) {
            console.log('❌ ClipboardManager.cleanKimiText 不可用');
            return false;
        }
        
        // 测试用例
        const testCases = [
            {
                name: '包含推荐问题的文本',
                input: `这是主要内容。

审核结果在哪里查？

如果审核不通过怎么办？

失业登记证明的有效期是多久？`,
                expectedRemovals: ['审核结果在哪里查？', '如果审核不通过怎么办？', '失业登记证明的有效期是多久？']
            },
            {
                name: '包含按钮文字的文本',
                input: '这是内容 复制 重试 分享 本回答由 AI 生成，内容仅供参考',
                expectedRemovals: ['复制', '重试', '分享', '本回答由 AI 生成，内容仅供参考']
            }
        ];
        
        let allPassed = true;
        
        testCases.forEach((testCase, index) => {
            console.log(`\n测试用例 ${index + 1}: ${testCase.name}`);
            console.log('输入:', testCase.input);
            
            const cleaned = ClipboardManager.cleanKimiText(testCase.input);
            console.log('输出:', cleaned);
            
            let passed = true;
            testCase.expectedRemovals.forEach(removal => {
                if (cleaned.includes(removal)) {
                    console.log(`❌ 未能移除: ${removal}`);
                    passed = false;
                } else {
                    console.log(`✅ 成功移除: ${removal}`);
                }
            });
            
            if (!passed) allPassed = false;
        });
        
        return allPassed;
    }
    
    // 5. 检查现有按钮
    function checkExistingButtons() {
        console.log('\n=== 5. 现有按钮检查 ===');
        
        const buttons = document.querySelectorAll('.puretext-copy-btn');
        console.log(`找到 ${buttons.length} 个复制按钮`);
        
        buttons.forEach((button, index) => {
            console.log(`按钮 ${index + 1}:`);
            console.log(`  文本: ${button.textContent}`);
            console.log(`  位置: ${button.style.position || '默认'}`);
            
            // 查找对应的内容容器
            let container = button.closest('.segment-content-box');
            if (!container) {
                container = button.parentElement;
                while (container && container !== document.body) {
                    const text = container.textContent?.trim();
                    if (text && text.length > 100) {
                        break;
                    }
                    container = container.parentElement;
                }
            }
            
            if (container) {
                const text = container.textContent?.trim();
                const hasQuestions = /[？?]/.test(text);
                console.log(`  内容长度: ${text?.length || 0}`);
                console.log(`  包含问题: ${hasQuestions}`);
            } else {
                console.log(`  ❌ 未找到对应的内容容器`);
            }
        });
        
        return buttons;
    }
    
    // 6. 创建测试按钮
    function createTestButtons(selectorResults) {
        console.log('\n=== 6. 创建测试按钮 ===');
        
        let buttonCount = 0;
        
        selectorResults.forEach((result, index) => {
            if (result.hasContent && result.hasQuestions && result.elements.length > 0) {
                result.elements.forEach((elementInfo, elIndex) => {
                    if (elementInfo.hasQuestions) {
                        const elements = document.querySelectorAll(result.selector);
                        const element = elements[elementInfo.index];
                        
                        if (element) {
                            buttonCount++;
                            createTestButton(element, buttonCount, `选择器${index + 1}-元素${elIndex + 1}`);
                        }
                    }
                });
            }
        });
        
        console.log(`创建了 ${buttonCount} 个测试按钮`);
    }
    
    // 创建单个测试按钮
    function createTestButton(element, index, label) {
        const testButton = document.createElement('button');
        testButton.textContent = `🧪 ${label}`;
        testButton.style.cssText = `
            position: fixed;
            top: ${20 + (index - 1) * 45}px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: bold;
            cursor: pointer;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: all 0.2s ease;
            min-width: 120px;
            text-align: center;
        `;
        
        testButton.addEventListener('mouseenter', () => {
            testButton.style.transform = 'translateY(-2px)';
            testButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        });
        
        testButton.addEventListener('mouseleave', () => {
            testButton.style.transform = 'translateY(0)';
            testButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        });
        
        testButton.addEventListener('click', async () => {
            try {
                const originalText = element.textContent?.trim();
                let cleanedText = originalText;
                
                // 使用ClipboardManager清理
                if (typeof ClipboardManager !== 'undefined' && ClipboardManager.cleanKimiText) {
                    cleanedText = ClipboardManager.cleanKimiText(originalText);
                }
                
                await navigator.clipboard.writeText(cleanedText);
                
                // 反馈
                const originalBtnText = testButton.textContent;
                testButton.textContent = '✅ 成功';
                testButton.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                
                setTimeout(() => {
                    testButton.textContent = originalBtnText;
                    testButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                }, 2000);
                
                // 统计
                const originalQuestions = (originalText.match(/[？?]/g) || []).length;
                const cleanedQuestions = (cleanedText.match(/[？?]/g) || []).length;
                
                console.log(`✅ ${label} 复制成功`);
                console.log(`原始问号: ${originalQuestions}, 清理后问号: ${cleanedQuestions}`);
                console.log(`文本长度: ${originalText.length} -> ${cleanedText.length}`);
                
            } catch (error) {
                console.error(`❌ ${label} 复制失败:`, error);
                testButton.textContent = '❌ 失败';
                testButton.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                
                setTimeout(() => {
                    testButton.textContent = `🧪 ${label}`;
                    testButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                }, 2000);
            }
        });
        
        document.body.appendChild(testButton);
        
        // 20秒后自动移除
        setTimeout(() => {
            if (testButton.parentNode) {
                testButton.parentNode.removeChild(testButton);
            }
        }, 20000);
    }
    
    // 执行所有检查
    function runAllChecks() {
        const extensionStatus = checkExtensionStatus();
        const kimiConfig = checkKimiConfig();
        const selectorResults = testSelectors(kimiConfig);
        const textCleaningPassed = testTextCleaning();
        const existingButtons = checkExistingButtons();
        
        // 创建测试按钮
        createTestButtons(selectorResults);
        
        // 总结
        console.log('\n=== 🎯 调试总结 ===');
        console.log(`扩展加载: ${extensionStatus.pureTextExtension ? '✅' : '❌'}`);
        console.log(`Kimi配置: ${kimiConfig ? '✅' : '❌'}`);
        console.log(`文本清理: ${textCleaningPassed ? '✅' : '❌'}`);
        console.log(`现有按钮: ${existingButtons.length}个`);
        
        const validSelectors = selectorResults.filter(r => r.hasContent && !r.error);
        console.log(`有效选择器: ${validSelectors.length}个`);
        
        const questionsFound = selectorResults.some(r => r.hasQuestions);
        console.log(`发现推荐问题: ${questionsFound ? '✅' : '❌'}`);
        
        if (questionsFound && textCleaningPassed) {
            console.log('\n🎉 修复应该有效！请点击右侧测试按钮验证。');
        } else if (!questionsFound) {
            console.log('\n💡 当前页面可能没有推荐问题，或者选择器需要调整。');
        } else {
            console.log('\n⚠️ 文本清理功能有问题，需要进一步调试。');
        }
    }
    
    // 开始调试
    runAllChecks();
    
    console.log('\n💡 使用说明:');
    console.log('- 查看控制台输出了解详细的调试信息');
    console.log('- 右侧会出现测试按钮，点击测试清理效果');
    console.log('- 测试按钮会显示清理前后的问号数量对比');
    console.log('- 如果发现问题，请根据调试信息进行相应修复');
    
})();