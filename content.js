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
   * 获取当前站点的选择器
   * @returns {string|null} CSS选择器字符串，如果不支持则返回null
   */
  getSelector() {
    const site = this.getCurrentSite();
    return site ? site.selector : null;
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
    
    // 获取元素的文本内容（自动去除HTML标签）
    let text = clonedElement.innerText || clonedElement.textContent || '';
    
    // 去除常见的Markdown格式标记
    text = this.removeMarkdownFormatting(text);
    
    // 清理多余的空白字符
    text = this.cleanWhitespace(text);
    
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
   * 向指定元素注入复制按钮
   * @param {HTMLElement} bubble - 目标气泡元素
   */
  injectButton(bubble) {
    try {
      // 检查元素是否仍在DOM中
      if (!document.contains(bubble)) {
        return;
      }

      // 检查是否已经注入过按钮
      if (this.injectedButtons.has(bubble)) {
        return;
      }

      // 检查是否已经存在按钮（双重保险）
      if (bubble.querySelector(`.${this.buttonClass}`)) {
        this.injectedButtons.add(bubble);
        return;
      }

      // 创建并注入按钮
      const button = this.createButton(bubble);
      this.positionButton(button, bubble);
      bubble.appendChild(button);
      
      // 标记为已注入
      this.injectedButtons.add(bubble);
      
      console.debug('PureText: Button injected successfully');
    } catch (error) {
      console.error('PureText: Button injection failed:', error);
    }
  }

  /**
   * 创建复制按钮元素
   * @param {HTMLElement} targetBubble - 目标气泡元素
   * @returns {HTMLElement} 创建的按钮元素
   */
  createButton(targetBubble) {
    const button = document.createElement('button');
    
    // 设置按钮文本（支持国际化）
    const buttonText = chrome.i18n ? chrome.i18n.getMessage('copyPlainText') : 'Copy Plain Text';
    button.textContent = buttonText;
    
    // 设置按钮类名
    button.className = this.buttonClass;
    
    // 设置按钮样式
    this.applyButtonStyles(button);
    
    // 添加点击事件
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.handleButtonClick(targetBubble, button);
    });

    // 添加键盘支持
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        this.handleButtonClick(targetBubble, button);
      }
    });

    return button;
  }

  /**
   * 应用按钮样式
   * @param {HTMLElement} button - 按钮元素
   */
  applyButtonStyles(button) {
    // 检测当前页面的主题色调
    const isDarkTheme = this.detectDarkTheme();
    
    // 根据主题选择合适的颜色方案
    const colorScheme = this.getColorScheme(isDarkTheme);
    
    button.style.cssText = `
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: ${colorScheme.background};
      color: ${colorScheme.text};
      border: 1px solid ${colorScheme.border};
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      cursor: pointer;
      z-index: 10001;
      opacity: 0.85;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      white-space: nowrap;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      box-shadow: 0 2px 8px ${colorScheme.shadow};
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      line-height: 1.2;
      letter-spacing: 0.01em;
      min-width: 80px;
      text-align: center;
      transform: translateZ(0);
      will-change: transform, opacity, background-color;
    `;

    // 添加悬停效果
    button.addEventListener('mouseenter', () => {
      button.style.opacity = '1';
      button.style.background = colorScheme.hoverBackground;
      button.style.transform = 'translateY(-1px) translateZ(0)';
      button.style.boxShadow = `0 4px 12px ${colorScheme.hoverShadow}`;
    });

    button.addEventListener('mouseleave', () => {
      button.style.opacity = '0.85';
      button.style.background = colorScheme.background;
      button.style.transform = 'translateY(0) translateZ(0)';
      button.style.boxShadow = `0 2px 8px ${colorScheme.shadow}`;
    });

    // 添加焦点样式（键盘导航支持）
    button.addEventListener('focus', () => {
      button.style.outline = `2px solid ${colorScheme.focus}`;
      button.style.outlineOffset = '2px';
      button.style.opacity = '1';
    });

    button.addEventListener('blur', () => {
      button.style.outline = 'none';
      button.style.opacity = '0.85';
    });

    // 添加活动状态样式
    button.addEventListener('mousedown', () => {
      button.style.transform = 'translateY(0) scale(0.98) translateZ(0)';
      button.style.background = colorScheme.activeBackground;
    });

    button.addEventListener('mouseup', () => {
      button.style.transform = 'translateY(-1px) translateZ(0)';
      button.style.background = colorScheme.hoverBackground;
    });

    // 添加触摸设备支持
    button.addEventListener('touchstart', () => {
      button.style.transform = 'scale(0.98) translateZ(0)';
      button.style.background = colorScheme.activeBackground;
    }, { passive: true });

    button.addEventListener('touchend', () => {
      button.style.transform = 'translateZ(0)';
      button.style.background = colorScheme.background;
    }, { passive: true });
  }

  /**
   * 检测当前页面是否为深色主题
   * @returns {boolean} 是否为深色主题
   */
  detectDarkTheme() {
    try {
      // 检查页面背景色
      const bodyStyle = window.getComputedStyle(document.body);
      const backgroundColor = bodyStyle.backgroundColor;
      
      // 检查HTML元素的背景色
      const htmlStyle = window.getComputedStyle(document.documentElement);
      const htmlBackgroundColor = htmlStyle.backgroundColor;
      
      // 解析颜色值并判断亮度
      const isDarkBody = this.isColorDark(backgroundColor);
      const isDarkHtml = this.isColorDark(htmlBackgroundColor);
      
      // 检查系统主题偏好
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // 检查常见的深色主题类名
      const hasDarkClass = document.documentElement.classList.contains('dark') || 
                          document.body.classList.contains('dark') ||
                          document.documentElement.classList.contains('dark-theme') ||
                          document.body.classList.contains('dark-theme');
      
      // 综合判断
      return isDarkBody || isDarkHtml || hasDarkClass || prefersDark;
    } catch (error) {
      // 如果检测失败，默认返回系统偏好或false
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }

  /**
   * 判断颜色是否为深色
   * @param {string} color - CSS颜色值
   * @returns {boolean} 是否为深色
   */
  isColorDark(color) {
    if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
      return false;
    }

    try {
      // 创建临时元素来解析颜色
      const tempElement = document.createElement('div');
      tempElement.style.color = color;
      document.body.appendChild(tempElement);
      
      const computedColor = window.getComputedStyle(tempElement).color;
      document.body.removeChild(tempElement);
      
      // 解析RGB值
      const rgbMatch = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        
        // 计算相对亮度 (使用 WCAG 标准)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance < 0.5;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * 根据主题获取颜色方案
   * @param {boolean} isDark - 是否为深色主题
   * @returns {Object} 颜色方案对象
   */
  getColorScheme(isDark) {
    if (isDark) {
      // 深色主题配色方案
      return {
        background: 'rgba(255, 255, 255, 0.12)',
        text: '#ffffff',
        border: 'rgba(255, 255, 255, 0.2)',
        shadow: 'rgba(0, 0, 0, 0.4)',
        hoverBackground: 'rgba(255, 255, 255, 0.18)',
        hoverShadow: 'rgba(0, 0, 0, 0.6)',
        activeBackground: 'rgba(255, 255, 255, 0.08)',
        focus: '#4CAF50'
      };
    } else {
      // 浅色主题配色方案
      return {
        background: 'rgba(0, 0, 0, 0.08)',
        text: '#333333',
        border: 'rgba(0, 0, 0, 0.12)',
        shadow: 'rgba(0, 0, 0, 0.15)',
        hoverBackground: 'rgba(0, 0, 0, 0.12)',
        hoverShadow: 'rgba(0, 0, 0, 0.25)',
        activeBackground: 'rgba(0, 0, 0, 0.04)',
        focus: '#2196F3'
      };
    }
  }

  /**
   * 定位按钮位置
   * @param {HTMLElement} button - 按钮元素
   * @param {HTMLElement} bubble - 目标气泡元素
   */
  positionButton(button, bubble) {
    // 确保父元素有相对定位
    const computedStyle = window.getComputedStyle(bubble);
    if (computedStyle.position === 'static') {
      bubble.style.position = 'relative';
    }

    // 智能定位：避免遮挡重要内容
    this.optimizeButtonPosition(button, bubble);
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
      const success = await ClipboardManager.copyPlainText(targetBubble);
      
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