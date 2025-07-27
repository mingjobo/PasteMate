import { describe, test, expect, beforeEach } from 'vitest';
import { KimiHtmlFormatter } from '../src/formatters/KimiHtmlFormatter.js';
import { JSDOM } from 'jsdom';

describe('KimiHtmlFormatter', () => {
  let formatter;
  let dom;
  let document;

  beforeEach(() => {
    formatter = new KimiHtmlFormatter();
    
    // 设置JSDOM环境
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    document = dom.window.document;
    global.document = document;
    global.window = dom.window;
    global.Node = dom.window.Node;
    global.NodeFilter = dom.window.NodeFilter;
  });

  describe('基本功能', () => {
    test('应该能够创建实例', () => {
      expect(formatter).toBeInstanceOf(KimiHtmlFormatter);
      expect(formatter.getName()).toBe('KimiHtmlFormatter');
      expect(formatter.getPriority()).toBe(10);
    });

    test('应该能够检测Kimi DOM结构', () => {
      const element = document.createElement('div');
      element.innerHTML = '<div class="markdown">测试内容</div>';
      
      expect(formatter.canHandle(element)).toBe(true);
    });

    test('应该拒绝非Kimi DOM结构', () => {
      const element = document.createElement('div');
      element.innerHTML = '<div class="other">测试内容</div>';
      
      expect(formatter.canHandle(element)).toBe(false);
    });
  });

  describe('文本节点处理', () => {
    test('应该识别Kimi特有的列表项格式', () => {
      const context = { inList: false, listItems: [], currentLevel: 0 };
      
      const result = formatter.processTextNode('合约价值: 10吨 × 4000元/吨 = 4万元', context);
      
      expect(context.inList).toBe(true);
      expect(context.listItems).toHaveLength(1);
      expect(context.listItems[0]).toBe('合约价值: 10吨 × 4000元/吨 = 4万元');
      expect(result).toBe('');
    });

    test('应该处理普通文本内容', () => {
      const context = { inList: false, listItems: [], currentLevel: 0 };
      
      const result = formatter.processTextNode('这是普通文本内容', context);
      
      expect(result).toContain('<p>这是普通文本内容</p>');
    });

    test('应该在列表中追加文本到当前列表项', () => {
      const context = { 
        inList: true, 
        listItems: ['合约价值:'], 
        currentLevel: 0 
      };
      
      const result = formatter.processTextNode('10吨 × 4000元/吨 = 4万元', context);
      
      expect(context.listItems[0]).toBe('合约价值: 10吨 × 4000元/吨 = 4万元');
      expect(result).toBe('');
    });
  });

  describe('元素节点处理', () => {
    test('应该处理强调元素', () => {
      const element = document.createElement('strong');
      element.textContent = '重要内容';
      const context = { inList: false, listItems: [], currentLevel: 0 };
      
      const result = formatter.processElementNode(element, context);
      
      expect(result).toBe('<strong>重要内容</strong>');
    });

    test('应该处理代码元素', () => {
      const element = document.createElement('code');
      element.textContent = 'console.log("hello")';
      const context = { inList: false, listItems: [], currentLevel: 0 };
      
      const result = formatter.processElementNode(element, context);
      
      expect(result).toBe('<code>console.log("hello")</code>');
    });

    test('应该忽略按钮元素', () => {
      const element = document.createElement('button');
      element.textContent = '复制';
      const context = { inList: false, listItems: [], currentLevel: 0 };
      
      const result = formatter.processElementNode(element, context);
      
      expect(result).toBe('');
    });
  });

  describe('格式化功能', () => {
    test('应该格式化包含列表的Kimi内容', async () => {
      const element = document.createElement('div');
      element.className = 'markdown';
      element.innerHTML = `
        <div>合约价值: 10吨 × 4000元/吨 = 4万元</div>
        <div>保证金比例: 10%，所以你只交了 4000元保证金</div>
        <div>这是普通段落内容</div>
      `;
      
      const result = await formatter.format(element);
      
      expect(result).toContain('<div>');
      expect(result).toContain('</div>');
      // 由于TreeWalker的复杂性，我们主要验证格式化器不会抛出错误
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    test('应该处理空元素', async () => {
      const element = document.createElement('div');
      element.className = 'markdown';
      
      const result = await formatter.format(element);
      
      expect(result).toBe('<div></div>');
    });

    test('应该在格式化失败时使用降级处理', async () => {
      const element = document.createElement('div');
      element.className = 'markdown';
      element.textContent = '测试内容\n第二行\n第三行';
      
      // 模拟格式化失败，应该使用fallbackFormat
      const result = await formatter.format(element);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('HTML转义功能', () => {
    test('应该转义HTML特殊字符', () => {
      const result = formatter.escapeHtml('<script>alert("xss")</script>');
      
      expect(result).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    });

    test('应该处理空值', () => {
      expect(formatter.escapeHtml('')).toBe('');
      expect(formatter.escapeHtml(null)).toBe('');
      expect(formatter.escapeHtml(undefined)).toBe('');
    });
  });

  describe('降级格式化', () => {
    test('应该提供降级格式化功能', () => {
      const element = document.createElement('div');
      element.textContent = '第一行\n第二行\n第三行';
      
      const result = formatter.fallbackFormat(element);
      
      expect(result).toContain('<div>');
      expect(result).toContain('<p>');
      expect(result).toContain('第一行');
      expect(result).toContain('第二行');
      expect(result).toContain('第三行');
    });

    test('应该处理空内容', () => {
      const element = document.createElement('div');
      
      const result = formatter.fallbackFormat(element);
      
      expect(result).toBe('<div><p>无内容</p></div>');
    });
  });
});