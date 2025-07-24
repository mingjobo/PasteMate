import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestEnvironment } from './test-utils.js';

describe('SiteManager', () => {
  let env;
  let SiteManager;
  let siteManager;
  
  beforeEach(async () => {
    env = createTestEnvironment();
    SiteManager = env.SiteManager;
    siteManager = new SiteManager();
    await siteManager.loadSiteConfig();
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with null siteConfig and currentSite', () => {
      const newSiteManager = new SiteManager();
      expect(newSiteManager.siteConfig).toBe(null);
      expect(newSiteManager.currentSite).toBe(null);
    });
  });

  describe('loadSiteConfig', () => {
    it('should load built-in site configuration', async () => {
      const newSiteManager = new SiteManager();
      await newSiteManager.loadSiteConfig();
      
      expect(newSiteManager.siteConfig).toBeDefined();
      expect(newSiteManager.siteConfig['chat.openai.com']).toBeDefined();
      expect(newSiteManager.siteConfig['chat.openai.com'].name).toBe('ChatGPT');
      expect(newSiteManager.siteConfig['chat.openai.com'].selector).toBe("[data-message-author-role='assistant'] .markdown");
    });

    it('should handle chrome storage errors gracefully', async () => {
      // Mock chrome.storage to throw an error
      global.chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));
      
      const newSiteManager = new SiteManager();
      await newSiteManager.loadSiteConfig();
      
      // Should still load built-in config
      expect(newSiteManager.siteConfig).toBeDefined();
      expect(newSiteManager.siteConfig['chat.openai.com']).toBeDefined();
    });

    it('should merge user configuration with built-in configuration', async () => {
      const userConfig = {
        customSites: {
          'example.com': {
            selector: '.custom-selector',
            name: 'Example Site'
          }
        },
        disabledSites: ['www.doubao.com']
      };
      
      global.chrome.storage.sync.get.mockResolvedValue(userConfig);
      
      const newSiteManager = new SiteManager();
      await newSiteManager.loadSiteConfig();
      
      // Should include custom site
      expect(newSiteManager.siteConfig['example.com']).toBeDefined();
      expect(newSiteManager.siteConfig['example.com'].name).toBe('Example Site');
      
      // Should exclude disabled site
      expect(newSiteManager.siteConfig['www.doubao.com']).toBeUndefined();
      
      // Should still include other built-in sites
      expect(newSiteManager.siteConfig['chat.openai.com']).toBeDefined();
    });
  });

  describe('getCurrentSite', () => {
    it('should return current site configuration for supported site', () => {
      // Test with chat.openai.com (default in test environment)
      const currentSite = siteManager.getCurrentSite();
      
      expect(currentSite).toBeDefined();
      expect(currentSite.name).toBe('ChatGPT');
      expect(currentSite.selector).toBe("[data-message-author-role='assistant'] .markdown");
      expect(currentSite.hostname).toBe('chat.openai.com');
    });

    it('should return null for unsupported site', () => {
      // Create environment with unsupported hostname
      const unsupportedEnv = createTestEnvironment('unsupported.com');
      const unsupportedSiteManager = new unsupportedEnv.SiteManager();
      unsupportedSiteManager.siteConfig = siteManager.siteConfig; // Use loaded config
      
      const currentSite = unsupportedSiteManager.getCurrentSite();
      expect(currentSite).toBe(null);
    });

    it('should return null when siteConfig is not loaded', () => {
      const newSiteManager = new SiteManager();
      const currentSite = newSiteManager.getCurrentSite();
      expect(currentSite).toBe(null);
    });

    it('should update currentSite property', () => {
      const currentSite = siteManager.getCurrentSite();
      expect(siteManager.currentSite).toBe(currentSite);
    });
  });

  describe('isSupported', () => {
    it('should return true for supported site', () => {
      expect(siteManager.isSupported()).toBe(true);
    });

    it('should return false for unsupported site', () => {
      const unsupportedEnv = createTestEnvironment('unsupported.com');
      const unsupportedSiteManager = new unsupportedEnv.SiteManager();
      unsupportedSiteManager.siteConfig = siteManager.siteConfig;
      
      expect(unsupportedSiteManager.isSupported()).toBe(false);
    });

    it('should return false when siteConfig is not loaded', () => {
      const newSiteManager = new SiteManager();
      expect(newSiteManager.isSupported()).toBe(false);
    });
  });

  describe('getSelector', () => {
    it('should return selector for supported site', () => {
      const selector = siteManager.getSelector();
      expect(selector).toBe("[data-message-author-role='assistant'] .markdown");
    });

    it('should return null for unsupported site', () => {
      const unsupportedEnv = createTestEnvironment('unsupported.com');
      const unsupportedSiteManager = new unsupportedEnv.SiteManager();
      unsupportedSiteManager.siteConfig = siteManager.siteConfig;
      
      const selector = unsupportedSiteManager.getSelector();
      expect(selector).toBe(null);
    });

    it('should return null when siteConfig is not loaded', () => {
      const newSiteManager = new SiteManager();
      const selector = newSiteManager.getSelector();
      expect(selector).toBe(null);
    });
  });

  describe('getSiteName', () => {
    it('should return site name for supported site', () => {
      const siteName = siteManager.getSiteName();
      expect(siteName).toBe('ChatGPT');
    });

    it('should return null for unsupported site', () => {
      const unsupportedEnv = createTestEnvironment('unsupported.com');
      const unsupportedSiteManager = new unsupportedEnv.SiteManager();
      unsupportedSiteManager.siteConfig = siteManager.siteConfig;
      
      const siteName = unsupportedSiteManager.getSiteName();
      expect(siteName).toBe(null);
    });

    it('should return null when siteConfig is not loaded', () => {
      const newSiteManager = new SiteManager();
      const siteName = newSiteManager.getSiteName();
      expect(siteName).toBe(null);
    });
  });

  describe('validateSiteConfig', () => {
    it('should return true for valid site configuration', () => {
      const validConfig = {
        selector: '.valid-selector',
        name: 'Valid Site'
      };
      
      const isValid = siteManager.validateSiteConfig(validConfig);
      expect(isValid).toBe(true);
    });

    it('should return false for null configuration', () => {
      const isValid = siteManager.validateSiteConfig(null);
      expect(isValid).toBe(false);
    });

    it('should return false for undefined configuration', () => {
      const isValid = siteManager.validateSiteConfig(undefined);
      expect(isValid).toBe(false);
    });

    it('should return false for non-object configuration', () => {
      const isValid = siteManager.validateSiteConfig('not an object');
      expect(isValid).toBe(false);
    });

    it('should return false for configuration without selector', () => {
      const invalidConfig = {
        name: 'Site Name'
        // missing selector
      };
      
      const isValid = siteManager.validateSiteConfig(invalidConfig);
      expect(isValid).toBe(false);
    });

    it('should return false for configuration without name', () => {
      const invalidConfig = {
        selector: '.selector'
        // missing name
      };
      
      const isValid = siteManager.validateSiteConfig(invalidConfig);
      expect(isValid).toBe(false);
    });

    it('should return false for configuration with non-string selector', () => {
      const invalidConfig = {
        selector: 123,
        name: 'Site Name'
      };
      
      const isValid = siteManager.validateSiteConfig(invalidConfig);
      expect(isValid).toBe(false);
    });

    it('should return false for configuration with non-string name', () => {
      const invalidConfig = {
        selector: '.selector',
        name: 123
      };
      
      const isValid = siteManager.validateSiteConfig(invalidConfig);
      expect(isValid).toBe(false);
    });

    it('should return false for invalid CSS selector', () => {
      const invalidConfig = {
        selector: '<<<invalid>>>',
        name: 'Site Name'
      };
      
      const isValid = siteManager.validateSiteConfig(invalidConfig);
      expect(isValid).toBe(false);
    });
  });

  describe('mergeConfigs', () => {
    it('should merge built-in and user configurations', () => {
      const builtInConfig = {
        'site1.com': { selector: '.s1', name: 'Site 1' },
        'site2.com': { selector: '.s2', name: 'Site 2' }
      };
      
      const userConfig = {
        customSites: {
          'site3.com': { selector: '.s3', name: 'Site 3' }
        },
        disabledSites: ['site2.com']
      };
      
      const merged = siteManager.mergeConfigs(builtInConfig, userConfig);
      
      // Should include built-in sites (except disabled ones)
      expect(merged['site1.com']).toBeDefined();
      expect(merged['site2.com']).toBeUndefined(); // disabled
      
      // Should include custom sites
      expect(merged['site3.com']).toBeDefined();
      expect(merged['site3.com'].name).toBe('Site 3');
    });

    it('should handle empty user configuration', () => {
      const builtInConfig = {
        'site1.com': { selector: '.s1', name: 'Site 1' }
      };
      
      const userConfig = {};
      
      const merged = siteManager.mergeConfigs(builtInConfig, userConfig);
      
      expect(merged).toEqual(builtInConfig);
    });

    it('should handle user configuration without customSites', () => {
      const builtInConfig = {
        'site1.com': { selector: '.s1', name: 'Site 1' },
        'site2.com': { selector: '.s2', name: 'Site 2' }
      };
      
      const userConfig = {
        disabledSites: ['site2.com']
      };
      
      const merged = siteManager.mergeConfigs(builtInConfig, userConfig);
      
      expect(merged['site1.com']).toBeDefined();
      expect(merged['site2.com']).toBeUndefined();
    });

    it('should handle user configuration without disabledSites', () => {
      const builtInConfig = {
        'site1.com': { selector: '.s1', name: 'Site 1' }
      };
      
      const userConfig = {
        customSites: {
          'site2.com': { selector: '.s2', name: 'Site 2' }
        }
      };
      
      const merged = siteManager.mergeConfigs(builtInConfig, userConfig);
      
      expect(merged['site1.com']).toBeDefined();
      expect(merged['site2.com']).toBeDefined();
    });
  });

  describe('different site configurations', () => {
    it('should work correctly for DeepSeek', async () => {
      const deepSeekEnv = createTestEnvironment('chat.deepseek.com');
      const deepSeekSiteManager = new deepSeekEnv.SiteManager();
      await deepSeekSiteManager.loadSiteConfig();
      
      const currentSite = deepSeekSiteManager.getCurrentSite();
      expect(currentSite.name).toBe('DeepSeek');
      expect(currentSite.selector).toBe('.message-content[data-role=\'assistant\']');
    });

    it('should work correctly for Doubao', async () => {
      const doubaoEnv = createTestEnvironment('www.doubao.com');
      const doubaoSiteManager = new doubaoEnv.SiteManager();
      await doubaoSiteManager.loadSiteConfig();
      
      const currentSite = doubaoSiteManager.getCurrentSite();
      expect(currentSite.name).toBe('豆包');
      expect(currentSite.selector).toBe('.dialogue-text.assistant');
    });

    it('should work correctly for Kimi', async () => {
      const kimiEnv = createTestEnvironment('www.kimi.com');
      const kimiSiteManager = new kimiEnv.SiteManager();
      await kimiSiteManager.loadSiteConfig();
      
      const currentSite = kimiSiteManager.getCurrentSite();
      expect(currentSite.name).toBe('Kimi');
      expect(currentSite.selector).toBe('.response-bubble');
    });
  });
});