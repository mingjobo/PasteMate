// DeepSeek 多按钮功能测试脚本
console.log('🧪 开始测试 DeepSeek 多按钮功能...');

// 模拟必要的全局变量和函数
if (!window.chrome) {
    window.chrome = {
        i18n: {
            getMessage: function(key) {
                const messages = {
                    'copyToWord': '复制到 Word',
                    'downloadAsWord': '下载为 Word',
                    'downloadAsPdf': '下载为 PDF'
                };
                return messages[key] || key;
            }
        }
    };
}

if (!window.ClipboardManager) {
    window.ClipboardManager = {
        copyHtmlToClipboard: async function(element) {
            console.log('📋 模拟复制到剪贴板:', element.textContent.substring(0, 50) + '...');
            return true;
        }
    };
}

if (!window.exportToWord) {
    window.exportToWord = async function(content, filename) {
        console.log('📄 模拟导出为 Word:', filename);
        console.log('内容预览:', content.textContent.substring(0, 50) + '...');
    };
}

if (!window.exportToPdf) {
    window.exportToPdf = async function(content, filename) {
        console.log('📑 模拟导出为 PDF:', filename);
        console.log('内容预览:', content.textContent.substring(0, 50) + '...');
    };
}

// 测试函数
function testDeepSeekButtonInjection() {
    console.log('🔍 测试 DeepSeek 按钮注入...');
    
    // 查找 AI 回复内容
    const bubbles = document.querySelectorAll('.ds-markdown.ds-markdown--block');
    console.log(`找到 ${bubbles.length} 个 AI 回复区块`);
    
    bubbles.forEach((bubble, index) => {
        console.log(`\n📝 处理第 ${index + 1} 个 AI 回复:`);
        
        // 查找操作区域
        let opArea = bubble.nextElementSibling;
        let iconButtons = opArea ? opArea.querySelectorAll('.ds-icon-button') : [];
        
        if (!iconButtons || iconButtons.length === 0) {
            opArea = bubble.parentElement;
            iconButtons = opArea ? opArea.querySelectorAll('.ds-icon-button') : [];
        }
        
        console.log(`- 找到 ${iconButtons.length} 个图标按钮`);
        
        if (iconButtons.length > 0) {
            const parent = iconButtons[0].parentNode;
            console.log(`- 父容器:`, parent.tagName, parent.className);
            
            // 检查是否已存在按钮组
            const existingGroup = parent.querySelector('.puretext-button-group');
            if (existingGroup) {
                console.log(`- ✅ 已存在按钮组，跳过`);
                return;
            }
            
            // 创建按钮组
            const buttonGroup = document.createElement('div');
            buttonGroup.className = 'puretext-button-group';
            buttonGroup.style.cssText = `
                display: inline-flex;
                align-items: center;
                gap: 4px;
                margin-left: 8px;
            `;
            
            // 创建三个按钮
            const buttonTexts = ['复制到 Word', '下载为 Word', '下载为 PDF'];
            const buttonActions = [
                () => window.ClipboardManager.copyHtmlToClipboard(bubble),
                () => window.exportToWord(bubble, 'PureText.docx'),
                () => window.exportToPdf(bubble, 'PureText.pdf')
            ];
            
            buttonTexts.forEach((text, btnIndex) => {
                const button = document.createElement('button');
                button.className = 'puretext-action-btn';
                button.textContent = text;
                button.style.cssText = `
                    padding: 2px 6px;
                    height: 20px;
                    font-size: 11px;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.7);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    opacity: 0.8;
                    transition: all 0.15s ease;
                `;
                
                // 添加交互效果
                button.addEventListener('mouseenter', () => {
                    button.style.opacity = '1';
                    button.style.background = 'rgba(255, 255, 255, 0.1)';
                });
                button.addEventListener('mouseleave', () => {
                    button.style.opacity = '0.8';
                    button.style.background = 'transparent';
                });
                
                // 添加点击事件
                button.addEventListener('click', async (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    
                    const originalText = button.textContent;
                    button.textContent = '处理中...';
                    
                    try {
                        await buttonActions[btnIndex]();
                        console.log(`✅ ${text} 操作成功`);
                    } catch (error) {
                        console.error(`❌ ${text} 操作失败:`, error);
                    } finally {
                        setTimeout(() => {
                            button.textContent = originalText;
                        }, 500);
                    }
                });
                
                buttonGroup.appendChild(button);
            });
            
            // 插入按钮组
            parent.insertBefore(buttonGroup, iconButtons[iconButtons.length - 1].nextSibling);
            console.log(`- ✅ 成功插入按钮组，包含 ${buttonTexts.length} 个按钮`);
        } else {
            console.log(`- ❌ 未找到图标按钮，跳过`);
        }
    });
}

// 执行测试
setTimeout(() => {
    testDeepSeekButtonInjection();
    console.log('\n🎉 DeepSeek 多按钮功能测试完成！');
}, 1000); 