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
    const buttonText = chrome?.i18n ? chrome.i18n.getMessage('copyToWord') : '复制为Word格式';
    // 判断是否是Kimi或DeepSeek
    const isKimi = window.location.hostname === 'www.kimi.com';
    const isDeepSeek = window.location.hostname === 'chat.deepseek.com';
    
    // 为DeepSeek提供特殊样式配置
    const customStyle = isDeepSeek ? {
      marginLeft: '4px',
      display: 'inline-flex'
    } : {};
    
    return super.createBaseButton(buttonText, onCopy, { 
      targetElement, 
      isKimi, 
      isDeepSeek,
      customStyle,
      iconName: 'copy'
    });
  }
}

// 兼容 content.js 旧用法：补充静态属性和方法，直接继承BaseActionButton的方法
CopyButton.BUTTON_CLASS = 'puretext-copy-btn';
CopyButton.CONTAINER_CLASS = 'puretext-button-container';

// 继承BaseActionButton的静态方法
CopyButton.hasButton = BaseActionButton.hasButton;
CopyButton.removeButton = BaseActionButton.removeButton;
CopyButton.positionButton = BaseActionButton.positionButton;
CopyButton.ensureInViewport = BaseActionButton.ensureInViewport;

// 导出类
export { CopyButton };