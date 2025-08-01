// 导出为 PDF 工具函数，依赖 html2pdf.js（需在 manifest 或 package.json 中声明依赖）
// 兼容 HTML/纯文本输入

/**
 * 将 HTML/纯文本内容导出为 PDF 文件
 * @param {string|HTMLElement} content - HTML 字符串或 DOM 元素
 * @param {string} filename - 下载文件名，默认 PureText.pdf
 */
export async function exportToPdf(content, filename = 'PureText.pdf') {
  let element;
  if (typeof content === 'string') {
    element = document.createElement('div');
    element.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    element = content;
  } else {
    throw new Error('内容类型不支持');
  }
  // 动态加载 html2pdf.js
  let html2pdf;
  if (!window.html2pdf) {
    html2pdf = (await import('html2pdf.js')).default;
    window.html2pdf = html2pdf;
  } else {
    html2pdf = window.html2pdf;
  }
  await html2pdf().from(element).set({
    margin: 10,
    filename,
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).save();
} 