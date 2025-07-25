// 一键纯文扩展 - 内容脚本
// 注意：SUPPORTED_SITES 配置在 sites.js 中定义

// 调试日志级别
const DEBUG_LEVEL = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

// 当前调试级别（可以通过控制台修改：window.PURETEXT_DEBUG_LEVEL = 3）
window.PURETEXT_DEBUG_LEVEL = window.PURETEXT_DEBUG_LEVEL || DEBUG_LEVEL.INFO;

// 调试日志函数
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

/**
 * 站点管理器类
 * 负责站点配置加载、当前站点识别和支持检查
 */
class SiteManager {
    constructor() {
        this.siteConfig = null;
        this.currentSite = null;
    }

    /**
     * 加载站点配置
     * 首先尝试从存储加载用户配置，如果失败则使用内置配置
     */
    async loadSiteConfig() {
        debugLog(DEBUG_LEVEL.DEBUG, '📋 Loading site configuration...');

        try {
            // 检查 SUPPORTED_SITES 是否可用
            debugLog(DEBUG_LEVEL.DEBUG, '🔍 Checking SUPPORTED_SITES availability:', typeof SUPPORTED_SITES);

            if (typeof SUPPORTED_SITES === 'undefined') {
                debugLog(DEBUG_LEVEL.ERROR, '❌ SUPPORTED_SITES is undefined! sites.js may not be loaded.');
                this.siteConfig = {};
                return;
            }

            debugLog(DEBUG_LEVEL.DEBUG, '📊 Available sites:', Object.keys(SUPPORTED_SITES));

            // 使用全局的SUPPORTED_SITES配置（从sites.js加载）
            const baseSites = { ...SUPPORTED_SITES };

            // 尝试从存储加载用户配置（为未来的配置功能预留）
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.sync.get(['customSites', 'disabledSites']);
                if (result.customSites || result.disabledSites) {
                    this.siteConfig = this.mergeConfigs(baseSites, result);
                    debugLog(DEBUG_LEVEL.INFO, '✅ Loaded user configuration');
                    return;
                }
            }

            // 使用内置配置作为默认
            this.siteConfig = baseSites;
            debugLog(DEBUG_LEVEL.INFO, '✅ Using built-in site configuration');

        } catch (error) {
            debugLog(DEBUG_LEVEL.WARN, '⚠️ Failed to load user config, using built-in config:', error);
            this.siteConfig = typeof SUPPORTED_SITES !== 'undefined' ? { ...SUPPORTED_SITES } : {};
        }
    }

    /**
     * 合并内置配置和用户配置
     * @param {Object} builtInConfig - 内置站点配置
     * @param {Object} userConfig - 用户配置
     * @returns {Object} 合并后的配置
     */
    mergeConfigs(builtInConfig, userConfig) {
        const merged = { ...builtInConfig };

        // 添加用户自定义站点
        if (userConfig.customSites) {
            Object.assign(merged, userConfig.customSites);
        }

        // 移除用户禁用的站点
        if (userConfig.disabledSites && Array.isArray(userConfig.disabledSites)) {
            userConfig.disabledSites.forEach(hostname => {
                delete merged[hostname];
            });
        }

        return merged;
    }

    /**
     * 获取当前站点配置
     * @returns {Object|null} 当前站点的配置对象，如果不支持则返回null
     */
    getCurrentSite() {
        if (!this.siteConfig) {
            debugLog(DEBUG_LEVEL.WARN, '⚠️ Site config not loaded');
            return null;
        }

        const hostname = window.location.hostname;
        debugLog(DEBUG_LEVEL.DEBUG, '🌐 Checking current hostname:', hostname);

        this.currentSite = this.siteConfig[hostname] || null;

        if (this.currentSite) {
            // 添加hostname信息到配置中
            this.currentSite.hostname = hostname;
            debugLog(DEBUG_LEVEL.INFO, '✅ Current site supported:', this.currentSite.name);
            debugLog(DEBUG_LEVEL.DEBUG, '🎯 Site selector:', this.currentSite.selector);
        } else {
            debugLog(DEBUG_LEVEL.WARN, '❌ Current site not supported:', hostname);
            debugLog(DEBUG_LEVEL.DEBUG, '📋 Available sites:', Object.keys(this.siteConfig));
        }

        return this.currentSite;
    }

    /**
     * 检查当前站点是否支持
     * @returns {boolean} 如果当前站点支持则返回true
     */
    isSupported() {
        return this.getCurrentSite() !== null;
    }

    /**
     * 获取当前站点的有效选择器
     * @returns {string|null} CSS选择器字符串，如果不支持则返回null
     */
    getSelector() {
        const site = this.getCurrentSite();
        if (!site) return null;

        // 如果是新格式（多选择器），尝试找到有效的选择器
        if (site.selectors && Array.isArray(site.selectors)) {
            return this.findValidSelector(site.selectors);
        }

        // 兼容旧格式（单选择器）
        if (site.selector) {
            return site.selector;
        }

        return null;
    }

    /**
     * 从多个选择器中找到第一个有效的选择器
     * @param {string[]} selectors - 选择器数组
     * @returns {string|null} 第一个有效的选择器，如果都无效则返回null
     */
    findValidSelector(selectors) {
        for (const selector of selectors) {
            try {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    // 验证元素是否有实际内容
                    const hasContent = Array.from(elements).some(el => {
                        const text = el.textContent?.trim();
                        return text && text.length > 10; // 至少10个字符
                    });

                    if (hasContent) {
                        debugLog(DEBUG_LEVEL.INFO, `✅ 找到有效选择器: ${selector} (匹配 ${elements.length} 个元素)`);
                        return selector;
                    }
                }
            } catch (error) {
                debugLog(DEBUG_LEVEL.DEBUG, `⚠️ 选择器无效: ${selector}`, error);
                continue;
            }
        }

        debugLog(DEBUG_LEVEL.WARN, '❌ 所有预设选择器都无效，尝试智能发现...');
        return this.discoverSelector();
    }

    /**
     * 智能发现页面中的 AI 回复元素选择器
     * @returns {string|null} 发现的选择器，如果未找到则返回null
     */
    discoverSelector() {
        const site = this.getCurrentSite();
        if (!site || !site.features) {
            return null;
        }

        debugLog(DEBUG_LEVEL.INFO, '🔍 开始智能选择器发现...');

        const candidates = [];

        // 方法1: 通过文本特征匹配
        if (site.features.textIndicators) {
            const textCandidates = this.findByTextIndicators(site.features.textIndicators);
            candidates.push(...textCandidates);
        }

        // 方法2: 通过角色属性匹配
        if (site.features.roleAttributes) {
            const roleCandidates = this.findByRoleAttributes(site.features.roleAttributes);
            candidates.push(...roleCandidates);
        }

        // 方法3: 通过容器类名匹配
        if (site.features.containerClasses) {
            const classCandidates = this.findByContainerClasses(site.features.containerClasses);
            candidates.push(...classCandidates);
        }

        // 分析候选元素并选择最佳的
        const bestSelector = this.selectBestCandidate(candidates);

        if (bestSelector) {
            debugLog(DEBUG_LEVEL.INFO, `🎯 智能发现选择器: ${bestSelector}`);
        } else {
            debugLog(DEBUG_LEVEL.WARN, '❌ 智能发现失败，未找到合适的选择器');
        }

        return bestSelector;
    }

    /**
     * 通过文本指示词查找候选元素
     * @param {string[]} indicators - 文本指示词数组
     * @returns {Object[]} 候选元素数组
     */
    findByTextIndicators(indicators) {
        const candidates = [];

        // 查找包含指示词的元素
        const allElements = document.querySelectorAll('div, p, section, article');

        allElements.forEach(element => {
            const text = element.textContent?.trim();
            if (!text || text.length < 20) return;

            // 检查是否包含任何指示词
            const hasIndicator = indicators.some(indicator =>
                text.includes(indicator)
            );

            if (hasIndicator) {
                candidates.push({
                    element,
                    selector: this.generateElementSelector(element),
                    confidence: 0.7,
                    method: 'text-indicator'
                });
            }
        });

        return candidates;
    }

    /**
     * 通过角色属性查找候选元素
     * @param {string[]} attributes - 角色属性数组
     * @returns {Object[]} 候选元素数组
     */
    findByRoleAttributes(attributes) {
        const candidates = [];

        attributes.forEach(attr => {
            try {
                // 解析属性名和值
                const [attrName, attrValue] = attr.split('=');
                const selector = `[${attrName}="${attrValue}"]`;

                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    candidates.push({
                        element,
                        selector,
                        confidence: 0.9,
                        method: 'role-attribute'
                    });
                });
            } catch (error) {
                debugLog(DEBUG_LEVEL.DEBUG, `⚠️ 角色属性查找失败: ${attr}`, error);
            }
        });

        return candidates;
    }

    /**
     * 通过容器类名查找候选元素
     * @param {string[]} classes - 容器类名数组
     * @returns {Object[]} 候选元素数组
     */
    findByContainerClasses(classes) {
        const candidates = [];

        classes.forEach(className => {
            try {
                // 查找包含该类名的元素
                const elements = document.querySelectorAll(`[class*="${className}"]`);

                elements.forEach(element => {
                    // 验证元素是否有实际内容
                    const text = element.textContent?.trim();
                    if (text && text.length > 50) {
                        candidates.push({
                            element,
                            selector: this.generateElementSelector(element),
                            confidence: 0.6,
                            method: 'container-class'
                        });
                    }
                });
            } catch (error) {
                debugLog(DEBUG_LEVEL.DEBUG, `⚠️ 容器类名查找失败: ${className}`, error);
            }
        });

        return candidates;
    }

    /**
     * 为元素生成CSS选择器
     * @param {HTMLElement} element - 目标元素
     * @returns {string} CSS选择器
     */
    generateElementSelector(element) {
        // 优先使用ID
        if (element.id) {
            return `#${element.id}`;
        }

        // 使用类名组合
        if (element.className && typeof element.className === 'string') {
            const classes = element.className.split(' ')
                .filter(c => c.trim() && !c.match(/^(ng-|_|css-)/)) // 过滤掉框架生成的类名
                .slice(0, 3); // 最多使用3个类名

            if (classes.length > 0) {
                return `.${classes.join('.')}`;
            }
        }

        // 使用标签名和属性组合
        let selector = element.tagName.toLowerCase();

        // 添加有意义的属性
        const meaningfulAttrs = ['data-role', 'data-author', 'data-type', 'role'];
        meaningfulAttrs.forEach(attr => {
            const value = element.getAttribute(attr);
            if (value) {
                selector += `[${attr}="${value}"]`;
            }
        });

        return selector;
    }

    /**
     * 从候选元素中选择最佳的选择器
     * @param {Object[]} candidates - 候选元素数组
     * @returns {string|null} 最佳选择器
     */
    selectBestCandidate(candidates) {
        if (candidates.length === 0) {
            return null;
        }

        // 去重并计算得分
        const uniqueCandidates = new Map();

        candidates.forEach(candidate => {
            const key = candidate.selector;
            if (uniqueCandidates.has(key)) {
                // 如果已存在，取较高的置信度
                const existing = uniqueCandidates.get(key);
                if (candidate.confidence > existing.confidence) {
                    uniqueCandidates.set(key, candidate);
                }
            } else {
                uniqueCandidates.set(key, candidate);
            }
        });

        // 验证并评分
        const validCandidates = [];

        uniqueCandidates.forEach(candidate => {
            try {
                const elements = document.querySelectorAll(candidate.selector);
                if (elements.length > 0 && elements.length <= 20) { // 合理的元素数量
                    let score = candidate.confidence;

                    // 根据元素数量调整得分
                    if (elements.length >= 1 && elements.length <= 5) {
                        score += 0.2; // 元素数量适中
                    }

                    // 根据文本内容质量调整得分
                    const avgTextLength = Array.from(elements).reduce((sum, el) => {
                        return sum + (el.textContent?.trim().length || 0);
                    }, 0) / elements.length;

                    if (avgTextLength > 100) {
                        score += 0.1; // 有丰富的文本内容
                    }

                    validCandidates.push({
                        ...candidate,
                        score,
                        elementCount: elements.length,
                        avgTextLength
                    });
                }
            } catch (error) {
                // 选择器无效，跳过
            }
        });

        if (validCandidates.length === 0) {
            return null;
        }

        // 按得分排序，返回最佳选择器
        validCandidates.sort((a, b) => b.score - a.score);

        const best = validCandidates[0];
        debugLog(DEBUG_LEVEL.INFO, `🏆 最佳候选: ${best.selector} (得分: ${best.score.toFixed(2)}, 方法: ${best.method})`);

        return best.selector;
    }

    /**
     * 获取当前站点的显示名称
     * @returns {string|null} 站点显示名称，如果不支持则返回null
     */
    getSiteName() {
        const site = this.getCurrentSite();
        return site ? site.name : null;
    }

    /**
     * 验证站点配置的有效性
     * @param {Object} siteConfig - 要验证的站点配置
     * @returns {boolean} 配置是否有效
     */
    validateSiteConfig(siteConfig) {
        if (!siteConfig || typeof siteConfig !== 'object') {
            return false;
        }

        // 检查必需的字段
        if (!siteConfig.selector || typeof siteConfig.selector !== 'string') {
            return false;
        }

        if (!siteConfig.name || typeof siteConfig.name !== 'string') {
            return false;
        }

        // 验证选择器格式（基本检查）
        try {
            document.querySelector(siteConfig.selector);
            return true;
        } catch (error) {
            console.warn('PureText: Invalid CSS selector:', siteConfig.selector, error);
            return false;
        }
    }
}

/**
 * 剪贴板管理器类
 * 负责纯文本提取和剪贴板操作
 */
class ClipboardManager {
    /**
     * 复制元素的纯文本内容到剪贴板
     * @param {HTMLElement} element - 要复制内容的DOM元素
     * @returns {Promise<boolean>} 复制是否成功
     */
    static async copyPlainText(element) {
        try {
            if (!element) {
                console.warn('PureText: No element provided for copying');
                return false;
            }

            const plainText = this.extractPlainText(element);

            if (!plainText.trim()) {
                console.warn('PureText: No text content found to copy');
                return false;
            }

            // 尝试使用现代 Clipboard API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(plainText);
                this.showSuccessMessage();
                return true;
            } else {
                // 降级到传统方法
                return this.fallbackCopyMethod(plainText);
            }
        } catch (error) {
            console.error('PureText: Clipboard write failed:', error);
            // 尝试降级方法
            try {
                const plainText = this.extractPlainText(element);
                return this.fallbackCopyMethod(plainText);
            } catch (fallbackError) {
                console.error('PureText: Fallback copy method also failed:', fallbackError);
                this.showErrorMessage();
                return false;
            }
        }
    }

    /**
     * 从DOM元素中提取纯文本，去除HTML标签和Markdown格式
     * @param {HTMLElement} element - 要提取文本的DOM元素
     * @returns {string} 提取的纯文本
     */
    static extractPlainText(element) {
        if (!element) {
            return '';
        }

        // 创建元素的副本，以避免修改原始DOM
        const clonedElement = element.cloneNode(true);

        // 移除所有复制按钮，避免按钮文字被包含在复制内容中
        const copyButtons = clonedElement.querySelectorAll('.puretext-copy-btn');
        copyButtons.forEach(button => button.remove());

        // 特殊处理 Kimi 网站 - 移除推荐问题区域
        if (window.location.hostname === 'www.kimi.com') {
            this.removeKimiSuggestedQuestions(clonedElement);
        }

        // 获取元素的文本内容（自动去除HTML标签）
        let text = clonedElement.innerText || clonedElement.textContent || '';

        // 去除常见的Markdown格式标记
        text = this.removeMarkdownFormatting(text);

        // 清理多余的空白字符
        text = this.cleanWhitespace(text);

        // 特殊处理 Kimi 网站 - 进一步清理文本
        if (window.location.hostname === 'www.kimi.com') {
            text = this.cleanKimiText(text);
        }

        return text;
    }

    /**
     * 去除Markdown格式标记
     * @param {string} text - 包含Markdown格式的文本
     * @returns {string} 去除格式后的纯文本
     */
    static removeMarkdownFormatting(text) {
        return text
            // 去除代码块标记 ``` (需要先处理，避免与其他规则冲突)
            .replace(/```[\s\S]*?```/g, (match) => {
                // 保留代码块内容，但去除标记
                return match.replace(/```[^\n]*\n?/g, '').replace(/\n```$/g, '');
            })

            // 去除粗体标记 **text** 或 __text__
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/__(.*?)__/g, '$1')

            // 去除斜体标记 *text* 或 _text_
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/_(.*?)_/g, '$1')

            // 去除删除线标记 ~~text~~
            .replace(/~~(.*?)~~/g, '$1')

            // 去除行内代码标记 `code`
            .replace(/`([^`]+)`/g, '$1')

            // 去除链接标记 [text](url)
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

            // 去除图片标记 ![alt](url)
            .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')

            // 去除标题标记 # ## ### 等
            .replace(/^#{1,6}\s+/gm, '')

            // 去除引用标记 >
            .replace(/^>\s*/gm, '')

            // 去除列表标记 - * +
            .replace(/^[\s]*[-*+]\s+/gm, '')

            // 去除有序列表标记 1. 2. 等
            .replace(/^[\s]*\d+\.\s+/gm, '')

            // 去除水平分割线 --- *** ___
            .replace(/^[\s]*[-*_]{3,}[\s]*$/gm, '');
    }

    /**
     * 清理多余的空白字符
     * @param {string} text - 要清理的文本
     * @returns {string} 清理后的文本
     */
    static cleanWhitespace(text) {
        return text
            // 规范化换行符 (先处理换行符)
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')

            // 将多个连续的空白字符替换为单个空格，但保留换行符
            .replace(/[ \t]+/g, ' ')

            // 去除多余的空行（保留最多一个空行）
            .replace(/\n\s*\n\s*\n/g, '\n\n')

            // 去除行首行尾的空白字符
            .trim();
    }

    /**
     * 降级复制方法（使用传统的document.execCommand）
     * @param {string} text - 要复制的文本
     * @returns {boolean} 复制是否成功
     */
    static fallbackCopyMethod(text) {
        try {
            // 创建临时textarea元素
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            textarea.style.top = '-9999px';

            document.body.appendChild(textarea);
            textarea.select();
            textarea.setSelectionRange(0, 99999); // 兼容移动设备

            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);

            if (successful) {
                this.showSuccessMessage();
                return true;
            } else {
                this.showErrorMessage();
                return false;
            }
        } catch (error) {
            console.error('PureText: Fallback copy method failed:', error);
            this.showErrorMessage();
            return false;
        }
    }

    /**
     * 显示复制成功消息
     */
    static showSuccessMessage() {
        // 使用chrome.i18n API获取本地化消息
        const message = chrome.i18n ? chrome.i18n.getMessage('copySuccess') : 'Copied successfully';
        this.showToast(message, 'success');
    }

    /**
     * 显示复制失败消息
     */
    static showErrorMessage() {
        // 使用chrome.i18n API获取本地化消息
        const message = chrome.i18n ? chrome.i18n.getMessage('copyFailed') : 'Copy failed';
        this.showToast(message, 'error');
    }

    /**
     * 移除Kimi网站的推荐问题区域
     * @param {HTMLElement} clonedElement - 克隆的DOM元素
     */
    static removeKimiSuggestedQuestions(clonedElement) {
        try {
            debugLog(DEBUG_LEVEL.DEBUG, '[Kimi] removeKimiSuggestedQuestions: start', clonedElement.outerHTML);
            // 查找并移除推荐问题相关的元素
            const questionSelectors = [
                '[class*="question"]', '[class*="suggest"]', '[class*="recommend"]', '[class*="related"]',
                'button:contains("?")', 'a:contains("?")',
                '.segment-content-box .segment-content:last-child',
                '[data-testid*="question"]', '[data-testid*="suggest"]'
            ];
            questionSelectors.forEach(selector => {
                try {
                    const elements = clonedElement.querySelectorAll(selector);
                    elements.forEach(element => {
                        const text = element.textContent?.trim();
                        if (text && text.includes('？') && text.length < 100) {
                            debugLog(DEBUG_LEVEL.DEBUG, `[Kimi] removeKimiSuggestedQuestions: removing by selector ${selector}`, text);
                            element.remove();
                        }
                    });
                } catch (error) {
                    debugLog(DEBUG_LEVEL.DEBUG, `[Kimi] removeKimiSuggestedQuestions: selector error ${selector}`, error);
                }
            });
            // 移除包含特定文本模式的元素
            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach(element => {
                const text = element.textContent?.trim();
                if (text && this.isKimiSuggestedQuestion(text)) {
                    debugLog(DEBUG_LEVEL.DEBUG, '[Kimi] removeKimiSuggestedQuestions: removing by pattern', text);
                    element.remove();
                }
            });
            debugLog(DEBUG_LEVEL.DEBUG, '[Kimi] removeKimiSuggestedQuestions: end', clonedElement.outerHTML);
        } catch (error) {
            debugLog(DEBUG_LEVEL.DEBUG, '⚠️ Error removing Kimi suggested questions:', error);
        }
    }

    /**
     * 判断文本是否是Kimi推荐问题
     * @param {string} text - 要检查的文本
     * @returns {boolean} 是否是推荐问题
     */
    static isKimiSuggestedQuestion(text) {
        if (!text || text.length > 100) return false;

        // 推荐问题的特征
        const questionPatterns = [
            /^[^。！]{10,60}[？?]$/,  // 以问号结尾的短句
            /^(?:如何|怎么|什么是|为什么|哪些|多少|何时|在哪|是否)/,  // 疑问词开头
            /(?:保证金|强平|期货|交易|风险|合约|平仓|开仓)[^。！]*[？?]$/,  // 金融相关问题
            /[^。！]*(?:多久|什么时候|何时|时间)[^。！]*[？?]$/,  // 时间相关问题
            /[^。！]*(?:多少|比例|费用|成本|价格)[^。！]*[？?]$/  // 数量相关问题
        ];

        return questionPatterns.some(pattern => pattern.test(text));
    }

    /**
     * 清理Kimi网站的文本内容
     * @param {string} text - 要清理的文本
     * @returns {string} 清理后的文本
     */
    static cleanKimiText(text) {
        if (!text) return '';

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
        cleanedText = this.removeRecommendedQuestions(cleanedText);

        // 第三步：清理多余的空白字符
        cleanedText = cleanedText
            .replace(/\n\s*\n\s*\n/g, '\n\n')  // 多个空行变成两个
            .replace(/[ \t]+/g, ' ')           // 多个空格变成一个
            .trim();                           // 去除首尾空白

        return cleanedText;
    }

    /**
     * 智能识别和去除推荐问题
     * @param {string} text - 要处理的文本
     * @returns {string} 处理后的文本
     */
    static removeRecommendedQuestions(text) {
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
        questionPatterns.forEach(pattern => {
            cleanedText = cleanedText.replace(pattern, '');
        });

        // 更精确的方法：分析文本结构
        cleanedText = this.removeQuestionsByStructure(cleanedText);

        return cleanedText;
    }

    /**
     * 基于文本结构去除推荐问题
     * @param {string} text - 要处理的文本
     * @returns {string} 处理后的文本
     */
    static removeQuestionsByStructure(text) {
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
                debugLog(DEBUG_LEVEL.DEBUG, '跳过推荐问题:', line);
                continue;
            }
            
            // 检查是否是主要内容
            if (line.length > 20 && !isQuestion) {
                foundMainContent = true;
            }
            
            // 如果已经找到主要内容，且当前行是短问题，可能是推荐问题
            if (foundMainContent && isQuestion && isShort) {
                debugLog(DEBUG_LEVEL.DEBUG, '跳过末尾推荐问题:', line);
                continue;
            }
            
            cleanedLines.push(line);
        }
        
        return cleanedLines.join('\n');
    }

    /**
     * 显示临时提示消息
     * @param {string} message - 要显示的消息
     * @param {string} type - 消息类型 ('success' 或 'error')
     */
    static showToast(message, type = 'success') {
        // 创建提示元素
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

        // 显示动画
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
        });

        // 2秒后自动移除
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 2000);
    }

    /**
     * 清理克隆的DOM元素，移除按钮、AI声明、推荐问题等，仅保留AI主体内容
     * @param {HTMLElement} clonedElement - 克隆的DOM元素
     */
    static cleanClonedElement(clonedElement) {
        // 移除所有复制按钮和按钮容器
        clonedElement.querySelectorAll('.puretext-copy-btn, .puretext-button-container').forEach(btn => btn.remove());
        // 移除常见的按钮和操作元素（精准匹配）
        const buttonSelectors = [
            'button', '[role="button"]', '.btn', '.button', '[onclick]', 'a[href="#"]', '.action', '.menu'
        ];
        buttonSelectors.forEach(selector => {
            clonedElement.querySelectorAll(selector).forEach(button => {
                const buttonText = button.textContent?.trim();
                if (buttonText && /^(复制|重试|分享|编辑|搜索|搜索一下|点赞|踩|收藏|删除|举报)$/.test(buttonText)) {
                    button.remove();
                }
            });
        });
        // 移除AI声明、免责声明、查看更多等界面元素（精准匹配）
        const extraTextSelectors = [
            '[class*="ai"]', '[class*="statement"]', '[class*="disclaimer"]', '[class*="more"]', '[class*="expand"]', '[class*="related"]'
        ];
        extraTextSelectors.forEach(selector => {
            clonedElement.querySelectorAll(selector).forEach(node => {
                const text = node.textContent?.trim();
                if (text && (/AI\s*生成/.test(text) || /内容仅供参考/.test(text) || /查看更多|展开全部|收起|相关推荐/.test(text))) {
                    node.remove();
                }
            });
        });
        // 不再全局移除短句问号结尾的节点，避免误删主体内容
    }

    static async copyHtmlToClipboard(element) {
        try {
            if (!element) {
                this.showErrorMessage('未找到可复制内容');
                return false;
            }
            let cloned;
            let html = '';
            let text = '';
            // Kimi专用：只复制.markdown内容
            if (window.location.hostname === 'www.kimi.com') {
                // 支持多段markdown
                const markdowns = element.querySelectorAll('.markdown, .markdown-container');
                if (markdowns.length > 0) {
                    let htmlParts = [];
                    let textParts = [];
                    markdowns.forEach(md => {
                        let mdClone = md.cloneNode(true);
                        ClipboardManager.cleanClonedElement(mdClone);
                        ClipboardManager.removeKimiSuggestedQuestions(mdClone);
                        htmlParts.push(mdClone.outerHTML);
                        textParts.push(mdClone.innerText || mdClone.textContent || '');
                    });
                    html = `<html><body>${htmlParts.join('<hr>')}</body></html>`;
                    text = textParts.join('\n\n');
                } else {
                    // fallback: 复制整个element
                    cloned = element.cloneNode(true);
                    ClipboardManager.cleanClonedElement(cloned);
                    ClipboardManager.removeKimiSuggestedQuestions(cloned);
                    html = `<html><body>${cloned.outerHTML}</body></html>`;
                    text = cloned.innerText || cloned.textContent || '';
                }
            } else {
                // 其他站点：原逻辑
                cloned = element.cloneNode(true);
                ClipboardManager.cleanClonedElement(cloned);
                html = `<html><body>${cloned.outerHTML}</body></html>`;
                text = cloned.innerText || cloned.textContent || '';
            }
            if (!text || !text.trim()) {
                debugLog(DEBUG_LEVEL.ERROR, '[PureText] No content after cleaning, abort copy.', html);
                this.showErrorMessage('未检测到可复制内容');
                return false;
            }
            const blobHtml = new Blob([html], { type: 'text/html' });
            const blobText = new Blob([text], { type: 'text/plain' });
            const clipboardItem = new window.ClipboardItem({
                'text/html': blobHtml,
                'text/plain': blobText
            });
            await navigator.clipboard.write([
                clipboardItem
            ]);
            this.showSuccessMessage('已复制为 Word 格式，可直接粘贴到 Word');
            return true;
        } catch (error) {
            this.showErrorMessage('复制失败，请重试');
            debugLog(DEBUG_LEVEL.ERROR, '[PureText] copyHtmlToClipboard error', error);
            if (typeof cloned !== 'undefined') {
                debugLog(DEBUG_LEVEL.ERROR, '[PureText] cloned.outerHTML on error', cloned?.outerHTML);
            }
            return false;
        }
    }
}

/**
 * 按钮注入器类
 * 负责监听DOM变化、创建和注入复制按钮
 */
class ButtonInjector {
    constructor(siteManager) {
        this.siteManager = siteManager;
        this.observer = null;
        this.injectedButtons = new WeakSet(); // 跟踪已注入按钮的元素
        this.buttonClass = 'puretext-copy-btn';
        this.debounceTimer = null;
        this.debounceDelay = 100; // 防抖延迟（毫秒）
    }

    /**
     * 开始监听DOM变化
     */
    startObserving() {
        if (this.observer) {
            this.stopObserving();
        }

        // 首次扫描现有元素
        this.scanAndInjectButtons();

        // 创建MutationObserver监听DOM变化
        this.observer = new MutationObserver((mutations) => {
            this.handleMutations(mutations);
        });

        // 开始观察
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false
        });

        console.debug('PureText: Started observing DOM changes');
    }

    /**
     * 停止监听DOM变化
     */
    stopObserving() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
            console.debug('PureText: Stopped observing DOM changes');
        }

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
    }

    /**
     * 处理DOM变化
     * @param {MutationRecord[]} mutations - DOM变化记录
     */
    handleMutations(mutations) {
        let shouldScan = false;

        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                // 检查是否有新增的节点
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
            // 使用防抖避免频繁扫描
            this.debouncedScan();
        }
    }

    /**
     * 防抖扫描函数
     */
    debouncedScan() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.scanAndInjectButtons();
        }, this.debounceDelay);
    }

    /**
     * 扫描页面并注入按钮
     */
    scanAndInjectButtons() {
        const selector = this.siteManager.getSelector();
        if (!selector) {
            debugLog(DEBUG_LEVEL.WARN, '⚠️ No selector available, skipping button injection');
            return;
        }

        debugLog(DEBUG_LEVEL.DEBUG, '🔍 Scanning for elements with selector:', selector);

        try {
            const bubbles = document.querySelectorAll(selector);
            debugLog(DEBUG_LEVEL.INFO, `📊 Found ${bubbles.length} target elements`);

            if (bubbles.length === 0) {
                debugLog(DEBUG_LEVEL.WARN, '⚠️ No target elements found. Possible reasons:');
                debugLog(DEBUG_LEVEL.WARN, '   - Page content not fully loaded');
                debugLog(DEBUG_LEVEL.WARN, '   - Selector may be incorrect for current page structure');
                debugLog(DEBUG_LEVEL.WARN, '   - Elements may be dynamically generated');

                // 尝试智能重新发现选择器
                this.attemptSelectorRediscovery();
                return;
            }

            let injectedCount = 0;
            for (const bubble of bubbles) {
                const injected = this.injectButton(bubble);
                if (injected) injectedCount++;
            }

            debugLog(DEBUG_LEVEL.INFO, `✅ Successfully injected ${injectedCount} buttons`);
        } catch (error) {
            debugLog(DEBUG_LEVEL.ERROR, '❌ Error scanning for bubbles:', error);
        }
    }

    /**
     * 尝试重新发现选择器
     */
    attemptSelectorRediscovery() {
        debugLog(DEBUG_LEVEL.INFO, '🔄 Attempting selector rediscovery...');

        // 强制重新获取选择器（会触发智能发现）
        const newSelector = this.siteManager.getSelector();

        if (newSelector) {
            debugLog(DEBUG_LEVEL.INFO, `🎯 Rediscovered selector: ${newSelector}`);

            // 使用新选择器重新扫描
            try {
                const bubbles = document.querySelectorAll(newSelector);
                if (bubbles.length > 0) {
                    debugLog(DEBUG_LEVEL.INFO, `✅ Rediscovery successful! Found ${bubbles.length} elements`);

                    let injectedCount = 0;
                    for (const bubble of bubbles) {
                        const injected = this.injectButton(bubble);
                        if (injected) injectedCount++;
                    }

                    debugLog(DEBUG_LEVEL.INFO, `✅ Injected ${injectedCount} buttons after rediscovery`);
                }
            } catch (error) {
                debugLog(DEBUG_LEVEL.ERROR, '❌ Error in rediscovery scan:', error);
            }
        } else {
            debugLog(DEBUG_LEVEL.WARN, '❌ Selector rediscovery failed');
        }
    }

    /**
     * 向指定元素注入复制按钮
     * @param {HTMLElement} bubble - 目标气泡元素
     * @returns {boolean} 是否成功注入按钮
     */
    injectButton(bubble) {
        try {
            // 检查元素是否仍在DOM中
            if (!document.contains(bubble)) {
                return false;
            }

            // 检查是否已经注入过按钮
            if (this.injectedButtons.has(bubble)) {
                return false;
            }

            // 检查是否已经存在按钮（双重保险）
            if (CopyButton.hasButton(bubble)) {
                this.injectedButtons.add(bubble);
                return false;
            }

            // 验证元素是否有足够的文本内容
            const text = bubble.textContent?.trim();
            if (!text || text.length < 20) {
                debugLog(DEBUG_LEVEL.DEBUG, '⚠️ 元素文本内容太少，跳过按钮注入');
                return false;
            }

            // 🔥 关键修复：检查是否是AI回复而不是用户消息
            if (!this.isAIResponse(bubble)) {
                debugLog(DEBUG_LEVEL.DEBUG, '⚠️ 检测到用户消息，跳过按钮注入');
                return false;
            }

            // 找到最合适的容器元素（AI 回复的完整容器）
            const targetContainer = this.findBestContainer(bubble);

            // 创建统一的按钮组件
            const buttonContainer = CopyButton.create(targetContainer, async (element) => {
                return await ClipboardManager.copyHtmlToClipboard(element);
            });

            // 智能定位按钮
            CopyButton.positionButton(buttonContainer, targetContainer);

            // 注入按钮
            targetContainer.appendChild(buttonContainer);

            // 标记为已注入
            this.injectedButtons.add(bubble);
            this.injectedButtons.add(targetContainer); // 也标记容器

            debugLog(DEBUG_LEVEL.DEBUG, '✅ 按钮注入成功');
            return true;

        } catch (error) {
            debugLog(DEBUG_LEVEL.ERROR, '❌ 按钮注入失败:', error);
            return false;
        }
    }

    /**
     * 找到最合适的按钮容器（AI 回复的完整容器）
     * @param {HTMLElement} element - 当前匹配的元素
     * @returns {HTMLElement} 最佳容器元素
     */
    findBestContainer(element) {
        // 向上查找，寻找更合适的容器
        let current = element;
        let bestContainer = element;

        // 最多向上查找 5 层
        for (let i = 0; i < 5 && current.parentElement; i++) {
            current = current.parentElement;

            // 检查是否是更好的容器
            if (this.isBetterContainer(current, bestContainer)) {
                bestContainer = current;
            }
        }

        debugLog(DEBUG_LEVEL.DEBUG, `🎯 选择容器: ${bestContainer.tagName}.${bestContainer.className}`);
        return bestContainer;
    }

    /**
     * 判断是否是更好的容器
     * @param {HTMLElement} candidate - 候选容器
     * @param {HTMLElement} current - 当前容器
     * @returns {boolean} 是否更好
     */
    isBetterContainer(candidate, current) {
        // 检查候选容器的特征
        const candidateClasses = candidate.className.toLowerCase();
        const candidateText = candidate.textContent?.trim() || '';

        // 如果候选容器包含明显的消息容器特征
        const messageKeywords = ['message', 'chat', 'conversation', 'response', 'reply'];
        const hasMessageKeyword = messageKeywords.some(keyword =>
            candidateClasses.includes(keyword)
        );

        // 如果候选容器的文本长度合理（不会太大包含其他内容）
        const currentText = current.textContent?.trim() || '';
        const textRatio = candidateText.length / Math.max(currentText.length, 1);
        const reasonableSize = textRatio <= 2; // 文本长度不超过当前容器的2倍

        // 如果候选容器有相对定位或者可以设置相对定位
        const style = window.getComputedStyle(candidate);
        const canPosition = style.position !== 'static' || candidate.tagName !== 'SPAN';

        return hasMessageKeyword && reasonableSize && canPosition;
    }

    /**
     * 判断元素是否是AI回复（而不是用户消息）
     * @param {HTMLElement} element - 要检查的元素
     * @returns {boolean} 是否是AI回复
     */
    isAIResponse(element) {
        try {
            // 方法1: 检查元素及其父元素的类名和属性
            let current = element;
            for (let i = 0; i < 5 && current; i++) {
                const className = current.className?.toLowerCase() || '';
                const dataRole = current.getAttribute('data-role')?.toLowerCase() || '';
                const dataAuthor = current.getAttribute('data-author')?.toLowerCase() || '';

                // 新增：如果 className 包含 user 或 user-content，直接判定为用户消息
                if (className.includes('user')) {
                    debugLog(DEBUG_LEVEL.DEBUG, '❌ 识别为用户消息（className含user）');
                    return false;
                }
                if (className.includes('user-content')) {
                    debugLog(DEBUG_LEVEL.DEBUG, '❌ 识别为用户消息（user-content）');
                    return false;
                }

                // 明确的AI回复标识
                if (dataRole === 'assistant' || dataAuthor === 'assistant' || 
                    className.includes('assistant') || className.includes('ai-response') ||
                    className.includes('bot-message') || className.includes('kimi-response')) {
                    debugLog(DEBUG_LEVEL.DEBUG, '✅ 通过属性识别为AI回复');
                    return true;
                }

                // 明确的用户消息标识
                if (dataRole === 'user' || dataAuthor === 'user' || 
                    className.includes('user-message') || className.includes('human-message') ||
                    className.includes('user-input') || className.includes('user-bubble')) {
                    debugLog(DEBUG_LEVEL.DEBUG, '❌ 通过属性识别为用户消息');
                    return false;
                }

                current = current.parentElement;
            }

            // 方法2: 通过文本内容特征判断
            const text = element.textContent?.trim() || '';
            if (text.length > 0) {
                // AI回复的特征词汇
                const aiIndicators = [
                    '我是', '我可以', '根据', '建议', '您可以', '建议您',
                    '以下是', '具体来说', '需要注意', '总结一下',
                    '首先', '其次', '最后', '另外', '此外',
                    '如果您', '您需要', '您可以', '为您',
                    'Kimi', '助手', '人工智能', 'AI'
                ];
                
                // 用户消息的特征词汇
                const userIndicators = [
                    '我想', '我需要', '请问', '能否', '可以吗',
                    '怎么办', '如何', '为什么', '什么是',
                    '帮我', '告诉我', '我该', '我应该'
                ];
                
                const hasAIIndicators = aiIndicators.some(indicator => text.includes(indicator));
                const hasUserIndicators = userIndicators.some(indicator => text.includes(indicator));
                
                if (hasAIIndicators && !hasUserIndicators) {
                    debugLog(DEBUG_LEVEL.DEBUG, '✅ 通过文本特征识别为AI回复');
                    return true;
                }
                
                if (hasUserIndicators && !hasAIIndicators) {
                    debugLog(DEBUG_LEVEL.DEBUG, '❌ 通过文本特征识别为用户消息');
                    return false;
                }
            }

            // 方法3: 通过位置和结构判断（Kimi特定）
            if (window.location.hostname === 'www.kimi.com') {
                return this.isKimiAIResponse(element);
            }

            // 方法4: 通过文本长度和复杂度判断（AI回复通常更长更详细）
            if (text.length > 100) {
                const sentences = text.split(/[。！？.!?]/).filter(s => s.trim().length > 10);
                const hasStructuredContent = /[：:]\s*\n|^\s*[•\-\*]\s+|^\s*\d+[\.\)]\s+/m.test(text);
                
                if (sentences.length >= 3 || hasStructuredContent) {
                    debugLog(DEBUG_LEVEL.DEBUG, '✅ 通过内容复杂度识别为AI回复');
                    return true;
                }
            }

            // 默认情况：如果无法确定，倾向于认为是AI回复（避免漏掉）
            debugLog(DEBUG_LEVEL.DEBUG, '⚠️ 无法明确判断，默认为AI回复');
            return true;

        } catch (error) {
            debugLog(DEBUG_LEVEL.DEBUG, '⚠️ AI回复判断出错，默认为AI回复:', error);
            return true;
        }
    }

    /**
     * Kimi网站特定的AI回复判断逻辑
     * @param {HTMLElement} element - 要检查的元素
     * @returns {boolean} 是否是AI回复
     */
    isKimiAIResponse(element) {
        try {
            // 检查元素在页面中的位置
            const rect = element.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            
            // Kimi中，用户消息通常在右侧，AI回复在左侧或占据更多宽度
            const isOnRight = rect.left > viewportWidth * 0.6;
            const isFullWidth = rect.width > viewportWidth * 0.7;
            
            if (isOnRight && !isFullWidth) {
                debugLog(DEBUG_LEVEL.DEBUG, '❌ Kimi: 位置判断为用户消息（右侧且窄）');
                return false;
            }

            // 检查是否包含Kimi特有的AI回复元素
            const hasKimiFeatures = element.querySelector('.segment-content-box') ||
                                  element.querySelector('.markdown-container') ||
                                  element.closest('.segment-content-box');
            
            if (hasKimiFeatures) {
                debugLog(DEBUG_LEVEL.DEBUG, '✅ Kimi: 包含AI回复特征元素');
                return true;
            }

            // 检查文本内容是否像用户输入
            const text = element.textContent?.trim() || '';
            const looksLikeUserInput = text.length < 100 && 
                                     (text.endsWith('？') || text.endsWith('?')) &&
                                     !text.includes('根据') && !text.includes('建议');
            
            if (looksLikeUserInput) {
                debugLog(DEBUG_LEVEL.DEBUG, '❌ Kimi: 文本特征判断为用户消息');
                return false;
            }

            return true;

        } catch (error) {
            debugLog(DEBUG_LEVEL.DEBUG, '⚠️ Kimi AI回复判断出错:', error);
            return true;
        }
    }







    /**
     * 优化按钮位置，避免遮挡重要内容
     * @param {HTMLElement} button - 按钮元素
     * @param {HTMLElement} bubble - 目标气泡元素
     */
    optimizeButtonPosition(button, bubble) {
        try {
            const bubbleRect = bubble.getBoundingClientRect();
            const bubbleStyle = window.getComputedStyle(bubble);

            // 获取气泡的内边距
            const paddingRight = parseInt(bubbleStyle.paddingRight) || 0;
            const paddingBottom = parseInt(bubbleStyle.paddingBottom) || 0;

            // 检查气泡右下角是否有其他重要元素
            const hasConflictingElements = this.checkForConflictingElements(bubble);

            if (hasConflictingElements) {
                // 如果有冲突，尝试其他位置
                this.findAlternativePosition(button, bubble);
            } else {
                // 默认位置：右下角，但考虑内边距
                const rightOffset = Math.max(8, paddingRight + 4);
                const bottomOffset = Math.max(8, paddingBottom + 4);

                button.style.right = `${rightOffset}px`;
                button.style.bottom = `${bottomOffset}px`;
            }

            // 确保按钮不会超出视口
            this.ensureButtonInViewport(button, bubble);

        } catch (error) {
            console.debug('PureText: Error optimizing button position:', error);
            // 降级到默认位置
            button.style.right = '8px';
            button.style.bottom = '8px';
        }
    }

    /**
     * 检查是否有与按钮位置冲突的元素
     * @param {HTMLElement} bubble - 目标气泡元素
     * @returns {boolean} 是否有冲突元素
     */
    checkForConflictingElements(bubble) {
        try {
            // 检查常见的可能冲突的元素
            const conflictSelectors = [
                'button', 'a[href]', '.btn', '.button',
                '[role="button"]', '.action', '.menu',
                '.timestamp', '.time', '.date',
                '.vote', '.rating', '.score',
                '.share', '.copy', '.edit', '.delete'
            ];

            for (const selector of conflictSelectors) {
                const elements = bubble.querySelectorAll(selector);
                for (const element of elements) {
                    const rect = element.getBoundingClientRect();
                    const bubbleRect = bubble.getBoundingClientRect();

                    // 检查元素是否在右下角区域（按钮可能的位置）
                    const isInBottomRight = (
                        rect.right > bubbleRect.right - 100 &&
                        rect.bottom > bubbleRect.bottom - 50
                    );

                    if (isInBottomRight && element.offsetWidth > 0 && element.offsetHeight > 0) {
                        return true;
                    }
                }
            }

            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * 寻找替代的按钮位置
     * @param {HTMLElement} button - 按钮元素
     * @param {HTMLElement} bubble - 目标气泡元素
     */
    findAlternativePosition(button, bubble) {
        // 尝试的位置优先级：右上角 -> 左下角 -> 左上角 -> 中间右侧
        const positions = [
            { right: '8px', top: '8px', bottom: 'auto' },      // 右上角
            { left: '8px', bottom: '8px', right: 'auto' },     // 左下角
            { left: '8px', top: '8px', right: 'auto', bottom: 'auto' }, // 左上角
            { right: '8px', top: '50%', bottom: 'auto', transform: 'translateY(-50%)' } // 中间右侧
        ];

        for (const position of positions) {
            if (this.isPositionClear(bubble, position)) {
                Object.assign(button.style, position);
                return;
            }
        }

        // 如果所有位置都有冲突，使用默认位置但调整透明度
        button.style.right = '8px';
        button.style.bottom = '8px';
        button.style.opacity = '0.7';
    }

    /**
     * 检查指定位置是否清晰无冲突
     * @param {HTMLElement} bubble - 目标气泡元素
     * @param {Object} position - 位置配置
     * @returns {boolean} 位置是否清晰
     */
    isPositionClear(bubble, position) {
        try {
            // 简化的冲突检测：检查该区域是否有可见元素
            const bubbleRect = bubble.getBoundingClientRect();
            const checkArea = this.getCheckArea(bubbleRect, position);

            const elementsInArea = document.elementsFromPoint(
                checkArea.x + checkArea.width / 2,
                checkArea.y + checkArea.height / 2
            );

            // 如果该位置只有气泡本身或其父元素，则认为是清晰的
            return elementsInArea.length <= 3;
        } catch (error) {
            return true; // 如果检测失败，假设位置清晰
        }
    }

    /**
     * 根据位置配置获取检查区域
     * @param {DOMRect} bubbleRect - 气泡矩形
     * @param {Object} position - 位置配置
     * @returns {Object} 检查区域
     */
    getCheckArea(bubbleRect, position) {
        const buttonWidth = 80;
        const buttonHeight = 30;

        let x, y;

        if (position.right && position.bottom) {
            // 右下角
            x = bubbleRect.right - buttonWidth - 8;
            y = bubbleRect.bottom - buttonHeight - 8;
        } else if (position.right && position.top) {
            // 右上角
            x = bubbleRect.right - buttonWidth - 8;
            y = bubbleRect.top + 8;
        } else if (position.left && position.bottom) {
            // 左下角
            x = bubbleRect.left + 8;
            y = bubbleRect.bottom - buttonHeight - 8;
        } else if (position.left && position.top) {
            // 左上角
            x = bubbleRect.left + 8;
            y = bubbleRect.top + 8;
        } else {
            // 默认右下角
            x = bubbleRect.right - buttonWidth - 8;
            y = bubbleRect.bottom - buttonHeight - 8;
        }

        return { x, y, width: buttonWidth, height: buttonHeight };
    }

    /**
     * 确保按钮在视口内可见
     * @param {HTMLElement} button - 按钮元素
     * @param {HTMLElement} bubble - 目标气泡元素
     */
    ensureButtonInViewport(button, bubble) {
        try {
            // 延迟检查，确保按钮已经渲染
            setTimeout(() => {
                const buttonRect = button.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                let needsAdjustment = false;

                // 检查是否超出右边界
                if (buttonRect.right > viewportWidth) {
                    button.style.right = 'auto';
                    button.style.left = '8px';
                    needsAdjustment = true;
                }

                // 检查是否超出下边界
                if (buttonRect.bottom > viewportHeight) {
                    button.style.bottom = 'auto';
                    button.style.top = '8px';
                    needsAdjustment = true;
                }

                // 检查是否超出左边界
                if (buttonRect.left < 0) {
                    button.style.left = '8px';
                    button.style.right = 'auto';
                    needsAdjustment = true;
                }

                // 检查是否超出上边界
                if (buttonRect.top < 0) {
                    button.style.top = '8px';
                    button.style.bottom = 'auto';
                    needsAdjustment = true;
                }

                if (needsAdjustment) {
                    console.debug('PureText: Button position adjusted to stay in viewport');
                }
            }, 50);
        } catch (error) {
            console.debug('PureText: Error ensuring button in viewport:', error);
        }
    }

    /**
     * 处理按钮点击事件
     * @param {HTMLElement} targetBubble - 目标气泡元素
     * @param {HTMLElement} button - 被点击的按钮
     */
    async handleButtonClick(targetBubble, button) {
        try {
            // 添加点击反馈
            this.addClickFeedback(button);

            // 验证目标元素仍然存在
            if (!document.contains(targetBubble)) {
                console.warn('PureText: Target bubble no longer exists in DOM');
                ClipboardManager.showErrorMessage();
                return;
            }

            // 执行复制操作
            const success = await ClipboardManager.copyHtmlToClipboard(targetBubble);

            if (success) {
                console.debug('PureText: Copy operation successful');
                // 记录成功的复制操作（用于调试和统计）
                this.logCopySuccess(targetBubble);
            } else {
                console.warn('PureText: Copy operation failed');
            }
        } catch (error) {
            console.error('PureText: Error handling button click:', error);
            // 确保用户看到错误反馈
            ClipboardManager.showErrorMessage();
        }
    }

    /**
     * 记录成功的复制操作
     * @param {HTMLElement} targetBubble - 目标气泡元素
     */
    logCopySuccess(targetBubble) {
        try {
            const textLength = ClipboardManager.extractPlainText(targetBubble).length;
            const siteName = this.siteManager.getSiteName();
            console.debug(`PureText: Successfully copied ${textLength} characters from ${siteName}`);
        } catch (error) {
            // 静默处理日志错误，不影响主要功能
            console.debug('PureText: Could not log copy success details');
        }
    }

    /**
     * 添加按钮点击反馈效果
     * @param {HTMLElement} button - 按钮元素
     */
    addClickFeedback(button) {
        // 保存原始样式
        const originalTransform = button.style.transform;
        const originalTransition = button.style.transition;
        const originalBackground = button.style.background;
        const originalText = button.textContent;

        // 检测主题以获取合适的反馈颜色
        const isDarkTheme = this.detectDarkTheme();
        const feedbackColor = isDarkTheme ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.2)';

        // 第一阶段：按下效果
        button.style.transition = 'all 0.1s cubic-bezier(0.4, 0, 0.2, 1)';
        button.style.transform = 'scale(0.95) translateZ(0)';
        button.style.background = feedbackColor;

        // 第二阶段：成功反馈
        setTimeout(() => {
            // 临时显示成功图标或文字
            const successText = '✓';
            button.textContent = successText;
            button.style.transform = 'scale(1.05) translateZ(0)';
            button.style.background = isDarkTheme ? 'rgba(76, 175, 80, 0.4)' : 'rgba(76, 175, 80, 0.3)';

            // 第三阶段：恢复原始状态
            setTimeout(() => {
                button.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                button.textContent = originalText;
                button.style.transform = originalTransform;
                button.style.background = originalBackground;

                // 最终恢复过渡效果
                setTimeout(() => {
                    button.style.transition = originalTransition;
                }, 300);
            }, 600);
        }, 100);

        // 添加涟漪效果
        this.addRippleEffect(button);
    }

    /**
     * 添加涟漪点击效果
     * @param {HTMLElement} button - 按钮元素
     */
    addRippleEffect(button) {
        try {
            // 创建涟漪元素
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);

            ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
        width: ${size}px;
        height: ${size}px;
        left: 50%;
        top: 50%;
        margin-left: ${-size / 2}px;
        margin-top: ${-size / 2}px;
      `;

            // 添加涟漪动画样式
            if (!document.getElementById('puretext-ripple-styles')) {
                const style = document.createElement('style');
                style.id = 'puretext-ripple-styles';
                style.textContent = `
          @keyframes ripple {
            to {
              transform: scale(2);
              opacity: 0;
            }
          }
        `;
                document.head.appendChild(style);
            }

            // 确保按钮有相对定位
            const originalPosition = button.style.position;
            if (window.getComputedStyle(button).position === 'static') {
                button.style.position = 'relative';
            }

            button.appendChild(ripple);

            // 动画结束后移除涟漪元素
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
                // 恢复原始定位
                if (originalPosition) {
                    button.style.position = originalPosition;
                }
            }, 600);

        } catch (error) {
            console.debug('PureText: Error adding ripple effect:', error);
        }
    }

    /**
     * 清理所有注入的按钮
     */
    cleanup() {
        try {
            const buttons = document.querySelectorAll(`.${this.buttonClass}`);
            buttons.forEach(button => {
                if (button.parentNode) {
                    button.parentNode.removeChild(button);
                }
            });

            this.injectedButtons = new WeakSet();
            console.debug('PureText: Cleaned up all injected buttons');
        } catch (error) {
            console.error('PureText: Error during cleanup:', error);
        }
    }
}

/**
 * 主扩展类
 * 负责协调所有组件并管理扩展生命周期
 */
class PureTextExtension {
    constructor() {
        this.siteManager = null;
        this.buttonInjector = null;
        this.isInitialized = false;
        this.isRunning = false;
    }

    /**
     * 初始化扩展
     */
    async init() {
        try {
            console.log('PureText: Initializing extension...');

            // 创建站点管理器
            this.siteManager = new SiteManager();

            // 加载站点配置
            await this.siteManager.loadSiteConfig();

            // 检查当前站点是否支持
            if (!this.siteManager.isSupported()) {
                console.debug('PureText: Current site is not supported:', window.location.hostname);
                return;
            }

            console.log('PureText: Site supported:', this.siteManager.getSiteName());

            // 创建按钮注入器
            this.buttonInjector = new ButtonInjector(this.siteManager);

            this.isInitialized = true;
            console.log('PureText: Extension initialized successfully');

        } catch (error) {
            console.error('PureText: Failed to initialize extension:', error);
            this.handleInitError(error);
        }
    }

    /**
     * 启动扩展功能
     */
    start() {
        if (!this.isInitialized) {
            console.warn('PureText: Extension not initialized, cannot start');
            return;
        }

        if (this.isRunning) {
            console.debug('PureText: Extension already running');
            return;
        }

        try {
            // 开始监听DOM变化并注入按钮
            this.buttonInjector.startObserving();

            this.isRunning = true;
            console.log('PureText: Extension started successfully');

        } catch (error) {
            console.error('PureText: Failed to start extension:', error);
            this.handleStartError(error);
        }
    }

    /**
     * 停止扩展功能
     */
    stop() {
        if (!this.isRunning) {
            console.debug('PureText: Extension not running');
            return;
        }

        try {
            // 停止DOM监听
            if (this.buttonInjector) {
                this.buttonInjector.stopObserving();
                this.buttonInjector.cleanup();
            }

            this.isRunning = false;
            console.log('PureText: Extension stopped');

        } catch (error) {
            console.error('PureText: Error stopping extension:', error);
        }
    }

    /**
     * 重启扩展
     */
    async restart() {
        console.log('PureText: Restarting extension...');
        this.stop();
        await this.init();
        this.start();
    }

    /**
     * 处理初始化错误
     * @param {Error} error - 错误对象
     */
    handleInitError(error) {
        // 记录错误但不影响页面正常使用
        console.error('PureText: Initialization failed, extension will not work on this page:', error);

        // 根据错误类型进行不同处理
        if (error.name === 'NetworkError') {
            console.debug('PureText: Network error during initialization, will retry later');
            // 设置重试逻辑
            setTimeout(() => {
                this.init().catch(retryError => {
                    console.warn('PureText: Retry initialization failed:', retryError);
                });
            }, 5000);
        } else if (error.message && error.message.includes('storage')) {
            console.debug('PureText: Storage error, continuing with built-in configuration');
        }
    }

    /**
     * 处理启动错误
     * @param {Error} error - 错误对象
     */
    handleStartError(error) {
        console.error('PureText: Start failed, attempting to recover');

        // 尝试清理并重新初始化
        setTimeout(async () => {
            try {
                await this.restart();
            } catch (retryError) {
                console.error('PureText: Recovery attempt failed:', retryError);
            }
        }, 2000);
    }

    /**
     * 获取扩展状态信息
     * @returns {Object} 状态信息
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isRunning: this.isRunning,
            currentSite: this.siteManager ? this.siteManager.getSiteName() : null,
            isSupported: this.siteManager ? this.siteManager.isSupported() : false,
            hostname: window.location.hostname,
            selector: this.siteManager ? this.siteManager.getSelector() : null
        };
    }

    /**
     * 执行集成测试，验证所有组件是否正常工作
     * @returns {Promise<Object>} 测试结果
     */
    async runIntegrationTest() {
        const testResults = {
            siteManager: false,
            buttonInjector: false,
            clipboardManager: false,
            overall: false,
            errors: []
        };

        try {
            // 测试站点管理器
            if (this.siteManager && this.siteManager.isSupported()) {
                const selector = this.siteManager.getSelector();
                if (selector && typeof selector === 'string') {
                    testResults.siteManager = true;
                } else {
                    testResults.errors.push('SiteManager: Invalid selector');
                }
            } else {
                testResults.errors.push('SiteManager: Site not supported or not initialized');
            }

            // 测试按钮注入器
            if (this.buttonInjector && this.isRunning) {
                // 尝试扫描现有按钮
                const existingButtons = document.querySelectorAll('.puretext-copy-btn');
                testResults.buttonInjector = true;
                console.debug(`PureText: Found ${existingButtons.length} existing buttons`);
            } else {
                testResults.errors.push('ButtonInjector: Not initialized or not running');
            }

            // 测试剪贴板管理器
            if (typeof ClipboardManager.extractPlainText === 'function') {
                // 创建测试元素
                const testElement = document.createElement('div');
                testElement.innerHTML = '**Test** content';
                const extracted = ClipboardManager.extractPlainText(testElement);
                if (extracted === 'Test content') {
                    testResults.clipboardManager = true;
                } else {
                    testResults.errors.push('ClipboardManager: Text extraction failed');
                }
            } else {
                testResults.errors.push('ClipboardManager: Not available');
            }

            // 整体测试结果
            testResults.overall = testResults.siteManager &&
                testResults.buttonInjector &&
                testResults.clipboardManager;

            console.log('PureText: Integration test completed', testResults);
            return testResults;

        } catch (error) {
            testResults.errors.push(`Integration test failed: ${error.message}`);
            console.error('PureText: Integration test error:', error);
            return testResults;
        }
    }
}

// 全局扩展实例
let pureTextExtension = null;

/**
 * 扩展启动函数
 */
async function startExtension() {
    try {
        // 避免重复初始化
        if (pureTextExtension) {
            console.debug('PureText: Extension already exists');
            return;
        }

        // 创建扩展实例
        pureTextExtension = new PureTextExtension();

        // 初始化并启动
        await pureTextExtension.init();
        pureTextExtension.start();

        // 验证启动状态
        const status = pureTextExtension.getStatus();
        console.log('PureText: Extension startup completed', status);

        // 如果启动成功且在支持的站点上，运行集成测试
        if (status.isInitialized && status.isRunning && status.isSupported) {
            // 延迟运行集成测试，确保DOM已稳定
            setTimeout(async () => {
                try {
                    const testResults = await pureTextExtension.runIntegrationTest();
                    if (testResults.overall) {
                        console.log('PureText: All components integrated successfully');
                    } else {
                        console.warn('PureText: Some integration issues detected:', testResults.errors);
                    }
                } catch (testError) {
                    console.debug('PureText: Integration test failed:', testError);
                }
            }, 1000);
        }

    } catch (error) {
        console.error('PureText: Failed to start extension:', error);
    }
}

/**
 * 页面加载完成后启动扩展
 */
function initializeWhenReady() {
    if (document.readyState === 'loading') {
        // 如果页面还在加载，等待DOMContentLoaded事件
        document.addEventListener('DOMContentLoaded', startExtension);
    } else {
        // 页面已经加载完成，直接启动
        startExtension();
    }
}

/**
 * 处理页面可见性变化
 */
function handleVisibilityChange() {
    if (document.hidden) {
        // 页面隐藏时暂停功能（可选优化）
        console.debug('PureText: Page hidden');
    } else {
        // 页面重新可见时确保功能正常
        console.debug('PureText: Page visible');
        if (pureTextExtension && !pureTextExtension.isRunning) {
            pureTextExtension.start();
        }
    }
}

/**
 * 处理页面卸载
 */
function handlePageUnload() {
    if (pureTextExtension) {
        pureTextExtension.stop();
    }
}

// 监听页面可见性变化
document.addEventListener('visibilitychange', handleVisibilityChange);

// 监听页面卸载
window.addEventListener('beforeunload', handlePageUnload);

// 启动扩展
console.log('PureText One-Click extension loaded');
initializeWhenReady();

// 挂载 ClipboardManager 到全局，确保按钮事件能访问
window.ClipboardManager = ClipboardManager;