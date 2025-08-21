import logger from './Logger.js';

/**
 * Word优化器 - 优化HTML以提高Word兼容性
 * 
 * 主要功能：
 * - HTML标准化，确保标签正确闭合
 * - 内联样式支持，为标题、列表、引用块添加适当样式
 * - 特殊字符处理，转换为HTML实体
 * - 完整HTML文档包装
 */
class WordOptimizer {
  /**
   * 优化HTML以提高Word兼容性
   * @param {string} html - 原始HTML
   * @returns {Promise<string>} 优化后的HTML
   */
  async optimize(html) {
    logger.debug('========== 开始优化HTML ==========');
    logger.debug('原始HTML长度:', html.length);
    logger.debug('原始HTML预览:', html.substring(0, 200) + '...');
    
    let optimized = html;
    
    // 1. 标准化HTML结构
    logger.debug('---------- 步骤1: 标准化HTML结构 ----------');
    const beforeStandardize = optimized;
    optimized = this.standardizeHtml(optimized);
    logger.debug('标准化后HTML长度:', optimized.length);
    logger.debug('标准化变化:', optimized !== beforeStandardize ? '有变化' : '无变化');
    
    // 2. 内联关键样式
    logger.debug('---------- 步骤2: 内联关键样式 ----------');
    const beforeInlineStyles = optimized;
    optimized = this.inlineStyles(optimized);
    logger.debug('内联样式后HTML长度:', optimized.length);
    logger.debug('内联样式变化:', optimized !== beforeInlineStyles ? '有变化' : '无变化');
    
    // 3. 处理特殊字符
    logger.debug('---------- 步骤3: 处理特殊字符 ----------');
    const beforeSpecialChars = optimized;
    optimized = this.handleSpecialCharacters(optimized);
    logger.debug('特殊字符处理后HTML长度:', optimized.length);
    logger.debug('特殊字符处理变化:', optimized !== beforeSpecialChars ? '有变化' : '无变化');
    
    // 4. 优化列表结构
    logger.debug('---------- 步骤4: 优化列表结构 ----------');
    const beforeOptimizeLists = optimized;
    optimized = this.optimizeLists(optimized);
    logger.debug('列表优化后HTML长度:', optimized.length);
    logger.debug('列表优化变化:', optimized !== beforeOptimizeLists ? '有变化' : '无变化');
    
    // 5. 优化表格结构
    logger.debug('---------- 步骤5: 优化表格结构 ----------');
    const beforeOptimizeTables = optimized;
    optimized = this.optimizeTables(optimized);
    logger.debug('表格优化后HTML长度:', optimized.length);
    logger.debug('表格优化变化:', optimized !== beforeOptimizeTables ? '有变化' : '无变化');
    
    // 6. 包装完整HTML文档
    logger.debug('---------- 步骤6: 包装完整HTML文档 ----------');
    const beforeWrap = optimized;
    optimized = this.wrapCompleteDocument(optimized);
    logger.debug('包装后HTML长度:', optimized.length);
    logger.debug('包装变化:', optimized !== beforeWrap ? '有变化' : '无变化');
    
    logger.debug('========== 优化完成 ==========');
    logger.debug('最终HTML长度:', optimized.length);
    logger.debug('最终HTML预览:', optimized.substring(0, 300) + '...');
    
    return optimized;
  }
  
  /**
   * 标准化HTML结构，确保标签正确闭合
   * @param {string} html - HTML字符串
   * @returns {string} 标准化后的HTML
   */
  standardizeHtml(html) {
    return html
      // 确保段落标签闭合
      .replace(/<p([^>]*)>([^<]*?)(?=<[^/]|$)/g, '<p$1>$2</p>')
      // 标准化列表结构，确保li标签闭合
      .replace(/<li([^>]*)>([^<]*?)(?=<li|<\/[ou]l|$)/g, '<li$1>$2</li>')
      // 确保标题标签闭合
      .replace(/<h([1-6])([^>]*)>([^<]*?)(?=<[^/]|$)/g, '<h$1$2>$3</h$1>')
      // 确保强调标签闭合
      .replace(/<strong([^>]*)>([^<]*?)(?=<[^/]|$)/g, '<strong$1>$2</strong>')
      // 移除空段落
      .replace(/<p[^>]*>\s*<\/p>/g, '')
      // 移除空列表项
      .replace(/<li[^>]*>\s*<\/li>/g, '')
      // 确保自闭合标签正确格式化
      .replace(/<hr([^>]*)>/g, '<hr$1 />')
      .replace(/<br([^>]*)>/g, '<br$1 />');
  }
  
  /**
   * 内联关键样式，为标题、列表、引用块添加适当样式
   * @param {string} html - HTML字符串
   * @returns {string} 内联样式后的HTML
   */
  inlineStyles(html) {
    return html
      // 为标题添加样式（统一使用11pt基准）
      .replace(/<h1([^>]*)>/g, '<h1$1 style="font-weight: bold; font-size: 16pt; margin: 0 0 10pt 0; font-family: Calibri, sans-serif; color: #333;">')
      .replace(/<h2([^>]*)>/g, '<h2$1 style="font-weight: bold; font-size: 14pt; margin: 0 0 10pt 0; font-family: Calibri, sans-serif; color: #333;">')
      .replace(/<h3([^>]*)>/g, '<h3$1 style="font-weight: bold; font-size: 12pt; margin: 0 0 10pt 0; font-family: Calibri, sans-serif; color: #333;">')
      .replace(/<h4([^>]*)>/g, '<h4$1 style="font-weight: bold; font-size: 11pt; margin: 0 0 10pt 0; font-family: Calibri, sans-serif; color: #333;">')
      .replace(/<h5([^>]*)>/g, '<h5$1 style="font-weight: bold; font-size: 11pt; margin: 0 0 10pt 0; font-family: Calibri, sans-serif; color: #333;">')
      .replace(/<h6([^>]*)>/g, '<h6$1 style="font-weight: bold; font-size: 11pt; margin: 0 0 10pt 0; font-family: Calibri, sans-serif; color: #333;">')
      
      // 为引用块添加样式
      .replace(/<blockquote([^>]*)>/g, '<blockquote$1 style="margin: 16px 0; padding: 8px 16px; border-left: 4px solid #ccc; background: #f9f9f9; font-style: italic;">')
      
      // 为段落添加样式（使用Word兼容的pt单位）
      .replace(/<p([^>]*)>/g, '<p$1 style="margin: 0 0 10pt 0; font-size: 11pt; font-family: Calibri, sans-serif; line-height: 1.15;">')
      
      // 为强调元素添加样式
      .replace(/<strong([^>]*)>/g, '<strong$1 style="font-weight: bold;">')
      .replace(/<em([^>]*)>/g, '<em$1 style="font-style: italic;">')
      
      // 为代码元素添加样式
      .replace(/<code([^>]*)>/g, '<code$1 style="background: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: \'Courier New\', monospace; font-size: 90%;">')
      .replace(/<pre([^>]*)>/g, '<pre$1 style="background: #f5f5f5; padding: 12px; border-radius: 6px; overflow-x: auto; font-family: \'Courier New\', monospace; white-space: pre-wrap;">');
  }
  
  /**
   * 处理特殊字符，转换为HTML实体
   * @param {string} html - HTML字符串
   * @returns {string} 处理后的HTML
   */
  handleSpecialCharacters(html) {
    // 处理特殊字符的函数
    const processSpecialChars = (text) => {
      return text
        // 转换特殊符号为HTML实体
        .replace(/•/g, '&bull;')
        .replace(/—/g, '&mdash;')
        .replace(/–/g, '&ndash;')
        // 处理智能引号 - 注意顺序很重要
        .replace(/"/g, '&ldquo;')
        .replace(/"/g, '&rdquo;')
        .replace(/'/g, '&lsquo;')
        .replace(/'/g, '&rsquo;')
        .replace(/…/g, '&hellip;')
        .replace(/©/g, '&copy;')
        .replace(/®/g, '&reg;')
        .replace(/™/g, '&trade;')
        .replace(/°/g, '&deg;')
        .replace(/±/g, '&plusmn;')
        .replace(/×/g, '&times;')
        .replace(/÷/g, '&divide;')
        // 处理数学符号
        .replace(/≤/g, '&le;')
        .replace(/≥/g, '&ge;')
        .replace(/≠/g, '&ne;')
        .replace(/≈/g, '&asymp;')
        // 处理箭头符号
        .replace(/→/g, '&rarr;')
        .replace(/←/g, '&larr;')
        .replace(/↑/g, '&uarr;')
        .replace(/↓/g, '&darr;')
        // 处理希腊字母
        .replace(/α/g, '&alpha;')
        .replace(/β/g, '&beta;')
        .replace(/γ/g, '&gamma;')
        .replace(/δ/g, '&delta;')
        .replace(/π/g, '&pi;')
        .replace(/Σ/g, '&Sigma;')
        .replace(/Ω/g, '&Omega;');
    };
    
    // 如果输入不包含HTML标签，直接处理整个字符串
    if (!html.includes('<') || !html.includes('>')) {
      return processSpecialChars(html);
    }
    
    // 如果包含HTML标签，只处理标签之间的文本内容
    return html.replace(/>([^<]+)</g, (match, textContent) => {
      const processedText = processSpecialChars(textContent);
      return `>${processedText}<`;
    });
  }
  
  /**
   * 优化列表结构，确保WPS和Word兼容性
   * @param {string} html - HTML字符串
   * @returns {string} 优化后的HTML
   */
  optimizeLists(html) {
    logger.debug('---------- 开始优化列表结构 ----------');
    logger.debug('输入HTML长度:', html.length);
    logger.debug('输入HTML前100字符:', html.substring(0, 100));
    
    // 检查是否包含列表标签
    const hasUl = html.includes('<ul');
    const hasOl = html.includes('<ol');
    const hasLi = html.includes('<li');
    logger.debug('列表标签检查:', { hasUl, hasOl, hasLi });
    
    // 查找所有列表标签
    const ulMatches = html.match(/<ul[^>]*>/g) || [];
    const olMatches = html.match(/<ol[^>]*>/g) || [];
    const liMatches = html.match(/<li[^>]*>/g) || [];
    logger.debug('列表标签统计:', {
      ul数量: ulMatches.length,
      ol数量: olMatches.length,
      li数量: liMatches.length
    });
    
    if (!hasUl && !hasOl && !hasLi) {
      logger.debug('未发现列表标签，跳过列表优化');
      return html;
    }
    
    let optimized = html;
    
    // 1. 清理列表项内容，移除多余的包装
    logger.debug('步骤1: 清理列表项内容');
    const beforeClean = optimized;
    optimized = optimized
      .replace(/<li[^>]*>\s*<div[^>]*class="paragraph"[^>]*>/g, '<li>')
      .replace(/<\/div>\s*<\/li>/g, '</li>');
    logger.debug('清理变化:', optimized !== beforeClean ? '有变化' : '无变化');
    if (optimized !== beforeClean) {
      logger.debug('清理后示例:', optimized.substring(0, 200));
    }
    
    // 2. 为WPS优化的列表样式（精确缩进版本）
    logger.debug('步骤2: 应用基础列表样式');
    const beforeBaseStyles = optimized;
    
    // 先记录替换前的标签
    logger.debug('替换前的ul标签:', ulMatches.slice(0, 3));
    logger.debug('替换前的ol标签:', olMatches.slice(0, 3));
    logger.debug('替换前的li标签:', liMatches.slice(0, 3));
    
    // Word粘贴HTML时的兼容性优化
    // 明确指定列表类型，确保Word正确识别
    optimized = optimized
      .replace(/<ul([^>]*)>/g, (match, attrs) => {
        logger.debug('  替换ul标签:', match, '-> 添加disc样式');
        // 明确指定无序列表样式
        return `<ul${attrs} style="list-style-type: disc;">`;
      })
      .replace(/<ol([^>]*)>/g, (match, attrs) => {
        logger.debug('  替换ol标签:', match, '-> 添加decimal样式');
        // 明确指定有序列表样式
        return `<ol${attrs} style="list-style-type: decimal;">`;
      })
      .replace(/<li([^>]*)>/g, (match, attrs) => {
        logger.debug('  保持li标签简单:', match);
        // li标签不添加样式，让它继承父元素的样式
        return `<li${attrs}>`;
      });
    
    logger.debug('基础样式变化:', optimized !== beforeBaseStyles ? '有变化' : '无变化');
    if (optimized !== beforeBaseStyles) {
      // 查看替换后的结果
      const newUlMatches = optimized.match(/<ul[^>]*>/g) || [];
      const newOlMatches = optimized.match(/<ol[^>]*>/g) || [];
      const newLiMatches = optimized.match(/<li[^>]*>/g) || [];
      logger.debug('替换后的ul标签:', newUlMatches.slice(0, 3));
      logger.debug('替换后的ol标签:', newOlMatches.slice(0, 3));
      logger.debug('替换后的li标签:', newLiMatches.slice(0, 3));
    }
    
    // 3. 跳过嵌套列表处理 - 让Word完全自动处理
    logger.debug('步骤3: 跳过嵌套列表处理（让Word自动处理）');
    const beforeNested = optimized;
    // 不做任何嵌套处理
    logger.debug('嵌套列表变化:', optimized !== beforeNested ? '有变化' : '无变化');
    
    // 5. 移除MSO样式（避免与Word默认列表样式冲突）
    logger.debug('步骤5: 跳过MSO样式（避免冲突）');
    const beforeMso = optimized;
    // 注释掉MSO样式，因为它们可能导致列表格式混乱
    // optimized = optimized
    //   .replace(/<ul([^>]*style="[^"]*")/g, '<ul$1; mso-list: l0 level1 lfo1;')
    //   .replace(/<ol([^>]*style="[^"]*")/g, '<ol$1; mso-list: l1 level1 lfo2;')
    //   .replace(/<li([^>]*style="[^"]*")/g, '<li$1; mso-list: l0 level1 lfo1;');
    logger.debug('MSO样式变化:', optimized !== beforeMso ? '有变化' : '无变化');
    
    // 6. 确保列表项内容正确显示
    logger.debug('步骤6: 清理空列表项');
    const beforeCleanEmpty = optimized;
    optimized = optimized
      .replace(/<li[^>]*>\s*<\/li>/g, '') // 移除空列表项
      .replace(/<li[^>]*>(\s*)<\/li>/g, ''); // 移除只包含空白字符的列表项
    logger.debug('清理空列表项变化:', optimized !== beforeCleanEmpty ? '有变化' : '无变化');
    
    logger.debug('列表优化完成，输出HTML长度:', optimized.length);
    logger.debug('输出HTML前200字符:', optimized.substring(0, 200));
    logger.debug('列表优化前后对比:', {
      原始长度: html.length,
      优化后长度: optimized.length,
      是否有变化: optimized !== html
    });
    
    return optimized;
  }
  
  /**
   * 优化表格结构
   * @param {string} html - HTML字符串
   * @returns {string} 优化后的HTML
   */
  optimizeTables(html) {
    return html
      // 为表格添加边框样式 - 使用纯黑色边框，简化设置避免重复边框
      .replace(/<table([^>]*)>/g, 
        '<table$1 style="border-collapse: collapse; width: 100%; margin: 16px 0;">')
      .replace(/<td([^>]*)>/g, 
        '<td$1 style="border: 1px solid #000000; padding: 8px; vertical-align: top;">')
      .replace(/<th([^>]*)>/g, 
        '<th$1 style="border: 1px solid #000000; padding: 8px; background: #f5f5f5; font-weight: bold; text-align: left; vertical-align: top;">')
      .replace(/<tr([^>]*)>/g, 
        '<tr$1>')
      .replace(/<thead([^>]*)>/g, 
        '<thead$1>')
      .replace(/<tbody([^>]*)>/g, 
        '<tbody$1>');
  }
  
  /**
   * 包装完整HTML文档
   * @param {string} html - HTML内容
   * @returns {string} 完整的HTML文档
   */
  wrapCompleteDocument(html) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="Generator" content="PureText Extension">
  <title>复制的内容</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 20px;
      background: #fff;
    }
    
    /* 确保Word兼容性的基础样式 */
    * {
      box-sizing: border-box;
    }
    
    /* 段落样式 - Word兼容 */
    p { 
      margin: 0 0 10pt 0;
      font-size: 11pt;
      font-family: Calibri, sans-serif;
      line-height: 1.15;
    }
    
    /* 简化的列表样式 - 让Word自动处理 */
    ul, ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    
    li {
      font-size: 11pt;
      font-family: Calibri, sans-serif;
      line-height: 1.5;
      margin: 5px 0;
    }
    
    /* 代码样式 */
    code { 
      background: #f5f5f5; 
      padding: 2px 4px; 
      border-radius: 3px; 
      font-family: 'Courier New', 'Consolas', monospace; 
      font-size: 90%;
      border: 1px solid #e0e0e0;
    }
    
    pre { 
      background: #f5f5f5; 
      padding: 12px; 
      border-radius: 6px; 
      overflow-x: auto; 
      font-family: 'Courier New', 'Consolas', monospace;
      white-space: pre-wrap;
      border: 1px solid #e0e0e0;
      margin: 12px 0;
    }
    
    /* 链接样式 */
    a {
      color: #0066cc;
      text-decoration: underline;
    }
    
    a:hover {
      color: #004499;
    }
    
    /* 分隔线样式 */
    hr {
      border: none;
      border-top: 1px solid #ccc;
      margin: 20px 0;
    }
    
    /* 确保图片适应容器 */
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 12px 0;
    }
    
    /* 打印样式 */
    @media print {
      body {
        max-width: none;
        margin: 0;
        padding: 0;
      }
    }
  </style>
</head>
<body>
${html}
</body>
</html>`;
  }
  
  /**
   * 验证HTML结构的完整性
   * @param {string} html - HTML字符串
   * @returns {boolean} 是否有效
   */
  validateHtmlStructure(html) {
    try {
      // 检查基本的标签配对
      const openTags = html.match(/<[^\/][^>]*>/g) || [];
      const closeTags = html.match(/<\/[^>]*>/g) || [];
      
      // 简单的标签平衡检查
      const tagCounts = {};
      
      openTags.forEach(tag => {
        const tagName = tag.match(/<(\w+)/)?.[1];
        if (tagName && !['br', 'hr', 'img', 'input', 'meta', 'link'].includes(tagName)) {
          tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
        }
      });
      
      closeTags.forEach(tag => {
        const tagName = tag.match(/<\/(\w+)/)?.[1];
        if (tagName) {
          tagCounts[tagName] = (tagCounts[tagName] || 0) - 1;
        }
      });
      
      // 检查是否所有标签都正确闭合
      return Object.values(tagCounts).every(count => count === 0);
    } catch (error) {
      logger.warn('HTML validation failed:', error);
      return false;
    }
  }
}

// 导出类 - 使用ES6模块语法
export { WordOptimizer };