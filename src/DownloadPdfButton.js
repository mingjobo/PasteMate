import { BaseActionButton } from './BaseActionButton.js';

class DownloadPdfButton extends BaseActionButton {
  /**
   * 创建“下载为 PDF”按钮
   * @param {HTMLElement} targetElement
   * @param {Function} onDownload
   * @param {Object} options - { icon, textMode }
   * @returns {HTMLElement}
   */
  static create(targetElement, onDownload, options = {}) {
    const buttonText = chrome?.i18n ? chrome.i18n.getMessage('downloadAsPdf') : '下载为 PDF';
    const isKimi = window.location.hostname === 'www.kimi.com';
    const isDeepSeek = window.location.hostname === 'chat.deepseek.com';
    const { customStyle = {} } = options;
    return super.createBaseButton(buttonText, onDownload, {
      targetElement,
      isKimi,
      isDeepSeek,
      customStyle
    });
  }
}

DownloadPdfButton.BUTTON_CLASS = 'puretext-download-pdf-btn';
DownloadPdfButton.CONTAINER_CLASS = 'puretext-button-container';

export { DownloadPdfButton }; 