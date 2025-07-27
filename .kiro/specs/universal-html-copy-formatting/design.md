# Design Document

## Overview

通用HTML格式化系统是PureText扩展的核心组件，负责将不同AI网站的DOM结构转换为Word友好的标准HTML格式。系统采用插件化架构，支持网站特定的格式化器，同时提供通用的降级处理机制。通过智能内容清理、结构化转换和格式优化，确保复制到Word的内容保持原有的视觉结构和可读性。

## Architecture

### 整体架构

```
HTML格式化系统架构
├── 格式化管理器 (HtmlFormatterManager)
│   ├── 网站检测与路由
│   ├── 格式化器选择
│   └── 降级处理机制
├── 网站特定格式化器
│   ├── KimiHtmlFormatter
│   ├── DeepSeekHtmlFormatter
│   ├── ChatGPTHtmlFormatter
│   └── 通用格式化器 (GenericHtmlFormatter)
├── 内容清理器 (ContentCleaner)
│   ├── 按钮和界面元素移除
│   ├── AI声明清理
│   └── 推荐问题过滤
├── 结构转换器 (StructureConverter)
│   ├── 列表识别与转换
│   ├── 标题格式化
│   ├── 引用块处理
│   └── 代码块格式化
└── Word优化器 (WordOptimizer)
    ├── HTML标准化
    ├── 样式内联化
    └── 兼容性处理
```

## Components and Interfaces

### 1. HTML格式化管理器

**文件**: `src/HtmlFormatterManager.js`

```javascript
class HtmlFormatterManager {
  constructor() {
    this.formatters = new Map();
    this.contentCleaner = new ContentCleaner();
    this.wordOptimizer = new WordOptimizer();
    this.registerDefaultFormatters();
  }
  
  /**
   * 注册网站特定的格式化器
   * @param {string} hostname - 网站域名
   * @param {HtmlFormatter} formatter - 格式化器实例
   */
  registerFormatter(hostname, formatter) {
    this.formatters.set(hostname, formatter);
  }
  
  /**
   * 格式化HTML内容为Word友好格式
   * @param {HTMLElement} element - 要格式化的DOM元素
   * @param {string} hostname - 当前网站域名
   * @returns {string} 格式化后的HTML字符串
   */
  async formatForWord(element, hostname) {
    try {
      // 1. 选择合适的格式化器
      const formatter = this.getFormatter(hostname);
      
      // 2. 克隆元素避免修改原DOM
      const cloned = element.cloneNode(true);
      
      // 3. 清理不需要的内容
      await this.contentCleaner.clean(cloned, hostname);
      
      // 4. 使用格式化器转换结构
      const formattedHtml = await formatter.format(cloned);
      
      // 5. Word优化处理
      const optimizedHtml = await this.wordOptimizer.optimize(formattedHtml);
      
      return optimizedHtml;
      
    } catch (error) {
      console.error('HTML formatting failed:', error);
      // 降级到基本文本提取
      return this.fallbackFormat(element);
    }
  }
  
  /**
   * 获取网站对应的格式化器
   * @param {string} hostname - 网站域名
   * @returns {HtmlFormatter} 格式化器实例
   */
  getFormatter(hostname) {
    return this.formatters.get(hostname) || this.formatters.get('generic');
  }
  
  /**
   * 降级格式化处理
   * @param {HTMLElement} element - DOM元素
   * @returns {string} 基本HTML格式
   */
  fallbackFormat(element) {
    const text = element.innerText || element.textContent || '';
    return `<div><p>${text.replace(/\n/g, '</p><p>')}</p></div>`;
  }
}
```

### 2. 网站特定格式化器接口

**文件**: `src/formatters/HtmlFormatter.js`

```javascript
/**
 * HTML格式化器基类
 */
class HtmlFormatter {
  /**
   * 格式化DOM元素为标准HTML
   * @param {HTMLElement} element - 要格式化的DOM元素
   * @returns {Promise<string>} 格式化后的HTML字符串
   */
  async format(element) {
    throw new Error('format method must be implemented');
  }
  
  /**
   * 检查是否支持当前DOM结构
   * @param {HTMLElement} element - DOM元素
   * @returns {boolean} 是否支持
   */
  canHandle(element) {
    return true;
  }
}
```

### 3. Kimi网站格式化器

**文件**: `src/formatters/KimiHtmlFormatter.js`

```javascript
class KimiHtmlFormatter extends HtmlFormatter {
  async format(element) {
    const converter = new StructureConverter();
    let html = '<div>';
    
    // 使用TreeWalker遍历DOM节点
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    const context = {
      inList: false,
      listItems: [],
      currentLevel: 0
    };
    
    let node;
    while (node = walker.nextNode()) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) {
          html += this.processTextNode(text, context, converter);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        html += this.processElementNode(node, context, converter);
      }
    }
    
    // 处理未完成的列表
    if (context.inList && context.listItems.length > 0) {
      html += converter.generateListHtml(context.listItems);
    }
    
    html += '</div>';
    return html;
  }
  
  /**
   * 处理文本节点
   * @param {string} text - 文本内容
   * @param {Object} context - 处理上下文
   * @param {StructureConverter} converter - 结构转换器
   * @returns {string} 处理后的HTML
   */
  processTextNode(text, context, converter) {
    // 检查是否是列表项开始
    if (converter.isListItemStart(text)) {
      if (!context.inList) {
        context.inList = true;
        context.listItems = [];
      }
      context.listItems.push(text);
      return '';
    }
    
    // 如果在列表中，添加到当前列表项
    if (context.inList && text.length > 0) {
      if (context.listItems.length > 0) {
        context.listItems[context.listItems.length - 1] += ' ' + text;
      }
      return '';
    }
    
    // 不在列表中的普通文本
    if (context.inList) {
      // 结束列表
      const listHtml = converter.generateListHtml(context.listItems);
      context.inList = false;
      context.listItems = [];
      return listHtml + this.formatTextContent(text, converter);
    }
    
    return this.formatTextContent(text, converter);
  }
  
  /**
   * 格式化文本内容
   * @param {string} text - 文本内容
   * @param {StructureConverter} converter - 结构转换器
   * @returns {string} 格式化后的HTML
   */
  formatTextContent(text, converter) {
    if (converter.isHeading(text)) {
      return `<h3><strong>${text}</strong></h3>`;
    } else if (converter.isBlockQuote(text)) {
      return `<blockquote><p>${text}</p></blockquote>`;
    } else if (text.length > 0) {
      return `<p>${text}</p>`;
    }
    return '';
  }
  
  /**
   * 处理元素节点
   * @param {HTMLElement} element - DOM元素
   * @param {Object} context - 处理上下文
   * @param {StructureConverter} converter - 结构转换器
   * @returns {string} 处理后的HTML
   */
  processElementNode(element, context, converter) {
    // 处理特殊元素类型
    if (element.tagName === 'HR') {
      return '<hr>';
    }
    
    // 处理强调元素
    if (element.tagName === 'STRONG' || element.tagName === 'B') {
      return `<strong>${element.textContent}</strong>`;
    }
    
    return '';
  }
  
  canHandle(element) {
    // 检查是否包含Kimi特有的DOM结构
    return element.querySelector('.markdown') !== null ||
           element.querySelector('.segment-content-box') !== null;
  }
}
```

### 4. DeepSeek网站格式化器

**文件**: `src/formatters/DeepSeekHtmlFormatter.js`

```javascript
class DeepSeekHtmlFormatter extends HtmlFormatter {
  async format(element) {
    // DeepSeek已经使用标准HTML结构，主要做清理和优化
    const optimizedHtml = this.optimizeStandardHtml(element);
    return optimizedHtml;
  }
  
  /**
   * 优化标准HTML结构
   * @param {HTMLElement} element - DOM元素
   * @returns {string} 优化后的HTML
   */
  optimizeStandardHtml(element) {
    let html = '<div>';
    
    // 遍历子元素，保持原有结构
    const children = Array.from(element.children);
    
    for (const child of children) {
      if (this.shouldIncludeElement(child)) {
        html += this.processStandardElement(child);
      }
    }
    
    html += '</div>';
    return html;
  }
  
  /**
   * 判断是否应该包含该元素
   * @param {HTMLElement} element - DOM元素
   * @returns {boolean} 是否包含
   */
  shouldIncludeElement(element) {
    // 排除按钮和其他界面元素
    if (element.tagName === 'BUTTON' || 
        element.classList.contains('puretext-copy-btn')) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 处理标准HTML元素
   * @param {HTMLElement} element - DOM元素
   * @returns {string} 处理后的HTML
   */
  processStandardElement(element) {
    // 直接返回元素的outerHTML，但需要清理样式
    const cloned = element.cloneNode(true);
    
    // 移除内联样式，保持结构
    this.removeInlineStyles(cloned);
    
    return cloned.outerHTML;
  }
  
  /**
   * 移除内联样式
   * @param {HTMLElement} element - DOM元素
   */
  removeInlineStyles(element) {
    // 移除style属性，但保持class
    element.removeAttribute('style');
    
    // 递归处理子元素
    const children = Array.from(element.children);
    children.forEach(child => this.removeInlineStyles(child));
  }
  
  canHandle(element) {
    // 检查是否包含DeepSeek特有的类名
    return element.classList.contains('ds-markdown') ||
           element.querySelector('.ds-markdown-paragraph') !== null;
  }
}
```

### 5. 内容清理器

**文件**: `src/ContentCleaner.js`

```javascript
class ContentCleaner {
  constructor() {
    this.cleaningRules = new Map();
    this.initializeDefaultRules();
  }
  
  /**
   * 清理DOM元素中的不需要内容
   * @param {HTMLElement} element - 要清理的DOM元素
   * @param {string} hostname - 网站域名
   */
  async clean(element, hostname) {
    // 1. 移除复制按钮
    this.removeButtons(element);
    
    // 2. 移除AI声明
    this.removeAIStatements(element);
    
    // 3. 移除推荐问题
    this.removeRecommendedQuestions(element, hostname);
    
    // 4. 移除导航和菜单元素
    this.removeNavigationElements(element);
    
    // 5. 应用网站特定的清理规则
    await this.applyCustomRules(element, hostname);
  }
  
  /**
   * 移除按钮元素
   * @param {HTMLElement} element - DOM元素
   */
  removeButtons(element) {
    const buttonSelectors = [
      'button',
      '[role="button"]',
      '.btn',
      '.button',
      '.puretext-copy-btn',
      '.puretext-button-container'
    ];
    
    buttonSelectors.forEach(selector => {
      element.querySelectorAll(selector).forEach(btn => {
        const text = btn.textContent?.trim();
        // 只移除特定的操作按钮
        if (text && /^(复制|重试|分享|编辑|搜索|点赞|踩|收藏)$/.test(text)) {
          btn.remove();
        }
      });
    });
  }
  
  /**
   * 移除AI生成声明
   * @param {HTMLElement} element - DOM元素
   */
  removeAIStatements(element) {
    const allElements = element.querySelectorAll('*');
    
    allElements.forEach(el => {
      const text = el.textContent?.trim();
      if (text && /本回答由\s*AI\s*生成.*内容仅供参考/.test(text)) {
        el.remove();
      }
    });
  }
  
  /**
   * 移除推荐问题
   * @param {HTMLElement} element - DOM元素
   * @param {string} hostname - 网站域名
   */
  removeRecommendedQuestions(element, hostname) {
    // 通用推荐问题模式
    const questionSelectors = [
      '[class*="recommend"]',
      '[class*="suggest"]',
      '[class*="related"]',
      '[data-testid*="question"]'
    ];
    
    questionSelectors.forEach(selector => {
      element.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    // 基于文本模式的清理
    this.removeQuestionsByPattern(element);
  }
  
  /**
   * 基于文本模式移除推荐问题
   * @param {HTMLElement} element - DOM元素
   */
  removeQuestionsByPattern(element) {
    const allElements = element.querySelectorAll('*');
    
    allElements.forEach(el => {
      const text = el.textContent?.trim();
      if (text && this.isRecommendedQuestion(text)) {
        el.remove();
      }
    });
  }
  
  /**
   * 判断是否是推荐问题
   * @param {string} text - 文本内容
   * @returns {boolean} 是否是推荐问题
   */
  isRecommendedQuestion(text) {
    if (!text || text.length > 100) return false;
    
    const questionPatterns = [
      /^[^。！]{10,60}[？?]$/,
      /^(?:如何|怎么|什么是|为什么|哪些|多少|何时|在哪|是否)/,
      /[^。！]*(?:多久|什么时候|何时|时间)[^。！]*[？?]$/,
      /[^。！]*(?:多少|比例|费用|成本|价格)[^。！]*[？?]$/
    ];
    
    return questionPatterns.some(pattern => pattern.test(text));
  }
}
```

### 6. 结构转换器

**文件**: `src/StructureConverter.js`

```javascript
class StructureConverter {
  /**
   * 检查文本是否是列表项的开始
   * @param {string} text - 文本内容
   * @returns {boolean} 是否是列表项
   */
  isListItemStart(text) {
    return /^[\s]*[•·▪▫◦‣⁃]\s+/.test(text) || 
           /^[\s]*\d+[\.\)]\s+/.test(text) ||
           /^[\s]*[a-zA-Z][\.\)]\s+/.test(text) ||
           // 特定格式：冒号结尾的描述性列表项
           /^[\s]*(合约价值|保证金比例|简介|名句|代表作|影响|贡献)[:：]/.test(text);
  }
  
  /**
   * 检查文本是否是标题
   * @param {string} text - 文本内容
   * @returns {boolean} 是否是标题
   */
  isHeading(text) {
    return /^[\s]*[✅❌🔧]\s+/.test(text) || 
           /^[\s]*\d+\.\s*[^。]{5,30}[:：]$/.test(text) ||
           /^[\s]*举个例子/.test(text) ||
           /^[\s]*总结一句话/.test(text) ||
           // DeepSeek风格的标题
           /^[\s]*\d+\.\s+[^（）]{2,20}（[^）]+）$/.test(text);
  }
  
  /**
   * 检查文本是否是引用块
   * @param {string} text - 文本内容
   * @returns {boolean} 是否是引用块
   */
  isBlockQuote(text) {
    return /^[\s]*5000\s*-\s*2000\s*=/.test(text) ||
           /^[\s]*强平只是强制/.test(text) ||
           // 数学计算或公式
           /^[\s]*[0-9]+\s*[-+*/=]\s*[0-9]/.test(text);
  }
  
  /**
   * 生成列表HTML
   * @param {string[]} items - 列表项数组
   * @returns {string} 列表HTML
   */
  generateListHtml(items) {
    if (items.length === 0) return '';
    
    // 判断列表类型
    const isOrderedList = items.some(item => /^\s*\d+[\.\)]/.test(item));
    const listTag = isOrderedList ? 'ol' : 'ul';
    
    let html = `<${listTag}>`;
    
    items.forEach(item => {
      const cleanItem = this.cleanListItem(item);
      if (cleanItem) {
        html += `<li>${cleanItem}</li>`;
      }
    });
    
    html += `</${listTag}>`;
    return html;
  }
  
  /**
   * 清理列表项内容
   * @param {string} item - 列表项文本
   * @returns {string} 清理后的文本
   */
  cleanListItem(item) {
    return item
      .replace(/^[\s]*[•·▪▫◦‣⁃]\s+/, '')
      .replace(/^[\s]*\d+[\.\)]\s+/, '')
      .replace(/^[\s]*[a-zA-Z][\.\)]\s+/, '')
      .trim();
  }
}
```

### 7. Word优化器

**文件**: `src/WordOptimizer.js`

```javascript
class WordOptimizer {
  /**
   * 优化HTML以提高Word兼容性
   * @param {string} html - 原始HTML
   * @returns {string} 优化后的HTML
   */
  async optimize(html) {
    let optimized = html;
    
    // 1. 标准化HTML结构
    optimized = this.standardizeHtml(optimized);
    
    // 2. 内联关键样式
    optimized = this.inlineStyles(optimized);
    
    // 3. 处理特殊字符
    optimized = this.handleSpecialCharacters(optimized);
    
    // 4. 优化表格结构
    optimized = this.optimizeTables(optimized);
    
    // 5. 包装完整HTML文档
    optimized = this.wrapCompleteDocument(optimized);
    
    return optimized;
  }
  
  /**
   * 标准化HTML结构
   * @param {string} html - HTML字符串
   * @returns {string} 标准化后的HTML
   */
  standardizeHtml(html) {
    return html
      // 确保段落标签闭合
      .replace(/<p([^>]*)>([^<]*?)(?=<[^/]|$)/g, '<p$1>$2</p>')
      // 标准化列表结构
      .replace(/<li([^>]*)>([^<]*?)(?=<li|<\/[ou]l|$)/g, '<li$1>$2</li>')
      // 移除空段落
      .replace(/<p[^>]*>\s*<\/p>/g, '');
  }
  
  /**
   * 内联关键样式
   * @param {string} html - HTML字符串
   * @returns {string} 内联样式后的HTML
   */
  inlineStyles(html) {
    return html
      // 为标题添加样式
      .replace(/<h([1-6])([^>]*)>/g, '<h$1$2 style="font-weight: bold; margin: 16px 0 8px 0;">')
      // 为列表添加样式
      .replace(/<ul([^>]*)>/g, '<ul$1 style="margin: 8px 0; padding-left: 20px;">')
      .replace(/<ol([^>]*)>/g, '<ol$1 style="margin: 8px 0; padding-left: 20px;">')
      // 为引用块添加样式
      .replace(/<blockquote([^>]*)>/g, '<blockquote$1 style="margin: 16px 0; padding: 8px 16px; border-left: 4px solid #ccc; background: #f9f9f9;">');
  }
  
  /**
   * 处理特殊字符
   * @param {string} html - HTML字符串
   * @returns {string} 处理后的HTML
   */
  handleSpecialCharacters(html) {
    return html
      // 转换特殊符号为HTML实体
      .replace(/•/g, '&bull;')
      .replace(/—/g, '&mdash;')
      .replace(/"/g, '&ldquo;')
      .replace(/"/g, '&rdquo;')
      .replace(/'/g, '&lsquo;')
      .replace(/'/g, '&rsquo;');
  }
  
  /**
   * 优化表格结构
   * @param {string} html - HTML字符串
   * @returns {string} 优化后的HTML
   */
  optimizeTables(html) {
    // 为表格添加边框样式
    return html.replace(/<table([^>]*)>/g, 
      '<table$1 style="border-collapse: collapse; width: 100%; margin: 16px 0;">')
      .replace(/<td([^>]*)>/g, 
        '<td$1 style="border: 1px solid #ddd; padding: 8px;">')
      .replace(/<th([^>]*)>/g, 
        '<th$1 style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5; font-weight: bold;">');
  }
  
  /**
   * 包装完整HTML文档
   * @param {string} html - HTML内容
   * @returns {string} 完整的HTML文档
   */
  wrapCompleteDocument(html) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="Generator" content="PureText Extension">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
    p { margin: 8px 0; }
    code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: 'Courier New', monospace; }
    pre { background: #f5f5f5; padding: 12px; border-radius: 6px; overflow-x: auto; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
  }
}
```

## Data Models

### 格式化配置模型

```javascript
interface FormatterConfig {
  hostname: string;
  formatterClass: string;
  priority: number;
  cleaningRules: {
    removeButtons: boolean;
    removeAIStatements: boolean;
    removeRecommendedQuestions: boolean;
    customSelectors: string[];
  };
  structureRules: {
    listPatterns: RegExp[];
    headingPatterns: RegExp[];
    blockQuotePatterns: RegExp[];
  };
}
```

### 处理上下文模型

```javascript
interface ProcessingContext {
  hostname: string;
  inList: boolean;
  listItems: string[];
  currentLevel: number;
  elementStack: HTMLElement[];
  textBuffer: string;
}
```

## Error Handling

### 1. 格式化器错误处理

```javascript
async formatForWord(element, hostname) {
  try {
    const formatter = this.getFormatter(hostname);
    return await formatter.format(element);
  } catch (error) {
    console.error(`Formatting failed for ${hostname}:`, error);
    // 降级到通用格式化器
    const genericFormatter = this.formatters.get('generic');
    return await genericFormatter.format(element);
  }
}
```

### 2. DOM操作错误处理

```javascript
processTextNode(text, context, converter) {
  try {
    return this.doProcessTextNode(text, context, converter);
  } catch (error) {
    console.warn('Text node processing failed:', error);
    // 返回基本的段落格式
    return `<p>${text}</p>`;
  }
}
```

### 3. 性能监控和超时处理

```javascript
async formatWithTimeout(element, timeout = 5000) {
  return Promise.race([
    this.formatForWord(element, window.location.hostname),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Format timeout')), timeout)
    )
  ]);
}
```

## Testing Strategy

### 1. 单元测试

```javascript
describe('KimiHtmlFormatter', () => {
  test('should convert Kimi list structure to standard HTML', () => {
    const mockElement = createKimiListElement();
    const formatter = new KimiHtmlFormatter();
    
    const result = formatter.format(mockElement);
    
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>合约价值: 10吨 × 4000元/吨 = 4万元</li>');
  });
});
```

### 2. 集成测试

```javascript
describe('HtmlFormatterManager Integration', () => {
  test('should handle different website structures', async () => {
    const manager = new HtmlFormatterManager();
    
    // 测试Kimi网站
    const kimiResult = await manager.formatForWord(kimiElement, 'www.kimi.com');
    expect(kimiResult).toContain('<ul>');
    
    // 测试DeepSeek网站
    const deepseekResult = await manager.formatForWord(deepseekElement, 'chat.deepseek.com');
    expect(deepseekResult).toContain('<h3>');
  });
});
```

这个设计提供了一个通用、可扩展的HTML格式化系统，能够处理不同AI网站的DOM结构差异，确保复制到Word的内容保持良好的格式。