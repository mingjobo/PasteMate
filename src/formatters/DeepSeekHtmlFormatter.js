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
      const context = {
        inList: false,
        listItems: [],
        currentLevel: 0,
        textBuffer: ''
      };
      html += this.processNode(element, context, 0);
      if (context.inList && context.listItems.length > 0) {
        console.log('[DeepSeekHtmlFormatter] format: 结尾输出剩余 listItems', context.listItems);
        html += this.structureConverter.generateListHtml(context.listItems);
      }
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
  processNode(node, context, depth = 0) {
    const indent = '  '.repeat(depth);
    if (!node) return '';
    // 文本节点
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (!text) return '';
      console.log(`${indent}[DeepSeekHtmlFormatter] processNode TEXT_NODE: "${text.slice(0, 40)}" inList=${context.inList} listItems=${JSON.stringify(context.listItems)}`);
      // 列表项
      if (this.structureConverter.isListItemStart(text)) {
        if (!context.inList) {
          context.inList = true;
          context.listItems = [];
          console.log(`${indent}[DeepSeekHtmlFormatter] processNode TEXT_NODE: 开始新列表`);
        }
        context.listItems.push(text);
        console.log(`${indent}[DeepSeekHtmlFormatter] processNode TEXT_NODE: 新增列表项，当前listItems=`, context.listItems);
        return '';
      }
      // 列表内追加
      if (context.inList && text.length > 0) {
        if (context.listItems.length > 0) {
          context.listItems[context.listItems.length - 1] += ' ' + text;
          console.log(`${indent}[DeepSeekHtmlFormatter] processNode TEXT_NODE: 列表内追加，当前listItems=`, context.listItems);
        }
        return '';
      }
      // 非列表文本，先输出当前列表
      let html = '';
      if (context.inList) {
        console.log(`${indent}[DeepSeekHtmlFormatter] processNode TEXT_NODE: 非列表文本，先输出当前列表`, context.listItems);
        html += this.structureConverter.generateListHtml(context.listItems);
        context.inList = false;
        context.listItems = [];
      }
      const formatted = this.formatTextContent(text);
      console.log(`${indent}[DeepSeekHtmlFormatter] processNode TEXT_NODE: 输出段落/标题/引用 html=`, formatted.slice(0, 80));
      html += formatted;
      return html;
    }
    // 元素节点
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName;
      console.log(`${indent}[DeepSeekHtmlFormatter] processNode ELEMENT_NODE: <${tag}> class=${node.className}`);
      // 块级结构：每遇到都要先输出当前列表
      if ([
        'P','UL','OL','LI','H1','H2','H3','H4','H5','H6','BLOCKQUOTE','PRE','CODE'
      ].includes(tag)) {
        let html = '';
        if (context.inList) {
          console.log(`${indent}[DeepSeekHtmlFormatter] processNode ELEMENT_NODE: 块级前输出当前列表`, context.listItems);
          html += this.structureConverter.generateListHtml(context.listItems);
          context.inList = false;
          context.listItems = [];
        }
        // 分别处理不同块级结构
        if (tag === 'UL' || tag === 'OL') {
          html += this.processListElement(node, context, depth+1);
        } else if (tag === 'LI') {
          html += this.processListItemElement(node, context, depth+1);
        } else if (tag === 'P' || node.classList.contains('ds-markdown-paragraph')) {
          html += this.processParagraphContainer(node, context, depth+1);
        } else if (/^H[1-6]$/.test(tag)) {
          html += this.processHeading(node, context, depth+1);
        } else if (tag === 'BLOCKQUOTE') {
          html += this.processBlockquote(node, context, depth+1);
        } else if (tag === 'PRE') {
          html += this.processPre(node, context, depth+1);
        } else if (tag === 'CODE') {
          html += this.processCode(node, context, depth+1);
        }
        console.log(`${indent}[DeepSeekHtmlFormatter] processNode ELEMENT_NODE: <${tag}> 输出 html=`, html.slice(0, 80));
        return html;
      }
      // 其他内联/容器结构，递归处理子节点
      let html = '';
      for (const child of node.childNodes) {
        html += this.processNode(child, context, depth+1);
      }
      return html;
    }
    return '';
  }

  processListElement(element, context, depth) {
    const listType = element.tagName.toLowerCase();
    const startAttr = element.getAttribute('start');
    const startValue = startAttr ? ` start="${startAttr}"` : '';
    let html = `<${listType}${startValue}>`;
    for (const child of element.children) {
      if (child.tagName === 'LI') {
        html += this.processListItemElement(child, context, depth+1);
      }
    }
    html += `</${listType}>`;
    console.log(`${'  '.repeat(depth)}[DeepSeekHtmlFormatter] processListElement <${listType}> 输出 html=`, html.slice(0, 80));
    return html;
  }

  processListItemElement(element, context, depth) {
    let html = '<li>';
    for (const child of element.childNodes) {
      html += this.processNode(child, context, depth+1);
    }
    html += '</li>';
    console.log(`${'  '.repeat(depth)}[DeepSeekHtmlFormatter] processListItemElement <li> 输出 html=`, html.slice(0, 80));
    return html;
  }

  processParagraphContainer(element, context, depth) {
    let html = '';
    for (const child of element.childNodes) {
      html += this.processNode(child, context, depth+1);
    }
    html = `<p>${html}</p>`;
    console.log(`${'  '.repeat(depth)}[DeepSeekHtmlFormatter] processParagraphContainer <p> 输出 html=`, html.slice(0, 80));
    return html;
  }

  processHeading(element, context, depth) {
    const level = Number(element.tagName[1]) || 3;
    const text = element.textContent?.trim() || '';
    const html = this.structureConverter.generateHeadingHtml(text, level);
    console.log(`${'  '.repeat(depth)}[DeepSeekHtmlFormatter] processHeading <h${level}> 输出 html=`, html.slice(0, 80));
    return html;
  }

  processBlockquote(element, context, depth) {
    let html = '';
    for (const child of element.childNodes) {
      html += this.processNode(child, context, depth+1);
    }
    html = `<blockquote><p>${html}</p></blockquote>`;
    console.log(`${'  '.repeat(depth)}[DeepSeekHtmlFormatter] processBlockquote <blockquote> 输出 html=`, html.slice(0, 80));
    return html;
  }

  processPre(element, context, depth) {
    const text = element.textContent?.trim() || '';
    const html = `<pre>${this.escapeHtml(text)}</pre>`;
    console.log(`${'  '.repeat(depth)}[DeepSeekHtmlFormatter] processPre <pre> 输出 html=`, html.slice(0, 80));
    return html;
  }

  processCode(element, context, depth) {
    const text = element.textContent?.trim() || '';
    const html = `<code>${this.escapeHtml(text)}</code>`;
    console.log(`${'  '.repeat(depth)}[DeepSeekHtmlFormatter] processCode <code> 输出 html=`, html.slice(0, 80));
    return html;
  }

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