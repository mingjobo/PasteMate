/**
 * 用户问题提取器
 * 用于从不同AI聊天网站中提取用户问题
 */
export class UserQuestionExtractor {
  /**
   * 获取当前对话的用户问题
   * @param {HTMLElement} aiResponseElement - AI回复元素
   * @returns {string} 用户问题文本
   */
  static getUserQuestion(aiResponseElement) {
    const hostname = window.location.hostname;
    
    try {
      switch (hostname) {
        case 'chat.deepseek.com':
          return this.getDeepSeekUserQuestion(aiResponseElement);
        case 'www.kimi.com':
          return this.getKimiUserQuestion(aiResponseElement);
        case 'chat.openai.com':
          return this.getChatGPTUserQuestion(aiResponseElement);
        case 'www.doubao.com':
          return this.getDoubaoUserQuestion(aiResponseElement);
        default:
          return this.getGenericUserQuestion(aiResponseElement);
      }
    } catch (error) {
      console.error('PureText: 获取用户问题失败:', error);
      return '';
    }
  }

  /**
   * 获取DeepSeek用户问题
   */
  static getDeepSeekUserQuestion(aiResponseElement) {
    // 从AI回复元素向上查找对话容器
    const conversationContainer = aiResponseElement.closest('[data-testid="conversation-turn"]') ||
                                aiResponseElement.closest('.conversation-turn') ||
                                aiResponseElement.closest('[role="listitem"]');
    
    if (!conversationContainer) {
      return '';
    }

    // 查找用户消息元素
    const userMessage = conversationContainer.querySelector('[data-testid="user-message"]') ||
                       conversationContainer.querySelector('.user-message') ||
                       conversationContainer.querySelector('[role="user"]');
    
    if (userMessage) {
      const questionText = userMessage.textContent?.trim() || '';
      return this.cleanQuestionText(questionText);
    }

    return '';
  }

  /**
   * 获取Kimi用户问题
   */
  static getKimiUserQuestion(aiResponseElement) {
    // 从AI回复元素向上查找对话容器
    const segmentAssistant = aiResponseElement.closest('.segment-assistant');
    if (!segmentAssistant) {
      return '';
    }

    // 查找同一对话中的用户消息
    const conversationContainer = segmentAssistant.closest('.conversation-container') ||
                                segmentAssistant.closest('.chat-container');
    
    if (!conversationContainer) {
      return '';
    }

    // 查找用户消息元素
    const userMessage = conversationContainer.querySelector('.segment-user') ||
                       conversationContainer.querySelector('.user-message') ||
                       conversationContainer.querySelector('[data-role="user"]');
    
    if (userMessage) {
      const questionText = userMessage.textContent?.trim() || '';
      return this.cleanQuestionText(questionText);
    }

    return '';
  }

  /**
   * 获取ChatGPT用户问题
   */
  static getChatGPTUserQuestion(aiResponseElement) {
    // 从AI回复元素向上查找对话容器
    const conversationContainer = aiResponseElement.closest('[data-testid="conversation-turn"]') ||
                                aiResponseElement.closest('.conversation-turn');
    
    if (!conversationContainer) {
      return '';
    }

    // 查找用户消息元素
    const userMessage = conversationContainer.querySelector('[data-testid="user-message"]') ||
                       conversationContainer.querySelector('.user-message');
    
    if (userMessage) {
      const questionText = userMessage.textContent?.trim() || '';
      return this.cleanQuestionText(questionText);
    }

    return '';
  }

  /**
   * 获取豆包用户问题
   */
  static getDoubaoUserQuestion(aiResponseElement) {
    // 从AI回复元素向上查找对话容器
    const conversationContainer = aiResponseElement.closest('.conversation-item') ||
                                aiResponseElement.closest('.chat-item');
    
    if (!conversationContainer) {
      return '';
    }

    // 查找用户消息元素
    const userMessage = conversationContainer.querySelector('.user-message') ||
                       conversationContainer.querySelector('[data-role="user"]');
    
    if (userMessage) {
      const questionText = userMessage.textContent?.trim() || '';
      return this.cleanQuestionText(questionText);
    }

    return '';
  }

  /**
   * 通用用户问题获取方法
   */
  static getGenericUserQuestion(aiResponseElement) {
    // 尝试多种常见的选择器
    const selectors = [
      '.user-message',
      '[data-role="user"]',
      '[data-testid="user-message"]',
      '.user-content',
      '.human-message'
    ];

    for (const selector of selectors) {
      const userMessage = aiResponseElement.closest('*').querySelector(selector);
      if (userMessage) {
        const questionText = userMessage.textContent?.trim() || '';
        return this.cleanQuestionText(questionText);
      }
    }

    return '';
  }

  /**
   * 清理问题文本
   * @param {string} text - 原始问题文本
   * @returns {string} 清理后的问题文本
   */
  static cleanQuestionText(text) {
    if (!text) return '';
    
    // 移除多余的空白字符
    let cleaned = text.replace(/\s+/g, ' ').trim();
    
    // 限制长度，避免文件名过长
    if (cleaned.length > 50) {
      cleaned = cleaned.substring(0, 50) + '...';
    }
    
    // 移除文件名中的非法字符
    cleaned = cleaned.replace(/[<>:"/\\|?*]/g, '_');
    
    return cleaned;
  }

  /**
   * 生成文件名
   * @param {string} userQuestion - 用户问题
   * @param {string} fileType - 文件类型 ('pdf' 或 'docx')
   * @returns {string} 格式化的文件名
   */
  static generateFilename(userQuestion, fileType) {
    const now = new Date();
    const dateTime = now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
    
    const hostname = window.location.hostname;
    let siteName = '';
    
    switch (hostname) {
      case 'chat.deepseek.com':
        siteName = 'deepseek';
        break;
      case 'www.kimi.com':
        siteName = 'kimi';
        break;
      case 'chat.openai.com':
        siteName = 'chatgpt';
        break;
      case 'www.doubao.com':
        siteName = 'doubao';
        break;
      default:
        siteName = hostname.replace(/\./g, '_');
    }
    
  //  const question = userQuestion || 'question';
    const extension = fileType === 'pdf' ? 'pdf' : 'docx';
    
    return `${dateTime}_${siteName}.${extension}`;
  }
} 