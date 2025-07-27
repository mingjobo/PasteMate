// 一键纯文扩展 - 统一内容脚本
// 将所有模块合并到一个文件中，避免ES模块导入问题

// ==================== 站点配置 ====================
const SUPPORTED_SITES = {
  "chat.openai.com": {
    name: "ChatGPT",
    selectors: [
      "[data-message-author-role='assistant'] .markdown",
      "[data-message-author-role='assistant']",
      ".group.w-full.text-token-text-primary",
      ".markdown.prose"
    ],
    features: {
      textIndicators: ["I'm", "I can", "Here's", "Based on"],
      roleAttributes: ["data-message-author-role=assistant"],
      containerClasses: ["markdown", "prose"]
    }
  },
  "chat.deepseek.com": {
    name: "DeepSeek",
    selectors: [
      ".ds-markdown.ds-markdown--block",
      ".message-content[data-role='assistant']",
      "[data-role='assistant'] .markdown",
      ".assistant-message .content"
    ],
    features: {
      textIndicators: ["我是", "我可以", "根据", "基于"],
      roleAttributes: ["data-role=assistant"],
      containerClasses: ["ds-markdown", "message-content"]
    }
  },
  "www.doubao.com": {
    name: "豆包",
    selectors: [
      ".dialogue-text.assistant",
      ".message.assistant .content",
      "[data-role='assistant']",
      ".ai-response"
    ],
    features: {
      textIndicators: ["我是", "我可以", "根据", "建议"],
      roleAttributes: ["data-role=assistant"],
      containerClasses: ["dialogue-text", "assistant"]
    }
  },
  "www.kimi.com": {
    name: "Kimi",
    selectors: [
      "[data-role='assistant'] .segment-content-box",
      "[data-author='assistant'] .segment-content-box",
      ".ai-response .segment-content-box",
      ".assistant-message .segment-content-box",
      ".segment-content-box",
      ".markdown-container",
      ".markdown",
      "div[class*=\"assistant\"]",
      "div[class*=\"ai\"]",
      ".response-bubble",
      "[data-role='assistant']",
      ".ai-message .content",
      ".message-content.assistant",
      ".chat-message.assistant",
      ".kimi-response",
      ".assistant-bubble"
    ],
    features: {
      textIndicators: ["我是", "我可以", "根据", "建议", "Kimi", "收到", "您可以", "建议您", "以下是", "具体来说", "需要注意"],
      roleAttributes: ["data-role=assistant", "data-author=assistant"],
      containerClasses: ["segment-content-box", "markdown-container", "markdown", "assistant", "ai"]
    }
  }
};

// ==================== 消息类型枚举 ====================
const MessageType = {
    HUMAN: 'human',
    AI: 'ai',
    UNKNOWN: 'unknown'
};

// ==================== KimiMessageDetector ====================
class KimiMessageDetector {
    static isHumanMessage(element) {
        const analysis = this.analyzeMessageType(element);
        return analysis.type === MessageType.HUMAN;
    }

    static isAIResponse(element) {
        const analysis = this.analyzeMessageType(element);
        return analysis.type === MessageType.AI;
    }

    static analyzeMessageType(element) {
        if (!element) {
            return {
                type: MessageType.UNKNOWN,
                confidence: 0,
                indicators: ['element-null'],
                element: null
            };
        }

        const indicators = [];
        let humanScore = 0;
        let aiScore = 0;

        // 方法1: 检查元素及其父元素的类名和属性
        const attributeAnalysis = this.analyzeAttributes(element);
        humanScore += attributeAnalysis.humanScore;
        aiScore += attributeAnalysis.aiScore;
        indicators.push(...attributeAnalysis.indicators);

        // 方法2: 通过文本内容特征判断
        const contentAnalysis = this.analyzeTextContent(element);
        humanScore += contentAnalysis.humanScore;
        aiScore += contentAnalysis.aiScore;
        indicators.push(...contentAnalysis.indicators);

        // 方法3: 通过位置和结构判断（Kimi特定）
        const structureAnalysis = this.analyzeStructure(element);
        humanScore += structureAnalysis.humanScore;
        aiScore += structureAnalysis.aiScore;
        indicators.push(...structureAnalysis.indicators);

        // 方法4: 通过内容复杂度判断
        const complexityAnalysis = this.analyzeComplexity(element);
        humanScore += complexityAnalysis.humanScore;
        aiScore += complexityAnalysis.aiScore;
        indicators.push(...complexityAnalysis.indicators);

        // 确定最终类型和置信度
        const totalScore = humanScore + aiScore;
        let type, confidence;

        if (totalScore === 0) {
            type = MessageType.UNKNOWN;
            confidence = 0;
        } else if (aiScore > humanScore) {
            type = MessageType.AI;
            confidence = aiScore / totalScore;
        } else if (humanScore > aiScore) {
            type = MessageType.HUMAN;
            confidence = humanScore / totalScore;
        } else {
            // 分数相等时，默认为AI（避免漏掉AI回复）
            type = MessageType.AI;
            confidence = 0.5;
            indicators.push('tie-default-ai');
        }

        return {
            type,
            confidence,
            indicators,
            element,
            scores: { humanScore, aiScore }
        };
    }

    static analyzeAttributes(element) {
        let humanScore = 0;
        let aiScore = 0;
        const indicators = [];

        let current = element;
        for (let i = 0; i < 5 && current; i++) {
            const className = current.className?.toLowerCase() || '';
            const dataRole = current.getAttribute('data-role')?.toLowerCase() || '';
            const dataAuthor = current.getAttribute('data-author')?.toLowerCase() || '';

            // 强烈的用户消息标识
            if (className.includes('user') && !className.includes('user-agent')) {
                humanScore += 3;
                indicators.push('class-user');
            }
            if (className.includes('user-content') || className.includes('user-message')) {
                humanScore += 4;
                indicators.push('class-user-content');
            }
            if (dataRole === 'user' || dataAuthor === 'user') {
                humanScore += 5;
                indicators.push('attr-user');
            }

            // 强烈的AI回复标识
            if (dataRole === 'assistant' || dataAuthor === 'assistant') {
                aiScore += 5;
                indicators.push('attr-assistant');
            }
            if (className.includes('assistant') || className.includes('ai-response')) {
                aiScore += 4;
                indicators.push('class-assistant');
            }
            if (className.includes('bot-message') || className.includes('kimi-response')) {
                aiScore += 3;
                indicators.push('class-bot');
            }

            current = current.parentElement;
        }

        return { humanScore, aiScore, indicators };
    }

    static analyzeTextContent(element) {
        let humanScore = 0;
        let aiScore = 0;
        const indicators = [];

        const text = element.textContent?.trim() || '';
        if (text.length === 0) {
            return { humanScore, aiScore, indicators };
        }

        // AI回复的特征词汇
        const aiIndicators = [
            '我是Kimi', '我可以帮助', '根据您的', '建议您', '您可以',
            '以下是', '具体来说', '需要注意', '总结一下',
            '首先', '其次', '最后', '另外', '此外',
            '如果您', '您需要', '为您', 'Kimi助手',
            '我理解', '我建议', '让我来', '我来帮您'
        ];

        // 用户消息的特征词汇
        const userIndicators = [
            '我想', '我需要', '请问', '能否', '可以吗', '怎么样',
            '怎么办', '如何', '为什么', '什么是', '什么叫',
            '帮我', '告诉我', '我该', '我应该', '我要',
            '请帮助', '请解释', '请分析', '你觉得'
        ];

        // 检查AI指示词
        const aiMatches = aiIndicators.filter(indicator => text.includes(indicator));
        if (aiMatches.length > 0) {
            aiScore += aiMatches.length * 2;
            indicators.push(`ai-words-${aiMatches.length}`);
        }

        // 检查用户指示词
        const userMatches = userIndicators.filter(indicator => text.includes(indicator));
        if (userMatches.length > 0) {
            humanScore += userMatches.length * 2;
            indicators.push(`user-words-${userMatches.length}`);
        }

        // 特殊模式检查
        if (text.match(/^(请|帮我|告诉我|我想|我需要)/)) {
            humanScore += 2;
            indicators.push('starts-with-request');
        }

        if (text.match(/[？?]$/)) {
            humanScore += 1;
            indicators.push('ends-with-question');
        }

        return { humanScore, aiScore, indicators };
    }

    static analyzeStructure(element) {
        let humanScore = 0;
        let aiScore = 0;
        const indicators = [];

        try {
            // 检查元素在页面中的位置
            const rect = element.getBoundingClientRect();
            const viewportWidth = window.innerWidth;

            // Kimi中，用户消息通常在右侧，AI回复在左侧或占据更多宽度
            const isOnRight = rect.left > viewportWidth * 0.6;
            const isFullWidth = rect.width > viewportWidth * 0.7;

            if (isOnRight && !isFullWidth) {
                humanScore += 2;
                indicators.push('position-right-narrow');
            }

            if (!isOnRight && isFullWidth) {
                aiScore += 2;
                indicators.push('position-left-wide');
            }

            // 检查是否包含Kimi特有的AI回复元素
            const hasKimiFeatures = element.querySelector('.segment-content-box') ||
                element.querySelector('.markdown-container') ||
                element.closest('.segment-content-box');

            if (hasKimiFeatures) {
                aiScore += 3;
                indicators.push('kimi-ai-features');
            }

            // 检查是否包含用户输入框附近的元素
            const nearInputBox = element.closest('.input-container') ||
                element.closest('.user-input') ||
                element.querySelector('textarea');

            if (nearInputBox) {
                humanScore += 2;
                indicators.push('near-input');
            }

        } catch (error) {
            indicators.push('structure-analysis-error');
        }

        return { humanScore, aiScore, indicators };
    }

    static analyzeComplexity(element) {
        let humanScore = 0;
        let aiScore = 0;
        const indicators = [];

        const text = element.textContent?.trim() || '';
        
        // 文本长度分析
        if (text.length > 200) {
            aiScore += 1;
            indicators.push('long-text');
        } else if (text.length < 50) {
            humanScore += 1;
            indicators.push('short-text');
        }

        // 句子数量分析
        const sentences = text.split(/[。！？.!?]/).filter(s => s.trim().length > 10);
        if (sentences.length >= 3) {
            aiScore += 1;
            indicators.push('multi-sentence');
        }

        // 结构化内容检查
        const hasStructuredContent = /[：:]\s*\n|^\s*[•\-\*]\s+|^\s*\d+[\.\)]\s+/m.test(text);
        if (hasStructuredContent) {
            aiScore += 2;
            indicators.push('structured-content');
        }

        // 代码块检查
        const hasCodeBlock = element.querySelector('code') || element.querySelector('pre') || 
            text.includes('```') || text.includes('`');
        if (hasCodeBlock) {
            aiScore += 2;
            indicators.push('code-content');
        }

        // 链接和引用检查
        const hasLinks = element.querySelector('a') || text.match(/https?:\/\/\S+/);
        if (hasLinks) {
            aiScore += 1;
            indicators.push('has-links');
        }

        return { humanScore, aiScore, indicators };
    }

    static getDebugInfo(element) {
        const analysis = this.analyzeMessageType(element);
        const text = element.textContent?.trim().substring(0, 100) || '';
        
        return `
消息类型分析:
- 类型: ${analysis.type}
- 置信度: ${(analysis.confidence * 100).toFixed(1)}%
- 人类得分: ${analysis.scores.humanScore}
- AI得分: ${analysis.scores.aiScore}
- 指标: ${analysis.indicators.join(', ')}
- 文本预览: "${text}${text.length > 100 ? '...' : ''}"
        `.trim();
    }
}

// ==================== ClipboardManager ====================
class ClipboardManager {
    static async copyHtmlToClipboard(element) {
        try {
            if (!element) {
                this.showErrorMessage('未找到可复制内容');
                return false;
            }
            
            console.log('[ClipboardManager] 开始复制操作');
            
            // 简化的HTML处理
            const processedHtml = this.processElementForCopy(element);
            const html = `<html><body>${processedHtml}</body></html>`;
            const text = element.innerText || element.textContent || '';

            const blobHtml = new Blob([html], { type: 'text/html' });
            const blobText = new Blob([text], { type: 'text/plain' });
            const clipboardItem = new window.ClipboardItem({
                'text/html': blobHtml,
                'text/plain': blobText
            });
            
            await navigator.clipboard.write([clipboardItem]);
            
            this.showSuccessMessage('已复制为 Word 格式，可直接粘贴到 Word');
            return true;
            
        } catch (error) {
            console.error('[ClipboardManager] Copy operation failed:', error);
            this.showErrorMessage('复制失败，请重试');
            return false;
        }
    }

    static processElementForCopy(element) {
        // 创建元素副本避免修改原DOM
        const cloned = element.cloneNode(true);
        
        // 移除不需要的元素
        this.removeUnwantedElements(cloned);
        
        return cloned.outerHTML;
    }

    static removeUnwantedElements(cloned) {
        // 移除复制按钮
        cloned.querySelectorAll('.puretext-copy-btn, .puretext-button-container').forEach(el => el.remove());
        
        // 移除操作按钮
        cloned.querySelectorAll('button, [role="button"]').forEach(button => {
            const text = button.textContent?.trim();
            if (text && /^(复制|重试|分享|编辑|搜索|点赞|踩|收藏)$/.test(text)) {
                button.remove();
            }
        });
        
        // 移除AI声明
        cloned.querySelectorAll('*').forEach(el => {
            const text = el.textContent?.trim();
            if (text && /本回答由\s*AI\s*生成.*内容仅供参考/.test(text)) {
                el.remove();
            }
        });
    }

    static showSuccessMessage(customMessage) {
        const message = customMessage || '复制成功';
        this.showToast(message, 'success');
    }

    static showErrorMessage(customMessage) {
        const message = customMessage || '复制失败';
        this.showToast(message, 'error');
    }

    static showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            font-size: 14px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
        });
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 2000);
    }
}

// ==================== CopyButton ====================
class CopyButton {
    static BUTTON_CLASS = 'puretext-copy-btn';
    static CONTAINER_CLASS = 'puretext-button-container';

    static create(targetElement, onCopy) {
        const container = document.createElement('div');
        container.className = this.CONTAINER_CLASS;
        
        const button = document.createElement('button');
        button.className = this.BUTTON_CLASS;
        
        const buttonText = chrome?.i18n ? chrome.i18n.getMessage('copyToWord') : '复制到 Word';
        button.textContent = buttonText;
        
        button.type = 'button';
        button.setAttribute('aria-label', buttonText);
        button.setAttribute('title', buttonText);
        
        // 检查是否是Kimi网站，如果是则使用特殊的样式
        const isKimi = window.location.hostname === 'www.kimi.com';
        
        this.applyContainerStyles(container, isKimi);
        this.applyButtonStyles(button, isKimi);
        this.addEventListeners(button, targetElement, onCopy);
        
        container.appendChild(button);
        
        return container;
    }

    static applyContainerStyles(container, isKimi = false) {
        if (isKimi) {
            // Kimi网站的容器样式 - 内联显示，不覆盖其他元素
            container.style.cssText = `
                display: inline-block;
                margin-left: 8px;
                vertical-align: middle;
                pointer-events: auto;
            `;
        } else {
            // 其他网站的容器样式 - 绝对定位
            container.style.cssText = `
                position: absolute;
                bottom: 8px;
                right: 8px;
                z-index: 10001;
                pointer-events: none;
            `;
        }
    }

    static applyButtonStyles(button, isKimi = false) {
        if (isKimi) {
            // Kimi网站的按钮样式 - 与现有按钮保持一致
            const colorScheme = {
                background: 'transparent',
                text: 'var(--color-text-1, #374151)',
                border: 'none',
                shadow: 'none',
                hoverBackground: 'var(--color-fill-2, rgba(0, 0, 0, 0.04))',
                hoverShadow: 'none',
                activeBackground: 'var(--color-fill-3, rgba(0, 0, 0, 0.08))',
                focus: '#3b82f6'
            };

            button.style.cssText = `
                all: initial;
                font-family: inherit;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 4px 8px;
                min-width: auto;
                height: 24px;
                font-size: 12px;
                font-weight: 400;
                line-height: 1.2;
                text-align: center;
                white-space: nowrap;
                background: ${colorScheme.background};
                color: ${colorScheme.text};
                border: ${colorScheme.border};
                border-radius: 4px;
                box-shadow: ${colorScheme.shadow};
                cursor: pointer;
                pointer-events: auto;
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                transition: all 0.15s ease;
                transform: translateZ(0);
                will-change: background-color;
                opacity: 1;
            `;

            this.addButtonInteractions(button, colorScheme);
        } else {
            // 其他网站的按钮样式 - 保持原有样式
            const colorScheme = {
                background: 'rgba(255, 255, 255, 0.95)',
                text: '#374151',
                border: 'rgba(0, 0, 0, 0.1)',
                shadow: 'rgba(0, 0, 0, 0.1)',
                hoverBackground: '#f3f4f6',
                hoverShadow: 'rgba(0, 0, 0, 0.15)',
                activeBackground: '#e5e7eb',
                focus: '#3b82f6'
            };

            button.style.cssText = `
                all: initial;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 6px 12px;
                min-width: 80px;
                height: 28px;
                font-size: 11px;
                font-weight: 500;
                line-height: 1.2;
                letter-spacing: 0.01em;
                text-align: center;
                white-space: nowrap;
                background: ${colorScheme.background};
                color: ${colorScheme.text};
                border: 1px solid ${colorScheme.border};
                border-radius: 6px;
                box-shadow: 0 1px 3px ${colorScheme.shadow};
                cursor: pointer;
                pointer-events: auto;
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
                transform: translateZ(0);
                will-change: transform, box-shadow, background-color;
                opacity: 0.9;
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
            `;

            this.addButtonInteractions(button, colorScheme);
        }
    }

    static addButtonInteractions(button, colorScheme) {
        button.addEventListener('mouseenter', () => {
            button.style.opacity = '1';
            button.style.background = colorScheme.hoverBackground;
            button.style.transform = 'translateY(-1px) translateZ(0)';
            button.style.boxShadow = `0 2px 6px ${colorScheme.hoverShadow}`;
        });

        button.addEventListener('mouseleave', () => {
            button.style.opacity = '0.9';
            button.style.background = colorScheme.background;
            button.style.transform = 'translateY(0) translateZ(0)';
            button.style.boxShadow = `0 1px 3px ${colorScheme.shadow}`;
        });

        button.addEventListener('focus', () => {
            button.style.outline = `2px solid ${colorScheme.focus}`;
            button.style.outlineOffset = '2px';
            button.style.opacity = '1';
        });

        button.addEventListener('blur', () => {
            button.style.outline = 'none';
            button.style.opacity = '0.9';
        });

        button.addEventListener('mousedown', () => {
            button.style.transform = 'translateY(0) scale(0.98) translateZ(0)';
            button.style.background = colorScheme.activeBackground;
        });

        button.addEventListener('mouseup', () => {
            button.style.transform = 'translateY(-1px) translateZ(0)';
            button.style.background = colorScheme.hoverBackground;
        });
    }

    static addEventListeners(button, targetElement, onCopy) {
        button.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            this.addClickFeedback(button);
            
            try {
                if (onCopy) {
                    await onCopy(targetElement);
                }
            } catch (error) {
                console.error('PureText: Copy operation failed:', error);
            }
        });

        button.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                
                this.addClickFeedback(button);
                
                try {
                    if (onCopy) {
                        await onCopy(targetElement);
                    }
                } catch (error) {
                    console.error('PureText: Copy operation failed:', error);
                }
            }
        });
    }

    static addClickFeedback(button) {
        button.style.transform = 'scale(0.95) translateZ(0)';
        
        setTimeout(() => {
            button.style.transform = 'translateZ(0)';
        }, 150);

        const originalText = button.textContent;
        button.textContent = '复制中...';
        
        setTimeout(() => {
            button.textContent = originalText;
        }, 500);
    }

    static hasButton(element) {
        return element.querySelector(`.${this.CONTAINER_CLASS}`) !== null;
    }

    static removeButton(element) {
        const existingButton = element.querySelector(`.${this.CONTAINER_CLASS}`);
        if (existingButton) {
            existingButton.remove();
        }
    }

    static positionButton(container, targetElement) {
        const computedStyle = window.getComputedStyle(targetElement);
        if (computedStyle.position === 'static') {
            targetElement.style.position = 'relative';
        }

        const style = window.getComputedStyle(targetElement);
        const paddingRight = parseInt(style.paddingRight) || 0;
        const paddingBottom = parseInt(style.paddingBottom) || 0;

        const rightOffset = Math.max(8, paddingRight + 4);
        const bottomOffset = Math.max(8, paddingBottom + 4);

        container.style.right = `${rightOffset}px`;
        container.style.bottom = `${bottomOffset}px`;

        this.ensureInViewport(container, targetElement);
    }

    static ensureInViewport(container, targetElement) {
        setTimeout(() => {
            try {
                const containerRect = container.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                if (containerRect.right > viewportWidth) {
                    container.style.right = 'auto';
                    container.style.left = '8px';
                }

                if (containerRect.bottom > viewportHeight) {
                    container.style.bottom = 'auto';
                    container.style.top = '8px';
                }

                if (containerRect.left < 0) {
                    container.style.left = '8px';
                    container.style.right = 'auto';
                }

                if (containerRect.top < 0) {
                    container.style.top = '8px';
                    container.style.bottom = 'auto';
                }
            } catch (error) {
                console.debug('PureText: Error ensuring button in viewport:', error);
            }
        }, 50);
    }
}

// ==================== 调试日志系统 ====================
const DEBUG_LEVEL = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

window.PURETEXT_DEBUG_LEVEL = window.PURETEXT_DEBUG_LEVEL || DEBUG_LEVEL.INFO;

function debugLog(level, message, ...args) {
    if (level <= window.PURETEXT_DEBUG_LEVEL) {
        const timestamp = new Date().toLocaleTimeString();
        const levelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
        const prefix = `[${timestamp}] PureText-${levelNames[level]}:`;

        switch (level) {
            case DEBUG_LEVEL.ERROR:
                console.error(prefix, message, ...args);
                break;
            case DEBUG_LEVEL.WARN:
                console.warn(prefix, message, ...args);
                break;
            case DEBUG_LEVEL.INFO:
                console.info(prefix, message, ...args);
                break;
            case DEBUG_LEVEL.DEBUG:
                console.log(prefix, message, ...args);
                break;
        }
    }
}

debugLog(DEBUG_LEVEL.INFO, '🚀 Content script loaded');

// ==================== 站点管理器 ====================
class SiteManager {
    constructor() {
        this.siteConfig = null;
        this.currentSite = null;
    }

    async loadSiteConfig() {
        debugLog(DEBUG_LEVEL.DEBUG, '📋 Loading site configuration...');

        try {
            debugLog(DEBUG_LEVEL.DEBUG, '🔍 Checking SUPPORTED_SITES availability:', typeof SUPPORTED_SITES);

            if (typeof SUPPORTED_SITES === 'undefined') {
                debugLog(DEBUG_LEVEL.ERROR, '❌ SUPPORTED_SITES is undefined!');
                this.siteConfig = {};
                return;
            }

            debugLog(DEBUG_LEVEL.DEBUG, '📊 Available sites:', Object.keys(SUPPORTED_SITES));

            const baseSites = { ...SUPPORTED_SITES };

            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.sync.get(['customSites', 'disabledSites']);
                if (result.customSites || result.disabledSites) {
                    this.siteConfig = this.mergeConfigs(baseSites, result);
                    debugLog(DEBUG_LEVEL.INFO, '✅ Loaded user configuration');
                    return;
                }
            }

            this.siteConfig = baseSites;
            debugLog(DEBUG_LEVEL.INFO, '✅ Using built-in site configuration');

        } catch (error) {
            debugLog(DEBUG_LEVEL.WARN, '⚠️ Failed to load user config, using built-in config:', error);
            this.siteConfig = typeof SUPPORTED_SITES !== 'undefined' ? { ...SUPPORTED_SITES } : {};
        }
    }

    mergeConfigs(builtInConfig, userConfig) {
        const merged = { ...builtInConfig };

        if (userConfig.customSites) {
            Object.assign(merged, userConfig.customSites);
        }

        if (userConfig.disabledSites) {
            userConfig.disabledSites.forEach(hostname => {
                delete merged[hostname];
            });
        }

        return merged;
    }

    identifyCurrentSite() {
        if (!this.siteConfig) {
            debugLog(DEBUG_LEVEL.WARN, '⚠️ Site config not loaded');
            return null;
        }

        const hostname = window.location.hostname;
        debugLog(DEBUG_LEVEL.DEBUG, `🔍 Identifying site for hostname: ${hostname}`);

        if (this.siteConfig[hostname]) {
            this.currentSite = { hostname, ...this.siteConfig[hostname] };
            debugLog(DEBUG_LEVEL.INFO, `✅ Direct match found for ${hostname}`);
            return this.currentSite;
        }

        for (const [configHostname, config] of Object.entries(this.siteConfig)) {
            if (hostname.includes(configHostname) || configHostname.includes(hostname)) {
                this.currentSite = { hostname: configHostname, ...config };
                debugLog(DEBUG_LEVEL.INFO, `✅ Fuzzy match found: ${hostname} -> ${configHostname}`);
                return this.currentSite;
            }
        }

        debugLog(DEBUG_LEVEL.INFO, `ℹ️ No configuration found for ${hostname}`);
        return null;
    }

    isCurrentSiteSupported() {
        return this.identifyCurrentSite() !== null;
    }

    getCurrentSiteConfig() {
        return this.currentSite || this.identifyCurrentSite();
    }

    getSupportedSites() {
        if (!this.siteConfig) {
            return [];
        }
        return Object.keys(this.siteConfig);
    }
}

// ==================== 按钮注入器 ====================
class ButtonInjector {
    constructor(siteManager) {
        this.siteManager = siteManager;
        this.observer = null;
        this.injectedButtons = new WeakSet();
        this.buttonClass = 'puretext-copy-btn';
        this.containerClass = 'puretext-button-container';
        this.isObserving = false;
    }

    start() {
        if (this.isObserving) {
            debugLog(DEBUG_LEVEL.DEBUG, '🔄 Button injector already running');
            return;
        }

        const siteConfig = this.siteManager.getCurrentSiteConfig();
        if (!siteConfig) {
            debugLog(DEBUG_LEVEL.WARN, '⚠️ No site configuration available, skipping button injection');
            return;
        }

        debugLog(DEBUG_LEVEL.INFO, '🚀 Starting button injection for:', siteConfig.hostname);

        this.injectButtonsForExistingElements(siteConfig);
        this.startObserving(siteConfig);
    }

    injectButtonsForExistingElements(siteConfig) {
        const selectors = siteConfig.selectors;
        if (!selectors || selectors.length === 0) {
            debugLog(DEBUG_LEVEL.WARN, '⚠️ No selectors available, skipping button injection');
            return;
        }

        debugLog(DEBUG_LEVEL.DEBUG, '🔍 Checking existing elements with selectors:', selectors);

        selectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                debugLog(DEBUG_LEVEL.DEBUG, `📍 Found ${elements.length} elements for selector: ${selector}`);

                elements.forEach(element => {
                    this.injectButtonForElement(element, siteConfig);
                });
            } catch (error) {
                debugLog(DEBUG_LEVEL.ERROR, `❌ Error querying selector "${selector}":`, error);
            }
        });
    }

    startObserving(siteConfig) {
        if (this.observer) {
            this.observer.disconnect();
        }

        this.observer = new MutationObserver((mutations) => {
            this.handleMutations(mutations, siteConfig);
        });

        const observerConfig = {
            childList: true,
            subtree: true,
            attributes: false
        };

        this.observer.observe(document.body, observerConfig);
        this.isObserving = true;

        debugLog(DEBUG_LEVEL.DEBUG, '👁️ Started observing DOM changes');
    }

    handleMutations(mutations, siteConfig) {
        const selectors = siteConfig.selectors;
        if (!selectors || selectors.length === 0) return;

        let foundNewElements = false;

        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        foundNewElements = this.checkNodeForTargets(node, selectors, siteConfig) || foundNewElements;
                    }
                });
            }
        });

        if (foundNewElements) {
            debugLog(DEBUG_LEVEL.DEBUG, '✨ Injected buttons for new elements');
        }
    }

    checkNodeForTargets(node, selectors, siteConfig) {
        let foundElements = false;

        selectors.forEach(selector => {
            try {
                if (node.matches && node.matches(selector)) {
                    this.injectButtonForElement(node, siteConfig);
                    foundElements = true;
                }

                const childElements = node.querySelectorAll(selector);
                childElements.forEach(element => {
                    this.injectButtonForElement(element, siteConfig);
                    foundElements = true;
                });
            } catch (error) {
                debugLog(DEBUG_LEVEL.ERROR, `❌ Error checking selector "${selector}":`, error);
            }
        });

        return foundElements;
    }

    injectButtonForElement(element, siteConfig) {
        if (this.injectedButtons.has(element)) {
            return;
        }

        if (!this.validateModuleAvailability()) {
            debugLog(DEBUG_LEVEL.ERROR, '❌ Required modules not available, skipping button injection');
            return;
        }

        const textContent = element.textContent || '';
        if (textContent.trim().length < 10) {
            debugLog(DEBUG_LEVEL.DEBUG, '⏭️ Skipping element with insufficient text content');
            return;
        }

        if (!this.isElementVisible(element)) {
            debugLog(DEBUG_LEVEL.DEBUG, '⏭️ Skipping invisible element');
            return;
        }

        // 🔥 关键修复：使用KimiMessageDetector验证是否应该注入按钮
        if (!this.validateButtonInjection(element, siteConfig)) {
            debugLog(DEBUG_LEVEL.DEBUG, '⏭️ Button injection validation failed');
            return;
        }

        try {
            const targetContainer = this.findButtonContainer(element, siteConfig);
            if (!targetContainer) {
                debugLog(DEBUG_LEVEL.DEBUG, '⏭️ No suitable container found for button');
                return;
            }

            // 对于Kimi网站，检查是否已经有我们的按钮
            if (siteConfig.hostname === 'www.kimi.com') {
                if (targetContainer.querySelector('.puretext-copy-btn')) {
                    debugLog(DEBUG_LEVEL.DEBUG, '⏭️ Button already exists in Kimi container');
                    return;
                }
            }

            const buttonContainer = CopyButton.create(targetContainer, async (element) => {
                return await ClipboardManager.copyHtmlToClipboard(element);
            });

            if (buttonContainer) {
                // 对于Kimi网站，直接将按钮添加到容器中
                if (siteConfig.hostname === 'www.kimi.com') {
                    targetContainer.appendChild(buttonContainer);
                    debugLog(DEBUG_LEVEL.DEBUG, '✅ Button injected into Kimi container');
                } else {
                    // 其他网站使用原有的逻辑
                    targetContainer.appendChild(buttonContainer);
                    debugLog(DEBUG_LEVEL.DEBUG, '✅ Button injected successfully');
                }
                
                this.injectedButtons.add(element);
            }

        } catch (error) {
            debugLog(DEBUG_LEVEL.ERROR, '❌ Error injecting button:', error);
            this.attemptModuleRecovery();
        }
    }

    validateModuleAvailability() {
        const requiredModules = [
            { name: 'CopyButton', ref: CopyButton },
            { name: 'ClipboardManager', ref: ClipboardManager }
        ];

        for (const module of requiredModules) {
            if (typeof module.ref === 'undefined' || module.ref === null) {
                debugLog(DEBUG_LEVEL.ERROR, `❌ Module ${module.name} is not available`);
                return false;
            }
        }

        return true;
    }

    attemptModuleRecovery() {
        debugLog(DEBUG_LEVEL.WARN, '🔄 Attempting module recovery...');
        
        setTimeout(() => {
            if (this.validateModuleAvailability()) {
                debugLog(DEBUG_LEVEL.INFO, '✅ Module recovery successful');
                this.start();
            } else {
                debugLog(DEBUG_LEVEL.ERROR, '❌ Module recovery failed');
            }
        }, 1000);
    }

    findButtonContainer(element, siteConfig) {
        // 对于Kimi网站，使用特殊的按钮容器查找逻辑
        if (siteConfig.hostname === 'www.kimi.com') {
            return this.findKimiButtonContainer(element, siteConfig);
        }

        if (siteConfig.buttonContainer) {
            const container = element.querySelector(siteConfig.buttonContainer) ||
                element.closest(siteConfig.buttonContainer);
            if (container) {
                return container;
            }
        }

        let current = element;
        let attempts = 0;
        const maxAttempts = 5;

        while (current && attempts < maxAttempts) {
            if (this.isGoodButtonContainer(current)) {
                return current;
            }

            current = current.parentElement;
            attempts++;
        }

        return element;
    }

    findKimiButtonContainer(element, siteConfig) {
        // 首先尝试找到segment-assistant-actions-content容器
        let container = element.querySelector('.segment-assistant-actions-content');
        if (container) {
            debugLog(DEBUG_LEVEL.DEBUG, '✅ Found Kimi button container: .segment-assistant-actions-content');
            return container;
        }

        // 如果没找到，向上查找父级元素
        let current = element;
        let attempts = 0;
        const maxAttempts = 10;

        while (current && attempts < maxAttempts) {
            container = current.querySelector('.segment-assistant-actions-content');
            if (container) {
                debugLog(DEBUG_LEVEL.DEBUG, '✅ Found Kimi button container in parent element');
                return container;
            }

            current = current.parentElement;
            attempts++;
        }

        // 如果还是没找到，尝试查找segment-assistant-actions容器
        current = element;
        attempts = 0;

        while (current && attempts < maxAttempts) {
            container = current.querySelector('.segment-assistant-actions');
            if (container) {
                debugLog(DEBUG_LEVEL.DEBUG, '⚠️ Found segment-assistant-actions, will create content container');
                return container;
            }

            current = current.parentElement;
            attempts++;
        }

        debugLog(DEBUG_LEVEL.WARN, '❌ No Kimi button container found');
        return element;
    }

    isGoodButtonContainer(element) {
        if (!element) return false;

        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        const hasSpace = rect.width > 100 && rect.height > 30;
        const isPositioned = ['relative', 'absolute', 'fixed'].includes(style.position) ||
            ['block', 'flex', 'grid'].includes(style.display);
        const notInline = style.display !== 'inline';

        return hasSpace && isPositioned && notInline;
    }

    isElementVisible(element) {
        if (!element) return false;

        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        return style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            rect.width > 0 &&
            rect.height > 0;
    }

    validateButtonInjection(element, siteConfig) {
        try {
            // 对于Kimi网站，使用专门的消息检测器
            if (siteConfig.hostname === 'www.kimi.com') {
                const analysis = KimiMessageDetector.analyzeMessageType(element);
                
                debugLog(DEBUG_LEVEL.DEBUG, `🔍 Kimi消息分析结果:`, {
                    type: analysis.type,
                    confidence: (analysis.confidence * 100).toFixed(1) + '%',
                    indicators: analysis.indicators.join(', ')
                });

                // 如果是用户消息，不注入按钮
                if (analysis.type === MessageType.HUMAN) {
                    debugLog(DEBUG_LEVEL.DEBUG, '❌ 检测到用户消息，跳过按钮注入');
                    return false;
                }

                // 如果是AI回复，注入按钮
                if (analysis.type === MessageType.AI) {
                    debugLog(DEBUG_LEVEL.DEBUG, '✅ 检测到AI回复，允许按钮注入');
                    return true;
                }

                // 如果类型未知但置信度较低，使用备用检测方法
                if (analysis.confidence < 0.6) {
                    debugLog(DEBUG_LEVEL.DEBUG, '⚠️ 置信度较低，使用备用检测方法');
                    return this.fallbackMessageDetection(element);
                }

                return true;
            }

            // 对于其他网站，使用通用检测逻辑
            return this.genericMessageValidation(element, siteConfig);

        } catch (error) {
            debugLog(DEBUG_LEVEL.ERROR, '❌ 消息类型验证出错:', error);
            return true;
        }
    }

    fallbackMessageDetection(element) {
        const text = element.textContent?.trim() || '';
        
        const userPatterns = [
            /^(请|帮我|告诉我|我想|我需要)/,
            /[？?]$/,
            /^.{1,50}[？?]$/
        ];

        const isLikelyUserMessage = userPatterns.some(pattern => pattern.test(text));
        
        if (isLikelyUserMessage) {
            debugLog(DEBUG_LEVEL.DEBUG, '❌ 备用检测：识别为用户消息');
            return false;
        }

        debugLog(DEBUG_LEVEL.DEBUG, '✅ 备用检测：允许按钮注入');
        return true;
    }

    genericMessageValidation(element, siteConfig) {
        let current = element;
        for (let i = 0; i < 3 && current; i++) {
            const dataRole = current.getAttribute('data-role')?.toLowerCase();
            const dataAuthor = current.getAttribute('data-author')?.toLowerCase();
            const className = current.className?.toLowerCase() || '';

            if (dataRole === 'user' || dataAuthor === 'user' || className.includes('user-message')) {
                debugLog(DEBUG_LEVEL.DEBUG, '❌ 通用检测：识别为用户消息');
                return false;
            }

            if (dataRole === 'assistant' || dataAuthor === 'assistant' || className.includes('assistant')) {
                debugLog(DEBUG_LEVEL.DEBUG, '✅ 通用检测：识别为AI回复');
                return true;
            }

            current = current.parentElement;
        }

        debugLog(DEBUG_LEVEL.DEBUG, '✅ 通用检测：默认允许按钮注入');
        return true;
    }

    cleanupIncorrectButtons() {
        const allButtons = document.querySelectorAll(`.${this.containerClass}`);
        let removedCount = 0;

        allButtons.forEach(buttonContainer => {
            const parentElement = buttonContainer.parentElement;
            if (parentElement) {
                const siteConfig = this.siteManager.getCurrentSiteConfig();
                if (siteConfig && !this.validateButtonInjection(parentElement, siteConfig)) {
                    buttonContainer.remove();
                    removedCount++;
                    debugLog(DEBUG_LEVEL.DEBUG, '🧹 移除了错误放置的按钮');
                }
            }
        });

        if (removedCount > 0) {
            debugLog(DEBUG_LEVEL.INFO, `🧹 清理了 ${removedCount} 个错误放置的按钮`);
        }
    }

    stop() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.isObserving = false;
        debugLog(DEBUG_LEVEL.INFO, '🛑 Button injection stopped');
    }

    cleanup() {
        const buttons = document.querySelectorAll(`.${this.containerClass}`);
        buttons.forEach(button => {
            button.remove();
        });

        this.injectedButtons = new WeakSet();
        debugLog(DEBUG_LEVEL.INFO, '🧹 Cleaned up all injected buttons');
    }
}

// ==================== 主扩展类 ====================
class PureTextExtension {
    constructor() {
        this.siteManager = new SiteManager();
        this.buttonInjector = new ButtonInjector(this.siteManager);
        this.isRunning = false;
    }

    async start() {
        if (this.isRunning) {
            debugLog(DEBUG_LEVEL.DEBUG, '🔄 Extension already running');
            return;
        }

        try {
            debugLog(DEBUG_LEVEL.INFO, '🚀 Starting PureText Extension...');

            await this.siteManager.loadSiteConfig();

            if (!this.siteManager.isCurrentSiteSupported()) {
                debugLog(DEBUG_LEVEL.INFO, `ℹ️ Current site (${window.location.hostname}) is not supported`);
                return;
            }

            debugLog(DEBUG_LEVEL.INFO, `✅ Current site supported: ${window.location.hostname}`);

            this.buttonInjector.start();

            this.isRunning = true;
            debugLog(DEBUG_LEVEL.INFO, '✅ PureText Extension started successfully');

        } catch (error) {
            debugLog(DEBUG_LEVEL.ERROR, '❌ Failed to start extension:', error);
        }
    }

    stop() {
        if (!this.isRunning) {
            debugLog(DEBUG_LEVEL.DEBUG, '🔄 Extension not running');
            return;
        }

        try {
            debugLog(DEBUG_LEVEL.INFO, '🛑 Stopping PureText Extension...');

            this.buttonInjector.stop();
            this.buttonInjector.cleanup();

            this.isRunning = false;
            debugLog(DEBUG_LEVEL.INFO, '✅ PureText Extension stopped successfully');

        } catch (error) {
            debugLog(DEBUG_LEVEL.ERROR, '❌ Failed to stop extension:', error);
        }
    }

    async restart() {
        debugLog(DEBUG_LEVEL.INFO, '🔄 Restarting PureText Extension...');
        this.stop();
        await this.start();
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            currentSite: this.siteManager.getCurrentSiteConfig(),
            supportedSites: this.siteManager.getSupportedSites(),
            injectedButtonsCount: document.querySelectorAll('.puretext-button-container').length
        };
    }
}

// ==================== 初始化和启动 ====================
let pureTextExtension = null;

async function startExtension() {
    try {
        if (!pureTextExtension) {
            pureTextExtension = new PureTextExtension();
        }
        await pureTextExtension.start();
    } catch (error) {
        console.error('PureText: Failed to start extension:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        startExtension();
    });
} else {
    startExtension();
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && pureTextExtension) {
        setTimeout(() => {
            if (pureTextExtension.isRunning) {
                pureTextExtension.buttonInjector.start();
            }
        }, 1000);
    }
});

// 暴露全局控制函数供调试使用
window.pureTextExtension = pureTextExtension;
window.stopPureText = function () {
    if (pureTextExtension) {
        pureTextExtension.stop();
    }
};

// 暴露类供调试使用
window.KimiMessageDetector = KimiMessageDetector;
window.MessageType = MessageType;
window.ClipboardManager = ClipboardManager;
window.CopyButton = CopyButton;

debugLog(DEBUG_LEVEL.INFO, '✅ PureText extension unified script loaded successfully');