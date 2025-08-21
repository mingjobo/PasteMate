import { IconManager } from './IconManager.js';
import logger from './Logger.js';

// 通用基础按钮父类，供所有操作按钮继承
class BaseActionButton {
  static BUTTON_CLASS = 'puretext-action-btn';
  static CONTAINER_CLASS = 'puretext-button-container';

  /**
   * 创建按钮容器和按钮元素
   * @param {string} text - 按钮文本
   * @param {Function} onAction - 按钮点击回调
   * @param {Object} options - 额外参数（如 isKimi、isDeepSeek、自定义样式、图标等）
   * @returns {HTMLElement} 按钮容器元素
   */
  static createBaseButton(text, onAction, options = {}) {
    const { targetElement, isKimi = false, isDeepSeek = false, customStyle = {}, iconName = null } = options;
    const container = document.createElement('div');
    container.className = this.CONTAINER_CLASS;
    this.applyContainerStyles(container, isKimi, isDeepSeek, customStyle);

    const button = document.createElement('button');
    button.className = this.BUTTON_CLASS;
    button.type = 'button';
    button.setAttribute('aria-label', text);
    button.setAttribute('title', text);
    
    // 添加图标和文本
    this.setupButtonContent(button, text, iconName);
    
    this.applyButtonStyles(button, isKimi, isDeepSeek);
    this.addButtonInteractions(button, this.getColorScheme(isDeepSeek));
    this.addActionEventListeners(button, targetElement, onAction);

    container.appendChild(button);
    return container;
  }

  /**
   * 设置按钮内容（图标+文本）
   * @param {HTMLElement} button - 按钮元素
   * @param {string} text - 按钮文本
   * @param {string} iconName - 图标名称
   */
  static setupButtonContent(button, text, iconName) {
    if (iconName) {
      const icon = IconManager.createIconElement(iconName);
      if (icon) {
        button.appendChild(icon);
      }
    }
    
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    textSpan.style.cssText = 'line-height: 1.2;';
    button.appendChild(textSpan);
  }

  static getColorScheme(isDeepSeek = false) {
    if (isDeepSeek) {
      return {
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
        text: '#6366f1',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        shadow: '0 2px 4px rgba(99, 102, 241, 0.1)',
        hoverBackground: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))',
        hoverShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
        activeBackground: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
        focus: '#6366f1'
      };
    }
    
    return {
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
      text: '#3b82f6',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      shadow: '0 2px 4px rgba(59, 130, 246, 0.1)',
      hoverBackground: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.15))',
      hoverShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
      activeBackground: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))',
      focus: '#3b82f6'
    };
  }

  static applyContainerStyles(container, isKimi = false, isDeepSeek = false, customStyle = {}) {
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      marginLeft: isDeepSeek ? '4px' : '8px',
      pointerEvents: 'auto',
      background: 'none',
      border: 'none',
      boxShadow: 'none',
      padding: '0'
    };
    
    Object.assign(container.style, baseStyles, customStyle);
  }

  static applyButtonStyles(button, isKimi = false, isDeepSeek = false) {
    const colorScheme = this.getColorScheme(isDeepSeek);
    
    const baseStyles = {
      all: 'initial',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isDeepSeek ? '4px 8px' : '6px 12px',
      minWidth: 'auto',
      height: isDeepSeek ? '24px' : '28px',
      fontSize: isDeepSeek ? '11px' : '12px',
      fontWeight: '500',
      lineHeight: '1.2',
      textAlign: 'center',
      whiteSpace: 'nowrap',
      background: colorScheme.background,
      color: colorScheme.text,
      border: colorScheme.border,
      borderRadius: '6px',
      boxShadow: colorScheme.shadow,
      cursor: 'pointer',
      pointerEvents: 'auto',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: 'translateZ(0)',
      willChange: 'transform, box-shadow, background',
      opacity: '1',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)'
    };
    
    Object.assign(button.style, baseStyles);
  }

  static addButtonInteractions(button, colorScheme) {
    button.addEventListener('mouseenter', () => {
      button.style.background = colorScheme.hoverBackground;
      button.style.transform = 'translateY(-2px) translateZ(0)';
      button.style.boxShadow = colorScheme.hoverShadow;
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = colorScheme.background;
      button.style.transform = 'translateY(0) translateZ(0)';
      button.style.boxShadow = colorScheme.shadow;
    });
    button.addEventListener('focus', () => {
      button.style.outline = `2px solid ${colorScheme.focus}`;
      button.style.outlineOffset = '2px';
    });
    button.addEventListener('blur', () => {
      button.style.outline = 'none';
    });
    button.addEventListener('mousedown', () => {
      button.style.transform = 'translateY(0) scale(0.96) translateZ(0)';
      button.style.background = colorScheme.activeBackground;
    });
    button.addEventListener('mouseup', () => {
      button.style.transform = 'translateY(-2px) scale(1) translateZ(0)';
      button.style.background = colorScheme.hoverBackground;
    });
    button.addEventListener('touchstart', (e) => {
      e.preventDefault();
      button.style.transform = 'scale(0.96) translateZ(0)';
      button.style.background = colorScheme.activeBackground;
    }, { passive: false });
    button.addEventListener('touchend', (e) => {
      e.preventDefault();
      button.style.transform = 'translateZ(0)';
      button.style.background = colorScheme.background;
    }, { passive: false });
  }

  static addClickFeedback(button) {
    button.style.transform = 'scale(0.95) translateZ(0)';
    setTimeout(() => {
      button.style.transform = 'translateZ(0)';
    }, 150);
    // const originalText = button.textContent;
    // button.textContent = '处理中...';
    // setTimeout(() => {
    //   button.textContent = originalText;
    // }, 500);
  }

  static hasButton(element) {
    return element.querySelector(`.${this.CONTAINER_CLASS}`) !== null;
  }

  static removeButton(element) {
    const existingButton = element.querySelector(`.${this.CONTAINER_CLASS}`);
    if (existingButton) {
      existingButton.remove();
    }
  }

  static positionButton(container, targetElement) {
    const computedStyle = window.getComputedStyle(targetElement);
    if (computedStyle.position === 'static') {
      targetElement.style.position = 'relative';
    }
    const rect = targetElement.getBoundingClientRect();
    const style = window.getComputedStyle(targetElement);
    const paddingRight = parseInt(style.paddingRight) || 0;
    const paddingBottom = parseInt(style.paddingBottom) || 0;
    const rightOffset = Math.max(8, paddingRight + 4);
    const bottomOffset = Math.max(8, paddingBottom + 4);
    container.style.right = `${rightOffset}px`;
    container.style.bottom = `${bottomOffset}px`;
    this.ensureInViewport(container, targetElement);
  }

  static ensureInViewport(container, targetElement) {
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
        logger.debug('Error ensuring button in viewport:', error);
      }
    }, 50);
  }

  /**
   * 事件监听器，子类可重写
   */
  static addActionEventListeners(button, targetElement, onAction) {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.addClickFeedback(button);
      try {
        if (onAction) {
          await onAction(targetElement);
        }
      } catch (error) {
        logger.error('Action failed:', error);
      }
    });
    button.addEventListener('keydown', async (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        this.addClickFeedback(button);
        try {
          if (onAction) {
            await onAction(targetElement);
          }
        } catch (error) {
          logger.error('Action failed:', error);
        }
      }
    });
  }
}

export { BaseActionButton }; 