// 导出为 Word 工具函数，使用 docx 和 file-saver，兼容 HTML/纯文本输入
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { UserQuestionExtractor } from './UserQuestionExtractor.js';

/**
 * 将 HTML/纯文本内容导出为 Word 文件
 * @param {string|HTMLElement} content - HTML 字符串或 DOM 元素
 * @param {string} filename - 下载文件名，默认 PureText.docx
 * @param {HTMLElement} aiResponseElement - AI回复元素，用于获取用户问题
 */
export async function exportToWord(content, filename = 'PureText.docx', aiResponseElement = null) {
  let html = '';
  if (typeof content === 'string') {
    html = content;
  } else if (content instanceof HTMLElement) {
    html = content.innerText || content.textContent || '';
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

  // 简单分段处理（按换行分段）
  const paragraphs = html.split(/\n+/).map(line =>
    new Paragraph({
      children: [new TextRun(line.trim())],
    })
  );

  const doc = new Document({
    creator: 'PureText',
    title: finalFilename,
    description: '由 PureText 导出',
    sections: [
      {
        children: paragraphs.length > 0 ? paragraphs : [new Paragraph('')],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, finalFilename);
} 