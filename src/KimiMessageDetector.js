/**
 * Kimi消息检测器
 * 专门用于在Kimi网站上准确识别AI回复和用户消息
 */

// 消息类型枚举
export const MessageType = {
    HUMAN: 'human',
    AI: 'ai',
    UNKNOWN: 'unknown'
};

export class KimiMessageDetector {
    /**
     * 判断元素是否包含用户消息
     * @param {HTMLElement} element - 要分析的元素
     * @returns {boolean} 如果是用户消息返回true
     */
    static isHumanMessage(element) {
        const analysis = this.analyzeMessageType(element);
        return analysis.type === MessageType.HUMAN;
    }

    /**
     * 判断元素是否包含AI回复
     * @param {HTMLElement} element - 要分析的元素
     * @returns {boolean} 如果是AI回复返回true
     */
    static isAIResponse(element) {
        const analysis = this.analyzeMessageType(element);
        return analysis.type === MessageType.AI;
    }

    /**
     * 分析元素特征以确定消息类型
     * @param {HTMLElement} element - 要分析的元素
     * @returns {Object} 包含类型和置信度的分析结果
     */
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

    /**
     * 分析元素属性和类名
     * @param {HTMLElement} element - 要分析的元素
     * @returns {Object} 属性分析结果
     */
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

    /**
     * 分析文本内容特征
     * @param {HTMLElement} element - 要分析的元素
     * @returns {Object} 内容分析结果
     */
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

    /**
     * 分析元素结构和位置（Kimi特定）
     * @param {HTMLElement} element - 要分析的元素
     * @returns {Object} 结构分析结果
     */
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

    /**
     * 分析内容复杂度
     * @param {HTMLElement} element - 要分析的元素
     * @returns {Object} 复杂度分析结果
     */
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

    /**
     * 获取调试信息
     * @param {HTMLElement} element - 要分析的元素
     * @returns {string} 格式化的调试信息
     */
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