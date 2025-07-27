import { HtmlFormatterManager } from './HtmlFormatterManager.js';

/**
 * 剪贴板管理器类
 * 负责统一文本格式化和剪贴板操作（Word和WPS兼容）
 */
class ClipboardManager {
  // 静态实例，用于管理HTML格式化
  static formatterManager = null;
  
  /**
   * 初始化HTML格式化管理器
   * @returns {Promise<void>}
   */
  static async initializeFormatterManager() {
    if (!this.formatterManager) {
      this.formatterManager = new HtmlFormatterManager();
      console.debug('[ClipboardManager] HTML formatter manager initialized');
    }
  }

  /**
   * 复制元素的统一格式文本到剪贴板（Word和WPS兼容）
   * @param {HTMLElement} element - 要复制内容的DOM元素
   * @returns {Promise<boolean>} 复制是否成功
   */
  static async copyHtmlToClipboard(element) {
    const startTime = performance.now();
    
    try {
      console.log('[ClipboardManager] ========== 开始统一文本复制操作 ==========');
      console.log('[ClipboardManager] 🔥 接收到的元素:', element?.tagName || 'Unknown', element?.className || '');
      console.log('[ClipboardManager] 元素内容长度:', (element?.textContent || '').length);
      console.log('[ClipboardManager] 元素内容预览:', (element?.textContent || '').substring(0, 300) + '...');
      
      if (!element) {
        console.error('[ClipboardManager] ❌ 元素为空，无法复制');
        this.showErrorMessage('未找到可复制内容');
        return false;
      }
      
      // 检测当前网站
      const hostname = this.detectWebsite();
      console.log('[ClipboardManager] 检测到网站:', hostname);
      
      // 确保格式化管理器已初始化
      console.log('[ClipboardManager] 初始化格式化管理器...');
      await this.initializeFormatterManager();
      console.log('[ClipboardManager] ✅ 格式化管理器已初始化');
      
      // 使用统一文本格式化系统
      console.log('[ClipboardManager] 🔥 开始统一文本格式化...');
      const unifiedText = await this.formatUnifiedText(element);
      console.log('[ClipboardManager] ✅ 统一文本格式化完成');
      console.log('[ClipboardManager] 格式化结果长度:', unifiedText.length);
      console.log('[ClipboardManager] 格式化结果预览:', unifiedText.substring(0, 500) + '...');

      console.log('[ClipboardManager] 创建剪贴板数据...');
      const blobText = new Blob([unifiedText], { type: 'text/plain' });
      const clipboardItem = new window.ClipboardItem({
        'text/plain': blobText
      });
      
      console.log('[ClipboardManager] 写入剪贴板...');
      await navigator.clipboard.write([clipboardItem]);
      console.log('[ClipboardManager] ✅ 剪贴板写入成功');
      
      // 记录性能指标
      const duration = performance.now() - startTime;
      this.logPerformanceMetrics('copyUnifiedTextToClipboard', duration, true, hostname);
      
      console.log('[ClipboardManager] ========== 统一文本复制操作完成 ==========');
      this.showSuccessMessage('已复制为统一格式，Word和WPS都能正常显示');
      return true;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      const hostname = this.detectWebsite();
      this.logPerformanceMetrics('copyUnifiedTextToClipboard', duration, false, hostname);
      
      console.error(`[ClipboardManager] ❌ Copy operation failed after ${duration.toFixed(2)}ms:`, error);
      console.error('[ClipboardManager] 错误详情:', error.stack);
      this.showErrorMessage('复制失败，请重试');
      return false;
    }
  }

  /**
   * 使用统一文本格式化系统格式化内容（Word和WPS兼容）
   * @param {HTMLElement} element - 要格式化的DOM元素
   * @returns {Promise<string>} 格式化后的统一文本字符串
   */
  static async formatUnifiedText(element) {
    const startTime = performance.now();
    
    try {
      console.log('[ClipboardManager] ========== 开始统一文本格式化 ==========');
      console.log('[ClipboardManager] 输入元素:', element?.tagName || 'Unknown', element?.className || '');
      console.log('[ClipboardManager] 输入元素内容长度:', (element?.textContent || '').length);
      
      // 检测当前网站
      const hostname = this.detectWebsite();
      console.log(`[ClipboardManager] 检测到网站: ${hostname}`);
      
      // 使用集成的格式化管理器进行初步处理
      let processedHtml = '';
      if (this.formatterManager) {
        console.log('[ClipboardManager] ✅ 使用集成的HTML格式化管理器');
        console.log('[ClipboardManager] 调用formatterManager.formatForWord...');
        
        processedHtml = await this.formatterManager.formatForWord(element, hostname);
        console.log('[ClipboardManager] HTML格式化完成，开始转换为统一文本...');
      } else {
        console.warn('[ClipboardManager] ⚠️ 格式化管理器未初始化，使用旧版处理');
        processedHtml = this.legacyHtmlProcessing(element);
      }
      
      // 将HTML转换为统一文本格式
      const unifiedText = this.convertHtmlToUnifiedText(processedHtml);
      
      const duration = performance.now() - startTime;
      console.log(`[ClipboardManager] ✅ 统一文本格式化完成，耗时: ${duration.toFixed(2)}ms`);
      console.log('[ClipboardManager] 统一文本长度:', unifiedText.length);
      console.log('[ClipboardManager] 统一文本预览:', unifiedText.substring(0, 300) + '...');
      
      return unifiedText;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[ClipboardManager] ❌ 统一文本格式化失败，耗时: ${duration.toFixed(2)}ms:`, error);
      console.error('[ClipboardManager] 错误详情:', error.stack);
      
      // 降级到纯文本提取
      console.warn('[ClipboardManager] 🔄 降级到纯文本提取');
      const result = this.extractPlainText(element);
      console.log('[ClipboardManager] 降级处理结果长度:', result.length);
      return result;
    }
  }

  /**
   * 将HTML转换为统一文本格式（Word和WPS兼容）
   * @param {string} html - HTML字符串
   * @returns {string} 统一文本格式
   */
  static convertHtmlToUnifiedText(html) {
    console.log('[ClipboardManager] 开始HTML到统一文本转换...');
    
    // 创建临时DOM元素来解析HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    let result = '';
    let currentLevel = 0;
    
    // 递归处理DOM节点
    const processNode = (node, level = 0) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) {
          result += text + '\n';
        }
        return;
      }
      
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }
      
      const tagName = node.tagName.toLowerCase();
      const text = node.textContent.trim();
      
      if (!text) return;
      
      switch (tagName) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          result += '\n' + text + '\n\n';
          break;
          
        case 'p':
          result += text + '\n\n';
          break;
          
        case 'ul':
          result += '\n';
          Array.from(node.children).forEach((li, index) => {
            if (li.tagName.toLowerCase() === 'li') {
              result += '• ' + li.textContent.trim() + '\n';
            }
          });
          result += '\n';
          break;
          
        case 'ol':
          result += '\n';
          Array.from(node.children).forEach((li, index) => {
            if (li.tagName.toLowerCase() === 'li') {
              result += (index + 1) + '. ' + li.textContent.trim() + '\n';
            }
          });
          result += '\n';
          break;
          
        case 'li':
          // 列表项在ul/ol中处理，这里跳过
          break;
          
        case 'blockquote':
          result += '\n引用：\n' + text + '\n\n';
          break;
          
        case 'code':
          result += '【代码】' + text + '\n';
          break;
          
        case 'strong':
        case 'b':
          result += '【粗体】' + text + '【/粗体】';
          break;
          
        case 'em':
        case 'i':
          result += '【斜体】' + text + '【/斜体】';
          break;
          
        case 'hr':
          result += '\n' + '─'.repeat(50) + '\n\n';
          break;
          
        case 'br':
          result += '\n';
          break;
          
        default:
          // 处理其他标签，递归处理子节点
          Array.from(node.childNodes).forEach(child => {
            processNode(child, level + 1);
          });
          break;
      }
    };
    
    // 处理所有子节点
    Array.from(tempDiv.childNodes).forEach(child => {
      processNode(child);
    });
    
    // 清理多余的换行符
    result = result
      .replace(/\n\s*\n\s*\n/g, '\n\n')  // 最多保留两个连续换行
      .replace(/\n+$/, '\n')              // 去除末尾多余换行
      .trim();
    
    console.log('[ClipboardManager] HTML到统一文本转换完成');
    return result;
  }
  
  /**
   * 检测当前网站
   * @returns {string} 网站域名
   */
  static detectWebsite() {
    const hostname = window.location.hostname;
    
    // 标准化域名处理
    const normalizedHostname = hostname.toLowerCase();
    
    // 支持的网站映射
    const siteMapping = {
      'www.kimi.com': 'www.kimi.com',
      'kimi.com': 'www.kimi.com',
      'chat.deepseek.com': 'chat.deepseek.com',
      'deepseek.com': 'chat.deepseek.com',
      'chatgpt.com': 'chatgpt.com',
      'chat.openai.com': 'chatgpt.com'
    };
    
    const mappedHostname = siteMapping[normalizedHostname] || normalizedHostname;
    
    console.debug(`[ClipboardManager] Website detection: ${hostname} -> ${mappedHostname}`);
    
    return mappedHostname;
  }

  /**
   * 旧版HTML处理逻辑（作为降级方案）
   * @param {HTMLElement} element - DOM元素
   * @returns {string} 处理后的HTML
   */
  static legacyHtmlProcessing(element) {
    const hostname = window.location.hostname;
    
    if (hostname === 'www.kimi.com') {
      return this.processKimiHtmlForWord(element);
    } else {
      // 其他网站使用原始HTML
      return element.outerHTML;
    }
  }

  /**
   * 处理Kimi网站的HTML结构，转换为Word友好的格式
   * @param {HTMLElement} element - 要处理的DOM元素
   * @returns {string} 处理后的HTML字符串
   */
  static processKimiHtmlForWord(element) {
    // 创建元素副本避免修改原DOM
    const cloned = element.cloneNode(true);
    
    // 移除不需要的元素
    this.removeUnwantedElements(cloned);
    
    // 转换Kimi的特殊结构为标准HTML
    const processedHtml = this.convertKimiStructureToStandardHtml(cloned);
    
    return processedHtml;
  }

  /**
   * 移除不需要的元素（按钮、推荐问题等）
   * @param {HTMLElement} cloned - 克隆的DOM元素
   */
  static removeUnwantedElements(cloned) {
    // 移除复制按钮
    cloned.querySelectorAll('.puretext-copy-btn, .puretext-button-container').forEach(el => el.remove());
    
    // 移除操作按钮
    cloned.querySelectorAll('button, [role="button"]').forEach(button => {
      const text = button.textContent?.trim();
      if (text && /^(复制|重试|分享|编辑|搜索|点赞|踩|收藏)$/.test(text)) {
        button.remove();
      }
    });
    
    // 移除AI声明
    cloned.querySelectorAll('*').forEach(el => {
      const text = el.textContent?.trim();
      if (text && /本回答由\s*AI\s*生成.*内容仅供参考/.test(text)) {
        el.remove();
      }
    });
    
    // 移除推荐问题区域
    cloned.querySelectorAll('[class*="recommend"], [class*="suggest"]').forEach(el => el.remove());
  }

  /**
   * 将Kimi的DOM结构转换为Word友好的标准HTML
   * @param {HTMLElement} cloned - 处理后的克隆元素
   * @returns {string} 标准HTML字符串
   */
  static convertKimiStructureToStandardHtml(cloned) {
    let html = '<div>';
    
    // 遍历所有子元素，重构为标准HTML格式
    const walker = document.createTreeWalker(
      cloned,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let currentNode;
    let inList = false;
    let listItems = [];
    
    while (currentNode = walker.nextNode()) {
      if (currentNode.nodeType === Node.TEXT_NODE) {
        const text = currentNode.textContent.trim();
        if (text) {
          // 检查是否是列表项的开始
          if (this.isListItemStart(text)) {
            if (!inList) {
              inList = true;
              listItems = [];
            }
            listItems.push(text);
          } else if (inList && text.length > 0) {
            // 如果在列表中，继续添加到当前列表项
            if (listItems.length > 0) {
              listItems[listItems.length - 1] += ' ' + text;
            }
          } else {
            // 不在列表中的普通文本
            if (inList) {
              // 结束列表，输出列表HTML
              html += this.generateListHtml(listItems);
              inList = false;
              listItems = [];
            }
            
            // 根据文本特征决定HTML标签
            if (this.isHeading(text)) {
              html += `<h3><strong>${text}</strong></h3>`;
            } else if (this.isBlockQuote(text)) {
              html += `<blockquote><p>${text}</p></blockquote>`;
            } else if (text.length > 0) {
              html += `<p>${text}</p>`;
            }
          }
        }
      }
    }
    
    // 如果最后还在列表中，输出列表
    if (inList && listItems.length > 0) {
      html += this.generateListHtml(listItems);
    }
    
    html += '</div>';
    return html;
  }

  /**
   * 检查文本是否是列表项的开始
   * @param {string} text - 要检查的文本
   * @returns {boolean} 是否是列表项
   */
  static isListItemStart(text) {
    // 检查是否以项目符号或数字开头
    return /^[\s]*[•·▪▫◦‣⁃]\s+/.test(text) || 
           /^[\s]*\d+[\.\)]\s+/.test(text) ||
           /^[\s]*[a-zA-Z][\.\)]\s+/.test(text) ||
           // Kimi特有的格式：合约价值、保证金比例等
           /^[\s]*(合约价值|保证金比例|你账户里总共|期货公司会|平仓后|不会倒扣|只是亏的|剩余的钱)[:：]/.test(text);
  }

  /**
   * 检查文本是否是标题
   * @param {string} text - 要检查的文本
   * @returns {boolean} 是否是标题
   */
  static isHeading(text) {
    return /^[\s]*[✅❌🔧]\s+/.test(text) || 
           /^[\s]*\d+\.\s*[^。]{5,30}[:：]$/.test(text) ||
           /^[\s]*举个例子/.test(text) ||
           /^[\s]*强平后会发生什么/.test(text) ||
           /^[\s]*总结一句话/.test(text);
  }

  /**
   * 检查文本是否是引用块
   * @param {string} text - 要检查的文本
   * @returns {boolean} 是否是引用块
   */
  static isBlockQuote(text) {
    return /^[\s]*5000\s*-\s*2000\s*=/.test(text) ||
           /^[\s]*强平只是强制/.test(text);
  }

  /**
   * 生成列表的HTML
   * @param {string[]} items - 列表项数组
   * @returns {string} 列表HTML
   */
  static generateListHtml(items) {
    if (items.length === 0) return '';
    
    // 判断是有序列表还是无序列表
    const isOrderedList = items.some(item => /^\s*\d+[\.\)]/.test(item));
    const listTag = isOrderedList ? 'ol' : 'ul';
    
    let html = `<${listTag}>`;
    
    items.forEach(item => {
      // 清理列表项前缀
      let cleanItem = item
        .replace(/^[\s]*[•·▪▫◦‣⁃]\s+/, '')
        .replace(/^[\s]*\d+[\.\)]\s+/, '')
        .replace(/^[\s]*[a-zA-Z][\.\)]\s+/, '')
        .trim();
      
      if (cleanItem) {
        html += `<li>${cleanItem}</li>`;
      }
    });
    
    html += `</${listTag}>`;
    return html;
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
   * @param {string} customMessage - 自定义成功消息
   */
  static showSuccessMessage(customMessage) {
    // 使用自定义消息或默认消息
    const message = customMessage || 
      (chrome?.i18n ? chrome.i18n.getMessage('copySuccess') : 'Copied successfully');
    this.showToast(message, 'success');
  }

  /**
   * 显示复制失败消息
   * @param {string} customMessage - 自定义错误消息
   */
  static showErrorMessage(customMessage) {
    // 使用自定义消息或默认消息
    const message = customMessage || 
      (chrome?.i18n ? chrome.i18n.getMessage('copyFailed') : 'Copy failed');
    this.showToast(message, 'error');
  }

  /**
   * 记录性能指标
   * @param {string} operation - 操作名称
   * @param {number} duration - 持续时间（毫秒）
   * @param {boolean} success - 操作是否成功
   * @param {string} hostname - 网站域名
   */
  static logPerformanceMetrics(operation, duration, success, hostname) {
    const metrics = {
      operation,
      duration: Math.round(duration),
      success,
      hostname,
      timestamp: new Date().toISOString()
    };
    
    console.debug(`[ClipboardManager] Performance metrics:`, metrics);
    
    // 如果操作时间超过500ms，记录警告
    if (duration > 500) {
      console.warn(`[ClipboardManager] ${operation} took ${duration.toFixed(2)}ms, exceeding 500ms target`);
    }
    
    // 可以在这里添加更多的性能监控逻辑，比如发送到分析服务
    // this.sendMetricsToAnalytics(metrics);
  }

  /**
   * 处理格式化超时
   * @param {HTMLElement} element - DOM元素
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {Promise<string>} 格式化结果
   */
  static async formatWithTimeout(element, timeout = 5000) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Formatting operation timed out')), timeout);
    });
    
    const formatPromise = this.formatUnifiedText(element);
    
    try {
      return await Promise.race([formatPromise, timeoutPromise]);
    } catch (error) {
      if (error.message === 'Formatting operation timed out') {
        console.warn('[ClipboardManager] Formatting timed out, using fallback');
        return this.extractPlainText(element);
      }
      throw error;
    }
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

// 导出类
export { ClipboardManager };