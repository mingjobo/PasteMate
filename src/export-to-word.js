// 导出为 Word 工具函数，使用 docx 和 file-saver，兼容 HTML/纯文本输入
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Numbering, LevelFormat } from 'docx';
import { saveAs } from 'file-saver';
import { UserQuestionExtractor } from './UserQuestionExtractor.js';

/**
 * 递归解析 Kimi HTML 字符串为 docx 段落数组，专门处理 div.paragraph 结构
 * @param {string} html
 * @param {string} bulletRef - 列表样式引用名
 * @returns {Paragraph[]}
 */
function parseKimiHtmlToDocxParagraphs(html, bulletRef = 'my-bullet') {
  const container = document.createElement('div');
  container.innerHTML = html;
  const paragraphs = [];

  function walk(node, listLevel = 0, inListItem = false) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.replace(/\s+/g, ' ');
      if (text.trim()) {
        return [new TextRun({ text, bold: false })];
      }
      return [];
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return [];
    
    const tagName = node.tagName.toLowerCase();
    console.log('[PureText] 处理节点:', tagName, node.className, node.textContent?.substring(0, 50));
    
    switch (tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
        const level = parseInt(node.tagName[1]);
        const headingLevel = level === 1 ? HeadingLevel.HEADING_1 : 
                           level === 2 ? HeadingLevel.HEADING_2 :
                           level === 3 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4;
        console.log('[PureText] 处理标题:', node.textContent.trim(), '级别:', level);
        paragraphs.push(
          new Paragraph({
            text: node.textContent.trim(),
            heading: headingLevel,
            spacing: { after: 150 },
            alignment: AlignmentType.LEFT,
          })
        );
        break;
      case 'ul':
        console.log('[PureText] 处理无序列表，子元素数量:', node.children.length);
        Array.from(node.children).forEach(li => {
          if (li.tagName.toLowerCase() === 'li') {
            const runs = walk(li, listLevel + 1, true);
            paragraphs.push(
              new Paragraph({
                children: runs,
                numbering: { reference: bulletRef, level: listLevel },
                spacing: { after: 80 },
              })
            );
          }
        });
        break;
      case 'li':
        console.log('[PureText] 处理列表项:', node.textContent?.substring(0, 50));
        return Array.from(node.childNodes).flatMap(child => walk(child, listLevel, true));
      case 'div':
        // 只处理 class=paragraph 的div
        if (node.classList && node.classList.contains('paragraph')) {
          console.log('[PureText] 处理段落div:', node.textContent?.substring(0, 50));
          if (inListItem) {
            return Array.from(node.childNodes).flatMap(child => walk(child, listLevel, true));
          } else {
            paragraphs.push(
              new Paragraph({
                children: Array.from(node.childNodes).flatMap(child => walk(child, listLevel, false)),
                spacing: { after: 120 },
              })
            );
          }
          break;
        }
        // 其他div递归children
        console.log('[PureText] 处理其他div:', node.className);
        return Array.from(node.childNodes).flatMap(child => walk(child, listLevel, inListItem));
      case 'strong':
      case 'b':
        console.log('[PureText] 处理加粗:', node.textContent);
        return [new TextRun({ text: node.textContent, bold: true })];
      case 'br':
        return [new TextRun({ text: '\n' })];
      case 'hr':
        console.log('[PureText] 处理分割线');
        // 可以添加分割线样式，这里暂时跳过
        break;
      default:
        console.log('[PureText] 处理默认标签:', tagName);
        return Array.from(node.childNodes).flatMap(child => walk(child, listLevel, inListItem));
    }
    return [];
  }

  console.log('[PureText] 开始解析Kimi HTML，内容长度:', html.length);
  Array.from(container.childNodes).forEach(node => walk(node));
  console.log('[PureText] Kimi解析完成，生成段落数:', paragraphs.length);
  return paragraphs;
}

/**
 * 递归解析 DeepSeek HTML 字符串为 docx 段落数组，处理标准p结构
 * @param {string} html
 * @param {string} bulletRef - 列表样式引用名
 * @returns {Paragraph[]}
 */
function parseDeepSeekHtmlToDocxParagraphs(html, bulletRef = 'my-bullet') {
  // 直接复用原有parseHtmlToDocxParagraphs逻辑
  const container = document.createElement('div');
  container.innerHTML = html;
  const paragraphs = [];

  function walk(node, listLevel = 0, inListItem = false) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.replace(/\s+/g, ' ');
      if (text.trim()) {
        return [new TextRun({ text, bold: false })];
      }
      return [];
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return [];
    switch (node.tagName.toLowerCase()) {
      case 'h1':
        paragraphs.push(
          new Paragraph({
            text: node.textContent.trim(),
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
            alignment: AlignmentType.LEFT,
          })
        );
        break;
      case 'h2':
        paragraphs.push(
          new Paragraph({
            text: node.textContent.trim(),
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 150 },
            alignment: AlignmentType.LEFT,
          })
        );
        break;
      case 'ul':
        Array.from(node.children).forEach(li => {
          if (li.tagName.toLowerCase() === 'li') {
            const runs = walk(li, listLevel + 1, true);
            paragraphs.push(
              new Paragraph({
                children: runs,
                numbering: { reference: bulletRef, level: listLevel },
                spacing: { after: 80 },
              })
            );
          }
        });
        break;
      case 'li':
        return Array.from(node.childNodes).flatMap(child => walk(child, listLevel, true));
      case 'p':
        if (inListItem) {
          return Array.from(node.childNodes).flatMap(child => walk(child, listLevel, true));
        } else {
          paragraphs.push(
            new Paragraph({
              children: Array.from(node.childNodes).flatMap(child => walk(child, listLevel, false)),
              spacing: { after: 120 },
            })
          );
        }
        break;
      case 'strong':
      case 'b':
        return [new TextRun({ text: node.textContent, bold: true })];
      case 'br':
        return [new TextRun({ text: '\n' })];
      default:
        return Array.from(node.childNodes).flatMap(child => walk(child, listLevel, inListItem));
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

  // 定义无序列表样式
  const bulletRef = 'my-bullet';
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
    ],
  };

  // 解析 HTML 为带格式的 docx 段落
  const paragraphs = useKimi
    ? parseKimiHtmlToDocxParagraphs(html, bulletRef)
    : parseDeepSeekHtmlToDocxParagraphs(html, bulletRef);

  const doc = new Document({
    creator: 'PureText',
    title: finalFilename,
    description: '由 PureText 导出',
    numbering,
    sections: [
      {
        children: paragraphs.length > 0 ? paragraphs : [new Paragraph('')],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, finalFilename);
} 