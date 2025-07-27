/**
 * 结构转换器测试
 * 验证各种结构识别和转换功能
 */

// 模拟浏览器环境
global.document = {
  createElement: (tag) => ({
    textContent: '',
    innerHTML: '',
    remove: () => {},
    cloneNode: () => ({ textContent: 'test content' }),
    querySelector: () => null,
    querySelectorAll: () => []
  }),
  createTreeWalker: (root, whatToShow, filter, entityReferenceExpansion) => ({
    nextNode: jest.fn(() => null)
  })
};

global.NodeFilter = {
  SHOW_ELEMENT: 1,
  SHOW_TEXT: 4
};

global.Node = {
  ELEMENT_NODE: 1,
  TEXT_NODE: 3
};

// 导入要测试的类
import { StructureConverter } from '../src/StructureConverter.js';

describe('StructureConverter', () => {
  let converter;
  
  beforeEach(() => {
    converter = new StructureConverter();
  });
  
  describe('基本功能', () => {
    test('应该能够创建实例', () => {
      expect(converter).toBeInstanceOf(StructureConverter);
      expect(converter.listPatterns).toBeInstanceOf(Array);
      expect(converter.headingPatterns).toBeInstanceOf(Array);
      expect(converter.blockQuotePatterns).toBeInstanceOf(Array);
    });
    
    test('应该能够获取模式统计信息', () => {
      const stats = converter.getPatternStats();
      
      expect(stats).toHaveProperty('listPatterns');
      expect(stats).toHaveProperty('headingPatterns');
      expect(stats).toHaveProperty('blockQuotePatterns');
      expect(typeof stats.listPatterns).toBe('number');
      expect(stats.listPatterns).toBeGreaterThan(0);
    });
    
    test('应该能够添加自定义模式', () => {
      const initialListCount = converter.listPatterns.length;
      
      converter.addListPattern(/^custom\s+/);
      
      expect(converter.listPatterns.length).toBe(initialListCount + 1);
    });
  });
  
  describe('列表项识别功能', () => {
    test('应该识别标准项目符号', () => {
      expect(converter.isListItemStart('• 第一项')).toBe(true);
      expect(converter.isListItemStart('· 第二项')).toBe(true);
      expect(converter.isListItemStart('▪ 第三项')).toBe(true);
      expect(converter.isListItemStart('普通文本')).toBe(false);
    });
    
    test('应该识别数字列表', () => {
      expect(converter.isListItemStart('1. 第一项')).toBe(true);
      expect(converter.isListItemStart('2) 第二项')).toBe(true);
      expect(converter.isListItemStart('10. 第十项')).toBe(true);
      expect(converter.isListItemStart('1 不是列表项')).toBe(false);
    });
    
    test('应该识别字母列表', () => {
      expect(converter.isListItemStart('a. 第一项')).toBe(true);
      expect(converter.isListItemStart('B) 第二项')).toBe(true);
      expect(converter.isListItemStart('z. 最后一项')).toBe(true);
    });
    
    test('应该识别Kimi特有的描述性列表', () => {
      expect(converter.isListItemStart('合约价值：10吨 × 4000元/吨 = 4万元')).toBe(true);
      expect(converter.isListItemStart('保证金比例：10%，所以你只交了 4000元保证金')).toBe(true);
      expect(converter.isListItemStart('你账户里总共：5000元')).toBe(true);
      expect(converter.isListItemStart('简介：苏州本土诗人')).toBe(true);
    });
    
    test('应该识别中文数字列表', () => {
      expect(converter.isListItemStart('一、第一项')).toBe(true);
      expect(converter.isListItemStart('二. 第二项')).toBe(true);
      expect(converter.isListItemStart('十) 第十项')).toBe(true);
    });
    
    test('应该处理无效输入', () => {
      expect(converter.isListItemStart(null)).toBe(false);
      expect(converter.isListItemStart(undefined)).toBe(false);
      expect(converter.isListItemStart('')).toBe(false);
      expect(converter.isListItemStart(123)).toBe(false);
    });
  });
  
  describe('标题识别功能', () => {
    test('应该识别带表情符号的标题', () => {
      expect(converter.isHeading('✅ 举个例子你就明白了：')).toBe(true);
      expect(converter.isHeading('❌ 不是"钱全没了"')).toBe(true);
      expect(converter.isHeading('🔧 强平后会发生什么？')).toBe(true);
    });
    
    test('应该识别数字标题', () => {
      expect(converter.isHeading('1. 张继（唐代）')).toBe(true);
      expect(converter.isHeading('2. 陆龟蒙（晚唐）')).toBe(true);
      expect(converter.isHeading('10. 其他诗人')).toBe(true);
    });
    
    test('应该识别常见标题开头', () => {
      expect(converter.isHeading('举个例子你就明白了')).toBe(true);
      expect(converter.isHeading('总结一句话')).toBe(true);
      expect(converter.isHeading('强平后会发生什么')).toBe(true);
    });
    
    test('应该识别短句标题', () => {
      expect(converter.isHeading('其他关联诗人：')).toBe(true);
      expect(converter.isHeading('重要提示:')).toBe(true);
    });
    
    test('应该拒绝过长的文本', () => {
      const longText = '这是一个非常长的文本，超过了100个字符的限制，因此不应该被识别为标题，而应该被当作普通的段落文本来处理，这样可以避免误判。';
      expect(converter.isHeading(longText)).toBe(false);
    });
    
    test('应该处理无效输入', () => {
      expect(converter.isHeading(null)).toBe(false);
      expect(converter.isHeading(undefined)).toBe(false);
      expect(converter.isHeading('')).toBe(false);
    });
  });
  
  describe('引用块识别功能', () => {
    test('应该识别数学计算', () => {
      expect(converter.isBlockQuote('5000 - 2000 = 3000元')).toBe(true);
      expect(converter.isBlockQuote('10 × 4000 = 40000')).toBe(true);
      expect(converter.isBlockQuote('100 + 200 = 300')).toBe(true);
    });
    
    test('应该识别引用标记', () => {
      expect(converter.isBlockQuote('> 这是一个引用')).toBe(true);
      expect(converter.isBlockQuote('》 这也是引用')).toBe(true);
    });
    
    test('应该识别特定的强调内容', () => {
      expect(converter.isBlockQuote('强平只是强制把你的仓位平掉')).toBe(true);
      expect(converter.isBlockQuote('注意：这是重要信息')).toBe(true);
      expect(converter.isBlockQuote('重要：请仔细阅读')).toBe(true);
    });
    
    test('应该处理无效输入', () => {
      expect(converter.isBlockQuote(null)).toBe(false);
      expect(converter.isBlockQuote(undefined)).toBe(false);
      expect(converter.isBlockQuote('')).toBe(false);
    });
  });
  
  describe('列表HTML生成功能', () => {
    test('应该生成无序列表HTML', () => {
      const items = [
        '• 第一项内容',
        '• 第二项内容',
        '• 第三项内容'
      ];
      
      const html = converter.generateListHtml(items);
      
      expect(html).toContain('<ul>');
      expect(html).toContain('</ul>');
      expect(html).toContain('<li>第一项内容</li>');
      expect(html).toContain('<li>第二项内容</li>');
      expect(html).toContain('<li>第三项内容</li>');
    });
    
    test('应该生成有序列表HTML', () => {
      const items = [
        '1. 第一项内容',
        '2. 第二项内容',
        '3. 第三项内容'
      ];
      
      const html = converter.generateListHtml(items);
      
      expect(html).toContain('<ol>');
      expect(html).toContain('</ol>');
      expect(html).toContain('<li>第一项内容</li>');
      expect(html).toContain('<li>第二项内容</li>');
      expect(html).toContain('<li>第三项内容</li>');
    });
    
    test('应该处理Kimi特有的描述性列表', () => {
      const items = [
        '合约价值：10吨 × 4000元/吨 = 4万元',
        '保证金比例：10%，所以你只交了 4000元保证金',
        '你账户里总共：5000元（4000保证金 + 1000可用资金）'
      ];
      
      const html = converter.generateListHtml(items);
      
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>10吨 × 4000元/吨 = 4万元</li>');
      expect(html).toContain('<li>10%，所以你只交了 4000元保证金</li>');
      expect(html).toContain('<li>5000元（4000保证金 + 1000可用资金）</li>');
    });
    
    test('应该处理空数组', () => {
      expect(converter.generateListHtml([])).toBe('');
      expect(converter.generateListHtml(null)).toBe('');
      expect(converter.generateListHtml(undefined)).toBe('');
    });
    
    test('应该过滤空项目', () => {
      const items = [
        '• 有效项目',
        '',
        null,
        '• 另一个有效项目'
      ];
      
      const html = converter.generateListHtml(items);
      
      expect(html).toContain('<li>有效项目</li>');
      expect(html).toContain('<li>另一个有效项目</li>');
      expect(html.match(/<li>/g)).toHaveLength(2); // 只有2个有效项目
    });
  });
  
  describe('列表类型分析功能', () => {
    test('应该正确识别有序列表', () => {
      const items = [
        '1. 第一项',
        '2. 第二项',
        '• 第三项'
      ];
      
      const type = converter.analyzeListType(items);
      expect(type).toBe('ordered');
    });
    
    test('应该正确识别无序列表', () => {
      const items = [
        '• 第一项',
        '• 第二项',
        '1. 第三项'
      ];
      
      const type = converter.analyzeListType(items);
      expect(type).toBe('unordered');
    });
    
    test('应该处理混合类型（默认无序）', () => {
      const items = [
        '• 第一项',
        '1. 第二项'
      ];
      
      const type = converter.analyzeListType(items);
      expect(type).toBe('unordered'); // 平局时默认无序
    });
  });
  
  describe('标题HTML生成功能', () => {
    test('应该生成标题HTML', () => {
      const html = converter.generateHeadingHtml('✅ 举个例子你就明白了：');
      
      expect(html).toContain('<h3>');
      expect(html).toContain('</h3>');
      expect(html).toContain('<strong>');
      expect(html).toContain('举个例子你就明白了：');
    });
    
    test('应该支持不同的标题级别', () => {
      const html1 = converter.generateHeadingHtml('标题', 1);
      const html2 = converter.generateHeadingHtml('标题', 2);
      
      expect(html1).toContain('<h1>');
      expect(html2).toContain('<h2>');
    });
    
    test('应该限制标题级别范围', () => {
      const html1 = converter.generateHeadingHtml('标题', 0);
      const html2 = converter.generateHeadingHtml('标题', 10);
      
      expect(html1).toContain('<h1>'); // 最小为1
      expect(html2).toContain('<h6>'); // 最大为6
    });
    
    test('应该转义HTML特殊字符', () => {
      const html = converter.generateHeadingHtml('<script>alert("xss")</script>');
      
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });
  
  describe('引用块HTML生成功能', () => {
    test('应该生成引用块HTML', () => {
      const html = converter.generateBlockQuoteHtml('5000 - 2000 = 3000元');
      
      expect(html).toContain('<blockquote>');
      expect(html).toContain('</blockquote>');
      expect(html).toContain('<p>');
      expect(html).toContain('3000元');
    });
    
    test('应该转义HTML特殊字符', () => {
      const html = converter.generateBlockQuoteHtml('<script>alert("xss")</script>');
      
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });
  
  describe('段落HTML生成功能', () => {
    test('应该生成段落HTML', () => {
      const html = converter.generateParagraphHtml('这是一个段落');
      
      expect(html).toContain('<p>');
      expect(html).toContain('</p>');
      expect(html).toContain('这是一个段落');
    });
    
    test('应该处理空文本', () => {
      expect(converter.generateParagraphHtml('')).toBe('');
      expect(converter.generateParagraphHtml(null)).toBe('');
      expect(converter.generateParagraphHtml(undefined)).toBe('');
    });
    
    test('应该转义HTML特殊字符', () => {
      const html = converter.generateParagraphHtml('<script>alert("xss")</script>');
      
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });
  
  describe('HTML清理功能', () => {
    test('应该清理内联样式', () => {
      const html = '<p style="color: red;" data-v-123="test">内容</p>';
      const cleaned = converter.cleanInlineStyles(html);
      
      expect(cleaned).not.toContain('style=');
      expect(cleaned).not.toContain('data-v-');
      expect(cleaned).toContain('内容');
    });
    
    test('应该优化HTML结构', () => {
      const html = '<p>段落1<p>段落2<li>列表项';
      const optimized = converter.optimizeHtmlStructure(html);
      
      expect(optimized).toContain('</p>');
      expect(optimized).toContain('</li>');
    });
  });
  
  describe('HTML转义功能', () => {
    test('应该转义特殊字符', () => {
      const text = '<script>alert("xss")</script>';
      const escaped = converter.escapeHtml(text);
      
      expect(escaped).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    });
    
    test('应该处理空值', () => {
      expect(converter.escapeHtml(null)).toBe('');
      expect(converter.escapeHtml(undefined)).toBe('');
      expect(converter.escapeHtml('')).toBe('');
    });
  });
});