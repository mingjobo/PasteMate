// 导出为 Word 工具函数，使用 docx 和 file-saver，兼容 HTML/纯文本输入
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Numbering, LevelFormat } from 'docx';
import { saveAs } from 'file-saver';
import { UserQuestionExtractor } from './UserQuestionExtractor.js';

/**
 * 递归解析 HTML 字符串为 docx 段落数组，支持标题、段落、无序列表、加粗、换行等
 * @param {string} html
 * @param {string} bulletRef - 列表样式引用名
 * @returns {Paragraph[]}
 */
function parseHtmlToDocxParagraphs(html, bulletRef = 'my-bullet') {
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
            // 递归时标记 inListItem = true
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
        // 递归处理 li 内部所有内容，inListItem = true
        return Array.from(node.childNodes).flatMap(child => walk(child, listLevel, true));
      case 'p':
        if (inListItem) {
          // 如果在 li 里，只返回 TextRun，不 push Paragraph
          return Array.from(node.childNodes).flatMap(child => walk(child, listLevel, true));
        } else {
          // ul/li 之外的 p，才 push Paragraph
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
 */
export async function exportToWord(content, filename = 'PureText.docx', aiResponseElement = null) {
  let html = '';
  if (typeof content === 'string') {
    html = content;
  } else if (content instanceof HTMLElement) {
    html = content.innerHTML || '';
  } else {
    throw new Error('内容类型不支持');
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
  const paragraphs = parseHtmlToDocxParagraphs(html, bulletRef);

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