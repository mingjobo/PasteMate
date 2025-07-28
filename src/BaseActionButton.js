// 通用基础按钮父类，供所有操作按钮继承
class BaseActionButton {
  static BUTTON_CLASS = 'puretext-action-btn';
  static CONTAINER_CLASS = 'puretext-button-container';

  /**
   * 创建按钮容器和按钮元素
   * @param {string} text - 按钮文本
   * @param {Function} onAction - 按钮点击回调
   * @param {Object} options - 额外参数（如 isKimi、isDeepSeek、自定义样式等）
   * @returns {HTMLElement} 按钮容器元素
   */
  static createBaseButton(text, onAction, options = {}) {
    const { targetElement, isKimi = false, isDeepSeek = false, customStyle = {} } = options;
    const container = document.createElement('div');
    container.className = this.CONTAINER_CLASS;
    this.applyContainerStyles(container, isKimi, isDeepSeek, customStyle);

    const button = document.createElement('button');
    button.className = this.BUTTON_CLASS;
    button.textContent = text;
    button.type = 'button';
    button.setAttribute('aria-label', text);
    button.setAttribute('title', text);
    this.applyButtonStyles(button, isKimi, isDeepSeek);
    this.addButtonInteractions(button, this.getColorScheme(isDeepSeek));
    this.addActionEventListeners(button, targetElement, onAction);

    container.appendChild(button);
    return container;
  }

  static getColorScheme(isDeepSeek = false) {
    if (isDeepSeek) {
      return {
        background: 'transparent',
        text: 'rgba(255, 255, 255, 0.7)',
        border: 'none',
        shadow: 'none',
        hoverBackground: 'rgba(255, 255, 255, 0.1)',
        hoverShadow: 'none',
        activeBackground: 'rgba(255, 255, 255, 0.15)',
        focus: '#3b82f6'
      };
    }
    
    return {
      background: 'transparent',
      text: 'var(--color-text-1, #374151)',
      border: 'none',
      shadow: 'none',
      hoverBackground: 'var(--color-fill-2, rgba(0, 0, 0, 0.04))',
      hoverShadow: 'none',
      activeBackground: 'var(--color-fill-3, rgba(0, 0, 0, 0.08))',
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
      fontFamily: 'inherit',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isDeepSeek ? '2px 6px' : '4px 8px',
      minWidth: 'auto',
      height: isDeepSeek ? '20px' : '24px',
      fontSize: isDeepSeek ? '11px' : '12px',
      fontWeight: '400',
      lineHeight: '1.2',
      textAlign: 'center',
      whiteSpace: 'nowrap',
      background: colorScheme.background,
      color: colorScheme.text,
      border: colorScheme.border,
      borderRadius: '4px',
      boxShadow: colorScheme.shadow,
      cursor: 'pointer',
      pointerEvents: 'auto',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      transition: 'all 0.15s ease',
      transform: 'translateZ(0)',
      willChange: 'background-color',
      opacity: isDeepSeek ? '0.8' : '1'
    };
    
    Object.assign(button.style, baseStyles);
  }

  static addButtonInteractions(button, colorScheme) {
    button.addEventListener('mouseenter', () => {
      button.style.opacity = '1';
      button.style.background = colorScheme.hoverBackground;
      button.style.transform = 'translateY(-1px) translateZ(0)';
      button.style.boxShadow = `0 2px 6px ${colorScheme.hoverShadow}`;
    });
    button.addEventListener('mouseleave', () => {
      button.style.opacity = '0.9';
      button.style.background = colorScheme.background;
      button.style.transform = 'translateY(0) translateZ(0)';
      button.style.boxShadow = `0 1px 3px ${colorScheme.shadow}`;
    });
    button.addEventListener('focus', () => {
      button.style.outline = `2px solid ${colorScheme.focus}`;
      button.style.outlineOffset = '2px';
      button.style.opacity = '1';
    });
    button.addEventListener('blur', () => {
      button.style.outline = 'none';
      button.style.opacity = '0.9';
    });
    button.addEventListener('mousedown', () => {
      button.style.transform = 'translateY(0) scale(0.98) translateZ(0)';
      button.style.background = colorScheme.activeBackground;
    });
    button.addEventListener('mouseup', () => {
      button.style.transform = 'translateY(-1px) translateZ(0)';
      button.style.background = colorScheme.hoverBackground;
    });
    button.addEventListener('touchstart', (e) => {
      e.preventDefault();
      button.style.transform = 'scale(0.98) translateZ(0)';
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
    const originalText = button.textContent;
    button.textContent = '处理中...';
    setTimeout(() => {
      button.textContent = originalText;
    }, 500);
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
        console.debug('PureText: Error ensuring button in viewport:', error);
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
        console.error('PureText: Action failed:', error);
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
          console.error('PureText: Action failed:', error);
        }
      }
    });
  }
}

export { BaseActionButton }; 