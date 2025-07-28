import { HtmlFormatter } from './formatters/HtmlFormatter.js';
import { ContentCleaner } from './ContentCleaner.js';
import { GenericHtmlFormatter } from './formatters/GenericHtmlFormatter.js';
import { KimiHtmlFormatter } from './formatters/KimiHtmlFormatter.js';
import { DeepSeekHtmlFormatter } from './formatters/DeepSeekHtmlFormatter.js';

/**
 * HTML格式化管理器
 * 负责管理不同网站的格式化器，提供统一的格式化接口
 */
class HtmlFormatterManager {
  constructor() {
    // 存储网站域名到格式化器的映射
    this.formatters = new Map();
    
    // 通用格式化器，作为降级方案
    this.genericFormatter = null;
    
    // 内容清理器实例
    this.contentCleaner = new ContentCleaner();
    
    // 初始化状态标记
    this.initialized = false;
    
    // 异步初始化默认格式化器
    this.initializeDefaultFormatters();
  }
  
  /**
   * 注册网站特定的格式化器
   * @param {string} hostname - 网站域名
   * @param {HtmlFormatter} formatter - 格式化器实例
   */
  registerFormatter(hostname, formatter) {
    if (!(formatter instanceof HtmlFormatter)) {
      throw new Error('Formatter must extend HtmlFormatter class');
    }
    
    console.debug(`[HtmlFormatterManager] Registering formatter for ${hostname}:`, formatter.getName());
    this.formatters.set(hostname, formatter);
  }
  
  /**
   * 设置通用格式化器
   * @param {HtmlFormatter} formatter - 通用格式化器实例
   */
  setGenericFormatter(formatter) {
    if (!(formatter instanceof HtmlFormatter)) {
      throw new Error('Generic formatter must extend HtmlFormatter class');
    }
    
    console.debug('[HtmlFormatterManager] Setting generic formatter:', formatter.getName());
    this.genericFormatter = formatter;
  }
  
  /**
   * 格式化HTML内容为Word友好格式
   * @param {HTMLElement} element - 要格式化的DOM元素
   * @param {string} hostname - 当前网站域名
   * @returns {Promise<string>} 格式化后的HTML字符串
   */
  async formatForWord(element, hostname = window.location.hostname) {
    console.log('[HtmlFormatterManager] formatForWord收到element:', element?.tagName, element?.className, (element?.innerText || '').slice(0, 50));
    console.log('[HtmlFormatterManager] hostname:', hostname);
    const startTime = performance.now();
    
    try {
      console.log(`[HtmlFormatterManager] ========== 开始格式化 ${hostname} ==========`);
      console.log(`[HtmlFormatterManager] 输入元素:`, element.tagName, element.className);
      console.log(`[HtmlFormatterManager] 元素内容长度:`, (element.textContent || '').length);
      
      // 1. 验证输入参数
      if (!element) {
        throw new Error('Element is required for formatting');
      }
      
      // 2. 等待初始化完成
      console.log(`[HtmlFormatterManager] 等待初始化完成...`);
      await this.waitForInitialization();
      console.log(`[HtmlFormatterManager] 初始化完成`);
      
      // 3. 选择合适的格式化器
      console.log(`[HtmlFormatterManager] 选择格式化器... hostname=`, hostname);
      const formatter = this.getFormatter(hostname, element);
      console.log(`[HtmlFormatterManager] 使用格式化器: ${formatter.getName()} for hostname: ${hostname}`);
      
      // 4. 克隆元素避免修改原DOM
      console.log(`[HtmlFormatterManager] 克隆DOM元素...`);
      const cloned = element.cloneNode(true);
      console.log(`[HtmlFormatterManager] DOM元素已克隆`);
      
      // 5. 执行格式化
      console.log(`[HtmlFormatterManager] 开始执行格式化...`);
      const formattedHtml = await this.executeFormatting(formatter, cloned, hostname);
      console.log(`[HtmlFormatterManager] 格式化完成，结果长度: ${formattedHtml.length}`);
      console.log(`[HtmlFormatterManager] 格式化结果预览: ${formattedHtml.substring(0, 300)}...`);
      
      // 6. 记录性能
      const duration = performance.now() - startTime;
      console.log(`[HtmlFormatterManager] 格式化总耗时: ${duration.toFixed(2)}ms`);
      
      return formattedHtml;
      
    } catch (error) {
      console.error(`[HtmlFormatterManager] Formatting failed for ${hostname}:`, error);
      
      // 降级到基本文本提取
      const fallbackResult = this.fallbackFormat(element);
      
      const duration = performance.now() - startTime;
      console.warn(`[HtmlFormatterManager] Used fallback formatting in ${duration.toFixed(2)}ms`);
      
      return fallbackResult;
    }
  }
  
  /**
   * 获取网站对应的格式化器
   * @param {string} hostname - 网站域名
   * @param {HTMLElement} element - DOM元素（用于能力检查）
   * @returns {HtmlFormatter} 格式化器实例
   */
  getFormatter(hostname, element) {
    // 1. 首先尝试获取网站特定的格式化器
    const siteFormatter = this.formatters.get(hostname);
    if (siteFormatter && siteFormatter.canHandle(element)) {
      return siteFormatter;
    }
    
    // 2. 尝试找到能处理该元素的其他格式化器
    for (const [site, formatter] of this.formatters) {
      const can = formatter.canHandle(element);
      console.log(`[HtmlFormatterManager] 检查formatter: ${formatter.getName()} for site: ${site}, canHandle: ${can}, element.className: ${element.className}`);
      if (site !== hostname && can) {
        console.debug(`[HtmlFormatterManager] Using cross-site formatter from ${site} for ${hostname}`);
        return formatter;
      }
    }
    
    // 3. 使用通用格式化器作为最后的降级方案
    if (this.genericFormatter) {
      console.debug(`[HtmlFormatterManager] Using generic formatter for ${hostname}`);
      return this.genericFormatter;
    }
    
    // 4. 如果没有任何格式化器可用，抛出错误
    throw new Error(`No suitable formatter found for ${hostname}`);
  }
  
  /**
   * 执行格式化操作，包含超时和错误处理
   * @param {HtmlFormatter} formatter - 格式化器
   * @param {HTMLElement} element - 克隆的DOM元素
   * @param {string} hostname - 网站域名
   * @returns {Promise<string>} 格式化结果
   */
  async executeFormatting(formatter, element, hostname) {
    // 设置5秒超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Formatting timeout')), 5000);
    });
    
    // 执行格式化流程
    const formatPromise = this.doFormatting(formatter, element, hostname);
    
    try {
      const result = await Promise.race([formatPromise, timeoutPromise]);
      
      // 验证结果
      if (typeof result !== 'string') {
        throw new Error('Formatter must return a string');
      }
      
      if (result.trim().length === 0) {
        throw new Error('Formatter returned empty result');
      }
      
      return result;
      
    } catch (error) {
      // 如果特定格式化器失败，尝试通用格式化器
      if (formatter !== this.genericFormatter && this.genericFormatter) {
        console.warn(`[HtmlFormatterManager] Specific formatter failed, trying generic formatter:`, error);
        return await this.doFormatting(this.genericFormatter, element, hostname);
      }
      
      throw error;
    }
  }
  
  /**
   * 执行格式化处理
   * @param {HtmlFormatter} formatter - 格式化器
   * @param {HTMLElement} element - 克隆的DOM元素
   * @param {string} hostname - 网站域名
   * @returns {Promise<string>} 格式化结果
   */
  async doFormatting(formatter, element, hostname) {
    // 1. 先进行内容清理（复制场景）
    await this.contentCleaner.clean(element, hostname, true);
    
    // 2. 然后执行格式化
    const result = await formatter.format(element);
    
    return result;
  }
  
  /**
   * 降级格式化处理
   * 当所有格式化器都失败时使用
   * @param {HTMLElement} element - DOM元素
   * @returns {string} 基本HTML格式
   */
  fallbackFormat(element) {
    try {
      // 提取纯文本内容
      const text = element.innerText || element.textContent || '';
      
      if (!text.trim()) {
        return '<div><p>无内容</p></div>';
      }
      
      // 将文本按行分割，转换为段落
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      const paragraphs = lines.map(line => `<p>${this.escapeHtml(line)}</p>`).join('');
      
      return `<div>${paragraphs}</div>`;
      
    } catch (error) {
      console.error('[HtmlFormatterManager] Fallback formatting failed:', error);
      return '<div><p>格式化失败</p></div>';
    }
  }
  
  /**
   * 转义HTML特殊字符
   * @param {string} text - 要转义的文本
   * @returns {string} 转义后的文本
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * 初始化默认格式化器
   * 注册通用格式化器作为降级方案
   */
  async initializeDefaultFormatters() {
    console.debug('[HtmlFormatterManager] Initializing default formatters...');
    
    try {
      // 使用已导入的格式化器类
      // 注册通用格式化器
      this.setGenericFormatter(new GenericHtmlFormatter());
      console.debug('[HtmlFormatterManager] Generic formatter registered');
      
      // 注册Kimi网站格式化器
      this.registerFormatter('www.kimi.com', new KimiHtmlFormatter());
      console.debug('[HtmlFormatterManager] Kimi formatter registered');
      
      // 注册DeepSeek网站格式化器
      this.registerFormatter('chat.deepseek.com', new DeepSeekHtmlFormatter());
      console.log('[HtmlFormatterManager] DeepSeek formatter registered for chat.deepseek.com');
      
      // 标记初始化完成
      this.initialized = true;
      
    } catch (error) {
      console.error('[HtmlFormatterManager] Failed to initialize default formatters:', error);
      // 即使失败也标记为已初始化，避免阻塞
      this.initialized = true;
    }
    
    console.debug('[HtmlFormatterManager] Default formatters initialized');
  }

  /**
   * 等待初始化完成
   * @returns {Promise<void>}
   */
  async waitForInitialization() {
    if (this.initialized) {
      return;
    }
    
    // 轮询等待初始化完成，最多等待5秒
    const maxWaitTime = 5000;
    const checkInterval = 100;
    let waitedTime = 0;
    
    while (!this.initialized && waitedTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waitedTime += checkInterval;
    }
    
    if (!this.initialized) {
      console.warn('[HtmlFormatterManager] Initialization timeout, proceeding anyway');
    }
  }
  
  /**
   * 获取所有已注册的格式化器信息
   * @returns {Array} 格式化器信息数组
   */
  getRegisteredFormatters() {
    const formatters = [];
    
    for (const [hostname, formatter] of this.formatters) {
      formatters.push({
        hostname,
        name: formatter.getName(),
        priority: formatter.getPriority()
      });
    }
    
    if (this.genericFormatter) {
      formatters.push({
        hostname: 'generic',
        name: this.genericFormatter.getName(),
        priority: this.genericFormatter.getPriority()
      });
    }
    
    return formatters.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * 清除所有注册的格式化器
   * 主要用于测试
   */
  clearFormatters() {
    this.formatters.clear();
    this.genericFormatter = null;
    console.debug('[HtmlFormatterManager] All formatters cleared');
  }
}

// 导出类
export { HtmlFormatterManager };