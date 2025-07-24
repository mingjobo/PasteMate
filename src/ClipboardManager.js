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

    // 创建元素的副本，以避免修改原始DOM
    const clonedElement = element.cloneNode(true);
    
    // 移除所有复制按钮，避免按钮文字被包含在复制内容中
    const copyButtons = clonedElement.querySelectorAll('.puretext-copy-btn, .puretext-button-container');
    copyButtons.forEach(button => button.remove());
    
    // 移除常见的按钮和操作元素
    const buttonSelectors = [
      'button',
      '[role="button"]',
      '.btn',
      '.button',
      '[onclick]',
      'a[href="#"]',
      '.action',
      '.menu'
    ];
    
    buttonSelectors.forEach(selector => {
      const buttons = clonedElement.querySelectorAll(selector);
      buttons.forEach(button => {
        const buttonText = button.textContent?.trim();
        // 如果按钮包含常见的操作文字，则移除
        if (buttonText && /^(复制|重试|分享|编辑|搜索|点赞|踩|收藏|删除|举报)$/.test(buttonText)) {
          button.remove();
        }
      });
    });
    
    // 获取元素的文本内容（自动去除HTML标签）
    let text = clonedElement.innerText || clonedElement.textContent || '';
    
    // 去除特定的多余文本
    text = this.removeExtraContent(text);
    
    // 去除常见的Markdown格式标记
    text = this.removeMarkdownFormatting(text);
    
    // 清理多余的空白字符
    text = this.cleanWhitespace(text);
    
    return text;
  }

  /**
   * 去除特定的多余内容
   * @param {string} text - 原始文本
   * @returns {string} 清理后的文本
   */
  static removeExtraContent(text) {
    let cleanedText = text;
    
    // 第一步：去除明确的界面元素
    cleanedText = cleanedText
      // 去除常见的按钮文字
      .replace(/\s*(复制|重试|分享|编辑|搜索一下|点赞|踩|收藏|删除|举报)\s*/g, '')
      
      // 去除 AI 生成声明
      .replace(/\s*本回答由\s*AI\s*生成[，,，。]*\s*内容仅供参考\s*/g, '')
      
      // 去除其他常见的界面元素文字
      .replace(/\s*(查看更多|展开全部|收起|相关推荐)\s*/g, '');
    
    // 第二步：智能去除推荐问题
    cleanedText = this.removeRecommendedQuestions(cleanedText);
    
    return cleanedText;
  }

  /**
   * 智能识别和去除AI推荐的后续问题
   * @param {string} text - 要处理的文本
   * @returns {string} 去除推荐问题后的文本
   */
  static removeRecommendedQuestions(text) {
    // 推荐问题的特征模式
    const questionPatterns = [
      // 1. 以问号结尾的短句（10-60字符，通常是推荐问题）
      /\s*[^\n。！]{10,60}[？?]\s*/g,
      
      // 2. 常见的推荐问题开头
      /\s*(?:如何|怎么|什么是|什么叫|为什么|哪些|多少|何时|在哪|是否|能否|可以)[^\n。！]{5,50}[？?]\s*/g,
      
      // 3. 疑问代词开头的问题
      /\s*(?:谁|哪|什么|怎样|多少|几|何)[^\n。！]{5,50}[？?]\s*/g,
      
      // 4. 时间相关的问题
      /\s*[^\n。！]*(?:多久|什么时候|何时|时间|期限|周期)[^\n。！]*[？?]\s*/g,
      
      // 5. 数量/比例相关的问题
      /\s*[^\n。！]*(?:多少|比例|费用|成本|价格|金额|数量)[^\n。！]*[？?]\s*/g,
      
      // 6. 条件/情况相关的问题
      /\s*[^\n。！]*(?:如果|假如|要是|情况下|条件)[^\n。！]*[？?]\s*/g
    ];
    
    let cleanedText = text;
    
    // 应用所有模式
    questionPatterns.forEach(pattern => {
      cleanedText = cleanedText.replace(pattern, '');
    });
    
    // 基于文本结构的清理
    return this.removeQuestionsByStructure(cleanedText);
  }

  /**
   * 基于文本结构去除推荐问题
   * @param {string} text - 要处理的文本
   * @returns {string} 处理后的文本
   */
  static removeQuestionsByStructure(text) {
    // 将文本按行分割
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    const cleanedLines = [];
    let foundMainContent = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 检查是否是推荐问题的特征
      const isQuestion = line.endsWith('？') || line.endsWith('?');
      const isShort = line.length < 80; // 推荐问题通常比较短
      const hasQuestionWords = /(?:如何|怎么|什么|为什么|哪些|多少|何时|在哪|是否|能否|可以)/.test(line);
      const isStandalone = i === lines.length - 1 || (i < lines.length - 1 && lines[i + 1].endsWith('？'));
      
      // 如果是问题且符合推荐问题特征，跳过
      if (isQuestion && isShort && (hasQuestionWords || isStandalone)) {
        continue;
      }
      
      // 检查是否是主要内容
      if (line.length > 20 && !isQuestion) {
        foundMainContent = true;
      }
      
      // 如果已经找到主要内容，且当前行是短问题，可能是推荐问题
      if (foundMainContent && isQuestion && isShort) {
        continue;
      }
      
      cleanedLines.push(line);
    }
    
    return cleanedLines.join('\n');
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