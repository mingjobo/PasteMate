import './src/ClipboardManager.js';
import { CopyButton } from './src/CopyButton.js';
import { DownloadWordButton } from './src/DownloadWordButton.js';
import { DownloadPdfButton } from './src/DownloadPdfButton.js';
import { PaymentModal } from './src/PaymentModal.js';
import { exportToWord } from './src/export-to-word.js';
import { exportToPdf } from './src/export-to-pdf.js';
import { SUPPORTED_SITES } from './sites.js';
// 静态导入 html2pdf.js 并设置为全局变量
import html2pdf from 'html2pdf.js';
window.html2pdf = html2pdf;
// 将所有模块合并到一个文件中，避免ES模块导入问题

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
// 使用window.ClipboardManager方案，确保src/ClipboardManager.js已在content.js前加载
// 不再import，不再定义ClipboardManager类
// 所有ClipboardManager.copyHtmlToClipboard调用都改为window.ClipboardManager.copyHtmlToClipboard

// ==================== CopyButton ====================
// 使用 src/CopyButton.js 导出的 CopyButton 类

// ==================== 按钮注入器 ====================
class ButtonInjector {
    constructor(siteManager) {
        this.siteManager = siteManager;
        this.observer = null;
        this.injectedButtons = new WeakSet();
        this.buttonClass = 'puretext-copy-btn';
        this.debounceTimer = null;
        this.debounceDelay = 100;
    }

    start() {
        this.startObserving();
    }

    stop() {
        this.stopObserving();
    }

    cleanup() {
        this.stopObserving();
        // 清理所有注入的按钮
        document.querySelectorAll('.puretext-button-container, .puretext-button-group').forEach(btn => btn.remove());
        this.injectedButtons = new WeakSet();
    }

    startObserving() {
        if (this.observer) {
            this.stopObserving();
        }

        this.scanAndInjectButtons();

        this.observer = new MutationObserver((mutations) => {
            this.handleMutations(mutations);
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false
        });
    }

    stopObserving() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
    }

    handleMutations(mutations) {
        let shouldScan = false;

        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        shouldScan = true;
                        break;
                    }
                }
            }
            
            if (shouldScan) break;
        }

        if (shouldScan) {
            this.debouncedScan();
        }
    }

    debouncedScan() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.scanAndInjectButtons();
        }, this.debounceDelay);
    }

    scanAndInjectButtons() {
        const siteConfig = this.siteManager.getCurrentSiteConfig();
        if (!siteConfig) {
            return;
        }

        try {
            // Kimi网站特殊处理：直接查找segment-assistant-actions-content容器
            if (window.location.hostname === 'www.kimi.com') {
                const actionContainers = document.querySelectorAll('.segment-assistant-actions-content');
                debugLog(DEBUG_LEVEL.DEBUG, `🔍 Found ${actionContainers.length} action containers for Kimi`);
                for (const container of actionContainers) {
                    this.injectButtonToKimiActions(container);
                }
                return;
            }

            // DeepSeek特殊处理：按钮插入到所有ds-icon-button同级，且在其右侧
            if (window.location.hostname === 'chat.deepseek.com') {
                // 选择所有AI回复区块
                const selectors = siteConfig.selectors || [];
                let bubbles = [];
                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        bubbles = Array.from(elements);
                        break;
                    }
                }
                for (const bubble of bubbles) {
                    // 1. 优先在bubble的下一个兄弟节点查找.ds-icon-button
                    let opArea = bubble.nextElementSibling;
                    let iconButtons = opArea ? opArea.querySelectorAll('.ds-icon-button') : [];
                    if (!iconButtons || iconButtons.length === 0) {
                        // 2. 如果找不到，再在父节点下查找
                        opArea = bubble.parentElement;
                        iconButtons = opArea ? opArea.querySelectorAll('.ds-icon-button') : [];
                    }
                    console.log('[PureText] bubble:', bubble);
                    console.log('[PureText] opArea:', opArea);
                    console.log('[PureText] iconButtons:', iconButtons);
                    if (!iconButtons || iconButtons.length === 0) continue;
                    const parent = iconButtons[0].parentNode;
                    console.log('[PureText] parent:', parent);
                    // 检查是否已插入
                    if (parent.querySelector('.puretext-button-group')) continue;
                    
                    // 创建按钮组容器
                    const buttonGroup = document.createElement('div');
                    buttonGroup.className = 'puretext-button-group';
                    buttonGroup.style.display = 'inline-flex';
                    buttonGroup.style.alignItems = 'center';
                    buttonGroup.style.gap = '4px';
                    
                    // 创建复制按钮
                    const onCopy = async (buttonContainer) => {
                        const aiContent = bubble;
                        return window.ClipboardManager.copyHtmlToClipboard(aiContent);
                    };
                    const copyBtn = CopyButton.create(bubble, onCopy);
                    
                    // 创建下载为 Word 按钮
                    const onDownloadWord = async (buttonContainer) => {
                        const aiContent = bubble;
                        const paymentModal = window.PaymentModal;
                        paymentModal.showPaymentModal('word', async () => {
                            await exportToWord(aiContent, 'PureText.docx', bubble, 'deepseek');
                        });
                    };
                    const wordBtn = DownloadWordButton.create(bubble, onDownloadWord);
                    
                    // 创建下载为 PDF 按钮
                    const onDownloadPdf = async (buttonContainer) => {
                        const aiContent = bubble;
                        const paymentModal = window.PaymentModal;
                        paymentModal.showPaymentModal('pdf', async () => {
                            await exportToPdf(aiContent, 'PureText.pdf', bubble);
                        });
                    };
                    const pdfBtn = DownloadPdfButton.create(bubble, onDownloadPdf);
                    
                    // 将按钮添加到按钮组
                    buttonGroup.appendChild(copyBtn);
                    buttonGroup.appendChild(wordBtn);
                    buttonGroup.appendChild(pdfBtn);
                    
                    // 插入到最后一个ds-icon-button后面
                    parent.insertBefore(buttonGroup, iconButtons[iconButtons.length - 1].nextSibling);
                    console.log('[PureText] 已插入puretext-button-group', buttonGroup, '到', parent);
                }
                return;
            }

            // 其他网站使用原有逻辑
            const selectors = siteConfig.selectors || [];
            let bubbles = [];
            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    bubbles = Array.from(elements);
                    break;
                }
            }
            if (bubbles.length === 0 && siteConfig.buttonContainer) {
                const buttonContainers = document.querySelectorAll(siteConfig.buttonContainer);
                bubbles = Array.from(buttonContainers);
            }
            for (const bubble of bubbles) {
                this.injectButton(bubble);
            }
        } catch (error) {
            debugLog(DEBUG_LEVEL.ERROR, '❌ Error scanning for buttons:', error);
        }
    }

    injectButtonToKimiActions(actionContainer) {
        try {
            if (!document.contains(actionContainer)) {
                return;
            }

            if (this.injectedButtons.has(actionContainer)) {
                return;
            }

            // 检查是否已经存在我们的按钮
            if (actionContainer.querySelector(`.${this.buttonClass}, .puretext-button-container`)) {
                return;
            }

            // 检查是否是AI回复的actions容器
            const segmentAssistant = actionContainer.closest('.segment-assistant');
            if (!segmentAssistant) {
                debugLog(DEBUG_LEVEL.DEBUG, '🔄 Skipping non-assistant actions container');
                return;
            }

            const button = this.createButtonForKimiActions(actionContainer);
            actionContainer.appendChild(button);
            this.injectedButtons.add(actionContainer);

            debugLog(DEBUG_LEVEL.DEBUG, '✅ Kimi actions button injected successfully');

        } catch (error) {
            debugLog(DEBUG_LEVEL.ERROR, '❌ Error injecting Kimi actions button:', error);
        }
    }

    injectButton(bubble) {
        try {
            if (!document.contains(bubble)) {
                return;
            }

            if (this.injectedButtons.has(bubble)) {
                return;
            }

            if (bubble.querySelector(`.${this.buttonClass}, .puretext-button-group`)) {
                return;
            }

            // 检查是否是 AI 回复（对于 Kimi 网站）
            if (window.location.hostname === 'www.kimi.com') {
                if (!KimiMessageDetector.isAIResponse(bubble)) {
                    debugLog(DEBUG_LEVEL.DEBUG, '🔄 Skipping human message for Kimi');
                    return;
                }
            }

            const button = this.createButton(bubble);
            bubble.appendChild(button);
            this.injectedButtons.add(bubble);

            debugLog(DEBUG_LEVEL.DEBUG, '✅ Button injected successfully');

        } catch (error) {
            debugLog(DEBUG_LEVEL.ERROR, '❌ Error injecting button:', error);
        }
    }

    createButtonForKimiActions(actionContainer) {
        const onCopy = async (buttonContainer) => {
            try {
                // 从actions容器向上查找AI回复内容
                const segmentAssistant = buttonContainer.closest('.segment-assistant');
                if (!segmentAssistant) {
                    debugLog(DEBUG_LEVEL.ERROR, '❌ 未找到 segment-assistant 容器');
                    return false;
                }

                const aiContent = segmentAssistant.querySelector('.segment-content-box .markdown-container');
                if (!aiContent) {
                    debugLog(DEBUG_LEVEL.ERROR, '❌ 未找到 AI 回复内容');
                    return false;
                }

                // 添加详细日志
                console.log('[PureText] ========== Kimi复制操作开始 ==========');
                console.log('[PureText] 按钮容器:', buttonContainer?.tagName, buttonContainer?.className);
                console.log('[PureText] 找到的 AI 内容容器:', aiContent?.tagName, aiContent?.className);
                console.log('[PureText] AI 内容文本预览:', (aiContent?.textContent || '').substring(0, 100) + '...');

                const success = await window.ClipboardManager.copyHtmlToClipboard(aiContent);
                
                console.log('[PureText] 复制结果:', success ? '成功' : '失败');
                console.log('[PureText] ========== Kimi复制操作结束 ==========');
                
                return success;
            } catch (error) {
                debugLog(DEBUG_LEVEL.ERROR, '❌ Kimi copy operation failed:', error);
                return false;
            }
        };

        // 为Kimi actions容器创建特殊样式的按钮
        const buttonText = chrome?.i18n ? chrome.i18n.getMessage('copyToWord') : '复制为Word格式';
        
        const container = document.createElement('div');
        container.className = 'puretext-button-container';
        container.style.cssText = `
            display: inline-flex;
            align-items: center;
            margin-left: 8px;
            pointer-events: auto;
            background: none;
            border: none;
            box-shadow: none;
            padding: 0;
        `;

        // 复制按钮
        const copyBtn = document.createElement('button');
        copyBtn.className = 'puretext-action-btn';
        copyBtn.textContent = buttonText;
        copyBtn.type = 'button';
        copyBtn.setAttribute('aria-label', buttonText);
        copyBtn.setAttribute('title', buttonText);
        
        // 应用Kimi actions按钮的特殊样式
        copyBtn.style.cssText = `
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
            background: transparent;
            color: var(--color-text-1, #374151);
            border: none;
            border-radius: 4px;
            box-shadow: none;
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

        // 添加交互效果
        copyBtn.addEventListener('mouseenter', () => {
            copyBtn.style.opacity = '1';
            copyBtn.style.background = 'var(--color-fill-2, rgba(0, 0, 0, 0.04))';
            copyBtn.style.transform = 'translateY(-1px) translateZ(0)';
        });
        copyBtn.addEventListener('mouseleave', () => {
            copyBtn.style.opacity = '0.9';
            copyBtn.style.background = 'transparent';
            copyBtn.style.transform = 'translateY(0) translateZ(0)';
        });
        copyBtn.addEventListener('focus', () => {
            copyBtn.style.outline = '2px solid #3b82f6';
            copyBtn.style.outlineOffset = '2px';
            copyBtn.style.opacity = '1';
        });
        copyBtn.addEventListener('blur', () => {
            copyBtn.style.outline = 'none';
            copyBtn.style.opacity = '0.9';
        });
        copyBtn.addEventListener('mousedown', () => {
            copyBtn.style.transform = 'translateY(0) scale(0.98) translateZ(0)';
            copyBtn.style.background = 'var(--color-fill-3, rgba(0, 0, 0, 0.08))';
        });
        copyBtn.addEventListener('mouseup', () => {
            copyBtn.style.transform = 'translateY(-1px) translateZ(0)';
            copyBtn.style.background = 'var(--color-fill-2, rgba(0, 0, 0, 0.04))';
        });

        // 添加点击事件
        copyBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            // 点击反馈
            copyBtn.style.transform = 'scale(0.95) translateZ(0)';
            setTimeout(() => {
                copyBtn.style.transform = 'translateZ(0)';
            }, 150);
            
            // const originalText = copyBtn.textContent;
            // copyBtn.textContent = '处理中...';
            
            try {
                await onCopy(actionContainer);
            } catch (error) {
                console.error('PureText: Kimi action failed:', error);
            } finally {
                setTimeout(() => {
                    // copyBtn.textContent = originalText;
                }, 500);
            }
        });

        // 新增：下载为 Word 按钮
        const onDownloadWord = async (buttonContainer) => {
            const segmentAssistant = buttonContainer.closest('.segment-assistant');
            if (!segmentAssistant) return;
            const aiContent = segmentAssistant.querySelector('.segment-content-box .markdown-container');
            if (!aiContent) return;
            const paymentModal = window.PaymentModal;
            paymentModal.showPaymentModal('word', async () => {
                await exportToWord(aiContent, 'PureText.docx', aiContent, 'kimi');
            });
        };
        const wordBtn = DownloadWordButton.create(actionContainer, onDownloadWord);
        // 新增：下载为 PDF 按钮
        const onDownloadPdf = async (buttonContainer) => {
            const segmentAssistant = buttonContainer.closest('.segment-assistant');
            if (!segmentAssistant) return;
            const aiContent = segmentAssistant.querySelector('.segment-content-box .markdown-container');
            if (!aiContent) return;
            const paymentModal = window.PaymentModal;
            paymentModal.showPaymentModal('pdf', async () => {
                await exportToPdf(aiContent, 'PureText.pdf', aiContent);
            });
        };
        const pdfBtn = DownloadPdfButton.create(actionContainer, onDownloadPdf);

        container.appendChild(copyBtn);
        // 直接添加整个按钮容器，而不是尝试提取按钮元素
        container.appendChild(wordBtn);
        container.appendChild(pdfBtn);
        return container;
    }

    createButton(targetBubble) {
        const onCopy = async (buttonContainer) => {
            try {
                // 关键修正：找到正确的 AI 回复内容，而不是按钮容器
                const aiContent = this.findAIResponseContent(buttonContainer);
                if (!aiContent) {
                    debugLog(DEBUG_LEVEL.ERROR, '❌ 未找到 AI 回复内容');
                    return false;
                }

                // 添加详细日志
                console.log('[PureText] ========== 复制操作开始 ==========');
                console.log('[PureText] 按钮容器:', buttonContainer?.tagName, buttonContainer?.className);
                console.log('[PureText] 找到的 AI 内容容器:', aiContent?.tagName, aiContent?.className);
                console.log('[PureText] AI 内容文本预览:', (aiContent?.textContent || '').substring(0, 100) + '...');
                console.log('[PureText] AI 内容 outerHTML 预览:', (aiContent?.outerHTML || '').substring(0, 200) + '...');

                const success = await window.ClipboardManager.copyHtmlToClipboard(aiContent);
                
                console.log('[PureText] 复制结果:', success ? '成功' : '失败');
                console.log('[PureText] ========== 复制操作结束 ==========');
                
                return success;
            } catch (error) {
                debugLog(DEBUG_LEVEL.ERROR, '❌ Copy operation failed:', error);
                return false;
            }
        };

        // 复制按钮
        const copyBtn = CopyButton.create(targetBubble, onCopy);
        // 新增：下载为 Word 按钮
        const onDownloadWord = async (buttonContainer) => {
            const aiContent = this.findAIResponseContent(buttonContainer);
            if (!aiContent) return;
            const hostname = window.location.hostname;
            const source = hostname === 'www.kimi.com' ? 'kimi' : 'deepseek';
            const paymentModal = window.PaymentModal;
            paymentModal.showPaymentModal('word', async () => {
                await exportToWord(aiContent, 'PureText.docx', aiContent, source);
            });
        };
        const wordBtn = DownloadWordButton.create(targetBubble, onDownloadWord);
        // 新增：下载为 PDF 按钮
        const onDownloadPdf = async (buttonContainer) => {
            const aiContent = this.findAIResponseContent(buttonContainer);
            if (!aiContent) return;
            const paymentModal = window.PaymentModal;
            paymentModal.showPaymentModal('pdf', async () => {
                await exportToPdf(aiContent, 'PureText.pdf', aiContent);
            });
        };
        const pdfBtn = DownloadPdfButton.create(targetBubble, onDownloadPdf);
        // 创建按钮组容器
        const group = document.createElement('div');
        group.className = 'puretext-button-group';
        group.style.display = 'inline-flex';
        group.appendChild(copyBtn);
        group.appendChild(wordBtn);
        group.appendChild(pdfBtn);
        return group;
    }

    /**
     * 关键方法：找到正确的 AI 回复内容
     * @param {HTMLElement} buttonContainer - 按钮所在的容器
     * @returns {HTMLElement|null} AI 回复内容容器
     */
    findAIResponseContent(buttonContainer) {
        const hostname = window.location.hostname;
        
        if (hostname === 'www.kimi.com') {
            // Kimi 网站：从按钮容器向上查找 AI 回复内容
            console.log('[PureText] 查找 Kimi AI 回复内容...');
            
            // 方法1：从 segment-assistant-actions-content 向上查找 segment-content-box
            let current = buttonContainer;
            while (current && current !== document.body) {
                console.log('[PureText] 检查元素:', current.tagName, current.className);
                
                // 检查是否是 AI 回复容器
                if (current.classList.contains('segment-content-box')) {
                    console.log('[PureText] 找到 segment-content-box');
                    return current;
                }
                
                // 检查是否包含 markdown-container
                const markdownContainer = current.querySelector('.markdown-container');
                if (markdownContainer) {
                    console.log('[PureText] 找到 markdown-container');
                    return markdownContainer;
                }
                
                current = current.parentElement;
            }
            
            // 方法2：直接查找最近的 AI 回复内容
            const aiContent = buttonContainer.closest('.segment-content-box')?.querySelector('.markdown-container');
            if (aiContent) {
                console.log('[PureText] 通过 closest 找到 AI 内容');
                return aiContent;
            }
            
            console.log('[PureText] 未找到 Kimi AI 回复内容');
            return null;
        }
        
        // 其他网站：直接使用按钮容器
        return buttonContainer;
    }

    detectDarkTheme() {
        try {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ||
                   document.documentElement.classList.contains('dark') ||
                   document.body.classList.contains('dark');
        } catch (error) {
            return false;
        }
    }

    getColorScheme(isDark) {
        if (isDark) {
            return {
                background: 'rgba(255, 255, 255, 0.1)',
                text: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                shadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                hoverBackground: 'rgba(255, 255, 255, 0.15)',
                hoverShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                activeBackground: 'rgba(255, 255, 255, 0.2)',
                focus: '#60a5fa'
            };
        }
        
        return {
            background: 'rgba(255, 255, 255, 0.9)',
            text: '#374151',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            shadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            hoverBackground: 'rgba(255, 255, 255, 1)',
            hoverShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            activeBackground: 'rgba(0, 0, 0, 0.05)',
            focus: '#3b82f6'
        };
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
            injectedButtonsCount: document.querySelectorAll('.puretext-button-container, .puretext-button-group').length
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
window.ClipboardManager = window.ClipboardManager;
window.CopyButton = CopyButton;
window.DownloadWordButton = DownloadWordButton;
window.DownloadPdfButton = DownloadPdfButton;
window.PaymentModal = window.PaymentModal;
window.exportToWord = exportToWord;
window.exportToPdf = exportToPdf;

debugLog(DEBUG_LEVEL.INFO, '✅ PureText extension unified script loaded successfully');