import { describe, it, expect, beforeEach } from 'vitest';
import { KimiMessageDetector, MessageType } from '../src/KimiMessageDetector.js';

describe('KimiMessageDetector', () => {
    let mockElement;

    beforeEach(() => {
        // 创建模拟的DOM环境
        global.window = {
            innerWidth: 1200
        };
        
        // 创建模拟元素
        mockElement = {
            textContent: '',
            className: '',
            getAttribute: () => null,
            querySelector: () => null,
            closest: () => null,
            parentElement: null,
            getBoundingClientRect: () => ({
                left: 100,
                width: 800
            })
        };
    });

    describe('analyzeMessageType', () => {
        it('应该识别明确的AI回复', () => {
            mockElement.textContent = '我是Kimi，我可以帮助您解决这个问题。根据您的描述，建议您采用以下方法：';
            mockElement.getAttribute = (attr) => {
                if (attr === 'data-role') return 'assistant';
                return null;
            };

            const result = KimiMessageDetector.analyzeMessageType(mockElement);
            
            expect(result.type).toBe(MessageType.AI);
            expect(result.confidence).toBeGreaterThan(0.7);
            expect(result.indicators).toContain('attr-assistant');
        });

        it('应该识别明确的用户消息', () => {
            mockElement.textContent = '请问如何解决这个问题？我需要帮助。';
            mockElement.className = 'user-message';

            const result = KimiMessageDetector.analyzeMessageType(mockElement);
            
            expect(result.type).toBe(MessageType.HUMAN);
            expect(result.confidence).toBeGreaterThan(0.5);
            expect(result.indicators).toContain('class-user-content');
        });

        it('应该处理空元素', () => {
            const result = KimiMessageDetector.analyzeMessageType(null);
            
            expect(result.type).toBe(MessageType.UNKNOWN);
            expect(result.confidence).toBe(0);
            expect(result.indicators).toContain('element-null');
        });

        it('应该基于文本内容进行分析', () => {
            mockElement.textContent = '我想了解更多关于这个话题的信息，你能告诉我吗？';

            const result = KimiMessageDetector.analyzeMessageType(mockElement);
            
            // 应该倾向于识别为用户消息，因为包含"我想"、"你能告诉我"等用户特征词
            expect(result.scores.humanScore).toBeGreaterThan(0);
            expect(result.indicators.some(i => i.includes('user-words'))).toBe(true);
        });

        it('应该识别结构化的AI回复', () => {
            mockElement.textContent = `
根据您的问题，我来为您详细解答：

1. 首先，需要了解基本概念
2. 其次，掌握具体方法
3. 最后，进行实践应用

希望这些信息对您有帮助。
            `;

            const result = KimiMessageDetector.analyzeMessageType(mockElement);
            
            expect(result.type).toBe(MessageType.AI);
            expect(result.indicators).toContain('structured-content');
            expect(result.indicators).toContain('multi-sentence');
        });
    });

    describe('isHumanMessage', () => {
        it('应该正确识别用户消息', () => {
            mockElement.textContent = '请帮我解决这个问题';
            mockElement.getAttribute = (attr) => {
                if (attr === 'data-role') return 'user';
                return null;
            };

            expect(KimiMessageDetector.isHumanMessage(mockElement)).toBe(true);
        });
    });

    describe('isAIResponse', () => {
        it('应该正确识别AI回复', () => {
            mockElement.textContent = '我可以帮助您解决这个问题。根据您的描述...';
            mockElement.getAttribute = (attr) => {
                if (attr === 'data-role') return 'assistant';
                return null;
            };

            expect(KimiMessageDetector.isAIResponse(mockElement)).toBe(true);
        });
    });

    describe('getDebugInfo', () => {
        it('应该返回格式化的调试信息', () => {
            mockElement.textContent = '这是一个测试消息';
            
            const debugInfo = KimiMessageDetector.getDebugInfo(mockElement);
            
            expect(debugInfo).toContain('消息类型分析');
            expect(debugInfo).toContain('类型:');
            expect(debugInfo).toContain('置信度:');
            expect(debugInfo).toContain('文本预览:');
        });
    });
});