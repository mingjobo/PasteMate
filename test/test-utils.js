// Test utilities for setting up the test environment
import { JSDOM } from 'jsdom';
import { vi } from 'vitest';

// Import the ClipboardManager from the separate module
import { ClipboardManager } from '../src/ClipboardManager.js';

// Mock the SUPPORTED_SITES configuration
const SUPPORTED_SITES = {
  "chat.openai.com": {
    selector: "[data-message-author-role='assistant'] .markdown",
    name: "ChatGPT"
  },
  "chat.deepseek.com": {
    selector: ".message-content[data-role='assistant']",
    name: "DeepSeek"
  },
  "www.doubao.com": {
    selector: ".dialogue-text.assistant",
    name: "豆包"
  },
  "www.kimi.com": {
    selector: ".response-bubble",
    name: "Kimi"
  }
};

// SiteManager class for testing
class SiteManager {
  constructor() {
    this.siteConfig = null;
    this.currentSite = null;
  }

  async loadSiteConfig() {
    try {
      const baseSites = SUPPORTED_SITES;
      
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.sync.get(['customSites', 'disabledSites']);
        if (result.customSites || result.disabledSites) {
          this.siteConfig = this.mergeConfigs(baseSites, result);
          return;
        }
      }
    } catch (error) {
      // Use built-in config as fallback
    }

    this.siteConfig = { ...SUPPORTED_SITES };
  }

  mergeConfigs(builtInConfig, userConfig) {
    const merged = { ...builtInConfig };
    
    if (userConfig.customSites) {
      Object.assign(merged, userConfig.customSites);
    }
    
    if (userConfig.disabledSites && Array.isArray(userConfig.disabledSites)) {
      userConfig.disabledSites.forEach(hostname => {
        delete merged[hostname];
      });
    }
    
    return merged;
  }

  getCurrentSite() {
    if (!this.siteConfig) {
      return null;
    }

    const hostname = window.location.hostname;
    this.currentSite = this.siteConfig[hostname] || null;
    
    if (this.currentSite) {
      this.currentSite.hostname = hostname;
    }
    
    return this.currentSite;
  }

  isSupported() {
    return this.getCurrentSite() !== null;
  }

  getSelector() {
    const site = this.getCurrentSite();
    return site ? site.selector : null;
  }

  getSiteName() {
    const site = this.getCurrentSite();
    return site ? site.name : null;
  }

  validateSiteConfig(siteConfig) {
    if (!siteConfig || typeof siteConfig !== 'object') {
      return false;
    }

    if (!siteConfig.selector || typeof siteConfig.selector !== 'string') {
      return false;
    }

    if (!siteConfig.name || typeof siteConfig.name !== 'string') {
      return false;
    }

    try {
      document.querySelector(siteConfig.selector);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// ButtonInjector class for testing
class ButtonInjector {
  constructor(siteManager) {
    this.siteManager = siteManager;
    this.observer = null;
    this.injectedButtons = new WeakSet();
    this.buttonClass = 'puretext-copy-btn';
    this.debounceTimer = null;
    this.debounceDelay = 100;
  }

  startObserving() {
    if (this.observer) {
      this.stopObserving();
    }

    this.scanAndInjectButtons();

    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }

  stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  handleMutations(mutations) {
    let shouldScan = false;

    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            shouldScan = true;
            break;
          }
        }
      }
      
      if (shouldScan) break;
    }

    if (shouldScan) {
      this.debouncedScan();
    }
  }

  debouncedScan() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.scanAndInjectButtons();
    }, this.debounceDelay);
  }

  scanAndInjectButtons() {
    const selector = this.siteManager.getSelector();
    if (!selector) {
      return;
    }

    try {
      const bubbles = document.querySelectorAll(selector);
      
      for (const bubble of bubbles) {
        this.injectButton(bubble);
      }
    } catch (error) {
      // Handle error gracefully
    }
  }

  injectButton(bubble) {
    try {
      if (!document.contains(bubble)) {
        return;
      }

      if (this.injectedButtons.has(bubble)) {
        return;
      }

      if (bubble.querySelector(`.${this.buttonClass}`)) {
        this.injectedButtons.add(bubble);
        return;
      }

      const button = this.createButton(bubble);
      bubble.appendChild(button);
      
      this.injectedButtons.add(bubble);
    } catch (error) {
      // Handle error gracefully
    }
  }

  createButton(targetBubble) {
    const button = document.createElement('button');
    
    const buttonText = chrome?.i18n ? chrome.i18n.getMessage('copyToWord') : 'Copy Plain Text';
    button.textContent = buttonText;
    
    button.className = this.buttonClass;
    
    this.applyButtonStyles(button);
    
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.handleButtonClick(targetBubble, button);
    });

    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        this.handleButtonClick(targetBubble, button);
      }
    });

    return button;
  }

  applyButtonStyles(button) {
    const isDarkTheme = this.detectDarkTheme();
    const colorScheme = this.getColorScheme(isDarkTheme);
    
    button.style.cssText = `
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: ${colorScheme.background};
      color: ${colorScheme.text};
      border: 1px solid ${colorScheme.border};
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      cursor: pointer;
      z-index: 10001;
      opacity: 0.85;
    `;
  }

  detectDarkTheme() {
    try {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const hasDarkClass = document.documentElement.classList.contains('dark') || 
                          document.body.classList.contains('dark');
      
      return hasDarkClass || prefersDark;
    } catch (error) {
      return false;
    }
  }

  getColorScheme(isDark) {
    if (isDark) {
      return {
        background: 'rgba(255, 255, 255, 0.12)',
        text: '#ffffff',
        border: 'rgba(255, 255, 255, 0.2)',
        shadow: 'rgba(0, 0, 0, 0.4)',
        hoverBackground: 'rgba(255, 255, 255, 0.18)',
        hoverShadow: 'rgba(0, 0, 0, 0.6)',
        activeBackground: 'rgba(255, 255, 255, 0.08)',
        focus: '#4CAF50'
      };
    } else {
      return {
        background: 'rgba(0, 0, 0, 0.08)',
        text: '#333333',
        border: 'rgba(0, 0, 0, 0.12)',
        shadow: 'rgba(0, 0, 0, 0.15)',
        hoverBackground: 'rgba(0, 0, 0, 0.12)',
        hoverShadow: 'rgba(0, 0, 0, 0.25)',
        activeBackground: 'rgba(0, 0, 0, 0.04)',
        focus: '#2196F3'
      };
    }
  }

  async handleButtonClick(targetBubble, button) {
    try {
      if (!document.contains(targetBubble)) {
        return;
      }
      
      const success = await ClipboardManager.copyHtmlToClipboard(targetBubble);
      return success;
    } catch (error) {
      return false;
    }
  }
}

// Create test environment function
export function createTestEnvironment(hostname = 'chat.openai.com') {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: `https://${hostname}`,
    pretendToBeVisual: true,
    resources: 'usable'
  });
  
  const window = dom.window;
  const document = window.document;
  
  // Set up global environment
  global.window = window;
  global.document = document;
  global.navigator = window.navigator;
  global.Node = window.Node;
  
  // Mock Chrome APIs
  global.chrome = {
    i18n: {
      getMessage: vi.fn((key) => {
        const messages = {
          'copyToWord': 'Copy Plain Text',
          'copySuccess': 'Copied successfully',
          'copyFailed': 'Copy failed'
        };
        return messages[key] || key;
      })
    },
    storage: {
      sync: {
        get: vi.fn(() => Promise.resolve({})),
        set: vi.fn(() => Promise.resolve())
      }
    }
  };
  
  // Mock clipboard API
  Object.defineProperty(window.navigator, 'clipboard', {
    value: {
      writeText: vi.fn(() => Promise.resolve())
    },
    writable: true
  });
  
  // Mock document.execCommand
  document.execCommand = vi.fn(() => true);
  
  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 0));
  
  // Mock MutationObserver
  global.MutationObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(),
    callback
  }));
  
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  
  return {
    window,
    document,
    ClipboardManager,
    SiteManager,
    ButtonInjector
  };
}