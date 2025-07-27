// 一键纯文扩展 - 内容脚本（包含所有模块）

// 首先导入站点配置和所有模块
import { SUPPORTED_SITES } from './sites.js';
import { HtmlFormatter } from './src/formatters/HtmlFormatter.js';
import { StructureConverter } from './src/StructureConverter.js';
import { ContentCleaner } from './src/ContentCleaner.js';
import { GenericHtmlFormatter } from './src/formatters/GenericHtmlFormatter.js';
import { KimiHtmlFormatter } from './src/formatters/KimiHtmlFormatter.js';
import { DeepSeekHtmlFormatter } from './src/formatters/DeepSeekHtmlFormatter.js';
import { HtmlFormatterManager } from './src/HtmlFormatterManager.js';
import { ClipboardManager } from './src/ClipboardManager.js';
import { CopyButton } from './src/CopyButton.js';
import { KimiMessageDetector, MessageType } from './src/KimiMessageDetector.js';

// 暴露为全局变量
window.HtmlFormatter = HtmlFormatter;
window.StructureConverter = StructureConverter;
window.ContentCleaner = ContentCleaner;
window.GenericHtmlFormatter = GenericHtmlFormatter;
window.KimiHtmlFormatter = KimiHtmlFormatter;
window.DeepSeekHtmlFormatter = DeepSeekHtmlFormatter;
window.HtmlFormatterManager = HtmlFormatterManager;
window.ClipboardManager = ClipboardManager;
window.CopyButton = CopyButton;
window.KimiMessageDetector = KimiMessageDetector;
window.MessageType = MessageType;

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
debugLog(DEBUG_LEVEL.INFO, '📦 All modules imported and exposed globally');

// 验证关键模块是否正确加载
function validateCriticalModules() {
    const criticalModules = [
        { name: 'SUPPORTED_SITES', ref: SUPPORTED_SITES },
        { name: 'CopyButton', ref: CopyButton },
        { name: 'ClipboardManager', ref: ClipboardManager },
        { name: 'HtmlFormatterManager', ref: HtmlFormatterManager }
    ];

    let allModulesLoaded = true;
    
    criticalModules.forEach(module => {
        if (typeof module.ref === 'undefined' || module.ref === null) {
            debugLog(DEBUG_LEVEL.ERROR, `❌ Critical module ${module.name} failed to load`);
            allModulesLoaded = false;
        } else {
            debugLog(DEBUG_LEVEL.DEBUG, `✅ Module ${module.name} loaded successfully`);
        }
    });

    if (allModulesLoaded) {
        debugLog(DEBUG_LEVEL.INFO, '✅ All critical modules loaded successfully');
    } else {
        debugLog(DEBUG_LEVEL.ERROR, '❌ Some critical modules failed to load - extension may not work properly');
    }

    return allModulesLoaded;
}

// 立即验证模块加载状态
const modulesLoaded = validateCriticalModules();

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
        if (userConfig.disabledSites) {
            userConfig.disabledSites.forEach(hostname => {
                delete merged[hostname];
            });
        }

        return merged;
    }

    /**
     * 识别当前站点
     * @returns {Object|null} 当前站点配置，如果不支持则返回null
     */
    identifyCurrentSite() {
        if (!this.siteConfig) {
            debugLog(DEBUG_LEVEL.WARN, '⚠️ Site config not loaded');
            return null;
        }

        const hostname = window.location.hostname;
        debugLog(DEBUG_LEVEL.DEBUG, `🔍 Identifying site for hostname: ${hostname}`);

        // 直接匹配
        if (this.siteConfig[hostname]) {
            this.currentSite = { hostname, ...this.siteConfig[hostname] };
            debugLog(DEBUG_LEVEL.INFO, `✅ Direct match found for ${hostname}`);
            return this.currentSite;
        }

        // 模糊匹配（支持子域名）
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

    /**
     * 检查当前站点是否受支持
     * @returns {boolean} 是否受支持
     */
    isCurrentSiteSupported() {
        return this.identifyCurrentSite() !== null;
    }

    /**
     * 获取当前站点配置
     * @returns {Object|null} 当前站点配置
     */
    getCurrentSiteConfig() {
        return this.currentSite || this.identifyCurrentSite();
    }

    /**
     * 获取所有支持的站点列表
     * @returns {Array} 支持的站点列表
     */
    getSupportedSites() {
        if (!this.siteConfig) {
            return [];
        }
        return Object.keys(this.siteConfig);
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
        this.containerClass = 'puretext-button-container';
        this.isObserving = false;
    }

    /**
     * 开始监听DOM变化并注入按钮
     */
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

        // 立即检查现有元素
        this.injectButtonsForExistingElements(siteConfig);

        // 开始观察DOM变化
        this.startObserving(siteConfig);
    }

    /**
     * 为现有元素注入按钮
     * @param {Object} siteConfig - 站点配置
     */
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

    /**
     * 开始观察DOM变化
     * @param {Object} siteConfig - 站点配置
     */
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
            attributes: false // 不监听属性变化，提高性能
        };

        this.observer.observe(document.body, observerConfig);
        this.isObserving = true;

        debugLog(DEBUG_LEVEL.DEBUG, '👁️ Started observing DOM changes');
    }

    /**
     * 处理DOM变化
     * @param {MutationRecord[]} mutations - DOM变化记录
     * @param {Object} siteConfig - 站点配置
     */
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

    /**
     * 检查节点是否包含目标元素
     * @param {Element} node - 要检查的节点
     * @param {string[]} selectors - 选择器数组
     * @param {Object} siteConfig - 站点配置
     * @returns {boolean} 是否找到新元素
     */
    checkNodeForTargets(node, selectors, siteConfig) {
        let foundElements = false;

        selectors.forEach(selector => {
            try {
                // 检查节点本身是否匹配
                if (node.matches && node.matches(selector)) {
                    this.injectButtonForElement(node, siteConfig);
                    foundElements = true;
                }

                // 检查子元素
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

    /**
     * 为单个元素注入按钮
     * @param {Element} element - 目标元素
     * @param {Object} siteConfig - 站点配置
     */
    injectButtonForElement(element, siteConfig) {
        // 检查是否已经注入过按钮
        if (this.injectedButtons.has(element)) {
            return;
        }

        // 检查关键模块是否可用
        if (!this.validateModuleAvailability()) {
            debugLog(DEBUG_LEVEL.ERROR, '❌ Required modules not available, skipping button injection');
            return;
        }

        // 检查元素是否有足够的文本内容
        const textContent = element.textContent || '';
        if (textContent.trim().length < 10) {
            debugLog(DEBUG_LEVEL.DEBUG, '⏭️ Skipping element with insufficient text content');
            return;
        }

        // 检查元素是否可见
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
            // 查找合适的容器来放置按钮
            const targetContainer = this.findButtonContainer(element, siteConfig);
            if (!targetContainer) {
                debugLog(DEBUG_LEVEL.DEBUG, '⏭️ No suitable container found for button');
                return;
            }

            // 创建统一的按钮组件
            const buttonContainer = CopyButton.create(targetContainer, async (element) => {
                return await ClipboardManager.copyHtmlToClipboard(element);
            });

            if (buttonContainer) {
                // 标记元素已注入按钮
                this.injectedButtons.add(element);
                debugLog(DEBUG_LEVEL.DEBUG, '✅ Button injected successfully');
            }

        } catch (error) {
            debugLog(DEBUG_LEVEL.ERROR, '❌ Error injecting button:', error);
            // 尝试重新初始化模块
            this.attemptModuleRecovery();
        }
    }

    /**
     * 验证关键模块是否可用
     * @returns {boolean} 模块是否都可用
     */
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

    /**
     * 尝试模块恢复
     */
    attemptModuleRecovery() {
        debugLog(DEBUG_LEVEL.WARN, '🔄 Attempting module recovery...');
        
        // 检查全局变量是否可用
        if (typeof window.CopyButton !== 'undefined') {
            debugLog(DEBUG_LEVEL.INFO, '✅ Found CopyButton in global scope');
            return;
        }

        // 延迟重试
        setTimeout(() => {
            if (this.validateModuleAvailability()) {
                debugLog(DEBUG_LEVEL.INFO, '✅ Module recovery successful');
                // 重新启动按钮注入
                this.start();
            } else {
                debugLog(DEBUG_LEVEL.ERROR, '❌ Module recovery failed');
            }
        }, 1000);
    }

    /**
     * 查找合适的按钮容器
     * @param {Element} element - 目标元素
     * @param {Object} siteConfig - 站点配置
     * @returns {Element|null} 按钮容器
     */
    findButtonContainer(element, siteConfig) {
        // 优先使用配置中指定的容器选择器
        if (siteConfig.buttonContainer) {
            const container = element.querySelector(siteConfig.buttonContainer) ||
                element.closest(siteConfig.buttonContainer);
            if (container) {
                return container;
            }
        }

        // 默认策略：查找合适的父容器
        let current = element;
        let attempts = 0;
        const maxAttempts = 5; // 限制向上查找的层数

        while (current && attempts < maxAttempts) {
            // 检查当前元素是否适合作为容器
            if (this.isGoodButtonContainer(current)) {
                return current;
            }

            current = current.parentElement;
            attempts++;
        }

        // 如果找不到合适的容器，使用原始元素
        return element;
    }

    /**
     * 判断元素是否适合作为按钮容器
     * @param {Element} element - 要检查的元素
     * @returns {boolean} 是否适合
     */
    isGoodButtonContainer(element) {
        if (!element) return false;

        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        // 检查元素是否有足够的空间
        const hasSpace = rect.width > 100 && rect.height > 30;

        // 检查元素是否是块级元素或具有相对/绝对定位
        const isPositioned = ['relative', 'absolute', 'fixed'].includes(style.position) ||
            ['block', 'flex', 'grid'].includes(style.display);

        // 检查元素是否不是内联元素
        const notInline = style.display !== 'inline';

        return hasSpace && isPositioned && notInline;
    }

    /**
     * 检查元素是否可见
     * @param {Element} element - 要检查的元素
     * @returns {boolean} 是否可见
     */
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

    /**
     * 验证是否应该为元素注入按钮（基于消息类型）
     * @param {Element} element - 目标元素
     * @param {Object} siteConfig - 站点配置
     * @returns {boolean} 是否应该注入按钮
     */
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

                // 默认允许注入（避免漏掉AI回复）
                return true;
            }

            // 对于其他网站，使用通用检测逻辑
            return this.genericMessageValidation(element, siteConfig);

        } catch (error) {
            debugLog(DEBUG_LEVEL.ERROR, '❌ 消息类型验证出错:', error);
            // 出错时默认允许注入，避免完全失效
            return true;
        }
    }

    /**
     * 备用消息检测方法（当主要检测方法置信度较低时使用）
     * @param {Element} element - 要检查的元素
     * @returns {boolean} 是否应该注入按钮
     */
    fallbackMessageDetection(element) {
        const text = element.textContent?.trim() || '';
        
        // 简单的启发式规则
        const userPatterns = [
            /^(请|帮我|告诉我|我想|我需要)/,
            /[？?]$/,
            /^.{1,50}[？?]$/  // 短问句
        ];

        const isLikelyUserMessage = userPatterns.some(pattern => pattern.test(text));
        
        if (isLikelyUserMessage) {
            debugLog(DEBUG_LEVEL.DEBUG, '❌ 备用检测：识别为用户消息');
            return false;
        }

        debugLog(DEBUG_LEVEL.DEBUG, '✅ 备用检测：允许按钮注入');
        return true;
    }

    /**
     * 通用消息验证（用于非Kimi网站）
     * @param {Element} element - 目标元素
     * @param {Object} siteConfig - 站点配置
     * @returns {boolean} 是否应该注入按钮
     */
    genericMessageValidation(element, siteConfig) {
        // 检查元素属性中的角色信息
        let current = element;
        for (let i = 0; i < 3 && current; i++) {
            const dataRole = current.getAttribute('data-role')?.toLowerCase();
            const dataAuthor = current.getAttribute('data-author')?.toLowerCase();
            const className = current.className?.toLowerCase() || '';

            // 明确的用户消息标识
            if (dataRole === 'user' || dataAuthor === 'user' || className.includes('user-message')) {
                debugLog(DEBUG_LEVEL.DEBUG, '❌ 通用检测：识别为用户消息');
                return false;
            }

            // 明确的AI回复标识
            if (dataRole === 'assistant' || dataAuthor === 'assistant' || className.includes('assistant')) {
                debugLog(DEBUG_LEVEL.DEBUG, '✅ 通用检测：识别为AI回复');
                return true;
            }

            current = current.parentElement;
        }

        // 默认允许注入
        debugLog(DEBUG_LEVEL.DEBUG, '✅ 通用检测：默认允许按钮注入');
        return true;
    }

    /**
     * 清理错误放置的按钮（从用户消息中移除按钮）
     */
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

    /**
     * 停止监听DOM变化
     */
    stop() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.isObserving = false;
        debugLog(DEBUG_LEVEL.INFO, '🛑 Button injection stopped');
    }

    /**
     * 清理所有注入的按钮
     */
    cleanup() {
        // 移除所有注入的按钮
        const buttons = document.querySelectorAll(`.${this.containerClass}`);
        buttons.forEach(button => {
            button.remove();
        });

        // 清空已注入按钮的记录
        this.injectedButtons = new WeakSet();

        debugLog(DEBUG_LEVEL.INFO, '🧹 Cleaned up all injected buttons');
    }
}

/**
 * 主扩展类
 * 协调各个组件的工作
 */
class PureTextExtension {
    constructor() {
        this.siteManager = new SiteManager();
        this.buttonInjector = new ButtonInjector(this.siteManager);
        this.isRunning = false;
    }

    /**
     * 启动扩展
     */
    async start() {
        if (this.isRunning) {
            debugLog(DEBUG_LEVEL.DEBUG, '🔄 Extension already running');
            return;
        }

        try {
            debugLog(DEBUG_LEVEL.INFO, '🚀 Starting PureText Extension...');

            // 加载站点配置
            await this.siteManager.loadSiteConfig();

            // 检查当前站点是否受支持
            if (!this.siteManager.isCurrentSiteSupported()) {
                debugLog(DEBUG_LEVEL.INFO, `ℹ️ Current site (${window.location.hostname}) is not supported`);
                return;
            }

            debugLog(DEBUG_LEVEL.INFO, `✅ Current site supported: ${window.location.hostname}`);

            // 启动按钮注入器
            this.buttonInjector.start();

            this.isRunning = true;
            debugLog(DEBUG_LEVEL.INFO, '✅ PureText Extension started successfully');

        } catch (error) {
            debugLog(DEBUG_LEVEL.ERROR, '❌ Failed to start extension:', error);
        }
    }

    /**
     * 停止扩展
     */
    stop() {
        if (!this.isRunning) {
            debugLog(DEBUG_LEVEL.DEBUG, '🔄 Extension not running');
            return;
        }

        try {
            debugLog(DEBUG_LEVEL.INFO, '🛑 Stopping PureText Extension...');

            // 停止按钮注入器
            this.buttonInjector.stop();

            // 清理注入的按钮
            this.buttonInjector.cleanup();

            this.isRunning = false;
            debugLog(DEBUG_LEVEL.INFO, '✅ PureText Extension stopped successfully');

        } catch (error) {
            debugLog(DEBUG_LEVEL.ERROR, '❌ Failed to stop extension:', error);
        }
    }

    /**
     * 重启扩展
     */
    async restart() {
        debugLog(DEBUG_LEVEL.INFO, '🔄 Restarting PureText Extension...');
        this.stop();
        await this.start();
    }

    /**
     * 获取扩展状态
     * @returns {Object} 扩展状态信息
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            currentSite: this.siteManager.getCurrentSiteConfig(),
            supportedSites: this.siteManager.getSupportedSites(),
            injectedButtonsCount: document.querySelectorAll('.puretext-button-container').length
        };
    }
}

// 全局扩展实例
let pureTextExtension = null;

/**
 * 启动扩展的主函数
 */
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

/**
 * 页面加载完成后启动扩展
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        startExtension();
    });
} else {
    // 如果页面已经加载完成，立即启动
    startExtension();
}

/**
 * 页面可见性变化时的处理
 */
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && pureTextExtension) {
        // 页面变为可见时，重新检查按钮注入
        setTimeout(() => {
            if (pureTextExtension.isRunning) {
                pureTextExtension.buttonInjector.start();
            }
        }, 1000);
    }
});

/**
 * 暴露全局控制函数供调试使用
 */
window.pureTextExtension = pureTextExtension;

/**
 * 全局停止函数
 */
window.stopPureText = function () {
    if (pureTextExtension) {
        pureTextExtension.stop();
    }
};

// 监听页面可见性变化
document.addEventListener('visibilitychange', function () {
    try {
        if (document.visibilityState === 'visible') {
            // 页面变为可见时，延迟重新启动扩展以确保DOM已稳定
            setTimeout(() => {
                if (pureTextExtension && !pureTextExtension.isRunning) {
                    startExtension();
                }
            }, 1000);
        }
    } catch (error) {
        // 不阻塞扩展的其他功能
    }
});

// 初始化HTML格式化管理器
async function initializeHtmlFormatterManager() {
    try {
        // 检查HtmlFormatterManager是否可用
        if (typeof HtmlFormatterManager !== 'undefined') {
            // 创建全局实例
            window.htmlFormatterManager = new HtmlFormatterManager();
            console.debug('[PureText] HTML formatter manager initialized');
        } else {
            console.warn('[PureText] HtmlFormatterManager not available');
        }
    } catch (error) {
        console.error('[PureText] Failed to initialize HTML formatter manager:', error);
        // 不阻塞扩展的其他功能
    }
}

// 延迟初始化HTML格式化管理器，确保所有模块都已加载
setTimeout(() => {
    initializeHtmlFormatterManager();
}, 100);