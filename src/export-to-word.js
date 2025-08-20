// 导出为 Word 工具函数，使用 docx 和 file-saver，兼容 HTML/纯文本输入
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, LevelFormat, TableBorders, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { UserQuestionExtractor } from './UserQuestionExtractor.js';

/**
 * 递归解析 Kimi HTML 字符串为 docx 段落数组，完全支持所有元素类型
 * @param {string} html
 * @param {string} bulletRef - 列表样式引用名
 * @param {string} orderedRef - 有序列表样式引用名
 * @returns {Array<Paragraph|Table>}
 */
function parseKimiHtmlToDocxParagraphs(html, bulletRef = 'my-bullet', orderedRef = 'my-numbered') {
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
      // 只处理包含annotation的katex元素，避免重复
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
        // 处理粗体 - 正确传递样式
        const boldStyle = { ...parentStyle, bold: true };
        return Array.from(node.childNodes).flatMap(child => 
          parseInlineElements(child, boldStyle)
        );
      
      case 'em':
      case 'i':
        // 处理斜体 - 正确传递样式
        const italicStyle = { ...parentStyle, italics: true };
        return Array.from(node.childNodes).flatMap(child => 
          parseInlineElements(child, italicStyle)
        );
      
      case 'code':
        // 行内代码
        return [new TextRun({ 
          text: node.textContent, 
          font: 'Courier New',
          highlight: 'yellow',
          ...parentStyle
        })];
      
      case 'a':
        // 链接
        return [new TextRun({ 
          text: node.textContent,
          underline: { type: 'single' },
          color: '0000FF',
          ...parentStyle
        })];
      
      case 'br':
        return [new TextRun({ text: '\n', ...parentStyle })];
      
      case 'span':
        // span元素，继承父样式
        return Array.from(node.childNodes).flatMap(child => 
          parseInlineElements(child, parentStyle)
        );
      
      default:
        // 递归处理子节点
        return Array.from(node.childNodes).flatMap(child => 
          parseInlineElements(child, parentStyle)
        );
    }
  }

  function walk(node, listLevel = 0, inListItem = false) {
    if (node.nodeType === Node.TEXT_NODE) {
      // 文本节点在列表外才处理
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
        // 处理列表 - 正确区分有序和无序列表
        const isOrdered = tag === 'ol';
        const listRef = isOrdered ? orderedRef : bulletRef;  // 使用正确的列表样式
        
        Array.from(node.children).forEach((li, index) => {
          if (li.tagName.toLowerCase() === 'li') {
            // 处理列表项
            let itemContent = [];
            
            Array.from(li.childNodes).forEach(child => {
              if (child.nodeType === Node.ELEMENT_NODE) {
                const childTag = child.tagName.toLowerCase();
                
                // Kimi的li内可能有div.paragraph
                if (childTag === 'div' && child.classList.contains('paragraph')) {
                  itemContent = itemContent.concat(parseInlineElements(child));
                }
                // 嵌套列表
                else if (childTag === 'ul' || childTag === 'ol') {
                  // 先输出当前列表项内容
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
                  // 递归处理嵌套列表
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
            
            // 输出列表项内容
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
        // 处理段落和普通div
        if (!inListItem) {
          // 检查是否为段落容器
          if (className.includes('paragraph') || tag === 'p') {
            const children = parseInlineElements(node);
            if (children.length > 0) {
              paragraphs.push(
                new Paragraph({
                  children: children,
                  spacing: { after: 120 },
                })
              );
            }
          } else {
            // 普通div，递归处理子节点
            Array.from(node.childNodes).forEach(child => 
              walk(child, listLevel, inListItem)
            );
          }
        }
        break;
      
      case 'blockquote':
        // 处理引用块
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
        // 处理代码块
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
        // 完整处理表格
        const rows = [];
        
        // 处理表头
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
        
        // 处理表体
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
        
        // 如果没有thead/tbody，直接处理tr
        if (!thead && !tbody) {
          const allRows = node.querySelectorAll('tr');
          allRows.forEach(tr => {
            const cells = [];
            // 处理th和td
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
        // 分隔线
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: '────────────────────────' })],
            spacing: { after: 120, before: 120 },
            alignment: AlignmentType.CENTER,
          })
        );
        break;
      
      case 'span':
        // 处理span元素
        if (className.includes('katex-display') || className.includes('math-display')) {
          // 独立公式 - 确保公式不被重复和分割
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
          // 普通span，递归处理
          Array.from(node.childNodes).forEach(child => 
            walk(child, listLevel, inListItem)
          );
        }
        break;
      
      default:
        // 其他元素，递归处理子节点
        Array.from(node.childNodes).forEach(child => 
          walk(child, listLevel, inListItem)
        );
        break;
    }
    
    return [];
  }

  console.log('[PureText] 开始解析Kimi HTML，内容长度:', html.length);
  Array.from(container.childNodes).forEach(node => walk(node));
  console.log('[PureText] Kimi解析完成，生成段落数:', paragraphs.length);
  return paragraphs;
}

/**
 * 递归解析 DeepSeek HTML 字符串为 docx 段落数组，处理复杂的嵌套结构
 * @param {string} html
 * @param {string} bulletRef - 列表样式引用名
 * @param {string} orderedRef - 有序列表样式引用名
 * @returns {Array<Paragraph|Table>}
 */
function parseDeepSeekHtmlToDocxParagraphs(html, bulletRef = 'my-bullet', orderedRef = 'my-numbered') {
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
    
    // 处理DeepSeek的特殊HTML标记
    if (className.includes('ds-markdown-html')) {
      // 跳过HTML标签显示
      return [];
    }
    
    // 处理数学公式 - 只提取LaTeX源码，避免重复
    if (className.includes('katex')) {
      // 只处理包含annotation的katex元素，避免处理katex-html
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
      // 如果是katex-html，跳过（避免重复）
      if (className.includes('katex-html')) {
        return [];
      }
      return [];
    }
    
    // 跳过katex-html，避免重复
    if (className.includes('katex-html')) {
      return [];
    }
    
    switch (tag) {
      case 'strong':
      case 'b':
        // 处理粗体 - 正确传递样式
        const boldStyle = { ...parentStyle, bold: true };
        return Array.from(node.childNodes).flatMap(child => 
          parseInlineElements(child, boldStyle)
        );
      
      case 'em':
      case 'i':
        // 处理斜体 - 正确传递样式
        const italicStyle = { ...parentStyle, italics: true };
        return Array.from(node.childNodes).flatMap(child => 
          parseInlineElements(child, italicStyle)
        );
      
      case 'code':
        // 行内代码
        return [new TextRun({ 
          text: node.textContent, 
          font: 'Courier New',
          highlight: 'yellow',
          ...parentStyle
        })];
      
      case 'a':
        // 链接
        return [new TextRun({ 
          text: node.textContent,
          underline: { type: 'single' },
          color: '0000FF',
          ...parentStyle
        })];
      
      case 'br':
        return [new TextRun({ text: '\n', ...parentStyle })];
      
      case 'span':
        // span元素，继承父样式
        return Array.from(node.childNodes).flatMap(child => 
          parseInlineElements(child, parentStyle)
        );
      
      default:
        // 递归处理子节点
        return Array.from(node.childNodes).flatMap(child => 
          parseInlineElements(child, parentStyle)
        );
    }
  }

  function walk(node, listLevel = 0, inListItem = false) {
    if (node.nodeType === Node.TEXT_NODE) {
      // 文本节点在列表外才处理
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
    
    // 跳过DeepSeek的UI元素
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
        // 处理列表 - 正确区分有序和无序列表
        const isOrdered = tag === 'ol';
        const listRef = isOrdered ? orderedRef : bulletRef;  // 使用正确的列表样式
        
        Array.from(node.children).forEach((li, index) => {
          if (li.tagName.toLowerCase() === 'li') {
            // 处理列表项
            let itemContent = [];
            
            Array.from(li.childNodes).forEach(child => {
              if (child.nodeType === Node.ELEMENT_NODE) {
                const childTag = child.tagName.toLowerCase();
                
                // DeepSeek的li内可能有p.ds-markdown-paragraph
                if (childTag === 'p' && child.classList.contains('ds-markdown-paragraph')) {
                  itemContent = itemContent.concat(parseInlineElements(child));
                }
                // 嵌套列表
                else if (childTag === 'ul' || childTag === 'ol') {
                  // 先输出当前列表项内容
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
                  // 递归处理嵌套列表
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
            
            // 输出列表项内容
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
        // 处理段落 - 确保所有p标签内容都被解析
        if (!inListItem) {
          const children = parseInlineElements(node);
          if (children.length > 0) {
            paragraphs.push(
              new Paragraph({
                children: children,
                spacing: { after: 120 },
              })
            );
          }
        }
        break;
      
      case 'blockquote':
        // 处理引用块
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
        // 处理代码块
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
        // 完整处理表格
        const rows = [];
        
        // 处理表头
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
        
        // 处理表体
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
        
        // 如果没有thead/tbody，直接处理tr
        if (!thead && !tbody) {
          const allRows = node.querySelectorAll('tr');
          allRows.forEach(tr => {
            const cells = [];
            // 处理th和td
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
        // 分隔线
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: '────────────────────────' })],
            spacing: { after: 120, before: 120 },
            alignment: AlignmentType.CENTER,
          })
        );
        break;
      
      case 'span':
        // 处理span元素
        if (className.includes('katex-display') || className.includes('ds-markdown-math')) {
          // 独立公式 - 确保公式不被重复和分割
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
          // 普通span，递归处理（排除特殊标记）
          Array.from(node.childNodes).forEach(child => 
            walk(child, listLevel, inListItem)
          );
        }
        break;
      
      case 'div':
        // 处理特殊的div容器
        if (className.includes('markdown-table-wrapper')) {
          // 表格容器，查找内部的table
          const table = node.querySelector('table');
          if (table) {
            walk(table, listLevel, inListItem);
          }
        } else if (className.includes('md-code-block')) {
          // 代码块容器，查找内部的pre
          const pre = node.querySelector('pre');
          if (pre) {
            walk(pre, listLevel, inListItem);
          }
        } else {
          // 普通div，递归处理子节点
          Array.from(node.childNodes).forEach(child => 
            walk(child, listLevel, inListItem)
          );
        }
        break;
      
      default:
        // 其他元素，递归处理子节点
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
 * 将 HTML/纯文本内容导出为 Word 文件（带格式，WPS兼容列表）
 * @param {string|HTMLElement} content - HTML 字符串或 DOM 元素
 * @param {string} filename - 下载文件名，默认 PureText.docx
 * @param {HTMLElement} aiResponseElement - AI回复元素，用于获取用户问题
 * @param {string} source - 内容来源，'kimi' 或 'deepseek' 或 'auto'
 */
export async function exportToWord(content, filename = 'PureText.docx', aiResponseElement = null, source = 'auto') {
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

  // 生成智能文件名
  let finalFilename = filename;
  if (aiResponseElement && filename === 'PureText.docx') {
    try {
      const userQuestion = UserQuestionExtractor.getUserQuestion(aiResponseElement);
      finalFilename = UserQuestionExtractor.generateFilename(userQuestion, 'docx');
      console.log('PureText: 生成智能文件名:', finalFilename);
    } catch (error) {
      console.error('PureText: 生成文件名失败:', error);
    }
  }

  // 定义列表样式
  const bulletRef = 'my-bullet';
  const orderedRef = 'my-numbered';
  const numbering = {
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

  // 解析 HTML 为带格式的 docx 段落
  const elements = useKimi
    ? parseKimiHtmlToDocxParagraphs(html, bulletRef, orderedRef)
    : parseDeepSeekHtmlToDocxParagraphs(html, bulletRef, orderedRef);

  const doc = new Document({
    creator: 'PureText',
    title: finalFilename,
    description: '由 PureText 导出',
    numbering,
    sections: [
      {
        children: elements.length > 0 ? elements : [new Paragraph('')],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, finalFilename);
} 