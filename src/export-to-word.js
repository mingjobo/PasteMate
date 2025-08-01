// 导出为 Word 工具函数，使用 docx 和 file-saver，兼容 HTML/纯文本输入
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

/**
 * 将 HTML/纯文本内容导出为 Word 文件
 * @param {string|HTMLElement} content - HTML 字符串或 DOM 元素
 * @param {string} filename - 下载文件名，默认 PureText.docx
 */
export async function exportToWord(content, filename = 'PureText.docx') {
  let html = '';
  if (typeof content === 'string') {
    html = content;
  } else if (content instanceof HTMLElement) {
    html = content.innerText || content.textContent || '';
  } else {
    throw new Error('内容类型不支持');
  }

  // 简单分段处理（按换行分段）
  const paragraphs = html.split(/\n+/).map(line =>
    new Paragraph({
      children: [new TextRun(line.trim())],
    })
  );

  const doc = new Document({
    creator: 'PureText',
    title: filename,
    description: '由 PureText 导出',
    sections: [
      {
        children: paragraphs.length > 0 ? paragraphs : [new Paragraph('')],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
} 