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
   * 检查文本是否是列表项的开始
   * @param {string} text - 文本内容
   * @returns {boolean} 是否是列表项
   */
  isListItemStart(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }
    
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
   * 生成列表HTML
   * @param {string[]} items - 列表项数组
   * @returns {string} 列表HTML
   */
  generateListHtml(items) {
    if (!items || items.length === 0) {
      return '';
    }
    
    console.debug('[StructureConverter] Generating list HTML for', items.length, 'items');
    
    // 分析列表类型
    const listType = this.analyzeListType(items);
    const listTag = listType === 'ordered' ? 'ol' : 'ul';
    
    let html = `<${listTag}>`;
    
    items.forEach((item, index) => {
      const cleanItem = this.cleanListItem(item);
      if (cleanItem) {
        html += `<li>${cleanItem}</li>`;
        console.debug(`[StructureConverter] List item ${index + 1}:`, cleanItem.substring(0, 50) + '...');
      }
    });
    
    html += `</${listTag}>`;
    
    console.debug('[StructureConverter] Generated list HTML:', html.substring(0, 200) + '...');
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
    
    console.debug('[StructureConverter] Generated heading HTML:', html);
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
    
    console.debug('[StructureConverter] Generated blockquote HTML:', html);
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
   * 转换Kimi特殊结构为标准HTML
   * 专门处理Kimi网站的DOM结构
   * @param {HTMLElement} element - Kimi的DOM元素
   * @returns {string} 标准HTML
   */
  convertKimiStructure(element) {
    console.debug('[StructureConverter] Converting Kimi structure');
    
    let html = '<div>';
    
    // 使用TreeWalker遍历DOM节点
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
    
    let node;
    while (node = walker.nextNode()) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          html += this.processKimiTextNode(text, context);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        html += this.processKimiElementNode(node, context);
      }
    }
    
    // 处理未完成的列表
    if (context.inList && context.listItems.length > 0) {
      html += this.generateListHtml(context.listItems);
    }
    
    html += '</div>';
    
    console.debug('[StructureConverter] Kimi structure conversion completed');
    return html;
  }
  
  /**
   * 处理Kimi的文本节点
   * @param {string} text - 文本内容
   * @param {Object} context - 处理上下文
   * @returns {string} 处理后的HTML
   */
  processKimiTextNode(text, context) {
    // 检查是否是列表项开始
    if (this.isListItemStart(text)) {
      if (!context.inList) {
        context.inList = true;
        context.listItems = [];
      }
      context.listItems.push(text);
      return '';
    }
    
    // 如果在列表中，继续添加到当前列表项
    if (context.inList && text.length > 0) {
      if (context.listItems.length > 0) {
        context.listItems[context.listItems.length - 1] += ' ' + text;
      }
      return '';
    }
    
    // 不在列表中的普通文本
    if (context.inList) {
      // 结束列表，输出列表HTML
      const listHtml = this.generateListHtml(context.listItems);
      context.inList = false;
      context.listItems = [];
      return listHtml + this.formatKimiTextContent(text);
    }
    
    return this.formatKimiTextContent(text);
  }
  
  /**
   * 格式化Kimi的文本内容
   * @param {string} text - 文本内容
   * @returns {string} 格式化后的HTML
   */
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
  
  /**
   * 处理Kimi的元素节点
   * @param {HTMLElement} element - DOM元素
   * @param {Object} context - 处理上下文
   * @returns {string} 处理后的HTML
   */
  processKimiElementNode(element, context) {
    // 处理特殊元素类型
    if (element.tagName === 'HR') {
      return '<hr>';
    }
    
    // 处理强调元素
    if (element.tagName === 'STRONG' || element.tagName === 'B') {
      const text = element.textContent?.trim();
      if (text) {
        return `<strong>${this.escapeHtml(text)}</strong>`;
      }
    }
    
    // 处理斜体元素
    if (element.tagName === 'EM' || element.tagName === 'I') {
      const text = element.textContent?.trim();
      if (text) {
        return `<em>${this.escapeHtml(text)}</em>`;
      }
    }
    
    return '';
  }
  
  /**
   * 转换DeepSeek结构（已经是标准HTML）
   * @param {HTMLElement} element - DeepSeek的DOM元素
   * @returns {string} 优化后的HTML
   */
  convertDeepSeekStructure(element) {
    console.debug('[StructureConverter] Converting DeepSeek structure');
    
    // DeepSeek已经使用标准HTML结构，主要做清理和优化
    let html = element.innerHTML;
    
    // 清理内联样式
    html = this.cleanInlineStyles(html);
    
    // 优化HTML结构
    html = this.optimizeHtmlStructure(html);
    
    console.debug('[StructureConverter] DeepSeek structure conversion completed');
    return `<div>${html}</div>`;
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
      console.debug('[StructureConverter] Added custom list pattern:', pattern);
    }
  }
  
  /**
   * 添加自定义标题模式
   * @param {RegExp} pattern - 标题识别模式
   */
  addHeadingPattern(pattern) {
    if (pattern instanceof RegExp) {
      this.headingPatterns.push(pattern);
      console.debug('[StructureConverter] Added custom heading pattern:', pattern);
    }
  }
  
  /**
   * 添加自定义引用块模式
   * @param {RegExp} pattern - 引用块识别模式
   */
  addBlockQuotePattern(pattern) {
    if (pattern instanceof RegExp) {
      this.blockQuotePatterns.push(pattern);
      console.debug('[StructureConverter] Added custom blockquote pattern:', pattern);
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