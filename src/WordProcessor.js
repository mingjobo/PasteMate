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
   * 将docx文档对象转换为HTML字符串（用于复制到剪贴板）
   * 注意：由于docx对象的内部结构复杂，这里采用更简单的方案：
   * 直接使用原始HTML，通过WordOptimizer优化后返回
   * @param {Document} doc - docx文档对象
   * @param {string|HTMLElement} originalContent - 原始内容
   * @returns {Promise<string>} HTML字符串
   */
  static async documentToHtml(doc, originalContent) {
    // 由于docx对象结构复杂，难以反向转换为HTML
    // 这里采用更实用的方案：直接处理原始HTML
    
    let html = '';
    if (typeof originalContent === 'string') {
      html = originalContent;
    } else if (originalContent instanceof HTMLElement) {
      html = originalContent.innerHTML || '';
    }
    
    // 使用WordOptimizer进行优化
    const optimizer = new WordOptimizer();
    const optimizedHtml = await optimizer.optimize(html);
    
    return optimizedHtml;
  }

  /**
   * 将docx元素转换为HTML
   * @param {Object} element - docx元素
   * @returns {Promise<string>} HTML字符串
   */
  static async convertDocxElementToHtml(element) {
    if (element instanceof Paragraph) {
      return this.convertParagraphToHtml(element);
    } else if (element instanceof Table) {
      return this.convertTableToHtml(element);
    }
    return '';
  }

  /**
   * 将段落转换为HTML
   * @param {Paragraph} paragraph - docx段落
   * @returns {string} HTML字符串
   */
  static convertParagraphToHtml(paragraph) {
    const options = paragraph.options || {};
    let tag = 'p';
    let style = 'margin: 8px 0; line-height: 1.6;';
    
    // 检查是否是标题
    if (options.heading) {
      const level = {
        [HeadingLevel.HEADING_1]: 1,
        [HeadingLevel.HEADING_2]: 2,
        [HeadingLevel.HEADING_3]: 3,
        [HeadingLevel.HEADING_4]: 4,
        [HeadingLevel.HEADING_5]: 5,
        [HeadingLevel.HEADING_6]: 6,
      }[options.heading] || 1;
      tag = `h${level}`;
      style = `font-weight: bold; margin: ${20 - level * 2}px 0 ${12 - level}px 0; color: #333;`;
    }
    
    // 检查是否是列表项
    if (options.numbering) {
      const indent = options.indent?.left || 360;
      style += ` margin-left: ${indent / 20}px;`;
      
      // 添加列表标记
      let prefix = '';
      if (options.numbering.reference === 'my-bullet') {
        prefix = '• ';
      } else if (options.numbering.reference === 'my-numbered') {
        // 这里简化处理，实际应该根据level计算序号
        prefix = '1. ';
      }
      
      const content = this.extractTextFromParagraph(paragraph);
      return `<li style="${style}">${prefix}${content}</li>`;
    }
    
    // 检查其他样式
    if (options.indent?.left) {
      style += ` margin-left: ${options.indent.left / 20}px;`;
    }
    if (options.shading?.fill) {
      style += ` background-color: #${options.shading.fill};`;
    }
    if (options.alignment === AlignmentType.CENTER) {
      style += ' text-align: center;';
    }
    
    const content = this.extractTextFromParagraph(paragraph);
    return `<${tag} style="${style}">${content}</${tag}>`;
  }

  /**
   * 从段落中提取文本内容
   * @param {Paragraph} paragraph - docx段落
   * @returns {string} HTML格式的文本
   */
  static extractTextFromParagraph(paragraph) {
    let html = '';
    const children = paragraph.options?.children || [];
    
    for (const child of children) {
      if (child instanceof TextRun) {
        const options = child.options || {};
        let text = options.text || '';
        
        // 应用文本样式
        if (options.bold) {
          text = `<strong>${text}</strong>`;
        }
        if (options.italics) {
          text = `<em>${text}</em>`;
        }
        if (options.underline) {
          text = `<u>${text}</u>`;
        }
        if (options.font) {
          text = `<span style="font-family: '${options.font}';">${text}</span>`;
        }
        if (options.color) {
          text = `<span style="color: #${options.color};">${text}</span>`;
        }
        if (options.highlight) {
          text = `<span style="background-color: ${options.highlight};">${text}</span>`;
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
    
    const rows = table.options?.rows || [];
    for (const row of rows) {
      html += '<tr>';
      const cells = row.options?.children || [];
      for (const cell of cells) {
        const isHeader = cell.options?.shading?.fill === 'E0E0E0';
        const tag = isHeader ? 'th' : 'td';
        const style = 'border: 1px solid #000000; padding: 8px; vertical-align: top;' +
                     (isHeader ? ' background: #f5f5f5; font-weight: bold;' : '');
        
        html += `<${tag} style="${style}">`;
        
        // 提取单元格内容
        const paragraphs = cell.options?.children || [];
        for (const para of paragraphs) {
          if (para instanceof Paragraph) {
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