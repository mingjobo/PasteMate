/**
 * 统一的复制按钮组件
 * 提供一致的样式和行为
 */
import { BaseActionButton } from './BaseActionButton';

// 修改 CopyButton 继承 BaseActionButton，只保留复制相关逻辑
class CopyButton extends BaseActionButton {
  /**
   * 创建复制按钮
   * @param {HTMLElement} targetElement
   * @param {Function} onCopy
   * @returns {HTMLElement}
   */
  static create(targetElement, onCopy) {
    // 国际化文本
    const buttonText = chrome?.i18n ? chrome.i18n.getMessage('copyToWord') : '复制到 Word';
    // 判断是否是Kimi
    const isKimi = window.location.hostname === 'www.kimi.com';
    return super.createBaseButton(buttonText, onCopy, { targetElement, isKimi });
  }
}

// 导出类
export { CopyButton };