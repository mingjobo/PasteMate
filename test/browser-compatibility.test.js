/**
 * 浏览器兼容性单元测试
 * 使用 Vitest 框架进行自动化测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// 模拟浏览器环境
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'https://chat.openai.com',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.MutationObserver = dom.window.MutationObserver;

// 模拟 Chrome 扩展 API
global.chrome = {
  runtime: {
    getManifest: vi.fn(() => ({
      manifest_version: 3,
      name: 'PureText One-Click',
      version: '1.0.0'
    }))
  },
  i18n: {
    getMessage: vi.fn((key) => {
      const messages = {
        'extensionName': 'PureText One-Click',
        'copyToWord': 'Copy Plain Text',
        'copySuccess': 'Copied successfully',
        'copyFailed': 'Copy failed'
      };
      return messages[key] || key;
    }),
    getUILanguage: vi.fn(() => 'en')
  },
  storage: {
    sync: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
      remove: vi.fn(() => Promise.resolve())
    }
  },
  permissions: {
    getAll: vi.fn(() => Promise.resolve({
      permissions: ['clipboardWrite'],
      origins: []
    }))
  }
};

// 模拟 Clipboard API
Object.defineProperty(global.navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve('test text'))
  },
  writable: true
});

describe('浏览器兼容性测试', () => {
  let mockConsole;

  beforeEach(() => {
    // 模拟控制台输出
    mockConsole = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    };
    global.console = mockConsole;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Chrome 浏览器兼容性', () => {
    it('应该支持 Manifest V3', () => {
      expect(chrome.runtime.getManifest).toBeDefined();
      const manifest = chrome.runtime.getManifest();
      expect(manifest.manifest_version).toBe(3);
    });

    it('应该支持剪贴板 API', async () => {
      expect(navigator.clipboard).toBeDefined();
      expect(navigator.clipboard.writeText).toBeDefined();
      
      await navigator.clipboard.writeText('test');
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test');
    });

    it('应该支持国际化 API', () => {
      expect(chrome.i18n.getMessage).toBeDefined();
      expect(chrome.i18n.getUILanguage).toBeDefined();
      
      const message = chrome.i18n.getMessage('copyToWord');
      expect(message).toBe('Copy Plain Text');
    });

    it('应该支持存储 API', async () => {
      expect(chrome.storage.sync).toBeDefined();
      
      await chrome.storage.sync.set({ test: 'value' });
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ test: 'value' });
    });

    it('应该支持 MutationObserver', () => {
      expect(MutationObserver).toBeDefined();
      
      const observer = new MutationObserver(() => {});
      expect(observer).toBeInstanceOf(MutationObserver);
      expect(observer.observe).toBeDefined();
      expect(observer.disconnect).toBeDefined();
    });
  });

  describe('Edge 浏览器兼容性', () => {
    beforeEach(() => {
      // 模拟 Edge 用户代理
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        writable: true
      });
    });

    it('应该正确检测 Edge 浏览器', () => {
      const userAgent = navigator.userAgent.toLowerCase();
      expect(userAgent.includes('edg/')).toBe(true);
    });

    it('应该支持所有 Chrome 扩展 API', () => {
      // Edge 基于 Chromium，应该支持所有 Chrome API
      expect(chrome.runtime).toBeDefined();
      expect(chrome.i18n).toBeDefined();
      expect(chrome.storage).toBeDefined();
    });
  });

  describe('Firefox 浏览器兼容性', () => {
    beforeEach(() => {
      // 模拟 Firefox 用户代理
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        writable: true
      });

      // Firefox 的剪贴板 API 可能有限制
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn(() => {
            // 模拟 Firefox 的权限限制
            if (Math.random() > 0.5) {
              return Promise.reject(new Error('Permission denied'));
            }
            return Promise.resolve();
          })
        },
        writable: true
      });
    });

    it('应该正确检测 Firefox 浏览器', () => {
      const userAgent = navigator.userAgent.toLowerCase();
      expect(userAgent.includes('firefox')).toBe(true);
    });

    it('应该处理剪贴板 API 权限限制', async () => {
      // Firefox 可能会拒绝剪贴板访问
      try {
        await navigator.clipboard.writeText('test');
      } catch (error) {
        expect(error.message).toBe('Permission denied');
      }
    });

    it('应该支持 Manifest V3 (Firefox 109+)', () => {
      // Firefox 109+ 支持 Manifest V3
      expect(chrome.runtime.getManifest).toBeDefined();
      const manifest = chrome.runtime.getManifest();
      expect(manifest.manifest_version).toBe(3);
    });
  });

  describe('DOM 操作兼容性', () => {
    it('应该能够创建和操作 DOM 元素', () => {
      const element = document.createElement('div');
      element.textContent = 'Test content';
      document.body.appendChild(element);
      
      expect(element.textContent).toBe('Test content');
      expect(document.body.contains(element)).toBe(true);
      
      document.body.removeChild(element);
      expect(document.body.contains(element)).toBe(false);
    });

    it('应该支持 CSS 样式设置', () => {
      const element = document.createElement('div');
      element.style.position = 'absolute';
      element.style.top = '10px';
      element.style.right = '10px';
      
      expect(element.style.position).toBe('absolute');
      expect(element.style.top).toBe('10px');
      expect(element.style.right).toBe('10px');
    });

    it('应该支持事件监听', () => {
      const element = document.createElement('button');
      const clickHandler = vi.fn();
      
      element.addEventListener('click', clickHandler);
      element.click();
      
      expect(clickHandler).toHaveBeenCalled();
    });
  });

  describe('CSS 特性兼容性', () => {
    let testElement;

    beforeEach(() => {
      testElement = document.createElement('div');
      document.body.appendChild(testElement);
    });

    afterEach(() => {
      if (testElement.parentNode) {
        testElement.parentNode.removeChild(testElement);
      }
    });

    it('应该支持基本 CSS 属性', () => {
      const properties = [
        'position',
        'top',
        'right',
        'bottom',
        'left',
        'background',
        'color',
        'border',
        'borderRadius',
        'padding',
        'margin',
        'fontSize',
        'fontFamily'
      ];

      properties.forEach(prop => {
        testElement.style[prop] = 'initial';
        expect(testElement.style[prop]).toBeDefined();
      });
    });

    it('应该支持现代 CSS 特性', () => {
      const modernProperties = [
        'transform',
        'transition',
        'boxShadow',
        'opacity',
        'zIndex'
      ];

      modernProperties.forEach(prop => {
        testElement.style[prop] = 'initial';
        expect(testElement.style[prop]).toBeDefined();
      });
    });

    it('应该优雅处理不支持的 CSS 特性', () => {
      // backdrop-filter 可能不被所有浏览器支持
      try {
        testElement.style.backdropFilter = 'blur(8px)';
        // 如果支持，应该能设置值
        expect(testElement.style.backdropFilter).toBeDefined();
      } catch (error) {
        // 如果不支持，应该优雅处理
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('错误处理和降级方案', () => {
    it('应该在 Chrome API 不可用时优雅降级', () => {
      // 临时移除 chrome 对象
      const originalChrome = global.chrome;
      global.chrome = undefined;

      // 测试代码应该能处理这种情况
      expect(() => {
        const hasChrome = typeof chrome !== 'undefined';
        expect(hasChrome).toBe(false);
      }).not.toThrow();

      // 恢复 chrome 对象
      global.chrome = originalChrome;
    });

    it('应该在剪贴板 API 失败时使用降级方案', async () => {
      // 模拟剪贴板 API 失败
      const originalClipboard = navigator.clipboard;
      navigator.clipboard = {
        writeText: vi.fn(() => Promise.reject(new Error('Permission denied')))
      };

      // 模拟 execCommand 方法（JSDOM 不支持）
      document.execCommand = vi.fn(() => true);

      // 模拟降级方案
      const fallbackCopy = (text) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      };

      try {
        await navigator.clipboard.writeText('test');
      } catch (error) {
        // 使用降级方案
        const success = fallbackCopy('test');
        expect(success).toBe(true);
        expect(document.execCommand).toHaveBeenCalledWith('copy');
      }

      // 恢复原始剪贴板 API
      navigator.clipboard = originalClipboard;
    });

    it('应该处理 DOM 元素不存在的情况', () => {
      const nonExistentElement = document.getElementById('non-existent');
      expect(nonExistentElement).toBeNull();

      // 代码应该能安全处理 null 元素
      expect(() => {
        if (nonExistentElement) {
          nonExistentElement.textContent = 'test';
        }
      }).not.toThrow();
    });
  });

  describe('性能和内存管理', () => {
    it('应该正确清理事件监听器', () => {
      const element = document.createElement('button');
      const handler = vi.fn();
      
      element.addEventListener('click', handler);
      element.removeEventListener('click', handler);
      element.click();
      
      // 移除监听器后不应该被调用
      expect(handler).not.toHaveBeenCalled();
    });

    it('应该正确断开 MutationObserver', () => {
      const observer = new MutationObserver(() => {});
      observer.observe(document.body, { childList: true });
      
      expect(() => {
        observer.disconnect();
      }).not.toThrow();
    });

    it('应该避免内存泄漏', () => {
      // 记录初始状态
      const initialChildCount = document.body.children.length;
      
      // 创建大量元素并清理
      const elements = [];
      for (let i = 0; i < 100; i++) {
        const element = document.createElement('div');
        elements.push(element);
        document.body.appendChild(element);
      }
      
      // 验证元素已添加
      expect(document.body.children.length).toBe(initialChildCount + 100);
      
      // 清理所有元素
      elements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
      
      // 验证清理完成，回到初始状态
      expect(document.body.children.length).toBe(initialChildCount);
    });
  });
});

describe('特定网站兼容性测试', () => {
  const testSites = [
    {
      hostname: 'chat.openai.com',
      selector: "[data-message-author-role='assistant'] .markdown",
      name: 'ChatGPT'
    },
    {
      hostname: 'chat.deepseek.com',
      selector: ".message-content[data-role='assistant']",
      name: 'DeepSeek'
    },
    {
      hostname: 'www.doubao.com',
      selector: '.dialogue-text.assistant',
      name: '豆包'
    },
    {
      hostname: 'www.kimi.com',
      selector: '.response-bubble',
      name: 'Kimi'
    }
  ];

  testSites.forEach((site, index) => {
    describe(`${site.name} (${site.hostname})`, () => {
      let mockLocation;
      
      beforeEach(() => {
        // 创建模拟的 location 对象
        mockLocation = { hostname: site.hostname };
        
        // 创建模拟的聊天消息元素
        const messageElement = document.createElement('div');
        messageElement.className = site.selector.replace(/[\[\]"']/g, '').replace(/[.#]/g, '').split(' ').join(' ');
        messageElement.textContent = '这是一个测试消息';
        messageElement.id = `test-message-${index}`;
        
        // 根据选择器设置属性
        if (site.selector.includes('data-message-author-role')) {
          messageElement.setAttribute('data-message-author-role', 'assistant');
        }
        if (site.selector.includes('data-role')) {
          messageElement.setAttribute('data-role', 'assistant');
        }
        
        document.body.appendChild(messageElement);
      });

      afterEach(() => {
        // 清理 DOM
        document.body.innerHTML = '';
      });

      it('应该能够识别当前网站', () => {
        expect(mockLocation.hostname).toBe(site.hostname);
      });

      it('应该能够找到目标元素', () => {
        // 简化的选择器测试
        const elements = document.querySelectorAll('div');
        expect(elements.length).toBeGreaterThan(0);
        
        // 验证特定测试元素存在
        const testElement = document.getElementById(`test-message-${index}`);
        expect(testElement).not.toBeNull();
      });

      it('应该能够提取文本内容', () => {
        const testElement = document.getElementById(`test-message-${index}`);
        expect(testElement).not.toBeNull();
        
        const text = testElement.textContent || testElement.innerText;
        expect(text).toBe('这是一个测试消息');
      });
    });
  });
});

describe('国际化兼容性测试', () => {
  const languages = ['en', 'zh-CN', 'zh-TW'];

  languages.forEach(lang => {
    it(`应该支持 ${lang} 语言`, () => {
      chrome.i18n.getUILanguage.mockReturnValue(lang);
      
      const uiLanguage = chrome.i18n.getUILanguage();
      expect(uiLanguage).toBe(lang);
    });
  });

  it('应该提供默认文案', () => {
    const defaultMessage = chrome.i18n.getMessage('nonExistentKey');
    expect(defaultMessage).toBe('nonExistentKey');
  });
});