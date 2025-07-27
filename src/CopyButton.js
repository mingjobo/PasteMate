/**
 * 统一的复制按钮组件
 * 提供一致的样式和行为
 */
class CopyButton {
  static BUTTON_CLASS = 'puretext-copy-btn';
  static CONTAINER_CLASS = 'puretext-button-container';

  /**
   * 创建复制按钮
   * @param {HTMLElement} targetElement - 目标元素（要复制内容的元素）
   * @param {Function} onCopy - 复制回调函数
   * @returns {HTMLElement} 按钮容器元素
   */
  static create(targetElement, onCopy) {
    // 创建按钮容器
    const container = document.createElement('div');
    container.className = this.CONTAINER_CLASS;
    
    // 创建按钮
    const button = document.createElement('button');
    button.className = this.BUTTON_CLASS;
    
    // 设置按钮文本（支持国际化）
    const buttonText = chrome?.i18n ? chrome.i18n.getMessage('copyToWord') : '复制到 Word';
    button.textContent = buttonText;
    
    // 设置按钮属性
    button.type = 'button';
    button.setAttribute('aria-label', buttonText);
    button.setAttribute('title', buttonText);
    
    // 检查是否是Kimi网站，如果是则使用特殊的样式
    const isKimi = window.location.hostname === 'www.kimi.com';
    
    // 应用样式
    this.applyContainerStyles(container, isKimi);
    this.applyButtonStyles(button, isKimi);
    
    // 添加事件监听器
    this.addEventListeners(button, targetElement, onCopy);
    
    // 组装
    container.appendChild(button);
    
    return container;
  }

  /**
   * 应用容器样式
   * @param {HTMLElement} container - 容器元素
   * @param {boolean} isKimi - 是否是Kimi网站
   */
  static applyContainerStyles(container, isKimi = false) {
    if (isKimi) {
      // Kimi网站的容器样式 - 内联显示，不覆盖其他元素
      container.style.cssText = `
        display: inline-block;
        margin-left: 8px;
        vertical-align: middle;
        pointer-events: auto;
      `;
    } else {
      // 其他网站的容器样式 - 绝对定位
      container.style.cssText = `
        position: absolute;
        bottom: 8px;
        right: 8px;
        z-index: 10001;
        pointer-events: none;
      `;
    }
  }

  /**
   * 应用按钮样式
   * @param {HTMLElement} button - 按钮元素
   * @param {boolean} isKimi - 是否是Kimi网站
   */
  static applyButtonStyles(button, isKimi = false) {
    if (isKimi) {
      // Kimi网站的按钮样式 - 与现有按钮保持一致
      const colorScheme = {
        background: 'transparent',
        text: 'var(--color-text-1, #374151)',
        border: 'none',
        shadow: 'none',
        hoverBackground: 'var(--color-fill-2, rgba(0, 0, 0, 0.04))',
        hoverShadow: 'none',
        activeBackground: 'var(--color-fill-3, rgba(0, 0, 0, 0.08))',
        focus: '#3b82f6'
      };

      button.style.cssText = `
        all: initial;
        font-family: inherit;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 4px 8px;
        min-width: auto;
        height: 24px;
        font-size: 12px;
        font-weight: 400;
        line-height: 1.2;
        text-align: center;
        white-space: nowrap;
        background: ${colorScheme.background};
        color: ${colorScheme.text};
        border: ${colorScheme.border};
        border-radius: 4px;
        box-shadow: ${colorScheme.shadow};
        cursor: pointer;
        pointer-events: auto;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        transition: all 0.15s ease;
        transform: translateZ(0);
        will-change: background-color;
        opacity: 1;
      `;

      this.addButtonInteractions(button, colorScheme);
    } else {
      // 其他网站的按钮样式 - 保持原有样式
      const colorScheme = {
        background: 'rgba(255, 255, 255, 0.95)',
        text: '#374151',
        border: 'rgba(0, 0, 0, 0.1)',
        shadow: 'rgba(0, 0, 0, 0.1)',
        hoverBackground: '#f3f4f6',
        hoverShadow: 'rgba(0, 0, 0, 0.15)',
        activeBackground: '#e5e7eb',
        focus: '#3b82f6'
      };

      button.style.cssText = `
        /* 重置样式 */
        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        
        /* 基础样式 */
        display: inline-flex;
        align-items: center;
        justify-content: center;
        
        /* 尺寸和间距 */
        padding: 6px 12px;
        min-width: 80px;
        height: 28px;
        
        /* 字体 */
        font-size: 11px;
        font-weight: 500;
        line-height: 1.2;
        letter-spacing: 0.01em;
        text-align: center;
        white-space: nowrap;
        
        /* 颜色 */
        background: ${colorScheme.background};
        color: ${colorScheme.text};
        border: 1px solid ${colorScheme.border};
        border-radius: 6px;
        box-shadow: 0 1px 3px ${colorScheme.shadow};
        
        /* 交互 */
        cursor: pointer;
        pointer-events: auto;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        
        /* 动画 */
        transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        transform: translateZ(0);
        will-change: transform, box-shadow, background-color;
        
        /* 视觉效果 */
        opacity: 0.9;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
      `;

      this.addButtonInteractions(button, colorScheme);
    }
  }

  /**
   * 添加按钮交互效果
   * @param {HTMLElement} button - 按钮元素
   * @param {Object} colorScheme - 颜色方案
   */
  static addButtonInteractions(button, colorScheme) {
    // 悬停效果
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

    // 焦点样式（键盘导航支持）
    button.addEventListener('focus', () => {
      button.style.outline = `2px solid ${colorScheme.focus}`;
      button.style.outlineOffset = '2px';
      button.style.opacity = '1';
    });

    button.addEventListener('blur', () => {
      button.style.outline = 'none';
      button.style.opacity = '0.9';
    });

    // 点击效果
    button.addEventListener('mousedown', () => {
      button.style.transform = 'translateY(0) scale(0.98) translateZ(0)';
      button.style.background = colorScheme.activeBackground;
    });

    button.addEventListener('mouseup', () => {
      button.style.transform = 'translateY(-1px) translateZ(0)';
      button.style.background = colorScheme.hoverBackground;
    });

    // 触摸设备支持
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

  /**
   * 添加事件监听器
   * @param {HTMLElement} button - 按钮元素
   * @param {HTMLElement} targetElement - 目标元素
   * @param {Function} onCopy - 复制回调函数
   */
  static addEventListeners(button, targetElement, onCopy) {
    // 点击事件
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      // 添加点击反馈
      this.addClickFeedback(button);
      
      try {
        // 执行复制操作
        if (onCopy) {
          await onCopy(targetElement);
        }
      } catch (error) {
        console.error('PureText: Copy operation failed:', error);
      }
    });

    // 键盘支持
    button.addEventListener('keydown', async (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        
        // 添加点击反馈
        this.addClickFeedback(button);
        
        try {
          // 执行复制操作
          if (onCopy) {
            await onCopy(targetElement);
          }
        } catch (error) {
          console.error('PureText: Copy operation failed:', error);
        }
      }
    });
  }

  /**
   * 添加点击反馈动画
   * @param {HTMLElement} button - 按钮元素
   */
  static addClickFeedback(button) {
    // 添加点击波纹效果
    button.style.transform = 'scale(0.95) translateZ(0)';
    
    setTimeout(() => {
      button.style.transform = 'translateZ(0)';
    }, 150);

    // 临时改变文本提供反馈
    const originalText = button.textContent;
    button.textContent = '复制中...';
    
    setTimeout(() => {
      button.textContent = originalText;
    }, 500);
  }

  /**
   * 检查元素是否已经有按钮
   * @param {HTMLElement} element - 要检查的元素
   * @returns {boolean} 是否已有按钮
   */
  static hasButton(element) {
    return element.querySelector(`.${this.CONTAINER_CLASS}`) !== null;
  }

  /**
   * 移除元素的按钮
   * @param {HTMLElement} element - 目标元素
   */
  static removeButton(element) {
    const existingButton = element.querySelector(`.${this.CONTAINER_CLASS}`);
    if (existingButton) {
      existingButton.remove();
    }
  }

  /**
   * 智能定位按钮位置
   * @param {HTMLElement} container - 按钮容器
   * @param {HTMLElement} targetElement - 目标元素
   */
  static positionButton(container, targetElement) {
    // 确保目标元素有相对定位
    const computedStyle = window.getComputedStyle(targetElement);
    if (computedStyle.position === 'static') {
      targetElement.style.position = 'relative';
    }

    // 获取目标元素的尺寸和内边距
    const rect = targetElement.getBoundingClientRect();
    const style = window.getComputedStyle(targetElement);
    const paddingRight = parseInt(style.paddingRight) || 0;
    const paddingBottom = parseInt(style.paddingBottom) || 0;

    // 计算最佳位置
    const rightOffset = Math.max(8, paddingRight + 4);
    const bottomOffset = Math.max(8, paddingBottom + 4);

    container.style.right = `${rightOffset}px`;
    container.style.bottom = `${bottomOffset}px`;

    // 确保按钮不会超出视口
    this.ensureInViewport(container, targetElement);
  }

  /**
   * 确保按钮在视口内
   * @param {HTMLElement} container - 按钮容器
   * @param {HTMLElement} targetElement - 目标元素
   */
  static ensureInViewport(container, targetElement) {
    // 延迟检查，确保元素已渲染
    setTimeout(() => {
      try {
        const containerRect = container.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // 检查并调整位置
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
}

// 导出类
export { CopyButton };