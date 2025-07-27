import { HtmlFormatter } from './HtmlFormatter.js';
import { StructureConverter } from '../StructureConverter.js';

/**
 * 通用HTML格式化器
 * 作为默认的降级方案，提供基本的文本提取和格式化功能
 * 当特定网站的格式化器失败时，使用此格式化器确保基本功能正常工作
 */
class GenericHtmlFormatter extends HtmlFormatter {
  constructor() {
    super();
    this.structureConverter = new StructureConverter();
  }
  
  /**
   * 格式化DOM元素为标准HTML
   * 实现基本的文本提取和段落格式化
   * @param {HTMLElement} element - 要格式化的DOM元素
   * @returns {Promise<string>} 格式化后的HTML字符串
   */
  async format(element) {
    console.debug('[GenericHtmlFormatter] Starting generic formatting');
    
    try {
      // 克隆元素避免修改原DOM
      const cloned = element.cloneNode(true);
      
      // 基本清理
      this.basicCleanup(cloned);
      
      // 提取和格式化文本内容
      const formattedHtml = this.extractAndFormat(cloned);
      
      console.debug('[GenericHtmlFormatter] Generic formatting completed');
      return formattedHtml;
      
    } catch (error) {
      console.error('[GenericHtmlFormatter] Formatting failed:', error);
      // 最基本的降级处理
      return this.fallbackTextExtraction(element);
    }
  }
  
  /**
   * 基本清理DOM元素
   * 移除不需要的元素和属性
   * @param {HTMLElement} element - 要清理的DOM元素
   */
  basicCleanup(element) {
    // 移除脚本和样式标签
    const scriptsAndStyles = element.querySelectorAll('script, style, noscript');
    scriptsAndStyles.forEach(el => el.remove());
    
    // 移除按钮元素
    const buttons = element.querySelectorAll('button, [role="button"], .btn, .button');
    buttons.forEach(btn => {
      const text = btn.textContent?.trim();
      // 移除常见的操作按钮
      if (text && /^(复制|重试|分享|编辑|搜索|点赞|踩|收藏|Copy|Retry|Share|Edit)$/i.test(text)) {
        btn.remove();
      }
    });
    
    // 移除隐藏元素
    const hiddenElements = element.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"], .hidden');
    hiddenElements.forEach(el => el.remove());
    
    // 清理内联样式和不必要的属性
    const allElements = element.querySelectorAll('*');
    allElements.forEach(el => {
      // 保留重要的语义属性，移除样式相关属性
      const attributesToRemove = ['style', 'class', 'id', 'data-v-', 'data-testid'];
      attributesToRemove.forEach(attr => {
        if (attr.endsWith('-')) {
          // 移除以特定前缀开头的属性
          Array.from(el.attributes).forEach(attribute => {
            if (attribute.name.startsWith(attr)) {
              el.removeAttribute(attribute.name);
            }
          });
        } else {
          el.removeAttribute(attr);
        }
      });
    });
  }
  
  /**
   * 提取和格式化文本内容
   * 将DOM结构转换为格式化的HTML
   * @param {HTMLElement} element - 已清理的DOM元素
   * @returns {string} 格式化后的HTML
   */
  extractAndFormat(element) {
    let html = '<div>';
    
    // 收集所有文本内容，按段落分组
    const textBlocks = this.extractTextBlocks(element);
    
    // 处理每个文本块
    const context = {
      inList: false,
      listItems: [],
      previousWasHeading: false
    };
    
    textBlocks.forEach(block => {
      const processedHtml = this.processTextBlock(block, context);
      if (processedHtml) {
        html += processedHtml;
      }
    });
    
    // 处理未完成的列表
    if (context.inList && context.listItems.length > 0) {
      html += this.structureConverter.generateListHtml(context.listItems);
    }
    
    html += '</div>';
    
    return this.cleanupGeneratedHtml(html);
  }
  
  /**
   * 提取文本块
   * 将DOM元素分解为逻辑文本块
   * @param {HTMLElement} element - DOM元素
   * @returns {Array} 文本块数组
   */
  extractTextBlocks(element) {
    const blocks = [];
    
    // 使用TreeWalker遍历所有文本节点
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // 过滤掉空白文本节点
          const text = node.textContent?.trim();
          return text && text.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      },
      false
    );
    
    let node;
    let currentBlock = '';
    let lastParent = null;
    
    while (node = walker.nextNode()) {
      const text = node.textContent?.trim();
      if (!text) continue;
      
      const parent = node.parentElement;
      
      // 如果父元素改变，开始新的文本块
      if (parent !== lastParent && currentBlock) {
        blocks.push(currentBlock.trim());
        currentBlock = '';
      }
      
      // 添加文本到当前块
      if (currentBlock) {
        currentBlock += ' ' + text;
      } else {
        currentBlock = text;
      }
      
      lastParent = parent;
      
      // 如果遇到块级元素的结束，结束当前块
      if (parent && this.isBlockElement(parent)) {
        blocks.push(currentBlock.trim());
        currentBlock = '';
        lastParent = null;
      }
    }
    
    // 添加最后一个块
    if (currentBlock.trim()) {
      blocks.push(currentBlock.trim());
    }
    
    // 过滤掉空块和过短的块
    return blocks.filter(block => block && block.length > 2);
  }
  
  /**
   * 判断是否是块级元素
   * @param {HTMLElement} element - DOM元素
   * @returns {boolean} 是否是块级元素
   */
  isBlockElement(element) {
    const blockTags = ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'PRE', 'HR'];
    return blockTags.includes(element.tagName);
  }
  
  /**
   * 处理单个文本块
   * 根据内容特征决定如何格式化
   * @param {string} block - 文本块
   * @param {Object} context - 处理上下文
   * @returns {string} 格式化后的HTML
   */
  processTextBlock(block, context) {
    if (!block || typeof block !== 'string') {
      return '';
    }
    
    const trimmedBlock = block.trim();
    if (!trimmedBlock) {
      return '';
    }
    
    // 检查是否是列表项
    if (this.structureConverter.isListItemStart(trimmedBlock)) {
      if (!context.inList) {
        context.inList = true;
        context.listItems = [];
      }
      context.listItems.push(trimmedBlock);
      context.previousWasHeading = false;
      return '';
    }
    
    // 如果之前在列表中，但当前不是列表项，结束列表
    if (context.inList) {
      const listHtml = this.structureConverter.generateListHtml(context.listItems);
      context.inList = false;
      context.listItems = [];
      
      // 继续处理当前块
      const currentHtml = this.formatSingleBlock(trimmedBlock, context);
      return listHtml + currentHtml;
    }
    
    return this.formatSingleBlock(trimmedBlock, context);
  }
  
  /**
   * 格式化单个文本块
   * @param {string} block - 文本块
   * @param {Object} context - 处理上下文
   * @returns {string} 格式化后的HTML
   */
  formatSingleBlock(block, context) {
    // 检查是否是标题
    if (this.structureConverter.isHeading(block)) {
      context.previousWasHeading = true;
      return this.structureConverter.generateHeadingHtml(block);
    }
    
    // 检查是否是引用块
    if (this.structureConverter.isBlockQuote(block)) {
      context.previousWasHeading = false;
      return this.structureConverter.generateBlockQuoteHtml(block);
    }
    
    // 检查是否是代码块（简单识别）
    if (this.isCodeBlock(block)) {
      context.previousWasHeading = false;
      return this.formatCodeBlock(block);
    }
    
    // 普通段落
    context.previousWasHeading = false;
    return this.structureConverter.generateParagraphHtml(block);
  }
  
  /**
   * 简单识别代码块
   * @param {string} text - 文本内容
   * @returns {boolean} 是否是代码块
   */
  isCodeBlock(text) {
    // 简单的代码块识别规则
    const codePatterns = [
      /^[\s]*```/,  // Markdown代码块
      /^[\s]*`[^`]+`[\s]*$/,  // 内联代码
      /^[\s]*function\s+\w+/,  // JavaScript函数
      /^[\s]*class\s+\w+/,  // 类定义
      /^[\s]*import\s+/,  // 导入语句
      /^[\s]*export\s+/,  // 导出语句
      /^[\s]*const\s+\w+\s*=/,  // 常量定义
      /^[\s]*let\s+\w+\s*=/,  // 变量定义
      /^[\s]*var\s+\w+\s*=/,  // 变量定义
      /^[\s]*if\s*\(/,  // 条件语句
      /^[\s]*for\s*\(/,  // 循环语句
      /^[\s]*while\s*\(/,  // 循环语句
      /^[\s]*\w+\s*\([^)]*\)\s*{/,  // 函数调用
      /^[\s]*<[^>]+>/,  // HTML标签
      /^[\s]*\{[\s\S]*\}[\s]*$/,  // JSON对象
      /^[\s]*\[[\s\S]*\][\s]*$/,  // 数组
    ];
    
    return codePatterns.some(pattern => pattern.test(text));
  }
  
  /**
   * 格式化代码块
   * @param {string} text - 代码文本
   * @returns {string} 格式化后的HTML
   */
  formatCodeBlock(text) {
    const cleanText = this.structureConverter.escapeHtml(text.trim());
    
    // 如果是单行代码，使用内联代码格式
    if (!text.includes('\n') && text.length < 100) {
      return `<p><code>${cleanText}</code></p>`;
    }
    
    // 多行代码使用预格式化块
    return `<pre><code>${cleanText}</code></pre>`;
  }
  
  /**
   * 清理生成的HTML
   * 移除多余的空白和空元素
   * @param {string} html - 生成的HTML
   * @returns {string} 清理后的HTML
   */
  cleanupGeneratedHtml(html) {
    return html
      // 移除空段落
      .replace(/<p[^>]*>\s*<\/p>/g, '')
      // 移除空列表项
      .replace(/<li[^>]*>\s*<\/li>/g, '')
      // 移除空列表
      .replace(/<[ou]l[^>]*>\s*<\/[ou]l>/g, '')
      // 移除空标题
      .replace(/<h[1-6][^>]*>\s*<\/h[1-6]>/g, '')
      // 移除空引用块
      .replace(/<blockquote[^>]*>\s*<\/blockquote>/g, '')
      // 清理多余的空白
      .replace(/\s+/g, ' ')
      // 清理标签间的空白
      .replace(/>\s+</g, '><')
      .trim();
  }
  
  /**
   * 最基本的降级文本提取
   * 当所有格式化都失败时的最后手段
   * @param {HTMLElement} element - DOM元素
   * @returns {string} 基本HTML格式
   */
  fallbackTextExtraction(element) {
    console.warn('[GenericHtmlFormatter] Using fallback text extraction');
    
    try {
      // 获取纯文本内容
      const text = element.innerText || element.textContent || '';
      
      if (!text.trim()) {
        return '<div><p>无内容</p></div>';
      }
      
      // 按行分割并过滤空行
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      // 将每行转换为段落
      let html = '<div>';
      lines.forEach(line => {
        const escapedLine = this.structureConverter.escapeHtml(line);
        html += `<p>${escapedLine}</p>`;
      });
      html += '</div>';
      
      return html;
      
    } catch (error) {
      console.error('[GenericHtmlFormatter] Fallback extraction failed:', error);
      return '<div><p>内容提取失败</p></div>';
    }
  }
  
  /**
   * 检查是否支持当前DOM结构
   * 通用格式化器支持所有结构（作为降级方案）
   * @param {HTMLElement} element - DOM元素
   * @returns {boolean} 始终返回true
   */
  canHandle(element) {
    // 通用格式化器作为降级方案，支持所有DOM结构
    return true;
  }
  
  /**
   * 获取格式化器的优先级
   * 通用格式化器优先级最低，作为降级方案
   * @returns {number} 优先级（最低）
   */
  getPriority() {
    return -1; // 最低优先级，确保只在其他格式化器都失败时使用
  }
  
  /**
   * 获取格式化器名称
   * @returns {string} 格式化器名称
   */
  getName() {
    return 'GenericHtmlFormatter';
  }
  
  /**
   * 获取支持的功能列表
   * @returns {Object} 功能列表
   */
  getSupportedFeatures() {
    return {
      basicTextExtraction: true,
      paragraphFormatting: true,
      simpleListRecognition: true,
      basicHeadingRecognition: true,
      blockQuoteRecognition: true,
      codeBlockRecognition: true,
      fallbackSupport: true,
      universalCompatibility: true
    };
  }
  
  /**
   * 获取格式化器统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      name: this.getName(),
      priority: this.getPriority(),
      features: this.getSupportedFeatures(),
      structureConverter: this.structureConverter.getPatternStats()
    };
  }
}

// 导出类
export { GenericHtmlFormatter };