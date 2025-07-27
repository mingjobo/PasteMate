/**
 * HTML格式化管理器测试
 * 验证核心架构的基本功能
 */

// 模拟浏览器环境
global.window = {
  location: { hostname: 'test.example.com' },
  performance: { now: () => Date.now() }
};

global.document = {
  createElement: (tag) => ({
    textContent: '',
    innerHTML: '',
    remove: () => {},
    cloneNode: () => ({ textContent: 'test content' }),
    querySelector: () => null,
    querySelectorAll: () => []
  })
};

// 导入要测试的类
import { HtmlFormatterManager } from '../src/HtmlFormatterManager.js';
import { HtmlFormatter } from '../src/formatters/HtmlFormatter.js';

describe('HtmlFormatterManager', () => {
  let manager;
  
  beforeEach(() => {
    manager = new HtmlFormatterManager();
  });
  
  afterEach(() => {
    manager.clearFormatters();
  });
  
  describe('基本功能', () => {
    test('应该能够创建实例', () => {
      expect(manager).toBeInstanceOf(HtmlFormatterManager);
      expect(manager.formatters).toBeInstanceOf(Map);
      expect(manager.genericFormatter).toBeNull();
    });
    
    test('应该能够注册格式化器', () => {
      class TestFormatter extends HtmlFormatter {
        async format(element) {
          return '<div>test</div>';
        }
        getName() {
          return 'TestFormatter';
        }
      }
      
      const formatter = new TestFormatter();
      manager.registerFormatter('test.com', formatter);
      
      expect(manager.formatters.get('test.com')).toBe(formatter);
    });
    
    test('应该拒绝非HtmlFormatter实例', () => {
      const invalidFormatter = { format: () => {} };
      
      expect(() => {
        manager.registerFormatter('test.com', invalidFormatter);
      }).toThrow('Formatter must extend HtmlFormatter class');
    });
    
    test('应该能够设置通用格式化器', () => {
      class GenericFormatter extends HtmlFormatter {
        async format(element) {
          return '<div>generic</div>';
        }
        getName() {
          return 'GenericFormatter';
        }
      }
      
      const formatter = new GenericFormatter();
      manager.setGenericFormatter(formatter);
      
      expect(manager.genericFormatter).toBe(formatter);
    });
  });
  
  describe('格式化器选择', () => {
    let testFormatter, genericFormatter;
    
    beforeEach(() => {
      class TestFormatter extends HtmlFormatter {
        async format(element) {
          return '<div>test specific</div>';
        }
        getName() {
          return 'TestFormatter';
        }
        canHandle(element) {
          return true;
        }
      }
      
      class GenericFormatter extends HtmlFormatter {
        async format(element) {
          return '<div>generic</div>';
        }
        getName() {
          return 'GenericFormatter';
        }
        canHandle(element) {
          return true;
        }
      }
      
      testFormatter = new TestFormatter();
      genericFormatter = new GenericFormatter();
      
      manager.registerFormatter('test.com', testFormatter);
      manager.setGenericFormatter(genericFormatter);
    });
    
    test('应该选择网站特定的格式化器', () => {
      const mockElement = { textContent: 'test' };
      const formatter = manager.getFormatter('test.com', mockElement);
      
      expect(formatter).toBe(testFormatter);
    });
    
    test('应该在没有特定格式化器时使用通用格式化器', () => {
      const mockElement = { textContent: 'test' };
      const formatter = manager.getFormatter('unknown.com', mockElement);
      
      expect(formatter).toBe(genericFormatter);
    });
    
    test('应该在没有任何格式化器时抛出错误', () => {
      manager.clearFormatters();
      const mockElement = { textContent: 'test' };
      
      expect(() => {
        manager.getFormatter('unknown.com', mockElement);
      }).toThrow('No suitable formatter found for unknown.com');
    });
  });
  
  describe('降级处理', () => {
    test('应该能够处理空元素', () => {
      const mockElement = { 
        innerText: '', 
        textContent: '',
        cloneNode: () => ({ innerText: '', textContent: '' })
      };
      
      const result = manager.fallbackFormat(mockElement);
      expect(result).toBe('<div><p>无内容</p></div>');
    });
    
    test('应该能够将文本转换为段落', () => {
      const mockElement = { 
        innerText: 'Line 1\nLine 2\nLine 3',
        textContent: 'Line 1\nLine 2\nLine 3',
        cloneNode: () => ({ innerText: 'Line 1\nLine 2\nLine 3' })
      };
      
      const result = manager.fallbackFormat(mockElement);
      expect(result).toContain('<p>Line 1</p>');
      expect(result).toContain('<p>Line 2</p>');
      expect(result).toContain('<p>Line 3</p>');
    });
    
    test('应该转义HTML特殊字符', () => {
      const text = '<script>alert("xss")</script>';
      const escaped = manager.escapeHtml(text);
      
      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
    });
  });
  
  describe('格式化器信息', () => {
    test('应该返回已注册格式化器的信息', () => {
      class TestFormatter extends HtmlFormatter {
        getName() { return 'TestFormatter'; }
        getPriority() { return 10; }
      }
      
      class GenericFormatter extends HtmlFormatter {
        getName() { return 'GenericFormatter'; }
        getPriority() { return -1; }
      }
      
      manager.registerFormatter('test.com', new TestFormatter());
      manager.setGenericFormatter(new GenericFormatter());
      
      const formatters = manager.getRegisteredFormatters();
      
      expect(formatters).toHaveLength(2);
      expect(formatters[0].name).toBe('TestFormatter');
      expect(formatters[0].priority).toBe(10);
      expect(formatters[1].name).toBe('GenericFormatter');
      expect(formatters[1].priority).toBe(-1);
    });
  });
});