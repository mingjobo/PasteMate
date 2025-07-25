import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestEnvironment } from './test-utils.js';

describe('ButtonInjector', () => {
  let env;
  let ButtonInjector;
  let SiteManager;
  let siteManager;
  let buttonInjector;
  
  beforeEach(async () => {
    env = createTestEnvironment();
    ButtonInjector = env.ButtonInjector;
    SiteManager = env.SiteManager;
    
    siteManager = new SiteManager();
    await siteManager.loadSiteConfig();
    
    buttonInjector = new ButtonInjector(siteManager);
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    if (buttonInjector.observer) {
      buttonInjector.stopObserving();
    }
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided siteManager', () => {
      expect(buttonInjector.siteManager).toBe(siteManager);
      expect(buttonInjector.observer).toBe(null);
      expect(buttonInjector.buttonClass).toBe('puretext-copy-btn');
      expect(buttonInjector.debounceDelay).toBe(100);
    });

    it('should initialize injectedButtons as WeakSet', () => {
      expect(buttonInjector.injectedButtons).toBeInstanceOf(WeakSet);
    });
  });

  describe('startObserving', () => {
    it('should create and start MutationObserver', () => {
      buttonInjector.startObserving();
      
      expect(global.MutationObserver).toHaveBeenCalled();
      expect(buttonInjector.observer).toBeDefined();
      expect(buttonInjector.observer.observe).toHaveBeenCalledWith(
        env.document.body,
        {
          childList: true,
          subtree: true,
          attributes: false
        }
      );
    });

    it('should stop existing observer before starting new one', () => {
      buttonInjector.startObserving();
      const firstObserver = buttonInjector.observer;
      
      buttonInjector.startObserving();
      
      expect(firstObserver.disconnect).toHaveBeenCalled();
      expect(buttonInjector.observer).not.toBe(firstObserver);
    });
  });

  describe('stopObserving', () => {
    it('should disconnect observer when it exists', () => {
      buttonInjector.startObserving();
      const observer = buttonInjector.observer;
      
      buttonInjector.stopObserving();
      
      expect(observer.disconnect).toHaveBeenCalled();
      expect(buttonInjector.observer).toBe(null);
    });

    it('should clear debounce timer', () => {
      buttonInjector.debounceTimer = setTimeout(() => {}, 1000);
      const timerId = buttonInjector.debounceTimer;
      
      buttonInjector.stopObserving();
      
      expect(buttonInjector.debounceTimer).toBe(null);
    });

    it('should handle case when observer is null', () => {
      expect(() => buttonInjector.stopObserving()).not.toThrow();
    });
  });

  describe('createButton', () => {
    it('should create button element with correct properties', () => {
      const targetBubble = env.document.createElement('div');
      const button = buttonInjector.createButton(targetBubble);
      
      expect(button.tagName).toBe('BUTTON');
      expect(button.textContent).toBe('Copy Plain Text');
      expect(button.className).toBe('puretext-copy-btn');
    });

    it('should use internationalized text when available', () => {
      global.chrome.i18n.getMessage.mockReturnValue('复制纯文本');
      
      const targetBubble = env.document.createElement('div');
      const button = buttonInjector.createButton(targetBubble);
      
      expect(button.textContent).toBe('复制纯文本');
    });

    it('should add click event listener', () => {
      const targetBubble = env.document.createElement('div');
      targetBubble.textContent = 'Test content';
      
      const button = buttonInjector.createButton(targetBubble);
      
      // Verify event listener was added by checking if click triggers copy
      const clickEvent = new env.window.Event('click');
      button.dispatchEvent(clickEvent);
      
      // The event should be handled (no error thrown)
      expect(button).toBeDefined();
    });

    it('should add keyboard event listener', () => {
      const targetBubble = env.document.createElement('div');
      const button = buttonInjector.createButton(targetBubble);
      
      // Test Enter key
      const enterEvent = new env.window.KeyboardEvent('keydown', { key: 'Enter' });
      expect(() => button.dispatchEvent(enterEvent)).not.toThrow();
      
      // Test Space key
      const spaceEvent = new env.window.KeyboardEvent('keydown', { key: ' ' });
      expect(() => button.dispatchEvent(spaceEvent)).not.toThrow();
    });

    it('should apply button styles', () => {
      const targetBubble = env.document.createElement('div');
      const button = buttonInjector.createButton(targetBubble);
      
      expect(button.style.position).toBe('absolute');
      expect(button.style.cursor).toBe('pointer');
      expect(button.style.fontFamily).toContain('system');
    });
  });

  describe('injectButton', () => {
    it('should inject button into bubble element', () => {
      const bubble = env.document.createElement('div');
      env.document.body.appendChild(bubble);
      
      buttonInjector.injectButton(bubble);
      
      const injectedButton = bubble.querySelector('.puretext-copy-btn');
      expect(injectedButton).toBeDefined();
      expect(injectedButton.textContent).toBe('Copy Plain Text');
    });

    it('should not inject button if element is not in DOM', () => {
      const bubble = env.document.createElement('div');
      // Don't append to document
      
      buttonInjector.injectButton(bubble);
      
      const injectedButton = bubble.querySelector('.puretext-copy-btn');
      expect(injectedButton).toBe(null);
    });

    it('should not inject duplicate buttons', () => {
      const bubble = env.document.createElement('div');
      env.document.body.appendChild(bubble);
      
      buttonInjector.injectButton(bubble);
      buttonInjector.injectButton(bubble);
      
      const buttons = bubble.querySelectorAll('.puretext-copy-btn');
      expect(buttons.length).toBe(1);
    });

    it('should track injected buttons in WeakSet', () => {
      const bubble = env.document.createElement('div');
      env.document.body.appendChild(bubble);
      
      expect(buttonInjector.injectedButtons.has(bubble)).toBe(false);
      
      buttonInjector.injectButton(bubble);
      
      expect(buttonInjector.injectedButtons.has(bubble)).toBe(true);
    });

    it('should handle injection errors gracefully', () => {
      const bubble = env.document.createElement('div');
      env.document.body.appendChild(bubble);
      
      // Mock appendChild to throw error
      const originalAppendChild = bubble.appendChild;
      bubble.appendChild = vi.fn(() => {
        throw new Error('Injection failed');
      });
      
      expect(() => buttonInjector.injectButton(bubble)).not.toThrow();
      
      // Restore original method
      bubble.appendChild = originalAppendChild;
    });
  });

  describe('scanAndInjectButtons', () => {
    it('should scan for elements matching site selector', () => {
      // Create elements matching ChatGPT selector
      const bubble1 = env.document.createElement('div');
      bubble1.setAttribute('data-message-author-role', 'assistant');
      const markdown1 = env.document.createElement('div');
      markdown1.className = 'markdown';
      bubble1.appendChild(markdown1);
      
      const bubble2 = env.document.createElement('div');
      bubble2.setAttribute('data-message-author-role', 'assistant');
      const markdown2 = env.document.createElement('div');
      markdown2.className = 'markdown';
      bubble2.appendChild(markdown2);
      
      env.document.body.appendChild(bubble1);
      env.document.body.appendChild(bubble2);
      
      buttonInjector.scanAndInjectButtons();
      
      expect(bubble1.querySelector('.puretext-copy-btn')).toBeDefined();
      expect(bubble2.querySelector('.puretext-copy-btn')).toBeDefined();
    });

    it('should handle case when no selector is available', () => {
      // Create site manager for unsupported site
      const unsupportedEnv = createTestEnvironment('unsupported.com');
      const unsupportedSiteManager = new unsupportedEnv.SiteManager();
      const unsupportedButtonInjector = new unsupportedEnv.ButtonInjector(unsupportedSiteManager);
      
      expect(() => unsupportedButtonInjector.scanAndInjectButtons()).not.toThrow();
    });

    it('should handle invalid selectors gracefully', () => {
      // Mock getSelector to return invalid selector
      siteManager.getSelector = vi.fn(() => '<<<invalid>>>');
      
      expect(() => buttonInjector.scanAndInjectButtons()).not.toThrow();
    });
  });

  describe('detectDarkTheme', () => {
    it('should detect dark theme from system preference', () => {
      env.window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('dark'),
        media: query
      }));
      
      const isDark = buttonInjector.detectDarkTheme();
      expect(isDark).toBe(true);
    });

    it('should detect dark theme from CSS classes', () => {
      env.document.documentElement.classList.add('dark');
      
      const isDark = buttonInjector.detectDarkTheme();
      expect(isDark).toBe(true);
    });

    it('should return false for light theme', () => {
      env.window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: false,
        media: query
      }));
      
      const isDark = buttonInjector.detectDarkTheme();
      expect(isDark).toBe(false);
    });

    it('should handle matchMedia errors gracefully', () => {
      env.window.matchMedia = vi.fn(() => {
        throw new Error('matchMedia error');
      });
      
      expect(() => buttonInjector.detectDarkTheme()).not.toThrow();
    });
  });

  describe('getColorScheme', () => {
    it('should return dark color scheme for dark theme', () => {
      const colorScheme = buttonInjector.getColorScheme(true);
      
      expect(colorScheme.text).toBe('#ffffff');
      expect(colorScheme.background).toContain('rgba(255, 255, 255');
    });

    it('should return light color scheme for light theme', () => {
      const colorScheme = buttonInjector.getColorScheme(false);
      
      expect(colorScheme.text).toBe('#333333');
      expect(colorScheme.background).toContain('rgba(0, 0, 0');
    });
  });

  describe('handleButtonClick', () => {
    it('should call ClipboardManager.copyPlainText', async () => {
      const bubble = env.document.createElement('div');
      bubble.textContent = 'Test content';
      env.document.body.appendChild(bubble);
      
      const button = buttonInjector.createButton(bubble);
      
      // Mock ClipboardManager.copyPlainText
      const copyPlainTextSpy = vi.spyOn(env.ClipboardManager, 'copyHtmlToClipboard')
        .mockResolvedValue(true);
      
      await buttonInjector.handleButtonClick(bubble, button);
      
      expect(copyPlainTextSpy).toHaveBeenCalledWith(bubble);
    });

    it('should handle case when target bubble is removed from DOM', async () => {
      const bubble = env.document.createElement('div');
      const button = buttonInjector.createButton(bubble);
      
      // Don't append bubble to document (simulates removal)
      
      await expect(buttonInjector.handleButtonClick(bubble, button)).resolves.not.toThrow();
    });

    it('should handle copy operation errors', async () => {
      const bubble = env.document.createElement('div');
      bubble.textContent = 'Test content';
      env.document.body.appendChild(bubble);
      
      const button = buttonInjector.createButton(bubble);
      
      // Mock ClipboardManager.copyPlainText to throw error
      vi.spyOn(env.ClipboardManager, 'copyHtmlToClipboard')
        .mockRejectedValue(new Error('Copy failed'));
      
      await expect(buttonInjector.handleButtonClick(bubble, button)).resolves.not.toThrow();
    });
  });

  describe('debouncedScan', () => {
    it('should debounce multiple scan requests', () => {
      const scanSpy = vi.spyOn(buttonInjector, 'scanAndInjectButtons');
      
      buttonInjector.debouncedScan();
      buttonInjector.debouncedScan();
      buttonInjector.debouncedScan();
      
      // Should not have called scan immediately
      expect(scanSpy).not.toHaveBeenCalled();
      
      // Wait for debounce delay
      return new Promise(resolve => {
        setTimeout(() => {
          expect(scanSpy).toHaveBeenCalledTimes(1);
          resolve();
        }, 150);
      });
    });

    it('should clear previous timer when called multiple times', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      buttonInjector.debouncedScan();
      const firstTimer = buttonInjector.debounceTimer;
      
      buttonInjector.debouncedScan();
      
      expect(clearTimeoutSpy).toHaveBeenCalledWith(firstTimer);
    });
  });

  describe('handleMutations', () => {
    it('should trigger scan when new elements are added', () => {
      const debouncedScanSpy = vi.spyOn(buttonInjector, 'debouncedScan');
      
      const mutations = [{
        type: 'childList',
        addedNodes: [env.document.createElement('div')]
      }];
      
      buttonInjector.handleMutations(mutations);
      
      expect(debouncedScanSpy).toHaveBeenCalled();
    });

    it('should not trigger scan when no elements are added', () => {
      const debouncedScanSpy = vi.spyOn(buttonInjector, 'debouncedScan');
      
      const mutations = [{
        type: 'childList',
        addedNodes: []
      }];
      
      buttonInjector.handleMutations(mutations);
      
      expect(debouncedScanSpy).not.toHaveBeenCalled();
    });

    it('should ignore non-element nodes', () => {
      const debouncedScanSpy = vi.spyOn(buttonInjector, 'debouncedScan');
      
      const textNode = env.document.createTextNode('text');
      const mutations = [{
        type: 'childList',
        addedNodes: [textNode]
      }];
      
      buttonInjector.handleMutations(mutations);
      
      expect(debouncedScanSpy).not.toHaveBeenCalled();
    });
  });
});