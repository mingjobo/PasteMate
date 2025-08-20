import { BaseActionButton } from './BaseActionButton.js';

class DownloadWordButton extends BaseActionButton {
  /**
   * 创建“下载为 Word”按钮
   * @param {HTMLElement} targetElement
   * @param {Function} onDownload
   * @param {Object} options - { icon, textMode }
   * @returns {HTMLElement}
   */
  static create(targetElement, onDownload, options = {}) {
    const buttonText = chrome?.i18n ? chrome.i18n.getMessage('downloadAsWord') : '下载为Word';
    const isKimi = window.location.hostname === 'www.kimi.com';
    const isDeepSeek = window.location.hostname === 'chat.deepseek.com';
    const { customStyle = {} } = options;
    return super.createBaseButton(buttonText, onDownload, {
      targetElement,
      isKimi,
      isDeepSeek,
      customStyle,
      iconName: 'word'
    });
  }
}

DownloadWordButton.BUTTON_CLASS = 'puretext-download-word-btn';
DownloadWordButton.CONTAINER_CLASS = 'puretext-button-container';

export { DownloadWordButton }; 