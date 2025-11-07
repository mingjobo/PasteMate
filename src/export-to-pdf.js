// 导出为 PDF 工具函数，使用打包的 html2pdf.js
// 兼容 HTML/纯文本输入
import { UserQuestionExtractor } from './UserQuestionExtractor.js';
import logger from './Logger.js';

/**
 * 将 HTML/纯文本内容导出为 PDF 文件
 * @param {string|HTMLElement} content - HTML 字符串或 DOM 元素
 * @param {string} filename - 下载文件名，默认 PureText.pdf
 * @param {HTMLElement} aiResponseElement - AI回复元素，用于获取用户问题
 */
export async function exportToPdf(content, filename = 'PureText.pdf', aiResponseElement = null) {
  try {
    let element;
    if (typeof content === 'string') {
      element = document.createElement('div');
      element.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      // 创建元素的深拷贝，避免影响原始页面
      element = content.cloneNode(true);
    } else {
      throw new Error('内容类型不支持');
    }

    logger.info('开始生成 PDF...');
    
    // 生成智能文件名
    let finalFilename = filename;
    if (aiResponseElement && filename === 'PureText.pdf') {
      try {
        const userQuestion = UserQuestionExtractor.getUserQuestion(aiResponseElement);
        finalFilename = UserQuestionExtractor.generateFilename(userQuestion, 'pdf');
        logger.debug('生成智能文件名:', finalFilename);
      } catch (error) {
        logger.error('生成文件名失败:', error);
      }
    }
    
    // 为DeepSeek网站添加特殊的PDF样式处理
    const isDeepSeek = window.location.hostname === 'chat.deepseek.com';
    if (isDeepSeek) {
      logger.debug('检测到DeepSeek网站，应用特殊PDF样式');
      applyDeepSeekPdfStyles(element);
    }
    
    // 为Kimi网站添加特殊的PDF样式处理
    const isKimi = window.location.hostname === 'www.kimi.com';
    if (isKimi) {
      logger.debug('检测到Kimi网站，应用特殊PDF样式');
      applyKimiPdfStyles(element);
    }
    
    // 使用打包的 html2pdf
    const html2pdf = window.html2pdf;
    
    if (!html2pdf) {
      throw new Error('PDF 导出功能不可用，html2pdf 未加载');
    }
    
    await html2pdf().from(element).set({
      margin: 10,
      filename: finalFilename,
      html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    }).save();
    
    logger.info(`PDF 导出成功 - ${finalFilename}`);
    
  } catch (error) {
    logger.error('PDF 导出失败:', error);
    throw new Error('PDF 导出失败: ' + error.message);
  }
}

/**
 * 为DeepSeek网站应用特殊的PDF样式
 * @param {HTMLElement} element - 要处理的DOM元素（副本）
 */
function applyDeepSeekPdfStyles(element) {
  try {
    // 为元素添加一个唯一的类名，用于样式作用域
    const pdfContainerClass = 'puretext-pdf-container-' + Date.now();
    element.classList.add(pdfContainerClass);
    
    // 创建一个新的样式元素，使用作用域样式
    const style = document.createElement('style');
    style.textContent = `
      /* DeepSeek PDF 样式重置 - 仅作用于PDF容器 */
      .${pdfContainerClass} * {
        color: #000000 !important;
        background-color: transparent !important;
        border-color: #000000 !important;
      }
      
      /* 确保所有文本都是黑色 */
      .${pdfContainerClass} p, .${pdfContainerClass} div, .${pdfContainerClass} span, 
      .${pdfContainerClass} h1, .${pdfContainerClass} h2, .${pdfContainerClass} h3, 
      .${pdfContainerClass} h4, .${pdfContainerClass} h5, .${pdfContainerClass} h6, 
      .${pdfContainerClass} li, .${pdfContainerClass} blockquote, .${pdfContainerClass} pre, 
      .${pdfContainerClass} code {
        color: #000000 !important;
      }
      
      /* 代码块保持背景色 */
      .${pdfContainerClass} pre, .${pdfContainerClass} code {
        background-color: #f5f5f5 !important;
        border: 1px solid #e0e0e0 !important;
      }
      
      /* 引用块样式 */
      .${pdfContainerClass} blockquote {
        border-left: 4px solid #e0e0e0 !important;
        padding-left: 16px !important;
        margin: 16px 0 !important;
      }
      
      /* 列表样式 */
      .${pdfContainerClass} ul, .${pdfContainerClass} ol {
        color: #000000 !important;
      }
      
      .${pdfContainerClass} li {
        color: #000000 !important;
      }
      
      /* 链接样式 */
      .${pdfContainerClass} a {
        color: #0066cc !important;
        text-decoration: underline !important;
      }
      
      /* 表格样式 */
      .${pdfContainerClass} table {
        border-collapse: collapse !important;
      }
      
      .${pdfContainerClass} th, .${pdfContainerClass} td {
        border: 1px solid #000000 !important;
        color: #000000 !important;
        padding: 8px !important;
      }
      
      /* 确保没有透明或白色文字 */
      .${pdfContainerClass} [style*="color: white"], 
      .${pdfContainerClass} [style*="color: #fff"], 
      .${pdfContainerClass} [style*="color: #ffffff"] {
        color: #000000 !important;
      }
      
      .${pdfContainerClass} [style*="color: transparent"] {
        color: #000000 !important;
      }
    `;
    
    // 将样式添加到元素中
    element.appendChild(style);
    
    // 遍历所有子元素，强制设置黑色文字（仅限副本中的元素）
    const allElements = element.querySelectorAll('*');
    allElements.forEach(el => {
      const computedStyle = window.getComputedStyle(el);
      const color = computedStyle.color;
      
      // 检查是否是白色或透明色
      if (color === 'rgba(0, 0, 0, 0)' || 
          color === 'transparent' || 
          color === 'rgb(255, 255, 255)' || 
          color === 'rgba(255, 255, 255, 1)' ||
          color === '#ffffff' ||
          color === '#fff') {
        el.style.setProperty('color', '#000000', 'important');
      }
      
      // 确保背景色不影响文字可读性
      const backgroundColor = computedStyle.backgroundColor;
      if (backgroundColor === 'rgb(255, 255, 255)' || 
          backgroundColor === 'rgba(255, 255, 255, 1)' ||
          backgroundColor === '#ffffff' ||
          backgroundColor === '#fff') {
        el.style.setProperty('background-color', 'transparent', 'important');
      }
    });
    
    logger.debug('DeepSeek PDF 样式应用完成');
    
  } catch (error) {
    logger.error('应用DeepSeek PDF样式失败:', error);
  }
}

/**
 * 为Kimi网站应用特殊的PDF样式
 * @param {HTMLElement} element - 要处理的DOM元素（副本）
 */
function applyKimiPdfStyles(element) {
  try {
    // 兜底清理：移除任何残留的AI思考内容
    removeThinkingContent(element);

    // 为元素添加一个唯一的类名，用于样式作用域
    const pdfContainerClass = 'puretext-kimi-pdf-container-' + Date.now();
    element.classList.add(pdfContainerClass);
    
    // 创建一个新的样式元素，使用作用域样式
    const style = document.createElement('style');
    style.textContent = `
      /* Kimi PDF 样式重置 - 仅作用于PDF容器 */
      .${pdfContainerClass} * {
        color: #000000 !important;
        background-color: transparent !important;
        border-color: #000000 !important;
      }
      
      /* 确保所有文本都是黑色 */
      .${pdfContainerClass} p, .${pdfContainerClass} div, .${pdfContainerClass} span, 
      .${pdfContainerClass} h1, .${pdfContainerClass} h2, .${pdfContainerClass} h3, 
      .${pdfContainerClass} h4, .${pdfContainerClass} h5, .${pdfContainerClass} h6, 
      .${pdfContainerClass} li, .${pdfContainerClass} blockquote, .${pdfContainerClass} pre, 
      .${pdfContainerClass} code {
        color: #000000 !important;
      }
      
      /* 修复列表样式 - 强制版本 */
      .${pdfContainerClass} ul, .${pdfContainerClass} ol {
        color: #000000 !important;
        list-style-position: outside !important;
        padding-left: 40px !important;
        margin: 8px 0 !important;
        margin-left: 10px !important;
      }
      
      .${pdfContainerClass} li {
        color: #000000 !important;
        margin: -2px 0 !important;
        line-height: 1.5 !important;
        padding-left: 10px !important;
        position: relative !important;
        transform: translateY(-3px) !important;
      }
      
      /* 强制重置任何可能导致重叠的样式 */
      .${pdfContainerClass} ol li::marker,
      .${pdfContainerClass} ul li::marker {
        color: #000000 !important;
      }
      
      /* 代码块保持背景色 */
      .${pdfContainerClass} pre, .${pdfContainerClass} code {
        background-color: #f5f5f5 !important;
        border: 1px solid #e0e0e0 !important;
        color: #000000 !important;
      }
      
      /* 引用块样式 */
      .${pdfContainerClass} blockquote {
        border-left: 4px solid #e0e0e0 !important;
        padding-left: 16px !important;
        margin: 16px 0 !important;
        color: #000000 !important;
      }
      
      /* 链接样式 */
      .${pdfContainerClass} a {
        color: #0066cc !important;
        text-decoration: underline !important;
      }
      
      /* 表格样式 */
      .${pdfContainerClass} table {
        border-collapse: collapse !important;
        width: 100% !important;
      }
      
      .${pdfContainerClass} th, .${pdfContainerClass} td {
        border: 1px solid #000000 !important;
        color: #000000 !important;
        padding: 8px !important;
      }
      
      /* 确保没有透明或白色文字 */
      .${pdfContainerClass} [style*="color: white"], 
      .${pdfContainerClass} [style*="color: #fff"], 
      .${pdfContainerClass} [style*="color: #ffffff"] {
        color: #000000 !important;
      }
      
      .${pdfContainerClass} [style*="color: transparent"] {
        color: #000000 !important;
      }
      
      /* 段落间距 */
      .${pdfContainerClass} p {
        margin: 8px 0 !important;
      }
      
      /* 标题间距 */
      .${pdfContainerClass} h1, .${pdfContainerClass} h2, .${pdfContainerClass} h3, 
      .${pdfContainerClass} h4, .${pdfContainerClass} h5, .${pdfContainerClass} h6 {
        margin: 16px 0 8px 0 !important;
        color: #000000 !important;
      }
    `;
    
    // 将样式添加到元素中
    element.appendChild(style);
    
    // 遍历所有子元素，强制设置黑色文字（仅限副本中的元素）
    const allElements = element.querySelectorAll('*');
    allElements.forEach(el => {
      const computedStyle = window.getComputedStyle(el);
      const color = computedStyle.color;
      
      // 检查是否是白色或透明色
      if (color === 'rgba(0, 0, 0, 0)' || 
          color === 'transparent' || 
          color === 'rgb(255, 255, 255)' || 
          color === 'rgba(255, 255, 255, 1)' ||
          color === '#ffffff' ||
          color === '#fff') {
        el.style.setProperty('color', '#000000', 'important');
      }
      
      // 强制处理列表样式，确保序号不重叠
      if (el.tagName === 'OL' || el.tagName === 'UL') {
        el.style.setProperty('list-style-position', 'outside', 'important');
        el.style.setProperty('padding-left', '40px', 'important');
        el.style.setProperty('margin-left', '10px', 'important');
        // 移除任何可能导致问题的样式
        el.style.removeProperty('text-indent');
        el.style.removeProperty('margin-left');
        el.style.setProperty('margin-left', '10px', 'important');
      }
      
      if (el.tagName === 'LI') {
        el.style.setProperty('padding-left', '10px', 'important');
        el.style.setProperty('margin-left', '0', 'important');
        el.style.setProperty('text-indent', '0', 'important');
        el.style.setProperty('position', 'relative', 'important');
        el.style.setProperty('transform', 'translateY(-3px)', 'important');
        // 移除任何负边距
        el.style.removeProperty('margin-left');
        el.style.setProperty('margin-left', '0', 'important');
      }
      
      // 确保背景色不影响文字可读性
      const backgroundColor = computedStyle.backgroundColor;
      if (backgroundColor === 'rgb(255, 255, 255)' || 
          backgroundColor === 'rgba(255, 255, 255, 1)' ||
          backgroundColor === '#ffffff' ||
          backgroundColor === '#fff') {
        el.style.setProperty('background-color', 'transparent', 'important');
      }
    });
    
    logger.debug('Kimi PDF 样式应用完成');

  } catch (error) {
    logger.error('应用Kimi PDF样式失败:', error);
  }
}

/**
 * 移除思考内容（兜底清理函数）
 * @param {HTMLElement} element - 要处理的DOM元素
 */
function removeThinkingContent(element) {
  try {
    // 移除思考相关的容器和元素
    const thinkingSelectors = [
      '.think-stage',
      '.toolcall-container',
      '.toolcall-content',
      '.toolcall-title',
      '.toolcall-title-status',
      '.toolcall-content-text',
      '.thinking-container',
      '.thought-process',
      '.reasoning-box',
      '.thinking-box',
      '.ai-thinking',
      '.thought-bubble',
      '.internal-thought',
      '.cognitive-process',
      '[data-thinking="true"]',
      '[data-thought="true"]',
      '[data-reasoning="true"]',
      '[data-internal="true"]',
      '[data-process="true"]',
      '.thinking',
      '.analysis-box'
    ];

    let removedCount = 0;
    thinkingSelectors.forEach(selector => {
      const elements = element.querySelectorAll(selector);
      elements.forEach(el => {
        el.remove();
        removedCount++;
      });
    });

    // 移除包含"思考已完成"等文本的元素
    const allElements = element.querySelectorAll('*');
    allElements.forEach(el => {
      const text = el.textContent?.trim() || '';
      if (text.includes('思考已完成') ||
          text.includes('思考过程') ||
          text.includes('思路分析') ||
          text.includes('推理过程')) {
        // 检查是否是思考标题或状态指示器
        if (el.classList.contains('toolcall-title-status') ||
            el.classList.contains('toolcall-title') ||
            el.closest('.toolcall-title')) {
          el.remove();
          removedCount++;
        }
      }
    });

    if (removedCount > 0) {
      logger.debug(`兜底清理：移除了 ${removedCount} 个思考相关元素`);
    }

  } catch (error) {
    logger.error('移除思考内容失败:', error);
  }
} 