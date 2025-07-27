import { HtmlFormatter } from './HtmlFormatter.js';
import { StructureConverter } from '../StructureConverter.js';

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
      console.log('[KimiHtmlFormatter] ========== 开始Kimi格式化 ==========');
      console.log('[KimiHtmlFormatter] 输入元素:', element?.tagName || 'Unknown', element?.className || '');
      console.log('[KimiHtmlFormatter] 元素内容预览:', (element?.textContent || '').substring(0, 100) + '...');
      
      let html = '<div>';
      let nodeCount = 0;
      let textNodeCount = 0;
      let elementNodeCount = 0;
      
      // 使用TreeWalker遍历DOM节点，实现Kimi特殊DOM结构的遍历和解析逻辑
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      const context = {
        inList: false,
        listItems: [],
        currentLevel: 0,
        textBuffer: ''
      };
      
      console.log('[KimiHtmlFormatter] TreeWalker创建完成，开始遍历节点...');
      
      let node;
      while (node = walker.nextNode()) {
        nodeCount++;
        console.log(`[KimiHtmlFormatter] 处理节点 #${nodeCount}:`, {
          nodeType: node.nodeType,
          tagName: node.tagName,
          textContent: node.textContent?.substring(0, 50) + '...'
        });
        
        if (node.nodeType === Node.TEXT_NODE) {
          textNodeCount++;
          const text = node.textContent?.trim();
          if (text) {
            console.log(`[KimiHtmlFormatter] 文本节点 #${textNodeCount}:`, text);
            const processedHtml = this.processTextNode(text, context);
            html += processedHtml;
            console.log(`[KimiHtmlFormatter] 文本节点处理结果:`, processedHtml || '(空)');
          } else {
            console.log(`[KimiHtmlFormatter] 跳过空文本节点`);
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          elementNodeCount++;
          console.log(`[KimiHtmlFormatter] 元素节点 #${elementNodeCount}:`, node.tagName, node.className);
          const processedHtml = this.processElementNode(node, context);
          html += processedHtml;
          console.log(`[KimiHtmlFormatter] 元素节点处理结果:`, processedHtml || '(空)');
        }
        
        // 输出当前上下文状态
        console.log(`[KimiHtmlFormatter] 当前上下文:`, {
          inList: context.inList,
          listItemsCount: context.listItems.length,
          listItems: context.listItems.map(item => item.substring(0, 30) + '...')
        });
      }
      
      console.log(`[KimiHtmlFormatter] 节点遍历完成。统计: 总节点=${nodeCount}, 文本节点=${textNodeCount}, 元素节点=${elementNodeCount}`);
      
      // 处理未完成的列表
      if (context.inList && context.listItems.length > 0) {
        console.log('[KimiHtmlFormatter] 处理未完成的列表，项目数:', context.listItems.length);
        const listHtml = this.structureConverter.generateListHtml(context.listItems);
        html += listHtml;
        console.log('[KimiHtmlFormatter] 最终列表HTML:', listHtml);
      } else {
        console.log('[KimiHtmlFormatter] 没有未完成的列表需要处理');
      }
      
      html += '</div>';
      
      console.log('[KimiHtmlFormatter] ========== 格式化完成 ==========');
      console.log('[KimiHtmlFormatter] 最终HTML长度:', html.length);
      console.log('[KimiHtmlFormatter] 最终HTML预览:', html.substring(0, 200) + '...');
      
      return html;
      
    } catch (error) {
      console.error('[KimiHtmlFormatter] 格式化失败:', error);
      console.error('[KimiHtmlFormatter] 错误堆栈:', error.stack);
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
      console.debug('[KimiHtmlFormatter] Using fallback formatting');
      
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
      
      console.debug('[KimiHtmlFormatter] Fallback formatting completed');
      return html;
      
    } catch (error) {
      console.error('[KimiHtmlFormatter] Fallback formatting failed:', error);
      return '<div><p>格式化失败</p></div>';
    }
  }
  
  /**
   * 处理文本节点 - 实现文本节点的分别处理逻辑
   * @param {string} text - 文本内容
   * @param {Object} context - 处理上下文
   * @returns {string} 处理后的HTML
   */
  processTextNode(text, context) {
    console.log('[KimiHtmlFormatter] ---------- 处理文本节点 ----------');
    console.log('[KimiHtmlFormatter] 输入文本:', `"${text}"`);
    console.log('[KimiHtmlFormatter] 文本长度:', text.length);
    
    // 检查是否是Kimi特殊的列表项开始（如"合约价值:"格式）
    const isListItem = this.structureConverter.isListItemStart(text);
    console.log('[KimiHtmlFormatter] 是否为列表项:', isListItem);
    
    if (isListItem) {
      console.log('[KimiHtmlFormatter] 检测到列表项开始');
      if (!context.inList) {
        console.log('[KimiHtmlFormatter] 开始新列表');
        context.inList = true;
        context.listItems = [];
      } else {
        console.log('[KimiHtmlFormatter] 继续现有列表');
      }
      context.listItems.push(text);
      console.log('[KimiHtmlFormatter] 添加列表项:', text);
      console.log('[KimiHtmlFormatter] 当前列表项总数:', context.listItems.length);
      return '';
    }
    
    // 如果在列表中，继续添加到当前列表项
    if (context.inList && text.length > 0) {
      console.log('[KimiHtmlFormatter] 在列表中，追加文本到最后一个列表项');
      if (context.listItems.length > 0) {
        const oldItem = context.listItems[context.listItems.length - 1];
        context.listItems[context.listItems.length - 1] += ' ' + text;
        const newItem = context.listItems[context.listItems.length - 1];
        console.log('[KimiHtmlFormatter] 列表项更新:');
        console.log('[KimiHtmlFormatter]   原内容:', oldItem);
        console.log('[KimiHtmlFormatter]   新内容:', newItem);
      } else {
        console.log('[KimiHtmlFormatter] 警告: 在列表中但没有列表项');
      }
      return '';
    }
    
    // 不在列表中的普通文本处理
    if (context.inList) {
      console.log('[KimiHtmlFormatter] 结束列表，处理普通文本');
      console.log('[KimiHtmlFormatter] 生成列表HTML，项目数:', context.listItems.length);
      const listHtml = this.structureConverter.generateListHtml(context.listItems);
      console.log('[KimiHtmlFormatter] 生成的列表HTML:', listHtml);
      context.inList = false;
      context.listItems = [];
      console.log('[KimiHtmlFormatter] 列表状态已重置');
      const textHtml = this.formatTextContent(text);
      console.log('[KimiHtmlFormatter] 文本内容HTML:', textHtml);
      return listHtml + textHtml;
    }
    
    console.log('[KimiHtmlFormatter] 处理普通文本内容');
    const result = this.formatTextContent(text);
    console.log('[KimiHtmlFormatter] 普通文本处理结果:', result);
    return result;
  }
  
  /**
   * 处理元素节点 - 实现元素节点的分别处理逻辑
   * @param {HTMLElement} element - DOM元素
   * @param {Object} context - 处理上下文
   * @returns {string} 处理后的HTML
   */
  processElementNode(element, context) {
    console.log('[KimiHtmlFormatter] ---------- 处理元素节点 ----------');
    console.log('[KimiHtmlFormatter] 元素标签:', element.tagName);
    console.log('[KimiHtmlFormatter] 元素类名:', element.className || '(无)');
    console.log('[KimiHtmlFormatter] 元素ID:', element.id || '(无)');
    console.log('[KimiHtmlFormatter] 元素文本内容:', (element.textContent || '').substring(0, 50) + '...');
    
    // 处理列表元素
    if (element.tagName === 'OL' || element.tagName === 'UL') {
      console.log('[KimiHtmlFormatter] 处理列表元素:', element.tagName);
      return this.processListElement(element, context);
    }
    
    // 处理列表项元素
    if (element.tagName === 'LI') {
      console.log('[KimiHtmlFormatter] 处理列表项元素');
      return this.processListItemElement(element, context);
    }
    
    // 处理段落容器
    if (element.classList.contains('paragraph')) {
      console.log('[KimiHtmlFormatter] 处理段落容器');
      return this.processParagraphContainer(element, context);
    }
    
    // 处理水平分割线
    if (element.tagName === 'HR') {
      console.log('[KimiHtmlFormatter] 处理HR元素');
      return '<hr>';
    }
    
    // 处理强调元素
    if (element.tagName === 'STRONG' || element.tagName === 'B') {
      console.log('[KimiHtmlFormatter] 处理强调元素:', element.tagName);
      const text = element.textContent?.trim();
      if (text) {
        console.log('[KimiHtmlFormatter] 强调元素文本:', text);
        const result = `<strong>${this.escapeHtml(text)}</strong>`;
        console.log('[KimiHtmlFormatter] 强调元素结果:', result);
        return result;
      } else {
        console.log('[KimiHtmlFormatter] 强调元素无文本内容');
      }
    }
    
    // 处理斜体元素
    if (element.tagName === 'EM' || element.tagName === 'I') {
      console.log('[KimiHtmlFormatter] 处理斜体元素:', element.tagName);
      const text = element.textContent?.trim();
      if (text) {
        console.log('[KimiHtmlFormatter] 斜体元素文本:', text);
        const result = `<em>${this.escapeHtml(text)}</em>`;
        console.log('[KimiHtmlFormatter] 斜体元素结果:', result);
        return result;
      } else {
        console.log('[KimiHtmlFormatter] 斜体元素无文本内容');
      }
    }
    
    // 处理代码元素
    if (element.tagName === 'CODE') {
      console.log('[KimiHtmlFormatter] 处理代码元素');
      const text = element.textContent?.trim();
      if (text) {
        console.log('[KimiHtmlFormatter] 代码元素文本:', text);
        const result = `<code>${this.escapeHtml(text)}</code>`;
        console.log('[KimiHtmlFormatter] 代码元素结果:', result);
        return result;
      } else {
        console.log('[KimiHtmlFormatter] 代码元素无文本内容');
      }
    }
    
    // 处理预格式化文本
    if (element.tagName === 'PRE') {
      console.log('[KimiHtmlFormatter] 处理预格式化文本元素');
      const text = element.textContent?.trim();
      if (text) {
        console.log('[KimiHtmlFormatter] 预格式化文本:', text.substring(0, 100) + '...');
        const result = `<pre>${this.escapeHtml(text)}</pre>`;
        console.log('[KimiHtmlFormatter] 预格式化文本结果长度:', result.length);
        return result;
      } else {
        console.log('[KimiHtmlFormatter] 预格式化文本元素无内容');
      }
    }
    
    // 处理链接元素
    if (element.tagName === 'A') {
      console.log('[KimiHtmlFormatter] 处理链接元素');
      const text = element.textContent?.trim();
      const href = element.getAttribute('href');
      console.log('[KimiHtmlFormatter] 链接文本:', text);
      console.log('[KimiHtmlFormatter] 链接地址:', href);
      if (text) {
        if (href) {
          const result = `<a href="${this.escapeHtml(href)}">${this.escapeHtml(text)}</a>`;
          console.log('[KimiHtmlFormatter] 链接元素结果:', result);
          return result;
        } else {
          console.log('[KimiHtmlFormatter] 链接无href，返回纯文本');
          return this.escapeHtml(text);
        }
      } else {
        console.log('[KimiHtmlFormatter] 链接元素无文本内容');
      }
    }
    
    // 处理Kimi特有的段落容器
    if (element.classList.contains('segment-content') || 
        element.classList.contains('markdown-container')) {
      console.log('[KimiHtmlFormatter] 检测到Kimi特有容器，让TreeWalker继续遍历子节点');
      // 这些容器通常包含文本内容，让TreeWalker继续遍历其子节点
      return '';
    }
    
    // 忽略按钮和其他界面元素
    if (element.tagName === 'BUTTON' || 
        element.classList.contains('puretext-copy-btn') ||
        element.classList.contains('puretext-button-container')) {
      console.log('[KimiHtmlFormatter] 忽略按钮或界面元素');
      return '';
    }
    
    console.log('[KimiHtmlFormatter] 未处理的元素类型，返回空字符串');
    return '';
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
    
    // 检查是否包含Kimi特有的DOM结构
    const kimiIndicators = [
      '.markdown',
      '.segment-content-box',
      '.markdown-container',
      '.segment-content',
      '[data-v-3a4aba44]'  // Kimi的Vue组件标识
    ];
    
    return kimiIndicators.some(selector => {
      try {
        return element.querySelector(selector) !== null;
      } catch (error) {
        return false;
      }
    });
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
  
  /**
   * 处理列表元素
   * @param {HTMLElement} element - 列表元素
   * @param {Object} context - 上下文对象
   * @returns {string} 处理后的HTML
   */
  processListElement(element, context) {
    const listType = element.tagName.toLowerCase();
    const startAttr = element.getAttribute('start');
    const startValue = startAttr ? ` start="${startAttr}"` : '';
    
    console.log(`[KimiHtmlFormatter] 处理${listType}列表，start="${startAttr || '1'}"`);
    
    let html = `<${listType}${startValue}>`;
    
    // 遍历子元素
    for (const child of element.children) {
      if (child.tagName === 'LI') {
        html += this.processListItemElement(child, context);
      }
    }
    
    html += `</${listType}>`;
    console.log(`[KimiHtmlFormatter] ${listType}列表处理完成，长度:`, html.length);
    return html;
  }
  
  /**
   * 处理列表项元素
   * @param {HTMLElement} element - 列表项元素
   * @param {Object} context - 上下文对象
   * @returns {string} 处理后的HTML
   */
  processListItemElement(element, context) {
    console.log('[KimiHtmlFormatter] 处理列表项元素');
    
    let html = '<li>';
    
    // 处理列表项内容
    for (const child of element.children) {
      if (child.classList.contains('paragraph')) {
        // 直接提取段落内容，不包装在额外的标签中
        const content = this.processParagraphContainer(child, context);
        html += content;
      } else if (child.tagName === 'OL' || child.tagName === 'UL') {
        html += this.processListElement(child, context);
      } else {
        html += this.processElementNode(child, context);
      }
    }
    
    html += '</li>';
    console.log('[KimiHtmlFormatter] 列表项处理完成');
    return html;
  }
  
  /**
   * 处理段落容器
   * @param {HTMLElement} element - 段落容器元素
   * @param {Object} context - 上下文对象
   * @returns {string} 处理后的HTML
   */
  processParagraphContainer(element, context) {
    console.log('[KimiHtmlFormatter] 处理段落容器');
    
    let html = '';
    
    // 处理段落内的内容
    for (const child of element.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim();
        if (text) {
          html += this.escapeHtml(text);
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        html += this.processElementNode(child, context);
      }
    }
    
    console.log('[KimiHtmlFormatter] 段落容器处理完成');
    return html;
  }
}

// 导出类
export { KimiHtmlFormatter };