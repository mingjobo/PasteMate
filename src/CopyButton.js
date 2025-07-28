/**
 * 统一的复制按钮组件
 * 提供一致的样式和行为
 */
import { BaseActionButton } from './BaseActionButton.js';

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

// 兼容 content.js 旧用法：补充静态属性和方法
CopyButton.BUTTON_CLASS = 'puretext-copy-btn';
CopyButton.CONTAINER_CLASS = 'puretext-button-container';

CopyButton.hasButton = function(element) {
  return element.querySelector(`.${CopyButton.CONTAINER_CLASS}`) !== null;
};

CopyButton.removeButton = function(element) {
  const existingButton = element.querySelector(`.${CopyButton.CONTAINER_CLASS}`);
  if (existingButton) existingButton.remove();
};

CopyButton.positionButton = function(container, targetElement) {
  const computedStyle = window.getComputedStyle(targetElement);
  if (computedStyle.position === 'static') {
    targetElement.style.position = 'relative';
  }
  const style = window.getComputedStyle(targetElement);
  const paddingRight = parseInt(style.paddingRight) || 0;
  const paddingBottom = parseInt(style.paddingBottom) || 0;
  const rightOffset = Math.max(8, paddingRight + 4);
  const bottomOffset = Math.max(8, paddingBottom + 4);
  container.style.right = `${rightOffset}px`;
  container.style.bottom = `${bottomOffset}px`;
  CopyButton.ensureInViewport(container, targetElement);
};

CopyButton.ensureInViewport = function(container, targetElement) {
  setTimeout(() => {
    try {
      const containerRect = container.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      if (containerRect.right > viewportWidth) {
        container.style.right = 'auto';
        container.style.left = '8px';
      }
      if (containerRect.bottom > viewportHeight) {
        container.style.bottom = 'auto';
        container.style.top = '8px';
      }
      if (containerRect.left < 0) {
        container.style.left = '8px';
        container.style.right = 'auto';
      }
      if (containerRect.top < 0) {
        container.style.top = '8px';
        container.style.bottom = 'auto';
      }
    } catch (error) {
      // 忽略
    }
  }, 50);
};

// 导出类
export { CopyButton };