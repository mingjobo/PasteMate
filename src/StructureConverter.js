import logger from './Logger.js';

/**
 * 结构转换器
 * 负责识别和转换DOM结构，将各种格式转换为标准HTML
 */
class StructureConverter {
  constructor() {
    // 列表项识别模式
    this.listPatterns = this.initializeListPatterns();
    
    // 标题识别模式
    this.headingPatterns = this.initializeHeadingPatterns();
    
    // 引用块识别模式
    this.blockQuotePatterns = this.initializeBlockQuotePatterns();
  }
  
  /**
   * 初始化列表项识别模式
   * @returns {Array} 列表项模式数组
   */
  initializeListPatterns() {
    return [
      // 标准项目符号
      /^[\s]*[•·▪▫◦‣⁃]\s+/,
      
      // 数字列表
      /^[\s]*\d+[\.\)]\s+/,
      
      // 字母列表
      /^[\s]*[a-zA-Z][\.\)]\s+/,
      
      // 中文数字列表
      /^[\s]*[一二三四五六七八九十]+[\.\)、]\s+/,
      
      // 罗马数字列表
      /^[\s]*[ivxlcdm]+[\.\)]\s+/i,
      
      // Kimi特有的描述性列表项（冒号结尾）
      /^[\s]*(合约价值|保证金比例|你账户里总共|期货公司会|平仓后|不会倒扣|只是亏的|剩余的钱|简介|名句|代表作|影响|贡献)[:：]/,
      
      // 通用的描述性列表项
      /^[\s]*[^：:]{1,20}[:：]\s*[^：:]/,
      
      // 破折号列表
      /^[\s]*[-—–]\s+/,
      
      // 星号列表
      /^[\s]*\*\s+/,
      
      // Kimi特有的列表结构检测
      /^[\s]*<li[^>]*>/i,
      /^[\s]*<ol[^>]*>/i,
      /^[\s]*<ul[^>]*>/i,
      
      // Kimi特有的段落容器检测
      /^[\s]*<div[^>]*class="paragraph"[^>]*>/i
    ];
  }
  
  /**
   * 初始化标题识别模式
   * @returns {Array} 标题模式数组
   */
  initializeHeadingPatterns() {
    return [
      // 带表情符号的标题
      /^[\s]*[✅❌🔧📝💡⚠️🎯🔍]\s+/,
      
      // 数字标题（如 "1. 张继（唐代）"）
      /^[\s]*\d+\.\s*[^。]{5,50}[（(][^）)]+[）)]/,
      
      // 简单数字标题
      /^[\s]*\d+\.\s*[^。]{5,30}[:：]?$/,
      
      // 常见标题开头
      /^[\s]*(举个例子|总结一句话|强平后会发生什么|不是"钱全没了"|其他关联诗人)/,
      
      // Markdown风格标题
      /^[\s]*#{1,6}\s+/,
      
      // 短句标题（以冒号结尾，长度适中）
      /^[\s]*[^。！？]{5,30}[:：]$/,
      
      // 问题式标题
      /^[\s]*[^。！]{10,40}[？?]$/
    ];
  }
  
  /**
   * 初始化引用块识别模式
   * @returns {Array} 引用块模式数组
   */
  initializeBlockQuotePatterns() {
    return [
      // 数学计算
      /^[\s]*\d+\s*[-+*/=]\s*\d+/,
      
      // 特定的计算示例
      /^[\s]*5000\s*-\s*2000\s*=/,
      
      // 引用标记
      /^[\s]*[>》]\s+/,
      
      // 强调性总结
      /^[\s]*强平只是强制/,
      
      // 重要说明
      /^[\s]*注意[:：]/,
      /^[\s]*重要[:：]/,
      /^[\s]*提示[:：]/
    ];
  }
  
  /**
   * 检查文本是否是列表项的开始（增强：支持Symbol字体的“”等伪符号）
   * @param {string} text - 文本内容
   * @returns {boolean} 是否是列表项
   */
  isListItemStart(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }
    // 增强：支持常见Symbol字体符号
    const symbolBullet = /^[\s]*[•·▪▫◦‣⁃\-\*\uF0B7\u25CF\u2022\u2219\u25CB\u25A0\u25AA\u25AB\u25B2\u25B6\u25C6\u25C7\u25CF\u25E6\u2023\u2043\u25D8\u25D9\u25D0\u25D1\u25D2\u25D3\u25D4\u25D5\u25D6\u25D7\u25D8\u25D9\u25DA\u25DB\u25DC\u25DD\u25DE\u25DF\u25E0\u25E1\u25E2\u25E3\u25E4\u25E5\u25E6\u25E7\u25E8\u25E9\u25EA\u25EB\u25EC\u25ED\u25EE\u25EF\uF0A7\uF0B7\uF0D8\uF0D9\uF0DA\uF0DB\uF0DC\uF0DD\uF0DE\uF0DF\uF0E0\uF0E1\uF0E2\uF0E3\uF0E4\uF0E5\uF0E6\uF0E7\uF0E8\uF0E9\uF0EA\uF0EB\uF0EC\uF0ED\uF0EE\uF0EF\uF0F0\uF0F1\uF0F2\uF0F3\uF0F4\uF0F5\uF0F6\uF0F7\uF0F8\uF0F9\uF0FA\uF0FB\uF0FC\uF0FD\uF0FE\uF0FF\u25CF\u25A0\u25B2\u25BC\u25C6\u25C7\u25CB\u25D8\u25D9\u25E6\u2023\u2043\u25D8\u25D9\u25DA\u25DB\u25DC\u25DD\u25DE\u25DF\u25E0\u25E1\u25E2\u25E3\u25E4\u25E5\u25E6\u25E7\u25E8\u25E9\u25EA\u25EB\u25EC\u25ED\u25EE\u25EF\uF0A7\uF0B7\uF0D8\uF0D9\uF0DA\uF0DB\uF0DC\uF0DD\uF0DE\uF0DF\uF0E0\uF0E1\uF0E2\uF0E3\uF0E4\uF0E5\uF0E6\uF0E7\uF0E8\uF0E9\uF0EA\uF0EB\uF0EC\uF0ED\uF0EE\uF0EF\uF0F0\uF0F1\uF0F2\uF0F3\uF0F4\uF0F5\uF0F6\uF0F7\uF0F8\uF0F9\uF0FA\uF0FB\uF0FC\uF0FD\uF0FE\uF0FF\u25CF\u25A0\u25B2\u25BC\u25C6\u25C7\u25CB\u25D8\u25D9\u25E6\u2023\u2043\u25D8\u25D9\u25DA\u25DB\u25DC\u25DD\u25DE\u25DF\u25E0\u25E1\u25E2\u25E3\u25E4\u25E5\u25E6\u25E7\u25E8\u25E9\u25EA\u25EB\u25EC\u25ED\u25EE\u25EF\uF0A7\uF0B7\uF0D8\uF0D9\uF0DA\uF0DB\uF0DC\uF0DD\uF0DE\uF0DF\uF0E0\uF0E1\uF0E2\uF0E3\uF0E4\uF0E5\uF0E6\uF0E7\uF0E8\uF0E9\uF0EA\uF0EB\uF0EC\uF0ED\uF0EE\uF0EF\uF0F0\uF0F1\uF0F2\uF0F3\uF0F4\uF0F5\uF0F6\uF0F7\uF0F8\uF0F9\uF0FA\uF0FB\uF0FC\uF0FD\uF0FE\uF0FF][\s\u00A0]*$/;
    if (symbolBullet.test(text)) return true;
    // 其余原有模式
    return this.listPatterns.some(pattern => pattern.test(text));
  }
  
  /**
   * 检查文本是否是标题
   * @param {string} text - 文本内容
   * @returns {boolean} 是否是标题
   */
  isHeading(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }
    
    // 过长的文本通常不是标题
    if (text.length > 100) {
      return false;
    }
    
    return this.headingPatterns.some(pattern => pattern.test(text));
  }
  
  /**
   * 检查文本是否是引用块
   * @param {string} text - 文本内容
   * @returns {boolean} 是否是引用块
   */
  isBlockQuote(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }
    
    return this.blockQuotePatterns.some(pattern => pattern.test(text));
  }
  
  /**
   * 生成列表HTML（增强：支持多级嵌套，自动识别有序/无序）
   * @param {string[]} items - 列表项数组
   * @returns {string} 列表HTML
   */
  generateListHtml(items) {
    if (!items || items.length === 0) {
      return '';
    }
    
    logger.debug('[StructureConverter] Generating list HTML for', items.length, 'items');
    
    // 分析列表类型
    const listType = this.analyzeListType(items);
    const listTag = listType === 'ordered' ? 'ol' : 'ul';
    
    let html = `<${listTag}>`;
    
    items.forEach((item, index) => {
      const cleanItem = this.cleanListItem(item);
      if (cleanItem) {
        html += `<li>${cleanItem}</li>`;
        logger.debug(`[StructureConverter] List item ${index + 1}:`, cleanItem.substring(0, 50) + '...');
      }
    });
    
    html += `</${listTag}>`;
    
    logger.debug('[StructureConverter] Generated list HTML:', html.substring(0, 200) + '...');
    return html;
  }
  
  /**
   * 分析列表类型
   * @param {string[]} items - 列表项数组
   * @returns {string} 列表类型 ('ordered' 或 'unordered')
   */
  analyzeListType(items) {
    let orderedCount = 0;
    let unorderedCount = 0;
    
    items.forEach(item => {
      if (/^\s*\d+[\.\)]/.test(item)) {
        orderedCount++;
      } else if (/^\s*[a-zA-Z][\.\)]/.test(item)) {
        orderedCount++;
      } else if (/^\s*[一二三四五六七八九十]+[\.\)、]/.test(item)) {
        orderedCount++;
      } else if (/^\s*[ivxlcdm]+[\.\)]/i.test(item)) {
        orderedCount++;
      } else {
        unorderedCount++;
      }
    });
    
    // 如果有序项目占多数，则使用有序列表
    return orderedCount > unorderedCount ? 'ordered' : 'unordered';
  }
  
  /**
   * 清理列表项内容
   * @param {string} item - 列表项文本
   * @returns {string} 清理后的文本
   */
  cleanListItem(item) {
    if (!item || typeof item !== 'string') {
      return '';
    }
    
    let cleaned = item;
    
    // 移除各种列表前缀
    this.listPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    // 清理多余的空白
    cleaned = cleaned.trim();
    
    // 转义HTML特殊字符
    cleaned = this.escapeHtml(cleaned);
    
    return cleaned;
  }
  
  /**
   * 生成标题HTML
   * @param {string} text - 标题文本
   * @param {number} level - 标题级别 (1-6)
   * @returns {string} 标题HTML
   */
  generateHeadingHtml(text, level = 3) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    // 确保级别在有效范围内
    level = Math.max(1, Math.min(6, level));
    
    // 清理标题文本
    let cleanText = text.trim();
    
    // 移除标题前缀
    this.headingPatterns.forEach(pattern => {
      cleanText = cleanText.replace(pattern, '');
    });
    
    cleanText = cleanText.trim();
    
    // 转义HTML特殊字符
    cleanText = this.escapeHtml(cleanText);
    
    // 为标题添加强调
    const html = `<h${level}><strong>${cleanText}</strong></h${level}>`;
    
    logger.debug('[StructureConverter] Generated heading HTML:', html);
    return html;
  }
  
  /**
   * 生成引用块HTML
   * @param {string} text - 引用文本
   * @returns {string} 引用块HTML
   */
  generateBlockQuoteHtml(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    // 清理引用文本
    let cleanText = text.trim();
    
    // 移除引用前缀
    this.blockQuotePatterns.forEach(pattern => {
      cleanText = cleanText.replace(pattern, '');
    });
    
    cleanText = cleanText.trim();
    
    // 转义HTML特殊字符
    cleanText = this.escapeHtml(cleanText);
    
    const html = `<blockquote><p>${cleanText}</p></blockquote>`;
    
    logger.debug('[StructureConverter] Generated blockquote HTML:', html);
    return html;
  }
  
  /**
   * 生成段落HTML
   * @param {string} text - 段落文本
   * @returns {string} 段落HTML
   */
  generateParagraphHtml(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    const cleanText = this.escapeHtml(text.trim());
    
    if (!cleanText) {
      return '';
    }
    
    return `<p>${cleanText}</p>`;
  }
  
  /**
   * 通用结构转换，支持Kimi和DeepSeek
   * @param {HTMLElement} element - 根DOM元素
   * @param {'kimi'|'deepseek'} siteType - 站点类型
   * @returns {string} 标准HTML
   */
  convertGenericStructure(element, siteType = 'kimi') {
    const context = {
      inList: false,
      listItems: [],
      currentLevel: 0,
      textBuffer: ''
    };
    let html = '<div>';
    html += this.processGenericNode(element, context, 0, siteType);
    if (context.inList && context.listItems.length > 0) {
      html += this.generateListHtml(context.listItems);
    }
    html += '</div>';
    return html;
  }

  /**
   * 递归处理节点，兼容Kimi/DeepSeek，增强：连续伪列表项自动分组为<ul>/<ol>
   */
  processGenericNode(node, context, depth = 0, siteType = 'kimi') {
    if (!node) return '';
    // 只在元素节点递归时做分组
    if (node.nodeType === Node.ELEMENT_NODE) {
      let html = '';
      let listBuffer = [];
      const children = Array.from(node.childNodes);
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        // 只处理文本节点和块级容器
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent?.trim();
          if (this.isListItemStart(text)) {
            listBuffer.push(text);
            continue;
          } else {
            if (listBuffer.length > 0) {
              html += this.generateListHtml(listBuffer);
              listBuffer = [];
            }
            if (text && text.length > 0) {
              html += this.formatKimiTextContent(text);
            }
            continue;
          }
        }
        // 元素节点递归
        if (child.nodeType === Node.ELEMENT_NODE) {
          // 检查伪列表容器（如DeepSeek的<p>、div.ds-markdown-paragraph等）
          let isFakeList = false;
          if (siteType === 'deepseek' && child.classList && child.classList.contains('ds-markdown-paragraph')) {
            // 检查其唯一文本子节点是否为列表符号
            const onlyText = child.textContent?.trim();
            if (this.isListItemStart(onlyText)) {
              listBuffer.push(onlyText);
              continue;
            }
          }
          // 递归处理
          if (listBuffer.length > 0) {
            html += this.generateListHtml(listBuffer);
            listBuffer = [];
          }
          html += this.processGenericNode(child, context, depth+1, siteType);
        }
      }
      if (listBuffer.length > 0) {
        html += this.generateListHtml(listBuffer);
      }
      return html;
    }
    // 文本节点（直接处理，兼容递归）
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (!text) return '';
      if (this.isListItemStart(text)) {
        // 由父级分组处理
        return '';
      }
      return this.formatKimiTextContent(text);
    }
    return '';
  }

  // 复用Kimi的文本格式化
  formatKimiTextContent(text) {
    if (this.isHeading(text)) {
      return this.generateHeadingHtml(text);
    } else if (this.isBlockQuote(text)) {
      return this.generateBlockQuoteHtml(text);
    } else if (text.length > 0) {
      return this.generateParagraphHtml(text);
    }
    return '';
  }

  // 复用Kimi的列表处理，增加siteType参数以便后续扩展
  processListElement(element, context, depth, siteType) {
    const listType = element.tagName.toLowerCase();
    const startAttr = element.getAttribute('start');
    const startValue = startAttr ? ` start="${startAttr}"` : '';
    let html = `<${listType}${startValue}>`;
    for (const child of element.children) {
      if (child.tagName === 'LI') {
        html += this.processListItemElement(child, context, depth+1, siteType);
      }
    }
    html += `</${listType}>`;
    return html;
  }

  processListItemElement(element, context, depth, siteType) {
    let html = '<li>';
    for (const child of element.childNodes) {
      html += this.processGenericNode(child, context, depth+1, siteType);
    }
    html += '</li>';
    return html;
  }

  processParagraphContainer(element, context, depth, siteType) {
    let html = '';
    for (const child of element.childNodes) {
      html += this.processGenericNode(child, context, depth+1, siteType);
    }
    html = `<p>${html}</p>`;
    return html;
  }

  processHeading(element, context, depth, siteType) {
    const level = Number(element.tagName[1]) || 3;
    const text = element.textContent?.trim() || '';
    const html = this.generateHeadingHtml(text, level);
    return html;
  }

  processBlockquote(element, context, depth, siteType) {
    let html = '';
    for (const child of element.childNodes) {
      html += this.processGenericNode(child, context, depth+1, siteType);
    }
    html = `<blockquote><p>${html}</p></blockquote>`;
    return html;
  }

  processPre(element, context, depth, siteType) {
    const text = element.textContent?.trim() || '';
    const html = `<pre>${this.escapeHtml(text)}</pre>`;
    return html;
  }

  processCode(element, context, depth, siteType) {
    const text = element.textContent?.trim() || '';
    const html = `<code>${this.escapeHtml(text)}</code>`;
    return html;
  }

  /**
   * 兼容原有Kimi结构转换API
   */
  convertKimiStructure(element) {
    return this.convertGenericStructure(element, 'kimi');
  }

  /**
   * 兼容原有DeepSeek结构转换API
   */
  convertDeepSeekStructure(element) {
    return this.convertGenericStructure(element, 'deepseek');
  }
  
  /**
   * 清理内联样式
   * @param {string} html - HTML字符串
   * @returns {string} 清理后的HTML
   */
  cleanInlineStyles(html) {
    return html
      // 移除style属性
      .replace(/\s+style="[^"]*"/gi, '')
      // 移除data属性
      .replace(/\s+data-[^=]*="[^"]*"/gi, '')
      // 移除Vue相关属性
      .replace(/\s+data-v-[^=]*="[^"]*"/gi, '')
      // 清理多余的空白
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * 优化HTML结构
   * @param {string} html - HTML字符串
   * @returns {string} 优化后的HTML
   */
  optimizeHtmlStructure(html) {
    return html
      // 确保段落标签闭合
      .replace(/<p([^>]*)>([^<]*?)(?=<[^/]|$)/g, '<p$1>$2</p>')
      // 标准化列表结构
      .replace(/<li([^>]*)>([^<]*?)(?=<li|<\/[ou]l|$)/g, '<li$1>$2</li>')
      // 移除空段落
      .replace(/<p[^>]*>\s*<\/p>/g, '')
      // 移除空列表项
      .replace(/<li[^>]*>\s*<\/li>/g, '');
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
   * 添加自定义列表模式
   * @param {RegExp} pattern - 列表项识别模式
   */
  addListPattern(pattern) {
    if (pattern instanceof RegExp) {
      this.listPatterns.push(pattern);
      logger.debug('[StructureConverter] Added custom list pattern:', pattern);
    }
  }
  
  /**
   * 添加自定义标题模式
   * @param {RegExp} pattern - 标题识别模式
   */
  addHeadingPattern(pattern) {
    if (pattern instanceof RegExp) {
      this.headingPatterns.push(pattern);
      logger.debug('[StructureConverter] Added custom heading pattern:', pattern);
    }
  }
  
  /**
   * 添加自定义引用块模式
   * @param {RegExp} pattern - 引用块识别模式
   */
  addBlockQuotePattern(pattern) {
    if (pattern instanceof RegExp) {
      this.blockQuotePatterns.push(pattern);
      logger.debug('[StructureConverter] Added custom blockquote pattern:', pattern);
    }
  }
  
  /**
   * 获取所有识别模式的统计信息
   * @returns {Object} 模式统计信息
   */
  getPatternStats() {
    return {
      listPatterns: this.listPatterns.length,
      headingPatterns: this.headingPatterns.length,
      blockQuotePatterns: this.blockQuotePatterns.length
    };
  }
}

// 导出类
export { StructureConverter };