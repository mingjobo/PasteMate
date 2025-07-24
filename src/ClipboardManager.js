/**
 * 剪贴板管理器类
 * 负责纯文本提取和剪贴板操作
 */
export class ClipboardManager {
  /**
   * 复制元素的纯文本内容到剪贴板
   * @param {HTMLElement} element - 要复制内容的DOM元素
   * @returns {Promise<boolean>} 复制是否成功
   */
  static async copyPlainText(element) {
    try {
      if (!element) {
        console.warn('PureText: No element provided for copying');
        return false;
      }

      const plainText = this.extractPlainText(element);
      
      if (!plainText.trim()) {
        console.warn('PureText: No text content found to copy');
        return false;
      }

      // 尝试使用现代 Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(plainText);
        this.showSuccessMessage();
        return true;
      } else {
        // 降级到传统方法
        return this.fallbackCopyMethod(plainText);
      }
    } catch (error) {
      console.error('PureText: Clipboard write failed:', error);
      // 尝试降级方法
      try {
        const plainText = this.extractPlainText(element);
        return this.fallbackCopyMethod(plainText);
      } catch (fallbackError) {
        console.error('PureText: Fallback copy method also failed:', fallbackError);
        this.showErrorMessage();
        return false;
      }
    }
  }

  /**
   * 从DOM元素中提取纯文本，去除HTML标签和Markdown格式
   * @param {HTMLElement} element - 要提取文本的DOM元素
   * @returns {string} 提取的纯文本
   */
  static extractPlainText(element) {
    if (!element) {
      return '';
    }

    // 获取元素的文本内容（自动去除HTML标签）
    let text = element.innerText || element.textContent || '';
    
    // 去除常见的Markdown格式标记
    text = this.removeMarkdownFormatting(text);
    
    // 清理多余的空白字符
    text = this.cleanWhitespace(text);
    
    return text;
  }

  /**
   * 去除Markdown格式标记
   * @param {string} text - 包含Markdown格式的文本
   * @returns {string} 去除格式后的纯文本
   */
  static removeMarkdownFormatting(text) {
    return text
      // 去除代码块标记 ``` (需要先处理，避免与其他规则冲突)
      .replace(/```[\s\S]*?```/g, (match) => {
        // 保留代码块内容，但去除标记
        return match.replace(/```[^\n]*\n?/g, '').replace(/\n```$/g, '');
      })
      
      // 去除粗体标记 **text** 或 __text__
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      
      // 去除斜体标记 *text* 或 _text_
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      
      // 去除删除线标记 ~~text~~
      .replace(/~~(.*?)~~/g, '$1')
      
      // 去除行内代码标记 `code`
      .replace(/`([^`]+)`/g, '$1')
      
      // 去除链接标记 [text](url)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      
      // 去除图片标记 ![alt](url)
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      
      // 去除标题标记 # ## ### 等
      .replace(/^#{1,6}\s+/gm, '')
      
      // 去除引用标记 >
      .replace(/^>\s*/gm, '')
      
      // 去除列表标记 - * +
      .replace(/^[\s]*[-*+]\s+/gm, '')
      
      // 去除有序列表标记 1. 2. 等
      .replace(/^[\s]*\d+\.\s+/gm, '')
      
      // 去除水平分割线 --- *** ___
      .replace(/^[\s]*[-*_]{3,}[\s]*$/gm, '');
  }

  /**
   * 清理多余的空白字符
   * @param {string} text - 要清理的文本
   * @returns {string} 清理后的文本
   */
  static cleanWhitespace(text) {
    return text
      // 规范化换行符 (先处理换行符)
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      
      // 将多个连续的空白字符替换为单个空格，但保留换行符
      .replace(/[ \t]+/g, ' ')
      
      // 去除多余的空行（保留最多一个空行）
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      
      // 去除行首行尾的空白字符
      .trim();
  }

  /**
   * 降级复制方法（使用传统的document.execCommand）
   * @param {string} text - 要复制的文本
   * @returns {boolean} 复制是否成功
   */
  static fallbackCopyMethod(text) {
    try {
      // 创建临时textarea元素
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, 99999); // 兼容移动设备
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (successful) {
        this.showSuccessMessage();
        return true;
      } else {
        this.showErrorMessage();
        return false;
      }
    } catch (error) {
      console.error('PureText: Fallback copy method failed:', error);
      this.showErrorMessage();
      return false;
    }
  }

  /**
   * 显示复制成功消息
   */
  static showSuccessMessage() {
    // 使用chrome.i18n API获取本地化消息
    const message = chrome?.i18n ? chrome.i18n.getMessage('copySuccess') : 'Copied successfully';
    this.showToast(message, 'success');
  }

  /**
   * 显示复制失败消息
   */
  static showErrorMessage() {
    // 使用chrome.i18n API获取本地化消息
    const message = chrome?.i18n ? chrome.i18n.getMessage('copyFailed') : 'Copy failed';
    this.showToast(message, 'error');
  }

  /**
   * 显示临时提示消息
   * @param {string} message - 要显示的消息
   * @param {string} type - 消息类型 ('success' 或 'error')
   */
  static showToast(message, type = 'success') {
    // 创建提示元素
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : '#f44336'};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // 显示动画
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
    });
    
    // 2秒后自动移除
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2000);
  }
}