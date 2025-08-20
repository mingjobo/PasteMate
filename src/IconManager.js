/**
 * 图标管理器 - 提供SVG图标资源
 */
class IconManager {
  static ICONS = {
    copy: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
    </svg>`,
    
    word: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.11 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-5.5-6L11 18h-1l-1.5-4L7 18H6l2.5-7h1L11 15l1.5-4h1L16 18h-1l-1.5-4z"/>
    </svg>`,
    
    pdf: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.11 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-9.5-6v4h1v-1.5h1c.83 0 1.5-.67 1.5-1.5v-1c0-.83-.67-1.5-1.5-1.5h-2zm1 1h1v1h-1v-1zm4 3h1v-4h-1v4zm3-4v4h1v-1.5h.5l.5 1.5h1l-.5-1.5c.28-.28.5-.61.5-1 0-.83-.67-1.5-1.5-1.5h-1.5zm1 1h.5v1h-.5v-1z"/>
    </svg>`,
    
    download: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
    </svg>`
  };

  /**
   * 获取图标HTML
   * @param {string} iconName - 图标名称
   * @param {string} color - 图标颜色
   * @returns {string} SVG图标HTML
   */
  static getIcon(iconName, color = 'currentColor') {
    const iconSvg = this.ICONS[iconName];
    if (!iconSvg) return '';
    
    return iconSvg.replace('fill="currentColor"', `fill="${color}"`);
  }

  /**
   * 创建图标元素
   * @param {string} iconName - 图标名称
   * @param {string} color - 图标颜色
   * @returns {HTMLElement} 图标元素
   */
  static createIconElement(iconName, color = 'currentColor') {
    const iconHtml = this.getIcon(iconName, color);
    if (!iconHtml) return null;

    const iconContainer = document.createElement('span');
    iconContainer.innerHTML = iconHtml;
    iconContainer.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-right: 4px;
      flex-shrink: 0;
    `;
    
    return iconContainer;
  }

  /**
   * 获取按钮对应的图标名称
   * @param {string} buttonType - 按钮类型 (copy, word, pdf)
   * @returns {string} 图标名称
   */
  static getButtonIcon(buttonType) {
    const iconMap = {
      copy: 'copy',
      word: 'word',
      pdf: 'pdf',
      downloadWord: 'word',
      downloadPdf: 'pdf'
    };
    
    return iconMap[buttonType] || 'copy';
  }
}

export { IconManager };