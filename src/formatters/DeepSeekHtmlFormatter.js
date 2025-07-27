import { HtmlFormatter } from './HtmlFormatter.js';
import { StructureConverter } from '../StructureConverter.js';

/**
 * DeepSeek网站专用HTML格式化器
 * 处理DeepSeek网站的标准HTML结构，主要做优化和清理
 * DeepSeek已经使用良好的HTML结构，重点是样式清理和格式优化
 */
class DeepSeekHtmlFormatter extends HtmlFormatter {
  constructor() {
    super();
    this.name = 'DeepSeekHtmlFormatter';
    this.structureConverter = new StructureConverter();
  }
  
  /**
   * 格式化DeepSeek的DOM元素为标准HTML
   * @param {HTMLElement} element - 要格式化的DOM元素
   * @returns {Promise<string>} 格式化后的HTML字符串
   */
  async format(element) {
    try {
      console.log('[DeepSeekHtmlFormatter] ========== 开始DeepSeek格式化 ==========');
      console.log('[DeepSeekHtmlFormatter] 输入元素:', element?.tagName || 'Unknown', element?.className || '');
      console.log('[DeepSeekHtmlFormatter] 元素内容预览:', (element?.textContent || '').substring(0, 100) + '...');
      
      // DeepSeek已经使用标准HTML结构，主要做清理和优化
      const optimizedHtml = this.optimizeStandardHtml(element);
      
      console.log('[DeepSeekHtmlFormatter] ========== 格式化完成 ==========');
      console.log('[DeepSeekHtmlFormatter] 最终HTML长度:', optimizedHtml.length);
      console.log('[DeepSeekHtmlFormatter] 最终HTML预览:', optimizedHtml.substring(0, 200) + '...');
      
      return optimizedHtml;
      
    } catch (error) {
      console.error('[DeepSeekHtmlFormatter] 格式化失败:', error);
      console.error('[DeepSeekHtmlFormatter] 错误堆栈:', error.stack);
      // 降级到基本处理
      return this.fallbackFormat(element);
    }
  }
  
  /**
   * 优化标准HTML结构 - 实现标准HTML的优化和清理逻辑
   * @param {HTMLElement} element - DOM元素
   * @returns {string} 优化后的HTML
   */
  optimizeStandardHtml(element) {
    console.log('[DeepSeekHtmlFormatter] ---------- 优化标准HTML结构 ----------');
    
    let html = '<div>';
    
    // 遍历子元素，保持原有结构
    const children = Array.from(element.children);
    console.log('[DeepSeekHtmlFormatter] 子元素数量:', children.length);
    
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      console.log(`[DeepSeekHtmlFormatter] 处理子元素 ${i + 1}/${children.length}:`, child.tagName, child.className);
      
      if (this.shouldIncludeElement(child)) {
        const processedHtml = this.processStandardElement(child);
        html += processedHtml;
        console.log(`[DeepSeekHtmlFormatter] 子元素处理结果长度:`, processedHtml.length);
      } else {
        console.log(`[DeepSeekHtmlFormatter] 跳过子元素:`, child.tagName, child.className);
      }
    }
    
    html += '</div>';
    
    console.log('[DeepSeekHtmlFormatter] 标准HTML优化完成，总长度:', html.length);
    return html;
  }
  
  /**
   * 判断是否应该包含该元素
   * @param {HTMLElement} element - DOM元素
   * @returns {boolean} 是否包含
   */
  shouldIncludeElement(element) {
    // 排除按钮和其他界面元素
    if (element.tagName === 'BUTTON' || 
        element.classList.contains('puretext-copy-btn') ||
        element.classList.contains('puretext-button-container')) {
      console.log('[DeepSeekHtmlFormatter] 排除按钮元素:', element.tagName, element.className);
      return false;
    }
    
    // 排除工具栏和操作元素
    if (element.classList.contains('toolbar') ||
        element.classList.contains('action') ||
        element.classList.contains('controls')) {
      console.log('[DeepSeekHtmlFormatter] 排除工具栏元素:', element.className);
      return false;
    }
    
    // 排除空元素
    const text = element.textContent?.trim();
    if (!text || text.length === 0) {
      console.log('[DeepSeekHtmlFormatter] 排除空元素:', element.tagName);
      return false;
    }
    
    return true;
  }
  
  /**
   * 处理标准HTML元素 - 保持DeepSeek原有的良好HTML结构，主要做样式清理
   * @param {HTMLElement} element - DOM元素
   * @returns {string} 处理后的HTML
   */
  processStandardElement(element) {
    console.log('[DeepSeekHtmlFormatter] ---------- 处理标准元素 ----------');
    console.log('[DeepSeekHtmlFormatter] 元素类型:', element.tagName);
    console.log('[DeepSeekHtmlFormatter] 元素类名:', element.className || '(无)');
    
    // 克隆元素以避免修改原DOM
    const cloned = element.cloneNode(true);
    
    // 实现内联样式移除功能，保持结构化格式
    this.removeInlineStyles(cloned);
    
    // 清理DeepSeek特有的属性
    this.cleanDeepSeekAttributes(cloned);
    
    // 优化特定HTML标签
    this.optimizeHtmlTags(cloned);
    
    const result = cloned.outerHTML || cloned.innerHTML || '';
    console.log('[DeepSeekHtmlFormatter] 标准元素处理完成，结果长度:', result.length);
    
    return result;
  }
  
  /**
   * 移除内联样式 - 实现内联样式移除功能，保持结构化格式
   * @param {HTMLElement} element - DOM元素
   */
  removeInlineStyles(element) {
    console.log('[DeepSeekHtmlFormatter] 移除内联样式...');
    
    // 移除当前元素的style属性，但保持class
    if (element.hasAttribute('style')) {
      console.log('[DeepSeekHtmlFormatter] 移除style属性:', element.getAttribute('style'));
      element.removeAttribute('style');
    }
    
    // 移除其他不需要的属性
    const attributesToRemove = ['data-v-', 'data-testid', 'data-role'];
    attributesToRemove.forEach(attrPrefix => {
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith(attrPrefix)) {
          console.log('[DeepSeekHtmlFormatter] 移除属性:', attr.name);
          element.removeAttribute(attr.name);
        }
      });
    });
    
    // 递归处理子元素
    const children = Array.from(element.children);
    children.forEach(child => this.removeInlineStyles(child));
    
    console.log('[DeepSeekHtmlFormatter] 内联样式移除完成');
  }
  
  /**
   * 清理DeepSeek特有的属性
   * @param {HTMLElement} element - DOM元素
   */
  cleanDeepSeekAttributes(element) {
    console.log('[DeepSeekHtmlFormatter] 清理DeepSeek特有属性...');
    
    // 移除DeepSeek特有的data属性
    const deepseekAttributes = ['data-ds-', 'data-deepseek-'];
    deepseekAttributes.forEach(attrPrefix => {
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith(attrPrefix)) {
          console.log('[DeepSeekHtmlFormatter] 移除DeepSeek属性:', attr.name);
          element.removeAttribute(attr.name);
        }
      });
    });
    
    // 递归处理子元素
    const children = Array.from(element.children);
    children.forEach(child => this.cleanDeepSeekAttributes(child));
    
    console.log('[DeepSeekHtmlFormatter] DeepSeek属性清理完成');
  }
  
  /**
   * 优化HTML标签
   * @param {HTMLElement} element - DOM元素
   */
  optimizeHtmlTags(element) {
    console.log('[DeepSeekHtmlFormatter] 优化HTML标签...');
    
    // 处理代码块
    if (element.tagName === 'PRE' || element.classList.contains('code-block')) {
      console.log('[DeepSeekHtmlFormatter] 优化代码块');
      // 确保代码块有正确的结构
      if (!element.querySelector('code')) {
        const codeElement = document.createElement('code');
        codeElement.textContent = element.textContent;
        element.innerHTML = '';
        element.appendChild(codeElement);
      }
    }
    
    // 处理表格
    if (element.tagName === 'TABLE') {
      console.log('[DeepSeekHtmlFormatter] 优化表格');
      // 确保表格有正确的边框样式（通过class而不是内联样式）
      element.classList.add('formatted-table');
    }
    
    // 处理列表
    if (element.tagName === 'UL' || element.tagName === 'OL') {
      console.log('[DeepSeekHtmlFormatter] 优化列表');
      element.classList.add('formatted-list');
    }
    
    // 处理标题
    if (/^H[1-6]$/.test(element.tagName)) {
      console.log('[DeepSeekHtmlFormatter] 优化标题:', element.tagName);
      element.classList.add('formatted-heading');
    }
    
    // 递归处理子元素
    const children = Array.from(element.children);
    children.forEach(child => this.optimizeHtmlTags(child));
    
    console.log('[DeepSeekHtmlFormatter] HTML标签优化完成');
  }
  
  /**
   * 降级格式化处理
   * @param {HTMLElement} element - DOM元素
   * @returns {string} 基本HTML格式
   */
  fallbackFormat(element) {
    try {
      console.debug('[DeepSeekHtmlFormatter] Using fallback formatting');
      
      // 直接使用元素的HTML，但清理样式
      let html = element.innerHTML || '';
      
      if (!html.trim()) {
        const text = element.innerText || element.textContent || '';
        if (text.trim()) {
          return `<div><p>${this.structureConverter.escapeHtml(text)}</p></div>`;
        }
        return '<div><p>无内容</p></div>';
      }
      
      // 清理内联样式和属性
      html = this.structureConverter.cleanInlineStyles(html);
      
      // 优化HTML结构
      html = this.structureConverter.optimizeHtmlStructure(html);
      
      console.debug('[DeepSeekHtmlFormatter] Fallback formatting completed');
      return `<div>${html}</div>`;
      
    } catch (error) {
      console.error('[DeepSeekHtmlFormatter] Fallback formatting failed:', error);
      return '<div><p>格式化失败</p></div>';
    }
  }
  
  /**
   * 检查是否支持当前DOM结构
   * @param {HTMLElement} element - DOM元素
   * @returns {boolean} 是否支持
   */
  canHandle(element) {
    if (!element) {
      return false;
    }
    
    // 检查是否包含DeepSeek特有的类名
    const deepseekIndicators = [
      '.ds-markdown',
      '.ds-markdown--block',
      '.ds-markdown-paragraph',
      '[class*="ds-"]'
    ];
    
    return deepseekIndicators.some(selector => {
      try {
        if (selector.includes('[class*=')) {
          // 检查是否有以ds-开头的类名
          return element.querySelector('[class*="ds-"]') !== null ||
                 element.classList.toString().includes('ds-');
        }
        return element.querySelector(selector) !== null ||
               element.classList.contains(selector.replace('.', ''));
      } catch (error) {
        return false;
      }
    });
  }
  
  /**
   * 获取格式化器的优先级
   * DeepSeek格式化器有中等优先级
   * @returns {number} 优先级
   */
  getPriority() {
    return 8;
  }
  
  /**
   * 获取格式化器名称
   * @returns {string} 格式化器名称
   */
  getName() {
    return this.name;
  }
}

// 导出类
export { DeepSeekHtmlFormatter };