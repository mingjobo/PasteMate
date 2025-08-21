/**
 * 统一的Word处理器类
 * 负责将HTML内容转换为docx格式，供复制和下载功能共同使用
 * 确保两个功能输出完全一致的Word格式
 */
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, LevelFormat, BorderStyle } from 'docx';
import { UserQuestionExtractor } from './UserQuestionExtractor.js';
import { WordOptimizer } from './WordOptimizer.js';

class WordProcessor {
  /**
   * 将HTML内容转换为docx文档对象
   * @param {HTMLElement|string} content - HTML元素或HTML字符串
   * @param {HTMLElement} aiResponseElement - AI回复元素，用于获取用户问题
   * @param {string} source - 内容来源，'kimi' 或 'deepseek' 或 'auto'
   * @returns {Promise<Document>} docx文档对象
   */
  static async htmlToDocument(content, aiResponseElement = null, source = 'auto') {
    let html = '';
    if (typeof content === 'string') {
      html = content;
    } else if (content instanceof HTMLElement) {
      html = content.innerHTML || '';
    } else {
      throw new Error('内容类型不支持');
    }

    // 自动判断来源
    let useKimi = false;
    if (source === 'kimi') {
      useKimi = true;
    } else if (source === 'deepseek') {
      useKimi = false;
    } else {
      // auto: 通过 className 判断
      if (content instanceof HTMLElement && content.closest('.segment-assistant')) {
        useKimi = true;
      }
    }

    // 定义列表样式
    const bulletRef = 'my-bullet';
    const orderedRef = 'my-numbered';
    const numbering = this.createNumberingConfig(bulletRef, orderedRef);

    // 解析 HTML 为带格式的 docx 段落
    const elements = useKimi
      ? this.parseKimiHtmlToDocxParagraphs(html, bulletRef, orderedRef)
      : this.parseDeepSeekHtmlToDocxParagraphs(html, bulletRef, orderedRef);

    // 生成智能文件名（用于文档标题）
    let title = 'PureText导出';
    if (aiResponseElement) {
      try {
        const userQuestion = UserQuestionExtractor.getUserQuestion(aiResponseElement);
        title = UserQuestionExtractor.generateFilename(userQuestion, 'docx').replace('.docx', '');
      } catch (error) {
        console.error('PureText: 生成文件名失败:', error);
      }
    }

    const doc = new Document({
      creator: 'PureText',
      title: title,
      description: '由 PureText 导出',
      numbering,
      sections: [
        {
          children: elements.length > 0 ? elements : [new Paragraph('')],
        },
      ],
    });

    return doc;
  }

  /**
   * 获取统一格式化的HTML（供复制和下载功能共用）
   * @param {HTMLElement|string} content - HTML元素或HTML字符串
   * @param {string} source - 内容来源，'kimi' 或 'deepseek' 或 'auto'
   * @returns {Promise<string>} 格式化后的HTML字符串
   */
  static async getFormattedHtml(content, source = 'auto') {
    let html = '';
    if (typeof content === 'string') {
      html = content;
    } else if (content instanceof HTMLElement) {
      html = content.innerHTML || '';
    }

    // 自动判断来源
    let useKimi = false;
    if (source === 'kimi') {
      useKimi = true;
    } else if (source === 'deepseek') {
      useKimi = false;
    } else {
      // auto: 通过 className 判断
      if (content instanceof HTMLElement && content.closest('.segment-assistant')) {
        useKimi = true;
      }
    }

    console.log('[WordProcessor] getFormattedHtml: useKimi=', useKimi, 'html length=', html.length);

    // 直接转换HTML到标准化格式，而不通过docx对象
    let standardHtml = '';
    if (useKimi) {
      standardHtml = this.convertKimiHtmlToStandard(html);
    } else {
      standardHtml = this.convertDeepSeekHtmlToStandard(html);
    }
    
    console.log('[WordProcessor] Standard HTML length:', standardHtml.length);
    
    // 使用WordOptimizer进行最终优化
    const optimizer = new WordOptimizer();
    const optimizedHtml = await optimizer.optimize(standardHtml);
    
    return optimizedHtml;
  }

  /**
   * 将Kimi的HTML转换为标准HTML格式
   * @param {string} html - Kimi的HTML
   * @returns {string} 标准HTML
   */
  static convertKimiHtmlToStandard(html) {
    const container = document.createElement('div');
    container.innerHTML = html;
    let result = '';

    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }
      
      if (node.nodeType !== Node.ELEMENT_NODE) return '';
      
      const tag = node.tagName.toLowerCase();
      const className = node.className || '';
      
      // 跳过按钮和UI元素
      if (className.includes('simple-button') || 
          className.includes('puretext-') ||
          className.includes('table-actions') ||
          tag === 'button') {
        return '';
      }
      
      let childContent = '';
      for (const child of node.childNodes) {
        childContent += walk(child);
      }
      
      switch (tag) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          return `<${tag}>${childContent}</${tag}>`;
        
        case 'div':
          if (className.includes('paragraph')) {
            return `<p>${childContent}</p>`;
          }
          return childContent;
        
        case 'ul':
        case 'ol':
          // 清理列表内容，移除多余空格
          const cleanedContent = childContent.replace(/\s+/g, ' ').trim();
          return `<${tag}>${cleanedContent}</${tag}>`;
        
        case 'li':
          // 特别处理Kimi的列表项结构
          // 如果包含 div.paragraph，需要提取其内容并去除多余空格
          let itemContent = childContent.trim();
          
          // 检查是否有嵌套的div.paragraph结构
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = node.innerHTML;
          const paragraphDivs = tempDiv.querySelectorAll('div.paragraph');
          
          if (paragraphDivs.length > 0) {
            // 如果有paragraph div，提取它们的文本内容
            itemContent = Array.from(paragraphDivs)
              .map(div => div.textContent.trim())
              .filter(text => text)
              .join(' ');
          }
          
          return `<li>${itemContent}</li>`;
        
        case 'table':
        case 'thead':
        case 'tbody':
        case 'tr':
        case 'th':
        case 'td':
          return `<${tag}>${childContent}</${tag}>`;
        
        case 'strong':
        case 'em':
        case 'code':
          return `<${tag}>${childContent}</${tag}>`;
        
        case 'blockquote':
          return `<blockquote>${childContent}</blockquote>`;
        
        case 'pre':
          return `<pre><code>${childContent}</code></pre>`;
        
        case 'hr':
          return '<hr>';
        
        case 'br':
          return '<br>';
        
        case 'span':
          if (className.includes('katex-container')) {
            // 处理数学公式
            const annotation = node.querySelector('annotation[encoding="application/x-tex"]');
            if (annotation) {
              return `<span class="math">${annotation.textContent}</span>`;
            }
          }
          return childContent;
        
        default:
          return childContent;
      }
    };

    for (const child of container.childNodes) {
      result += walk(child);
    }
    
    return result;
  }

  /**
   * 将DeepSeek的HTML转换为标准HTML格式
   * @param {string} html - DeepSeek的HTML
   * @returns {string} 标准HTML
   */
  static convertDeepSeekHtmlToStandard(html) {
    const container = document.createElement('div');
    container.innerHTML = html;
    let result = '';

    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }
      
      if (node.nodeType !== Node.ELEMENT_NODE) return '';
      
      const tag = node.tagName.toLowerCase();
      const className = node.className || '';
      
      // 跳过特殊元素
      if (className.includes('ds-markdown-html') ||
          className.includes('ds-button') ||
          className.includes('code-info-button') ||
          tag === 'button') {
        return '';
      }
      
      let childContent = '';
      for (const child of node.childNodes) {
        childContent += walk(child);
      }
      
      switch (tag) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          return `<${tag}>${childContent}</${tag}>`;
        
        case 'p':
          if (className.includes('ds-markdown-paragraph')) {
            return `<p>${childContent}</p>`;
          }
          return `<p>${childContent}</p>`;
        
        case 'ul':
        case 'ol':
          return `<${tag}>${childContent}</${tag}>`;
        
        case 'li':
          // DeepSeek的li内部有p.ds-markdown-paragraph，需要特殊处理
          // 提取p标签内的文本，避免嵌套问题
          const tempLi = document.createElement('div');
          tempLi.innerHTML = node.innerHTML;
          const paragraphs = tempLi.querySelectorAll('p.ds-markdown-paragraph');
          
          if (paragraphs.length > 0) {
            // 提取所有p标签的内容，去掉p标签本身
            let liContent = '';
            for (const p of paragraphs) {
              // 递归处理p标签内的内容
              for (const child of p.childNodes) {
                liContent += walk(child);
              }
            }
            // 处理嵌套列表
            const nestedLists = tempLi.querySelectorAll('ul, ol');
            for (const list of nestedLists) {
              liContent += walk(list);
            }
            return `<li>${liContent}</li>`;
          }
          return `<li>${childContent}</li>`;
        
        case 'div':
          if (className.includes('markdown-table-wrapper')) {
            return childContent;
          } else if (className.includes('md-code-block')) {
            const pre = node.querySelector('pre');
            if (pre) {
              return `<pre><code>${pre.textContent}</code></pre>`;
            }
          }
          return childContent;
        
        case 'table':
        case 'thead':
        case 'tbody':
        case 'tr':
        case 'th':
        case 'td':
          return `<${tag}>${childContent}</${tag}>`;
        
        case 'strong':
        case 'em':
        case 'code':
          return `<${tag}>${childContent}</${tag}>`;
        
        case 'blockquote':
          return `<blockquote>${childContent}</blockquote>`;
        
        case 'pre':
          return `<pre><code>${childContent}</code></pre>`;
        
        case 'hr':
          return '<hr>';
        
        case 'br':
          return '<br>';
        
        case 'span':
          if (className.includes('katex')) {
            const annotation = node.querySelector('annotation[encoding="application/x-tex"]');
            if (annotation) {
              return `<span class="math">${annotation.textContent}</span>`;
            }
          }
          return childContent;
        
        default:
          return childContent;
      }
    };

    for (const child of container.childNodes) {
      result += walk(child);
    }
    
    return result;
  }

  /**
   * 将docx元素数组转换为HTML字符串
   * @param {Array} elements - docx元素数组
   * @returns {Promise<string>} HTML字符串
   */
  static async convertDocxElementsToHtml(elements) {
    let html = '';
    let inList = false;
    let currentListType = null;

    console.log('[WordProcessor] Converting docx elements to HTML, count:', elements.length);

    for (const element of elements) {
      // 调试：输出元素结构
      if (elements.length > 0 && elements.indexOf(element) === 0) {
        console.log('[WordProcessor] First element structure:', {
          constructor: element?.constructor?.name,
          hasOptions: !!element?.options,
          hasChildren: !!element?.children,
          hasRows: !!element?.rows,
          elementKeys: element ? Object.keys(element) : [],
          numbering: element?.numbering,
          heading: element?.heading,
          shading: element?.shading,
          element: element
        });
      }
      
      // 更可靠的类型检查：基于 rootKey 属性
      const isParagraph = element && element.rootKey === 'w:p';
      const isTable = element && element.rootKey === 'w:tbl';
      
      if (isParagraph) {
        // 属性可能直接在element上，也可能在element.options中
        const numbering = element.numbering || element.options?.numbering;
        const heading = element.heading || element.options?.heading;
        const shading = element.shading || element.options?.shading;
        
        // 处理列表项
        if (numbering) {
          const isOrdered = numbering.reference === 'my-numbered';
          const listType = isOrdered ? 'ol' : 'ul';
          
          // 开始新列表或切换列表类型
          if (!inList || currentListType !== listType) {
            if (inList) {
              html += `</${currentListType}>`;
            }
            html += `<${listType}>`;
            inList = true;
            currentListType = listType;
          }
          
          // 提取列表项内容
          const content = this.extractTextFromParagraph(element);
          html += `<li>${content}</li>`;
        } else {
          // 结束列表
          if (inList) {
            html += `</${currentListType}>`;
            inList = false;
            currentListType = null;
          }
          
          // 处理其他段落类型
          if (heading) {
            const level = {
              [HeadingLevel.HEADING_1]: 1,
              [HeadingLevel.HEADING_2]: 2,
              [HeadingLevel.HEADING_3]: 3,
              [HeadingLevel.HEADING_4]: 4,
              [HeadingLevel.HEADING_5]: 5,
              [HeadingLevel.HEADING_6]: 6,
            }[heading] || 1;
            const content = this.extractTextFromParagraph(element);
            html += `<h${level}>${content}</h${level}>`;
          } else {
            const content = this.extractTextFromParagraph(element);
            if (shading?.fill === 'F5F5F5') {
              // 代码块
              html += `<pre><code>${content}</code></pre>`;
            } else if (shading?.fill === 'F0F0F0') {
              // 引用块
              html += `<blockquote>${content}</blockquote>`;
            } else if (content.trim()) {
              // 普通段落（只有内容非空才添加）
              html += `<p>${content}</p>`;
            }
          }
        }
      } else if (isTable) {
        // 结束列表
        if (inList) {
          html += `</${currentListType}>`;
          inList = false;
          currentListType = null;
        }
        
        html += this.convertTableToHtml(element);
      } else {
        console.warn('[WordProcessor] Unknown element type:', element);
      }
    }
    
    // 确保列表闭合
    if (inList) {
      html += `</${currentListType}>`;
    }
    
    console.log('[WordProcessor] HTML conversion complete, length:', html.length);
    return html;
  }


  /**
   * 从段落中提取文本内容
   * @param {Paragraph} paragraph - docx段落
   * @returns {string} HTML格式的文本
   */
  static extractTextFromParagraph(paragraph) {
    let html = '';
    const children = paragraph.children || paragraph.options?.children || [];
    
    // 如果没有children，可能文本直接在paragraph上
    if (children.length === 0 && (paragraph.text || paragraph.options?.text)) {
      return paragraph.text || paragraph.options?.text || '';
    }
    
    for (const child of children) {
      // 检查是否是 TextRun（基于属性而不是 instanceof）
      const isTextRun = child && (child.rootKey === 'w:r' || child.text !== undefined || child.options?.text !== undefined);
      
      if (isTextRun) {
        // 属性可能直接在child上，也可能在child.options中
        let text = child.text || child.options?.text || '';
        const bold = child.bold || child.options?.bold;
        const italics = child.italics || child.options?.italics;
        const underline = child.underline || child.options?.underline;
        const font = child.font || child.options?.font;
        const color = child.color || child.options?.color;
        const highlight = child.highlight || child.options?.highlight;
        
        // 应用文本样式
        if (bold) {
          text = `<strong>${text}</strong>`;
        }
        if (italics) {
          text = `<em>${text}</em>`;
        }
        if (underline) {
          text = `<u>${text}</u>`;
        }
        if (font) {
          text = `<span style="font-family: '${font}';">${text}</span>`;
        }
        if (color) {
          text = `<span style="color: #${color};">${text}</span>`;
        }
        if (highlight) {
          text = `<span style="background-color: ${highlight};">${text}</span>`;
        }
        
        html += text;
      }
    }
    
    return html;
  }

  /**
   * 将表格转换为HTML
   * @param {Table} table - docx表格
   * @returns {string} HTML字符串
   */
  static convertTableToHtml(table) {
    let html = '<table style="border-collapse: collapse; width: 100%; margin: 16px 0;">';
    
    const rows = table.rows || table.options?.rows || [];
    for (const row of rows) {
      html += '<tr>';
      const cells = row.children || row.options?.children || [];
      for (const cell of cells) {
        const shading = cell.shading || cell.options?.shading;
        const isHeader = shading?.fill === 'E0E0E0';
        const tag = isHeader ? 'th' : 'td';
        const style = 'border: 1px solid #000000; padding: 8px; vertical-align: top;' +
                     (isHeader ? ' background: #f5f5f5; font-weight: bold;' : '');
        
        html += `<${tag} style="${style}">`;
        
        // 提取单元格内容
        const paragraphs = cell.children || cell.options?.children || [];
        for (const para of paragraphs) {
          // 检查是否是段落（基于属性）
          const isPara = para && para.rootKey === 'w:p';
          if (isPara) {
            const content = this.extractTextFromParagraph(para);
            html += content;
          }
        }
        
        html += `</${tag}>`;
      }
      html += '</tr>';
    }
    
    html += '</table>';
    return html;
  }

  /**
   * 包装完整HTML文档
   * @param {string} bodyHtml - 主体HTML内容
   * @returns {string} 完整的HTML文档
   */
  static wrapCompleteHtmlDocument(bodyHtml) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="Generator" content="PureText Extension">
  <title>复制的内容</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 20px;
      background: #fff;
    }
    
    /* 确保Word兼容性的基础样式 */
    * {
      box-sizing: border-box;
    }
    
    /* 段落样式 */
    p { 
      margin: 8px 0; 
      line-height: 1.6; 
    }
    
    /* WPS和Word兼容的列表样式 */
    ul {
      margin: 12px 0;
      padding-left: 30px;
      list-style: disc;
      list-style-position: outside;
    }
    
    ol {
      margin: 12px 0;
      padding-left: 30px;
      list-style: decimal;
      list-style-position: outside;
    }
    
    li {
      margin: 6px 0;
      line-height: 1.6;
      padding-left: 8px;
    }
    
    /* 嵌套列表样式 */
    ul ul {
      list-style: circle;
      margin: 8px 0;
      padding-left: 50px;
    }
    
    ol ol {
      list-style: lower-alpha;
      margin: 8px 0;
      padding-left: 50px;
    }
    
    ul ul ul {
      list-style: square;
      padding-left: 70px;
    }
    
    ol ol ol {
      list-style: lower-roman;
      padding-left: 70px;
    }
    
    /* 代码样式 */
    code { 
      background: #f5f5f5; 
      padding: 2px 4px; 
      border-radius: 3px; 
      font-family: 'Courier New', 'Consolas', monospace; 
      font-size: 90%;
      border: 1px solid #e0e0e0;
    }
    
    pre { 
      background: #f5f5f5; 
      padding: 12px; 
      border-radius: 6px; 
      overflow-x: auto; 
      font-family: 'Courier New', 'Consolas', monospace;
      white-space: pre-wrap;
      border: 1px solid #e0e0e0;
      margin: 12px 0;
    }
    
    /* 链接样式 */
    a {
      color: #0066cc;
      text-decoration: underline;
    }
    
    a:hover {
      color: #004499;
    }
    
    /* 分隔线样式 */
    hr {
      border: none;
      border-top: 1px solid #ccc;
      margin: 20px 0;
    }
    
    /* 确保图片适应容器 */
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 12px 0;
    }
    
    /* 打印样式 */
    @media print {
      body {
        max-width: none;
        margin: 0;
        padding: 0;
      }
    }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
  }

  /**
   * 创建列表编号配置
   * @param {string} bulletRef - 无序列表引用
   * @param {string} orderedRef - 有序列表引用
   * @returns {Object} 编号配置
   */
  static createNumberingConfig(bulletRef, orderedRef) {
    return {
      config: [
        {
          reference: bulletRef,
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '\u2022',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 360, hanging: 360 } } },
            },
            {
              level: 1,
              format: LevelFormat.BULLET,
              text: '\u25E6',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
            {
              level: 2,
              format: LevelFormat.BULLET,
              text: '\u25AA',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 1080, hanging: 360 } } },
            },
          ],
        },
        {
          reference: orderedRef,
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: '%1.',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 360, hanging: 360 } } },
            },
            {
              level: 1,
              format: LevelFormat.LOWER_LETTER,
              text: '%2.',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
            {
              level: 2,
              format: LevelFormat.LOWER_ROMAN,
              text: '%3.', 
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 1080, hanging: 360 } } },
            },
          ],
        },
      ],
    };
  }

  /**
   * 递归解析 Kimi HTML 字符串为 docx 段落数组
   * 从 export-to-word.js 移植过来的方法
   */
  static parseKimiHtmlToDocxParagraphs(html, bulletRef = 'my-bullet', orderedRef = 'my-numbered') {
    const container = document.createElement('div');
    container.innerHTML = html;
    const paragraphs = [];

    function parseInlineElements(node, parentStyle = {}) {
      // 解析内联元素，返回TextRun数组
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (text.trim() || text.includes('\n')) {
          return [new TextRun({ 
            text,
            ...parentStyle 
          })];
        }
        return [];
      }
      
      if (node.nodeType !== Node.ELEMENT_NODE) return [];
      
      const tag = node.tagName.toLowerCase();
      const className = node.className || '';
      
      // 处理数学公式
      if (className.includes('katex-container')) {
        const annotation = node.querySelector('annotation[encoding="application/x-tex"]');
        if (annotation) {
          const latex = annotation.textContent || '';
          return [new TextRun({ 
            text: latex,
            font: 'Cambria Math',
            italics: true,
            ...parentStyle
          })];
        }
        return [];
      }
      
      switch (tag) {
        case 'strong':
        case 'b':
          const boldStyle = { ...parentStyle, bold: true };
          return Array.from(node.childNodes).flatMap(child => 
            parseInlineElements(child, boldStyle)
          );
        
        case 'em':
        case 'i':
          const italicStyle = { ...parentStyle, italics: true };
          return Array.from(node.childNodes).flatMap(child => 
            parseInlineElements(child, italicStyle)
          );
        
        case 'code':
          return [new TextRun({ 
            text: node.textContent, 
            font: 'Courier New',
            highlight: 'yellow',
            ...parentStyle
          })];
        
        case 'a':
          return [new TextRun({ 
            text: node.textContent,
            underline: { type: 'single' },
            color: '0000FF',
            ...parentStyle
          })];
        
        case 'br':
          return [new TextRun({ text: '\n', ...parentStyle })];
        
        case 'span':
          return Array.from(node.childNodes).flatMap(child => 
            parseInlineElements(child, parentStyle)
          );
        
        default:
          return Array.from(node.childNodes).flatMap(child => 
            parseInlineElements(child, parentStyle)
          );
      }
    }

    // 处理包含<br>标签的段落
    function parseParagraphWithBreaks(node) {
      const result = [];
      const segments = [];
      let currentSegment = [];
      
      function collectContent(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;
          if (text.trim()) {
            currentSegment.push(new TextRun({ text }));
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = node.tagName.toLowerCase();
          
          if (tag === 'br') {
            if (currentSegment.length > 0) {
              segments.push([...currentSegment]);
              currentSegment = [];
            }
          } else {
            const inlineContent = parseInlineElements(node);
            currentSegment.push(...inlineContent);
          }
        }
      }
      
      for (const child of node.childNodes) {
        collectContent(child);
      }
      
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
      }
      
      segments.forEach(segment => {
        if (segment.length > 0) {
          result.push(
            new Paragraph({
              children: segment,
              spacing: { after: 120 },
            })
          );
        }
      });
      
      return result.length > 0 ? result : [new Paragraph({ children: [new TextRun({ text: '' })] })];
    }

    function walk(node, listLevel = 0, inListItem = false) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (!inListItem) {
          const text = node.textContent.trim();
          if (text) {
            paragraphs.push(
              new Paragraph({
                children: [new TextRun({ text })],
                spacing: { after: 120 },
              })
            );
          }
        }
        return [];
      }
      
      if (node.nodeType !== Node.ELEMENT_NODE) return [];
      
      const tag = node.tagName.toLowerCase();
      const className = node.className || '';
      
      // 跳过按钮和界面元素
      if (className.includes('simple-button') || 
          className.includes('puretext-copy-btn') ||
          className.includes('puretext-button-container') ||
          className.includes('segment-assistant-actions') ||
          tag === 'BUTTON') {
        return [];
      }
      
      switch (tag) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          const level = parseInt(tag[1]);
          const headingLevel = level === 1 ? HeadingLevel.HEADING_1 : 
                             level === 2 ? HeadingLevel.HEADING_2 :
                             level === 3 ? HeadingLevel.HEADING_3 : 
                             HeadingLevel.HEADING_4;
          
          paragraphs.push(
            new Paragraph({
              children: parseInlineElements(node),
              heading: headingLevel,
              spacing: { after: 150 },
              alignment: AlignmentType.LEFT,
            })
          );
          break;
        
        case 'ul':
        case 'ol':
          const isOrdered = tag === 'ol';
          const listRef = isOrdered ? orderedRef : bulletRef;
          
          Array.from(node.children).forEach((li, index) => {
            if (li.tagName.toLowerCase() === 'li') {
              let itemContent = [];
              
              Array.from(li.childNodes).forEach(child => {
                if (child.nodeType === Node.ELEMENT_NODE) {
                  const childTag = child.tagName.toLowerCase();
                  
                  if (childTag === 'div' && child.classList.contains('paragraph')) {
                    itemContent = itemContent.concat(parseInlineElements(child));
                  }
                  else if (childTag === 'ul' || childTag === 'ol') {
                    if (itemContent.length > 0) {
                      paragraphs.push(
                        new Paragraph({
                          children: itemContent,
                          numbering: { reference: listRef, level: listLevel },
                          spacing: { after: 80 },
                        })
                      );
                      itemContent = [];
                    }
                    walk(child, listLevel + 1, false);
                  }
                  else {
                    itemContent = itemContent.concat(parseInlineElements(child));
                  }
                } else if (child.nodeType === Node.TEXT_NODE) {
                  const text = child.textContent.trim();
                  if (text) {
                    itemContent.push(new TextRun({ text }));
                  }
                }
              });
              
              if (itemContent.length > 0) {
                paragraphs.push(
                  new Paragraph({
                    children: itemContent,
                    numbering: { reference: listRef, level: listLevel },
                    spacing: { after: 80 },
                  })
                );
              }
            }
          });
          break;
        
        case 'p':
        case 'div':
          if (!inListItem) {
            if (className.includes('paragraph') || tag === 'p') {
              const paragraphContent = parseParagraphWithBreaks(node);
              paragraphContent.forEach(para => paragraphs.push(para));
            } else {
              Array.from(node.childNodes).forEach(child => 
                walk(child, listLevel, inListItem)
              );
            }
          }
          break;
        
        case 'blockquote':
          const quoteContent = parseInlineElements(node);
          if (quoteContent.length > 0) {
            paragraphs.push(
              new Paragraph({
                children: quoteContent,
                indent: { left: 720 },
                spacing: { after: 120 },
                shading: { fill: 'F0F0F0' },
              })
            );
          }
          break;
        
        case 'pre':
          const codeText = node.textContent || '';
          if (codeText.trim()) {
            paragraphs.push(
              new Paragraph({
                children: [new TextRun({ 
                  text: codeText,
                  font: 'Courier New'
                })],
                spacing: { after: 120 },
                shading: { fill: 'F5F5F5' },
              })
            );
          }
          break;
        
        case 'table':
          const rows = [];
          
          const thead = node.querySelector('thead');
          if (thead) {
            const headerRows = thead.querySelectorAll('tr');
            headerRows.forEach(tr => {
              const cells = [];
              tr.querySelectorAll('th').forEach(th => {
                cells.push(
                  new TableCell({
                    children: [new Paragraph({
                      children: parseInlineElements(th),
                      alignment: AlignmentType.CENTER,
                    })],
                    shading: { fill: 'E0E0E0' },
                  })
                );
              });
              if (cells.length > 0) {
                rows.push(new TableRow({ children: cells }));
              }
            });
          }
          
          const tbody = node.querySelector('tbody');
          if (tbody) {
            const bodyRows = tbody.querySelectorAll('tr');
            bodyRows.forEach(tr => {
              const cells = [];
              tr.querySelectorAll('td').forEach(td => {
                cells.push(
                  new TableCell({
                    children: [new Paragraph({
                      children: parseInlineElements(td),
                    })],
                  })
                );
              });
              if (cells.length > 0) {
                rows.push(new TableRow({ children: cells }));
              }
            });
          }
          
          if (!thead && !tbody) {
            const allRows = node.querySelectorAll('tr');
            allRows.forEach(tr => {
              const cells = [];
              tr.querySelectorAll('th, td').forEach(cell => {
                const isHeader = cell.tagName.toLowerCase() === 'th';
                cells.push(
                  new TableCell({
                    children: [new Paragraph({
                      children: parseInlineElements(cell),
                      alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
                    })],
                    shading: isHeader ? { fill: 'E0E0E0' } : undefined,
                  })
                );
              });
              if (cells.length > 0) {
                rows.push(new TableRow({ children: cells }));
              }
            });
          }
          
          if (rows.length > 0) {
            paragraphs.push(
              new Table({
                rows: rows,
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                },
              })
            );
          }
          break;
        
        case 'hr':
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: '────────────────────────' })],
              spacing: { after: 120, before: 120 },
              alignment: AlignmentType.CENTER,
            })
          );
          break;
        
        case 'span':
          if (className.includes('katex-display') || className.includes('math-display')) {
            const annotation = node.querySelector('annotation[encoding="application/x-tex"]');
            if (annotation) {
              const latex = annotation.textContent || '';
              paragraphs.push(
                new Paragraph({
                  children: [new TextRun({ 
                    text: latex,
                    font: 'Cambria Math',
                    italics: true
                  })],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 120, before: 120 },
                })
              );
            }
          } else {
            Array.from(node.childNodes).forEach(child => 
              walk(child, listLevel, inListItem)
            );
          }
          break;
        
        default:
          Array.from(node.childNodes).forEach(child => 
            walk(child, listLevel, inListItem)
          );
          break;
      }
      
      return [];
    }

    Array.from(container.childNodes).forEach(node => walk(node));
    return paragraphs;
  }

  /**
   * 递归解析 DeepSeek HTML 字符串为 docx 段落数组
   * 从 export-to-word.js 移植过来的方法
   */
  static parseDeepSeekHtmlToDocxParagraphs(html, bulletRef = 'my-bullet', orderedRef = 'my-numbered') {
    const container = document.createElement('div');
    container.innerHTML = html;
    const paragraphs = [];

    function parseInlineElements(node, parentStyle = {}) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (text.trim() || text.includes('\n')) {
          return [new TextRun({ 
            text,
            ...parentStyle 
          })];
        }
        return [];
      }
      
      if (node.nodeType !== Node.ELEMENT_NODE) return [];
      
      const tag = node.tagName.toLowerCase();
      const className = node.className || '';
      
      if (className.includes('ds-markdown-html')) {
        return [];
      }
      
      if (className.includes('katex')) {
        const annotation = node.querySelector('annotation[encoding="application/x-tex"]');
        if (annotation) {
          const latex = annotation.textContent || '';
          return [new TextRun({ 
            text: latex,
            font: 'Cambria Math',
            italics: true,
            ...parentStyle
          })];
        }
        if (className.includes('katex-html')) {
          return [];
        }
        return [];
      }
      
      if (className.includes('katex-html')) {
        return [];
      }
      
      switch (tag) {
        case 'strong':
        case 'b':
          const boldStyle = { ...parentStyle, bold: true };
          return Array.from(node.childNodes).flatMap(child => 
            parseInlineElements(child, boldStyle)
          );
        
        case 'em':
        case 'i':
          const italicStyle = { ...parentStyle, italics: true };
          return Array.from(node.childNodes).flatMap(child => 
            parseInlineElements(child, italicStyle)
          );
        
        case 'code':
          return [new TextRun({ 
            text: node.textContent, 
            font: 'Courier New',
            highlight: 'yellow',
            ...parentStyle
          })];
        
        case 'a':
          return [new TextRun({ 
            text: node.textContent,
            underline: { type: 'single' },
            color: '0000FF',
            ...parentStyle
          })];
        
        case 'br':
          return [new TextRun({ text: '\n', ...parentStyle })];
        
        case 'span':
          return Array.from(node.childNodes).flatMap(child => 
            parseInlineElements(child, parentStyle)
          );
        
        default:
          return Array.from(node.childNodes).flatMap(child => 
            parseInlineElements(child, parentStyle)
          );
      }
    }

    function parseParagraphWithBreaks(node) {
      const result = [];
      const segments = [];
      let currentSegment = [];
      
      function collectContent(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;
          if (text.trim()) {
            currentSegment.push(new TextRun({ text }));
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = node.tagName.toLowerCase();
          
          if (tag === 'br') {
            if (currentSegment.length > 0) {
              segments.push([...currentSegment]);
              currentSegment = [];
            }
          } else {
            const inlineContent = parseInlineElements(node);
            currentSegment.push(...inlineContent);
          }
        }
      }
      
      for (const child of node.childNodes) {
        collectContent(child);
      }
      
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
      }
      
      segments.forEach(segment => {
        if (segment.length > 0) {
          result.push(
            new Paragraph({
              children: segment,
              spacing: { after: 120 },
            })
          );
        }
      });
      
      return result.length > 0 ? result : [new Paragraph({ children: [new TextRun({ text: '' })] })];
    }

    function walk(node, listLevel = 0, inListItem = false) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (!inListItem) {
          const text = node.textContent.trim();
          if (text) {
            paragraphs.push(
              new Paragraph({
                children: [new TextRun({ text })],
                spacing: { after: 120 },
              })
            );
          }
        }
        return [];
      }
      
      if (node.nodeType !== Node.ELEMENT_NODE) return [];
      
      const tag = node.tagName.toLowerCase();
      const className = node.className || '';
      
      if (className.includes('md-code-block-banner') || 
          className.includes('ds-button') ||
          className.includes('code-info-button')) {
        return [];
      }
      
      switch (tag) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          const level = parseInt(tag[1]);
          const headingLevel = level === 1 ? HeadingLevel.HEADING_1 : 
                             level === 2 ? HeadingLevel.HEADING_2 :
                             level === 3 ? HeadingLevel.HEADING_3 : 
                             HeadingLevel.HEADING_4;
          
          paragraphs.push(
            new Paragraph({
              children: parseInlineElements(node),
              heading: headingLevel,
              spacing: { after: 150 },
              alignment: AlignmentType.LEFT,
            })
          );
          break;
        
        case 'ul':
        case 'ol':
          const isOrdered = tag === 'ol';
          const listRef = isOrdered ? orderedRef : bulletRef;
          
          Array.from(node.children).forEach((li, index) => {
            if (li.tagName.toLowerCase() === 'li') {
              let itemContent = [];
              
              Array.from(li.childNodes).forEach(child => {
                if (child.nodeType === Node.ELEMENT_NODE) {
                  const childTag = child.tagName.toLowerCase();
                  
                  if (childTag === 'p' && child.classList.contains('ds-markdown-paragraph')) {
                    itemContent = itemContent.concat(parseInlineElements(child));
                  }
                  else if (childTag === 'ul' || childTag === 'ol') {
                    if (itemContent.length > 0) {
                      paragraphs.push(
                        new Paragraph({
                          children: itemContent,
                          numbering: { reference: listRef, level: listLevel },
                          spacing: { after: 80 },
                        })
                      );
                      itemContent = [];
                    }
                    walk(child, listLevel + 1, false);
                  }
                  else {
                    itemContent = itemContent.concat(parseInlineElements(child));
                  }
                } else if (child.nodeType === Node.TEXT_NODE) {
                  const text = child.textContent.trim();
                  if (text) {
                    itemContent.push(new TextRun({ text }));
                  }
                }
              });
              
              if (itemContent.length > 0) {
                paragraphs.push(
                  new Paragraph({
                    children: itemContent,
                    numbering: { reference: listRef, level: listLevel },
                    spacing: { after: 80 },
                  })
                );
              }
            }
          });
          break;
        
        case 'p':
          if (!inListItem) {
            const paragraphContent = parseParagraphWithBreaks(node);
            paragraphContent.forEach(para => paragraphs.push(para));
          }
          break;
        
        case 'blockquote':
          const quoteContent = parseInlineElements(node);
          if (quoteContent.length > 0) {
            paragraphs.push(
              new Paragraph({
                children: quoteContent,
                indent: { left: 720 },
                spacing: { after: 120 },
                shading: { fill: 'F0F0F0' },
              })
            );
          }
          break;
        
        case 'pre':
          const codeText = node.textContent || '';
          if (codeText.trim()) {
            paragraphs.push(
              new Paragraph({
                children: [new TextRun({ 
                  text: codeText,
                  font: 'Courier New'
                })],
                spacing: { after: 120 },
                shading: { fill: 'F5F5F5' },
              })
            );
          }
          break;
        
        case 'table':
          const rows = [];
          
          const thead = node.querySelector('thead');
          if (thead) {
            const headerRows = thead.querySelectorAll('tr');
            headerRows.forEach(tr => {
              const cells = [];
              tr.querySelectorAll('th').forEach(th => {
                cells.push(
                  new TableCell({
                    children: [new Paragraph({
                      children: parseInlineElements(th),
                      alignment: AlignmentType.CENTER,
                    })],
                    shading: { fill: 'E0E0E0' },
                  })
                );
              });
              if (cells.length > 0) {
                rows.push(new TableRow({ children: cells }));
              }
            });
          }
          
          const tbody = node.querySelector('tbody');
          if (tbody) {
            const bodyRows = tbody.querySelectorAll('tr');
            bodyRows.forEach(tr => {
              const cells = [];
              tr.querySelectorAll('td').forEach(td => {
                cells.push(
                  new TableCell({
                    children: [new Paragraph({
                      children: parseInlineElements(td),
                    })],
                  })
                );
              });
              if (cells.length > 0) {
                rows.push(new TableRow({ children: cells }));
              }
            });
          }
          
          if (!thead && !tbody) {
            const allRows = node.querySelectorAll('tr');
            allRows.forEach(tr => {
              const cells = [];
              tr.querySelectorAll('th, td').forEach(cell => {
                const isHeader = cell.tagName.toLowerCase() === 'th';
                cells.push(
                  new TableCell({
                    children: [new Paragraph({
                      children: parseInlineElements(cell),
                      alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
                    })],
                    shading: isHeader ? { fill: 'E0E0E0' } : undefined,
                  })
                );
              });
              if (cells.length > 0) {
                rows.push(new TableRow({ children: cells }));
              }
            });
          }
          
          if (rows.length > 0) {
            paragraphs.push(
              new Table({
                rows: rows,
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                },
              })
            );
          }
          break;
        
        case 'hr':
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: '────────────────────────' })],
              spacing: { after: 120, before: 120 },
              alignment: AlignmentType.CENTER,
            })
          );
          break;
        
        case 'span':
          if (className.includes('katex-display') || className.includes('ds-markdown-math')) {
            const annotation = node.querySelector('annotation[encoding="application/x-tex"]');
            if (annotation) {
              const latex = annotation.textContent || '';
              paragraphs.push(
                new Paragraph({
                  children: [new TextRun({ 
                    text: latex,
                    font: 'Cambria Math',
                    italics: true
                  })],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 120, before: 120 },
                })
              );
            }
          } else if (!className.includes('ds-markdown-html') && !className.includes('katex-html')) {
            Array.from(node.childNodes).forEach(child => 
              walk(child, listLevel, inListItem)
            );
          }
          break;
        
        case 'div':
          if (className.includes('markdown-table-wrapper')) {
            const table = node.querySelector('table');
            if (table) {
              walk(table, listLevel, inListItem);
            }
          } else if (className.includes('md-code-block')) {
            const pre = node.querySelector('pre');
            if (pre) {
              walk(pre, listLevel, inListItem);
            }
          } else {
            Array.from(node.childNodes).forEach(child => 
              walk(child, listLevel, inListItem)
            );
          }
          break;
        
        default:
          Array.from(node.childNodes).forEach(child => 
            walk(child, listLevel, inListItem)
          );
          break;
      }
      
      return [];
    }

    Array.from(container.childNodes).forEach(node => walk(node));
    return paragraphs;
  }
}

// 导出类
export { WordProcessor };