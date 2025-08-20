import { describe, test, expect, beforeEach } from 'vitest';
import WordOptimizer from '../src/WordOptimizer.js';

describe('WordOptimizer', () => {
  let optimizer;

  beforeEach(() => {
    optimizer = new WordOptimizer();
  });

  describe('standardizeHtml', () => {
    test('should close unclosed paragraph tags', () => {
      const html = '<p>First paragraph<p>Second paragraph';
      const result = optimizer.standardizeHtml(html);
      
      expect(result).toContain('<p>First paragraph</p>');
      expect(result).toContain('<p>Second paragraph</p>');
    });

    test('should close unclosed list item tags', () => {
      const html = '<ul><li>Item 1<li>Item 2</ul>';
      const result = optimizer.standardizeHtml(html);
      
      expect(result).toContain('<li>Item 1</li>');
      expect(result).toContain('<li>Item 2</li>');
    });

    test('should close unclosed heading tags', () => {
      const html = '<h1>Title<h2>Subtitle';
      const result = optimizer.standardizeHtml(html);
      
      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<h2>Subtitle</h2>');
    });

    test('should close unclosed strong tags', () => {
      const html = '<strong>Bold text<p>Normal text';
      const result = optimizer.standardizeHtml(html);
      
      expect(result).toContain('<strong>Bold text</strong>');
    });

    test('should remove empty paragraphs', () => {
      const html = '<p></p><p>Content</p><p>   </p>';
      const result = optimizer.standardizeHtml(html);
      
      expect(result).not.toMatch(/<p[^>]*>\s*<\/p>/);
      expect(result).toContain('<p>Content</p>');
    });

    test('should format self-closing tags correctly', () => {
      const html = '<hr><br>';
      const result = optimizer.standardizeHtml(html);
      
      expect(result).toContain('<hr />');
      expect(result).toContain('<br />');
    });
  });

  describe('inlineStyles', () => {
    test('should add styles to heading tags', () => {
      const html = '<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>';
      const result = optimizer.inlineStyles(html);
      
      expect(result).toContain('style="font-weight: bold; font-size: 24px;');
      expect(result).toContain('style="font-weight: bold; font-size: 20px;');
      expect(result).toContain('style="font-weight: bold; font-size: 16px;');
    });

    test('should add styles to list elements', () => {
      const html = '<ul><li>Item 1</li></ul><ol><li>Item 2</li></ol>';
      const result = optimizer.inlineStyles(html);
      
      expect(result).toContain('style="margin: 8px 0; padding-left: 20px; list-style-type: disc;"');
      expect(result).toContain('style="margin: 8px 0; padding-left: 20px; list-style-type: decimal;"');
      expect(result).toContain('style="margin: 4px 0; line-height: 1.5;"');
    });

    test('should add styles to blockquote elements', () => {
      const html = '<blockquote>Quote text</blockquote>';
      const result = optimizer.inlineStyles(html);
      
      expect(result).toContain('style="margin: 16px 0; padding: 8px 16px; border-left: 4px solid #ccc; background: #f9f9f9; font-style: italic;"');
    });

    test('should add styles to paragraph elements', () => {
      const html = '<p>Paragraph text</p>';
      const result = optimizer.inlineStyles(html);
      
      expect(result).toContain('style="margin: 8px 0; line-height: 1.6;"');
    });

    test('should add styles to code elements', () => {
      const html = '<code>inline code</code><pre>code block</pre>';
      const result = optimizer.inlineStyles(html);
      
      expect(result).toContain('style="background: #f5f5f5; padding: 2px 4px;');
      expect(result).toContain('style="background: #f5f5f5; padding: 12px;');
    });
  });

  describe('handleSpecialCharacters', () => {
    test('should convert bullet points to HTML entities', () => {
      const html = 'Text with • bullet point';
      const result = optimizer.handleSpecialCharacters(html);
      
      expect(result).toBe('Text with &bull; bullet point');
    });

    test('should convert dashes to HTML entities', () => {
      const html = 'Text with — em dash and – en dash';
      const result = optimizer.handleSpecialCharacters(html);
      
      expect(result).toBe('Text with &mdash; em dash and &ndash; en dash');
    });

    test('should convert quotes to HTML entities', () => {
      const html = `"Smart quotes" and 'apostrophes'`;
      const result = optimizer.handleSpecialCharacters(html);
      
      expect(result).toBe('&ldquo;Smart quotes&rdquo; and &lsquo;apostrophes&rsquo;');
    });

    test('should convert mathematical symbols', () => {
      const html = '5 × 3 ÷ 2 ≤ 10 ≥ 5 ≠ 8';
      const result = optimizer.handleSpecialCharacters(html);
      
      expect(result).toBe('5 &times; 3 &divide; 2 &le; 10 &ge; 5 &ne; 8');
    });

    test('should convert arrow symbols', () => {
      const html = 'A → B ← C ↑ D ↓ E';
      const result = optimizer.handleSpecialCharacters(html);
      
      expect(result).toBe('A &rarr; B &larr; C &uarr; D &darr; E');
    });

    test('should convert Greek letters', () => {
      const html = 'α + β = γ, π ≈ 3.14, Σ and Ω';
      const result = optimizer.handleSpecialCharacters(html);
      
      expect(result).toBe('&alpha; + &beta; = &gamma;, &pi; &asymp; 3.14, &Sigma; and &Omega;');
    });
  });

  describe('optimizeTables', () => {
    test('should add styles to table elements', () => {
      const html = '<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>';
      const result = optimizer.optimizeTables(html);
      
      expect(result).toContain('style="border-collapse: collapse; width: 100%;');
      expect(result).toContain('style="border: 1px solid #000000; padding: 8px; background: #f5f5f5;');
      expect(result).toContain('style="border: 1px solid #000000; padding: 8px; vertical-align: top;"');
    });
  });

  describe('wrapCompleteDocument', () => {
    test('should wrap content in complete HTML document', () => {
      const html = '<p>Test content</p>';
      const result = optimizer.wrapCompleteDocument(html);
      
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html lang="zh-CN">');
      expect(result).toContain('<head>');
      expect(result).toContain('<meta charset="UTF-8">');
      expect(result).toContain('<title>复制的内容</title>');
      expect(result).toContain('<body>');
      expect(result).toContain('<p>Test content</p>');
      expect(result).toContain('</body>');
      expect(result).toContain('</html>');
    });

    test('should include comprehensive CSS styles', () => {
      const html = '<p>Test</p>';
      const result = optimizer.wrapCompleteDocument(html);
      
      expect(result).toContain('font-family: -apple-system');
      expect(result).toContain('line-height: 1.6');
      expect(result).toContain('max-width: 800px');
      expect(result).toContain('@media print');
    });
  });

  describe('validateHtmlStructure', () => {
    test('should validate properly closed tags', () => {
      const html = '<div><p>Text</p><ul><li>Item</li></ul></div>';
      const result = optimizer.validateHtmlStructure(html);
      
      expect(result).toBe(true);
    });

    test('should detect unclosed tags', () => {
      const html = '<div><p>Text<ul><li>Item</li></ul></div>';
      const result = optimizer.validateHtmlStructure(html);
      
      expect(result).toBe(false);
    });

    test('should handle self-closing tags correctly', () => {
      const html = '<div><p>Text</p><br><hr><img src="test.jpg"></div>';
      const result = optimizer.validateHtmlStructure(html);
      
      expect(result).toBe(true);
    });
  });

  describe('optimize (integration)', () => {
    test('should perform complete optimization', async () => {
      const html = '<h1>Title<p>Text with • bullet and — dash<ul><li>Item 1<li>Item 2</ul>';
      const result = await optimizer.optimize(html);
      
      // Should be a complete HTML document
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html lang="zh-CN">');
      
      // Should have standardized structure
      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<li>Item 1</li>');
      expect(result).toContain('<li>Item 2</li>');
      
      // Should have inline styles
      expect(result).toContain('style="font-weight: bold; font-size: 24px;');
      expect(result).toContain('style="margin: 8px 0; padding-left: 20px;');
      
      // Should have converted special characters
      expect(result).toContain('&bull;');
      expect(result).toContain('&mdash;');
    });

    test('should handle complex nested structures', async () => {
      const html = `
        <div>
          <h2>Section Title
          <p>Paragraph with "quotes" and — dashes
          <blockquote>Quote text
          <ul>
            <li>Item with α symbol
            <li>Item with → arrow
          </ul>
          <table>
            <tr><th>Header<td>Data
          </table>
        </div>
      `;
      
      const result = await optimizer.optimize(html);
      
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<h2>Section Title</h2>');
      expect(result).toContain('&ldquo;quotes&rdquo;');
      expect(result).toContain('&mdash;');
      expect(result).toContain('<blockquote');
      expect(result).toContain('&alpha;');
      expect(result).toContain('&rarr;');
      expect(result).toContain('border-collapse: collapse');
    });
  });
});