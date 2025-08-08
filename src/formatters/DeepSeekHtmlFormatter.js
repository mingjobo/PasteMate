import { HtmlFormatter } from './HtmlFormatter.js';
import { StructureConverter } from '../StructureConverter.js';

/**
 * DeepSeek网站专用HTML格式化器
 * 递归结构化遍历，输出标准HTML，保证Word/WPS格式和Kimi一致
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
      console.log('[DeepSeekHtmlFormatter] format: 入口', element.tagName, element.className);
      let html = '<div>';
      html += this.processNode(element, 0);
      html += '</div>';
      console.log('[DeepSeekHtmlFormatter] format: 最终HTML长度', html.length, '片段：', html.substring(0, 200));
      return html;
    } catch (error) {
      console.error('[DeepSeekHtmlFormatter] format: 异常', error);
      return this.fallbackFormat(element);
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
      console.log(`${indent}[DeepSeekHtmlFormatter] TEXT: "${text.slice(0, 40)}"`);
      // 返回转义后的文本，保留空格
      return this.escapeHtml(text);
    }
    
    // 元素节点
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName;
      const className = node.className || '';
      console.log(`${indent}[DeepSeekHtmlFormatter] ELEMENT: <${tag}> class="${className}"`);
      
      // 处理特殊元素
      // 跳过代码块的按钮区域
      if (className.includes('md-code-block-banner') || 
          className.includes('ds-button') ||
          className.includes('code-info-button')) {
        return '';
      }
      
      // 处理数学公式
      if (className.includes('katex')) {
        return this.processMathFormula(node, depth);
      }
      
      // 处理特殊HTML标记
      if (className.includes('ds-markdown-html')) {
        return this.processHtmlSpan(node, depth);
      }
      
      // 处理表格容器
      if (className.includes('markdown-table-wrapper')) {
        return this.processTableWrapper(node, depth);
      }
      
      // 处理代码块容器
      if (className.includes('md-code-block')) {
        return this.processCodeBlock(node, depth);
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
          return this.processParagraph(node, depth);
        
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
        
        case 'DIV':
          // 普通div，递归处理子节点
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
    const level = parseInt(tag[1]);
    const content = this.processChildren(node, depth);
    return `<${tag}>${content}</${tag}>`;
  }

  // 处理段落
  processParagraph(node, depth) {
    // DeepSeek的段落可能包含各种内联元素
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
    
    // DeepSeek的li内部可能包含p.ds-markdown-paragraph
    // 需要特殊处理，避免生成<li><p>内容</p></li>这种结构
    let hasP = false;
    for (const child of node.children) {
      if (child.tagName === 'P' && child.classList.contains('ds-markdown-paragraph')) {
        hasP = true;
        // 直接提取p内的内容，不包含p标签本身
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

  // 处理代码块容器
  processCodeBlock(node, depth) {
    // 查找内部的pre元素
    const pre = node.querySelector('pre');
    if (pre) {
      return this.processPre(pre, depth);
    }
    return '';
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
      if (node.classList.contains('katex-display')) {
        return `<p>[数学公式: ${this.escapeHtml(latex)}]</p>`;
      } else {
        return `[${this.escapeHtml(latex)}]`;
      }
    }
    // 如果没有找到LaTeX，返回纯文本
    const text = node.textContent || '';
    return this.escapeHtml(text);
  }

  // 处理特殊HTML标记
  processHtmlSpan(node, depth) {
    // ds-markdown-html包含的是需要特殊处理的HTML片段
    // 提取其文本内容
    const text = node.textContent || '';
    // 检查是否包含特殊标签
    if (text.includes('<u>') || text.includes('</u>')) {
      // 下划线文本
      return '<u>下划线文本</u>';
    } else if (text.includes('<ins>') || text.includes('</ins>')) {
      // 插入文本
      return '<ins>新增内容</ins>';
    } else if (text.includes('<center>') || text.includes('</center>')) {
      // 居中文本
      return text.replace(/<\/?center>/g, '');
    } else if (text.includes('align=')) {
      // 对齐文本
      return text.replace(/<p[^>]*>|<\/p>/g, '');
    }
    // 默认返回转义后的文本
    return this.escapeHtml(text);
  }

  escapeHtml(text) {
    if (!text || typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  fallbackFormat(element) {
    try {
      let html = element.innerText || element.textContent || '';
      if (!html.trim()) return '<div><p>无内容</p></div>';
      html = this.structureConverter.escapeHtml(html);
      return `<div><p>${html}</p></div>`;
    } catch (error) {
      return '<div><p>格式化失败</p></div>';
    }
  }

  getPriority() {
    return 8;
  }
  getName() {
    return this.name;
  }

  canHandle(element) {
    const result = element?.classList?.contains('ds-markdown');
    console.log('[DeepSeekHtmlFormatter] canHandle: classList=', element?.className, ', 结果=', result);
    return result;
  }
}

export { DeepSeekHtmlFormatter };