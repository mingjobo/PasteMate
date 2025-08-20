// 导出为 Word 工具函数，使用统一的 WordProcessor 处理
import { Packer } from 'docx';
import { saveAs } from 'file-saver';
import { WordProcessor } from './WordProcessor.js';
import { UserQuestionExtractor } from './UserQuestionExtractor.js';

/**
 * 将 HTML/纯文本内容导出为 Word 文件（使用统一的 WordProcessor）
 * @param {string|HTMLElement} content - HTML 字符串或 DOM 元素
 * @param {string} filename - 下载文件名，默认 PureText.docx
 * @param {HTMLElement} aiResponseElement - AI回复元素，用于获取用户问题
 * @param {string} source - 内容来源，'kimi' 或 'deepseek' 或 'auto'
 */
export async function exportToWord(content, filename = 'PureText.docx', aiResponseElement = null, source = 'auto') {
  console.log('[exportToWord] 开始导出，source:', source);
  
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
  
  try {
    // 使用统一的 WordProcessor 处理
    const doc = await WordProcessor.htmlToDocument(content, aiResponseElement, source);
    
    // 生成 Word 文件
    const blob = await Packer.toBlob(doc);
    saveAs(blob, finalFilename);
    
    console.log('[exportToWord] 导出成功:', finalFilename);
  } catch (error) {
    console.error('[exportToWord] 导出失败:', error);
    throw error;
  }
}