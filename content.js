// 一键纯文扩展 - 内容脚本
// 注意：SUPPORTED_SITES 配置在 sites.js 中定义

console.log('🚀 PureText Content script loaded');

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
     */
    async loadSiteConfig() {
        try {
            if (typeof SUPPORTED_SITES === 'undefined') {
                console.error('❌ SUPPORTED_SITES is undefined! sites.js may not be loaded.');
                this.siteConfig = {};
                return;
            }

            // 使用全局的SUPPORTED_SITES配置（从sites.js加载）
            this.siteConfig = { ...SUPPORTED_SITES };
            console.log('✅ Site configuration loaded');

        } catch (error) {
            console.warn('⚠️ Failed to load config, using built-in config:', error);
            this.siteConfig = typeof SUPPORTED_SITES !== 'undefined' ? { ...SUPPORTED_SITES } : {};
        }
    }

    /**
     * 获取当前站点配置
     */
    getCurrentSite() {
        if (!this.siteConfig) {
            console.warn('⚠️ Site config not loaded');
            return null;
        }

        const hostname = window.location.hostname;
        this.currentSite = this.siteConfig[hostname] || null;

        if (this.currentSite) {
            this.currentSite.hostname = hostname;
            console.log('✅ Current site supported:', this.currentSite.name);
        } else {
            console.warn('❌ Current site not supported:', hostname);
        }

        return this.currentSite;
    }

    /**
     * 检查当前站点是否支持
     */
    isSupported() {
        return this.getCurrentSite() !== null;
    }

    /**
     * 获取当前站点的有效选择器
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
     */
    findValidSelector(selectors) {
        for (const selector of selectors) {
            try {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    // 验证元素是否有实际内容
                    const hasContent = Array.from(elements).some(el => {
                        const text = el.textContent?.trim();
                        return text && text.length > 10;
                    });

                    if (hasContent) {
                        console.log(`✅ 找到有效选择器: ${selector}`);
                        return selector;
                    }
                }
            } catch (error) {
                continue;
            }
        }

        console.warn('❌ 所有预设选择器都无效');
        return null;
    }

    /**
     * 获取当前站点的显示名称
     */
    getSiteName() {
        const site = this.getCurrentSite();
        return site ? site.name : null;
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
        this.injectedButtons = new WeakSet();
        this.buttonClass = 'puretext-copy-btn';
        this.debounceTimer = null;
        this.debounceDelay = 100;
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

        console.log('✅ Started observing DOM changes');
    }

    /**
     * 停止监听DOM变化
     */
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

    /**
     * 处理DOM变化
     */
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
            console.warn('⚠️ No selector available, skipping button injection');
            return;
        }

        try {
            const bubbles = document.querySelectorAll(selector);
            console.log(`📊 Found ${bubbles.length} target elements`);

            if (bubbles.length === 0) {
                console.warn('⚠️ No target elements found');
                return;
            }

            let injectedCount = 0;
            for (const bubble of bubbles) {
                const injected = this.injectButton(bubble);
                if (injected) injectedCount++;
            }

            console.log(`✅ Successfully injected ${injectedCount} buttons`);
        } catch (error) {
            console.error('❌ Error scanning for bubbles:', error);
        }
    }

    /**
     * 向指定元素注入复制按钮
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

            // 检查是否已经存在按钮
            if (CopyButton.hasButton(bubble)) {
                this.injectedButtons.add(bubble);
                return false;
            }

            // 验证元素是否有足够的文本内容
            const text = bubble.textContent?.trim();
            if (!text || text.length < 20) {
                return false;
            }

            // 检查是否是AI回复而不是用户消息
            if (!this.isAIResponse(bubble)) {
                return false;
            }

            // 找到最合适的容器元素
            const targetContainer = this.findBestContainer(bubble);

            // 创建按钮组件
            const buttonContainer = CopyButton.create(targetContainer, async (element) => {
                return await ClipboardManager.copyHtmlToClipboard(element);
            });

            // 定位按钮到右下角
            buttonContainer.style.position = 'absolute';
            buttonContainer.style.right = '8px';
            buttonContainer.style.bottom = '8px';
            buttonContainer.style.zIndex = '1000';

            // 注入按钮
            targetContainer.appendChild(buttonContainer);

            // 标记为已注入
            this.injectedButtons.add(bubble);
            this.injectedButtons.add(targetContainer);

            return true;

        } catch (error) {
            console.error('❌ 按钮注入失败:', error);
            return false;
        }
    }

    /**
     * 找到最合适的按钮容器
     */
    findBestContainer(element) {
        let current = element;
        let bestContainer = element;

        // 向上查找，寻找更合适的容器
        for (let i = 0; i < 5 && current.parentElement; i++) {
            current = current.parentElement;

            // 检查是否是更好的容器
            if (this.isBetterContainer(current, bestContainer)) {
                bestContainer = current;
            }
        }

        return bestContainer;
    }

    /**
     * 判断是否是更好的容器
     */
    isBetterContainer(candidate, current) {
        const candidateClasses = candidate.className.toLowerCase();
        const candidateText = candidate.textContent?.trim() || '';

        // 如果候选容器包含明显的消息容器特征
        const messageKeywords = ['message', 'chat', 'conversation', 'response', 'reply'];
        const hasMessageKeyword = messageKeywords.some(keyword =>
            candidateClasses.includes(keyword)
        );

        // 如果候选容器的文本长度合理
        const currentText = current.textContent?.trim() || '';
        const textRatio = candidateText.length / Math.max(currentText.length, 1);
        const reasonableSize = textRatio <= 2;

        // 如果候选容器有相对定位
        const style = window.getComputedStyle(candidate);
        const canPosition = style.position !== 'static' || candidate.tagName !== 'SPAN';

        return hasMessageKeyword && reasonableSize && canPosition;
    }

    /**
     * 判断元素是否是AI回复
     */
    isAIResponse(element) {
        try {
            // 检查元素及其父元素的类名和属性
            let current = element;
            for (let i = 0; i < 5 && current; i++) {
                const className = current.className?.toLowerCase() || '';
                const dataRole = current.getAttribute('data-role')?.toLowerCase() || '';
                const dataAuthor = current.getAttribute('data-author')?.toLowerCase() || '';

                // 如果包含user，判定为用户消息
                if (className.includes('user')) {
                    return false;
                }

                // 明确的AI回复标识
                if (dataRole === 'assistant' || dataAuthor === 'assistant' ||
                    className.includes('assistant') || className.includes('ai-response') ||
                    className.includes('bot-message') || className.includes('kimi-response')) {
                    return true;
                }

                // 明确的用户消息标识
                if (dataRole === 'user' || dataAuthor === 'user' ||
                    className.includes('user-message') || className.includes('human-message')) {
                    return false;
                }

                current = current.parentElement;
            }

            // 通过文本内容特征判断
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
                    return true;
                }

                if (hasUserIndicators && !hasAIIndicators) {
                    return false;
                }
            }

            // 默认情况：如果无法确定，倾向于认为是AI回复
            return true;

        } catch (error) {
            return true;
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
            console.log('✅ Cleaned up all injected buttons');
        } catch (error) {
            console.error('❌ Error during cleanup:', error);
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
            console.log('🚀 Initializing extension...');

            // 创建站点管理器
            this.siteManager = new SiteManager();

            // 加载站点配置
            await this.siteManager.loadSiteConfig();

            // 检查当前站点是否支持
            if (!this.siteManager.isSupported()) {
                console.log('❌ Current site is not supported:', window.location.hostname);
                return;
            }

            console.log('✅ Site supported:', this.siteManager.getSiteName());

            // 创建按钮注入器
            this.buttonInjector = new ButtonInjector(this.siteManager);

            this.isInitialized = true;
            console.log('✅ Extension initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize extension:', error);
        }
    }

    /**
     * 启动扩展功能
     */
    start() {
        if (!this.isInitialized) {
            console.warn('⚠️ Extension not initialized, cannot start');
            return;
        }

        if (this.isRunning) {
            console.log('✅ Extension already running');
            return;
        }

        try {
            // 开始监听DOM变化并注入按钮
            this.buttonInjector.startObserving();

            this.isRunning = true;
            console.log('✅ Extension started successfully');

        } catch (error) {
            console.error('❌ Failed to start extension:', error);
        }
    }

    /**
     * 停止扩展功能
     */
    stop() {
        if (!this.isRunning) {
            return;
        }

        try {
            // 停止DOM监听
            if (this.buttonInjector) {
                this.buttonInjector.stopObserving();
                this.buttonInjector.cleanup();
            }

            this.isRunning = false;
            console.log('✅ Extension stopped');

        } catch (error) {
            console.error('❌ Error stopping extension:', error);
        }
    }

    /**
     * 重启扩展
     */
    async restart() {
        console.log('🔄 Restarting extension...');
        this.stop();
        await this.init();
        this.start();
    }

    /**
     * 获取扩展状态信息
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
            console.log('✅ Extension already exists');
            return;
        }

        // 创建扩展实例
        pureTextExtension = new PureTextExtension();

        // 初始化并启动
        await pureTextExtension.init();
        pureTextExtension.start();

        // 验证启动状态
        const status = pureTextExtension.getStatus();
        console.log('✅ Extension startup completed', status);

    } catch (error) {
        console.error('❌ Failed to start extension:', error);
    }
}

/**
 * 页面加载完成后启动扩展
 */
function initializeWhenReady() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startExtension);
    } else {
        startExtension();
    }
}

/**
 * 处理页面可见性变化
 */
function handleVisibilityChange() {
    if (document.hidden) {
        console.log('📱 Page hidden');
    } else {
        console.log('📱 Page visible');
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
console.log('🚀 PureText One-Click extension loaded');
initializeWhenReady();

// 挂载 ClipboardManager 到全局，确保按钮事件能访问
window.ClipboardManager = ClipboardManager;

/**
 * 初始化HTML格式化管理器
 * 这个函数负责加载和初始化 @/formatters 文件夹中的所有格式化器
 * 
 * 格式化器包括：
 * - HtmlFormatter.js: 基础格式化器接口
 * - GenericHtmlFormatter.js: 通用格式化器（处理大多数网站）
 * - KimiHtmlFormatter.js: Kimi网站专用格式化器
 * - DeepSeekHtmlFormatter.js: DeepSeek网站专用格式化器
 * 
 * HtmlFormatterManager 会：
 * 1. 根据当前网站域名选择合适的格式化器
 * 2. 将AI回复的HTML内容转换为Word友好的格式
 * 3. 处理代码块、列表、表格等复杂结构
 * 4. 清理不必要的样式和脚本
 */
async function initializeHtmlFormatterManager() {
    try {
        // 检查HtmlFormatterManager是否可用
        if (typeof HtmlFormatterManager !== 'undefined') {
            // 创建全局实例
            // 🔥 这里会实例化 HtmlFormatterManager，它会：
            // - 导入所有格式化器类
            // - 注册网站特定的格式化器（如 KimiHtmlFormatter、DeepSeekHtmlFormatter）
            // - 设置通用格式化器（GenericHtmlFormatter）作为降级方案
            window.htmlFormatterManager = new HtmlFormatterManager();
            console.log('✅ HTML formatter manager initialized');
        } else {
            console.warn('⚠️ HtmlFormatterManager not available');
        }
    } catch (error) {
        console.error('❌ Failed to initialize HTML formatter manager:', error);
        // 不阻塞扩展的其他功能
    }
}

// 延迟初始化HTML格式化管理器，确保所有模块都已加载
setTimeout(() => {
    initializeHtmlFormatterManager();
}, 100);