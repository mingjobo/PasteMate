import { HtmlFormatter } from './HtmlFormatter.js';
import { StructureConverter } from '../StructureConverter.js';
import logger from '../Logger.js';

/**
 * Kimi网站专用HTML格式化器
 * 处理Kimi网站特殊的DOM结构，转换为Word友好的标准HTML
 */
class KimiHtmlFormatter extends HtmlFormatter {
  constructor() {
    super();
    this.name = 'KimiHtmlFormatter';
    this.structureConverter = new StructureConverter();
  }
  
  /**
   * 格式化Kimi的DOM元素为标准HTML
   * @param {HTMLElement} element - 要格式化的DOM元素
   * @returns {Promise<string>} 格式化后的HTML字符串
   */
  async format(element) {
    try {
      logger.debug('[KimiHtmlFormatter] ========== 开始Kimi格式化 ==========');
      logger.debug('[KimiHtmlFormatter] 输入元素:', element?.tagName || 'Unknown', element?.className || '');
      logger.debug('[KimiHtmlFormatter] 元素内容预览:', (element?.textContent || '').substring(0, 100) + '...');
      
      let html = '<div>';
      html += this.processNode(element, 0);
      html += '</div>';
      
      logger.debug('[KimiHtmlFormatter] ========== 格式化完成 ==========');
      logger.debug('[KimiHtmlFormatter] 最终HTML长度:', html.length);
      logger.debug('[KimiHtmlFormatter] 最终HTML预览:', html.substring(0, 200) + '...');
      
      return html;
      
    } catch (error) {
      logger.error('[KimiHtmlFormatter] 格式化失败:', error);
      logger.error('[KimiHtmlFormatter] 错误堆栈:', error.stack);
      // 降级到基本处理
      return this.fallbackFormat(element);
    }
  }
  
  /**
   * 降级格式化处理
   * @param {HTMLElement} element - DOM元素
   * @returns {string} 基本HTML格式
   */
  fallbackFormat(element) {
    try {
      logger.debug('[KimiHtmlFormatter] Using fallback formatting');
      
      let html = '<div>';
      
      // 提取所有文本内容
      const textContent = element.innerText || element.textContent || '';
      
      if (!textContent.trim()) {
        return '<div><p>无内容</p></div>';
      }
      
      // 按行分割并处理
      const lines = textContent.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      let inList = false;
      let listItems = [];
      
      for (const line of lines) {
        if (this.structureConverter.isListItemStart(line)) {
          if (!inList) {
            inList = true;
            listItems = [];
          }
          listItems.push(line);
        } else {
          if (inList) {
            // 结束列表
            html += this.structureConverter.generateListHtml(listItems);
            inList = false;
            listItems = [];
          }
          
          if (this.structureConverter.isHeading(line)) {
            html += this.structureConverter.generateHeadingHtml(line);
          } else if (this.structureConverter.isBlockQuote(line)) {
            html += this.structureConverter.generateBlockQuoteHtml(line);
          } else {
            html += this.structureConverter.generateParagraphHtml(line);
          }
        }
      }
      
      // 处理未完成的列表
      if (inList && listItems.length > 0) {
        html += this.structureConverter.generateListHtml(listItems);
      }
      
      html += '</div>';
      
      logger.debug('[KimiHtmlFormatter] Fallback formatting completed');
      return html;
      
    } catch (error) {
      logger.error('[KimiHtmlFormatter] Fallback formatting failed:', error);
      return '<div><p>格式化失败</p></div>';
    }
  }
  
  /**
   * 递归分块处理节点，保证所有内容完整输出
   */
  processNode(node, depth = 0) {
    const indent = '  '.repeat(depth);
    if (!node) return '';
    
    // 文本节点
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (!text) return '';
      logger.debug(`${indent}[KimiHtmlFormatter] TEXT: "${text.slice(0, 40)}"`);
      // 返回转义后的文本，保留空格
      return this.escapeHtml(text);
    }
    
    // 元素节点
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName;
      const className = node.className || '';
      logger.debug(`${indent}[KimiHtmlFormatter] ELEMENT: <${tag}> class="${className}"`);
      
      // 跳过按钮和界面元素
      if (className.includes('simple-button') || 
          className.includes('puretext-copy-btn') ||
          className.includes('puretext-button-container') ||
          className.includes('segment-assistant-actions') ||
          tag === 'BUTTON') {
        return '';
      }
      
      // 处理数学公式
      if (className.includes('katex-container')) {
        return this.processMathFormula(node, depth);
      }
      
      // 处理表格容器
      if (className.includes('table') && className.includes('markdown-table')) {
        return this.processTableWrapper(node, depth);
      }
      
      // 处理标准HTML元素
      switch (tag) {
        case 'H1':
        case 'H2':
        case 'H3':
        case 'H4':
        case 'H5':
        case 'H6':
          return this.processHeading(node, depth);
        
        case 'P':
        case 'DIV':
          // 检查是否为段落容器
          if (className.includes('paragraph')) {
            return this.processParagraph(node, depth);
          }
          // 普通div，递归处理子节点
          return this.processChildren(node, depth);
        
        case 'UL':
        case 'OL':
          return this.processList(node, depth);
        
        case 'LI':
          return this.processListItem(node, depth);
        
        case 'TABLE':
          return this.processTable(node, depth);
        
        case 'THEAD':
        case 'TBODY':
        case 'TR':
          return this.processTableSection(node, depth);
        
        case 'TH':
        case 'TD':
          return this.processTableCell(node, depth);
        
        case 'BLOCKQUOTE':
          return this.processBlockquote(node, depth);
        
        case 'PRE':
          return this.processPre(node, depth);
        
        case 'CODE':
          // 行内代码
          if (!node.parentElement || node.parentElement.tagName !== 'PRE') {
            return this.processInlineCode(node, depth);
          }
          // PRE内的代码块，递归处理内容
          return this.processChildren(node, depth);
        
        case 'STRONG':
        case 'B':
          return this.processBold(node, depth);
        
        case 'EM':
        case 'I':
          return this.processItalic(node, depth);
        
        case 'A':
          return this.processLink(node, depth);
        
        case 'BR':
          return '<br>';
        
        case 'HR':
          return '<hr>';
        
        case 'SPAN':
          // 普通span，递归处理子节点
          return this.processChildren(node, depth);
        
        default:
          // 其他元素，递归处理子节点
          return this.processChildren(node, depth);
      }
    }
    
    return '';
  }
  
  processChildren(node, depth) {
    let html = '';
    for (const child of node.childNodes) {
      html += this.processNode(child, depth + 1);
    }
    return html;
  }

  // 处理标题
  processHeading(node, depth) {
    const tag = node.tagName.toLowerCase();
    const content = this.processChildren(node, depth);
    return `<${tag}>${content}</${tag}>`;
  }

  // 处理段落
  processParagraph(node, depth) {
    // Kimi的段落可能包含各种内联元素
    const content = this.processChildren(node, depth);
    if (!content.trim()) return '';
    return `<p>${content}</p>`;
  }

  // 处理列表
  processList(node, depth) {
    const tag = node.tagName.toLowerCase();
    const startAttr = node.getAttribute('start');
    const startValue = startAttr ? ` start="${startAttr}"` : '';
    let html = `<${tag}${startValue}>`;
    
    for (const child of node.children) {
      if (child.tagName === 'LI') {
        html += this.processListItem(child, depth + 1);
      }
    }
    
    html += `</${tag}>`;
    return html;
  }

  // 处理列表项
  processListItem(node, depth) {
    let html = '<li>';
    
    // Kimi的li内部可能包含div.paragraph
    // 需要特殊处理，避免生成<li><p>内容</p></li>这种结构
    let hasP = false;
    for (const child of node.children) {
      if (child.classList && child.classList.contains('paragraph')) {
        hasP = true;
        // 直接提取div内的内容，不包含p标签本身
        html += this.processChildren(child, depth);
      } else if (child.tagName === 'UL' || child.tagName === 'OL') {
        // 嵌套列表
        html += this.processList(child, depth + 1);
      } else {
        html += this.processNode(child, depth + 1);
      }
    }
    
    // 如果没有p标签，处理所有子节点
    if (!hasP) {
      for (const child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE || 
            (child.nodeType === Node.ELEMENT_NODE && 
             child.tagName !== 'UL' && child.tagName !== 'OL')) {
          html += this.processNode(child, depth + 1);
        }
      }
    }
    
    html += '</li>';
    return html;
  }

  // 处理表格容器
  processTableWrapper(node, depth) {
    // 查找内部的table元素
    const table = node.querySelector('table');
    if (table) {
      return this.processTable(table, depth);
    }
    return this.processChildren(node, depth);
  }

  // 处理表格
  processTable(node, depth) {
    let html = '<table>';
    for (const child of node.children) {
      html += this.processTableSection(child, depth + 1);
    }
    html += '</table>';
    return html;
  }

  // 处理表格部分
  processTableSection(node, depth) {
    const tag = node.tagName.toLowerCase();
    let html = `<${tag}>`;
    for (const child of node.children) {
      html += this.processNode(child, depth + 1);
    }
    html += `</${tag}>`;
    return html;
  }

  // 处理表格单元格
  processTableCell(node, depth) {
    const tag = node.tagName.toLowerCase();
    const content = this.processChildren(node, depth);
    return `<${tag}>${content}</${tag}>`;
  }

  // 处理引用块
  processBlockquote(node, depth) {
    const content = this.processChildren(node, depth);
    return `<blockquote>${content}</blockquote>`;
  }

  // 处理预格式化文本
  processPre(node, depth) {
    // 提取代码内容，跳过语法高亮的span等
    const codeElement = node.querySelector('code');
    let text = '';
    if (codeElement) {
      text = codeElement.textContent || '';
    } else {
      text = node.textContent || '';
    }
    return `<pre>${this.escapeHtml(text)}</pre>`;
  }

  // 处理行内代码
  processInlineCode(node, depth) {
    const text = node.textContent || '';
    return `<code>${this.escapeHtml(text)}</code>`;
  }

  // 处理粗体
  processBold(node, depth) {
    const content = this.processChildren(node, depth);
    return `<strong>${content}</strong>`;
  }

  // 处理斜体
  processItalic(node, depth) {
    const content = this.processChildren(node, depth);
    return `<em>${content}</em>`;
  }

  // 处理链接
  processLink(node, depth) {
    const href = node.getAttribute('href') || '#';
    const title = node.getAttribute('title') || '';
    const content = this.processChildren(node, depth);
    const titleAttr = title ? ` title="${this.escapeHtml(title)}"` : '';
    return `<a href="${this.escapeHtml(href)}"${titleAttr}>${content}</a>`;
  }

  // 处理数学公式
  processMathFormula(node, depth) {
    // 提取LaTeX源码
    const annotation = node.querySelector('annotation[encoding="application/x-tex"]');
    if (annotation) {
      const latex = annotation.textContent || '';
      // 判断是否为块级公式
      if (node.classList.contains('math-display') || node.closest('.math-display')) {
        return `<p>[数学公式: ${this.escapeHtml(latex)}]</p>`;
      } else {
        return `[${this.escapeHtml(latex)}]`;
      }
    }
    // 如果没有找到LaTeX，返回纯文本
    const text = node.textContent || '';
    return this.escapeHtml(text);
  }
  
  /**
   * 格式化文本内容
   * @param {string} text - 文本内容
   * @returns {string} 格式化后的HTML
   */
  formatTextContent(text) {
    if (this.structureConverter.isHeading(text)) {
      return this.structureConverter.generateHeadingHtml(text);
    } else if (this.structureConverter.isBlockQuote(text)) {
      return this.structureConverter.generateBlockQuoteHtml(text);
    } else if (text.length > 0) {
      return this.structureConverter.generateParagraphHtml(text);
    }
    return '';
  }
  
  /**
   * 转义HTML特殊字符
   * @param {string} text - 要转义的文本
   * @returns {string} 转义后的文本
   */
  escapeHtml(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    
    // 首先检查是否是DeepSeek的内容，如果是则不处理
    if (element.classList?.contains('ds-markdown') || 
        element.querySelector('.ds-markdown') ||
        element.querySelector('.ds-icon-button')) {
      logger.debug('[KimiHtmlFormatter] canHandle: 检测到DeepSeek内容，拒绝处理');
      return false;
    }
    
    // 检查是否包含Kimi特有的DOM结构
    const kimiIndicators = [
      '.segment-content-box',  // Kimi特有的内容框
      '.markdown-container',   // Kimi的markdown容器
      '.segment-content',      // Kimi的段落内容
      '[data-v-3a4aba44]'     // Kimi的Vue组件标识
    ];
    
    // 必须包含Kimi特有的结构才处理
    const hasKimiStructure = kimiIndicators.some(selector => {
      try {
        return element.querySelector(selector) !== null;
      } catch (error) {
        return false;
      }
    });
    
    logger.debug('[KimiHtmlFormatter] canHandle: hasKimiStructure=', hasKimiStructure, ', element.className=', element.className);
    return hasKimiStructure;
  }
  
  /**
   * 获取格式化器的优先级
   * Kimi格式化器有较高优先级
   * @returns {number} 优先级
   */
  getPriority() {
    return 10;
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
export { KimiHtmlFormatter };