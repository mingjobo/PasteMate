// 导出为 PDF 工具函数，使用打包的 html2pdf.js
// 兼容 HTML/纯文本输入

/**
 * 将 HTML/纯文本内容导出为 PDF 文件
 * @param {string|HTMLElement} content - HTML 字符串或 DOM 元素
 * @param {string} filename - 下载文件名，默认 PureText.pdf
 */
export async function exportToPdf(content, filename = 'PureText.pdf') {
  try {
    let element;
    if (typeof content === 'string') {
      element = document.createElement('div');
      element.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      element = content;
    } else {
      throw new Error('内容类型不支持');
    }

    console.log('PureText: 开始生成 PDF...');
    
    // 使用打包的 html2pdf
    const html2pdf = window.html2pdf;
    
    if (!html2pdf) {
      throw new Error('PDF 导出功能不可用，html2pdf 未加载');
    }
    
    await html2pdf().from(element).set({
      margin: 10,
      filename,
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
    
    console.log(`PureText: PDF 导出成功 - ${filename}`);
    
  } catch (error) {
    console.error('PureText: PDF 导出失败:', error);
    throw new Error('PDF 导出失败: ' + error.message);
  }
} 