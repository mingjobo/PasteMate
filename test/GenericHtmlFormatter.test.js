import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GenericHtmlFormatter } from '../src/formatters/GenericHtmlFormatter.js';

// Mock DOM environment
global.document = {
  createElement: vi.fn(() => ({
    textContent: '',
    innerHTML: ''
  })),
  createTreeWalker: vi.fn()
};

global.Node = {
  TEXT_NODE: 3,
  ELEMENT_NODE: 1
};

global.NodeFilter = {
  SHOW_TEXT: 4,
  SHOW_ELEMENT: 1,
  FILTER_ACCEPT: 1,
  FILTER_REJECT: 2
};

describe('GenericHtmlFormatter', () => {
  let formatter;
  
  beforeEach(() => {
    formatter = new GenericHtmlFormatter();
    vi.clearAllMocks();
  });
  
  describe('Basic Properties', () => {
    it('should initialize correctly', () => {
      expect(formatter.structureConverter).toBeDefined();
      expect(formatter.getName()).toBe('GenericHtmlFormatter');
      expect(formatter.getPriority()).toBe(-1);
    });
    
    it('should always return true for canHandle (fallback formatter)', () => {
      const mockElement = { tagName: 'DIV' };
      expect(formatter.canHandle(mockElement)).toBe(true);
    });
  });
  
  describe('Block Element Detection', () => {
    it('should identify block elements correctly', () => {
      expect(formatter.isBlockElement({ tagName: 'DIV' })).toBe(true);
      expect(formatter.isBlockElement({ tagName: 'P' })).toBe(true);
      expect(formatter.isBlockElement({ tagName: 'H1' })).toBe(true);
      expect(formatter.isBlockElement({ tagName: 'UL' })).toBe(true);
      expect(formatter.isBlockElement({ tagName: 'SPAN' })).toBe(false);
      expect(formatter.isBlockElement({ tagName: 'A' })).toBe(false);
    });
  });
  
  describe('Code Block Detection', () => {
    it('should identify code blocks correctly', () => {
      expect(formatter.isCodeBlock('```javascript')).toBe(true);
      expect(formatter.isCodeBlock('function test() {')).toBe(true);
      expect(formatter.isCodeBlock('const x = 5;')).toBe(true);
      expect(formatter.isCodeBlock('import React from "react";')).toBe(true);
      expect(formatter.isCodeBlock('<div>hello</div>')).toBe(true);
      expect(formatter.isCodeBlock('This is normal text')).toBe(false);
    });
  });
  
  describe('Code Block Formatting', () => {
    it('should format single line code as inline', () => {
      const result = formatter.formatCodeBlock('const x = 5;');
      expect(result).toMatch(/<p><code>.*<\/code><\/p>/);
    });
    
    it('should format multi-line code as pre block', () => {
      const code = 'function test() {\n  return true;\n}';
      const result = formatter.formatCodeBlock(code);
      expect(result).toMatch(/<pre><code>.*<\/code><\/pre>/);
    });
  });
  
  describe('HTML Cleanup', () => {
    it('should remove empty paragraphs', () => {
      const html = '<div><p></p><p>Content</p><p>   </p></div>';
      const result = formatter.cleanupGeneratedHtml(html);
      expect(result).not.toMatch(/<p[^>]*>\s*<\/p>/);
      expect(result).toMatch(/<p>Content<\/p>/);
    });
    
    it('should remove empty lists', () => {
      const html = '<div><ul></ul><ol><li>Item</li></ol><ul>   </ul></div>';
      const result = formatter.cleanupGeneratedHtml(html);
      expect(result).not.toMatch(/<ul[^>]*>\s*<\/ul>/);
      expect(result).toMatch(/<ol><li>Item<\/li><\/ol>/);
    });
    
    it('should clean up whitespace', () => {
      const html = '<div>  <p>  Text  </p>  </div>';
      const result = formatter.cleanupGeneratedHtml(html);
      expect(result).toBe('<div><p> Text </p></div>');
    });
  });
  
  describe('Fallback Text Extraction', () => {
    it('should extract text when all formatting fails', () => {
      const mockElement = {
        innerText: 'Line 1\nLine 2\n\nLine 3',
        textContent: 'Line 1\nLine 2\n\nLine 3'
      };
      
      // Mock escapeHtml
      formatter.structureConverter.escapeHtml = vi.fn((text) => text);
      
      const result = formatter.fallbackTextExtraction(mockElement);
      
      expect(result).toMatch(/<div>/);
      expect(result).toMatch(/<p>Line 1<\/p>/);
      expect(result).toMatch(/<p>Line 2<\/p>/);
      expect(result).toMatch(/<p>Line 3<\/p>/);
    });
    
    it('should handle empty content', () => {
      const mockElement = {
        innerText: '',
        textContent: ''
      };
      
      const result = formatter.fallbackTextExtraction(mockElement);
      
      expect(result).toMatch(/无内容/);
    });
    
    it('should handle extraction errors gracefully', () => {
      const mockElement = {
        get innerText() { throw new Error('Test error'); },
        get textContent() { throw new Error('Test error'); }
      };
      
      const result = formatter.fallbackTextExtraction(mockElement);
      
      expect(result).toMatch(/内容提取失败/);
    });
  });
  
  describe('Format Method', () => {
    it('should complete full formatting process', async () => {
      const mockElement = {
        cloneNode: vi.fn(() => ({
          querySelectorAll: vi.fn(() => []),
          innerText: 'Test content'
        }))
      };
      
      // Mock methods
      formatter.basicCleanup = vi.fn();
      formatter.extractAndFormat = vi.fn(() => '<div><p>Formatted content</p></div>');
      
      const result = await formatter.format(mockElement);
      
      expect(formatter.basicCleanup).toHaveBeenCalled();
      expect(formatter.extractAndFormat).toHaveBeenCalled();
      expect(result).toMatch(/Formatted content/);
    });
    
    it('should use fallback when formatting fails', async () => {
      const mockElement = {
        cloneNode: vi.fn(() => { throw new Error('Clone failed'); }),
        innerText: 'Fallback content'
      };
      
      // Mock fallback method
      formatter.fallbackTextExtraction = vi.fn(() => '<div><p>Fallback result</p></div>');
      
      const result = await formatter.format(mockElement);
      
      expect(formatter.fallbackTextExtraction).toHaveBeenCalled();
      expect(result).toMatch(/Fallback result/);
    });
  });
  
  describe('Feature Support', () => {
    it('should return all supported features', () => {
      const features = formatter.getSupportedFeatures();
      
      expect(features.basicTextExtraction).toBe(true);
      expect(features.paragraphFormatting).toBe(true);
      expect(features.simpleListRecognition).toBe(true);
      expect(features.basicHeadingRecognition).toBe(true);
      expect(features.blockQuoteRecognition).toBe(true);
      expect(features.codeBlockRecognition).toBe(true);
      expect(features.fallbackSupport).toBe(true);
      expect(features.universalCompatibility).toBe(true);
    });
    
    it('should return formatter statistics', () => {
      // Mock structure converter stats
      formatter.structureConverter.getPatternStats = vi.fn(() => ({
        listPatterns: 10,
        headingPatterns: 8,
        blockQuotePatterns: 5
      }));
      
      const stats = formatter.getStats();
      
      expect(stats.name).toBe('GenericHtmlFormatter');
      expect(stats.priority).toBe(-1);
      expect(stats.features).toBeDefined();
      expect(stats.structureConverter).toBeDefined();
    });
  });
  
  describe('Text Processing', () => {
    it('should handle list items correctly', () => {
      const context = { inList: false, listItems: [], previousWasHeading: false };
      
      // Mock isListItemStart to return true
      formatter.structureConverter.isListItemStart = vi.fn(() => true);
      
      const result = formatter.processTextBlock('• First item', context);
      
      expect(context.inList).toBe(true);
      expect(context.listItems.includes('• First item')).toBe(true);
      expect(result).toBe('');
    });
    
    it('should format headings correctly', () => {
      const context = { previousWasHeading: false };
      
      // Mock isHeading to return true
      formatter.structureConverter.isHeading = vi.fn(() => true);
      formatter.structureConverter.generateHeadingHtml = vi.fn(() => '<h3><strong>Test Heading</strong></h3>');
      
      const result = formatter.formatSingleBlock('Test Heading', context);
      
      expect(context.previousWasHeading).toBe(true);
      expect(result).toMatch(/<h3>/);
    });
    
    it('should format normal paragraphs correctly', () => {
      const context = { previousWasHeading: false };
      
      // Mock methods
      formatter.structureConverter.isHeading = vi.fn(() => false);
      formatter.structureConverter.isBlockQuote = vi.fn(() => false);
      formatter.structureConverter.generateParagraphHtml = vi.fn(() => '<p>Normal text</p>');
      
      const result = formatter.formatSingleBlock('Normal text', context);
      
      expect(result).toMatch(/<p>Normal text<\/p>/);
    });
  });
});