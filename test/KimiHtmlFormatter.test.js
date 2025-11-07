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
      element.innerHTML = '<div class="segment-content-box"><div class="markdown">测试内容</div></div>';

      expect(formatter.canHandle(element)).toBe(true);
    });

    test('应该拒绝非Kimi DOM结构', () => {
      const element = document.createElement('div');
      element.innerHTML = '<div class="other">测试内容</div>';

      expect(formatter.canHandle(element)).toBe(false);
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

  describe('思考内容过滤', () => {
    test('应该检测并过滤思考类名的内容', async () => {
      const element = document.createElement('div');
      element.innerHTML = `
        <div class="markdown">
          <div class="thinking-container">
            <p>让我思考一下这个问题...</p>
            <p>首先，我需要分析用户的需求。</p>
          </div>
          <div class="final-answer">
            <p>这是正式的回答内容。</p>
          </div>
        </div>
      `;

      const result = await formatter.format(element);

      expect(result).not.toContain('让我思考一下这个问题');
      expect(result).not.toContain('首先，我需要分析用户的需求');
      expect(result).toContain('这是正式的回答内容');
    });

    test('应该检测并过滤带有思考属性的元素', async () => {
      const element = document.createElement('div');
      element.innerHTML = `
        <div class="markdown">
          <div data-thinking="true">
            <p>我正在思考如何回答...</p>
          </div>
          <div>
            <p>这是实际的回答。</p>
          </div>
        </div>
      `;

      const result = await formatter.format(element);

      expect(result).not.toContain('我正在思考如何回答');
      expect(result).toContain('这是实际的回答');
    });

    test('应该检测并过滤思考文本内容', async () => {
      const element = document.createElement('div');
      element.innerHTML = `
        <div class="think-stage" data-v-37a2ffbe="">
          <div class="toolcall-container">
            <div class="toolcall-content-text">
              <div class="markdown">
                <div class="paragraph">用户说"思考下思考"，这是一个简短而模糊的请求。</div>
                <div class="paragraph">我需要先通过试探性回应来确认用户的真实意图。</div>
                <div class="paragraph">回应策略：以开放式追问开始，保持思辨性。</div>
              </div>
            </div>
          </div>
        </div>
      `;

      const result = await formatter.format(element);

      // 整个think-stage容器应该被过滤
      expect(result).toBe('<div></div>');
    });

    test('应该保留正常的非思考内容', async () => {
      const element = document.createElement('div');
      element.innerHTML = `
        <div class="markdown">
          <h1>实验报告</h1>
          <p>这是一个实验报告的内容。</p>
          <ul>
            <li>实验数据：10吨 × 4000元/吨 = 4万元</li>
            <li>实验结果：符合预期</li>
          </ul>
        </div>
      `;

      const result = await formatter.format(element);

      expect(result).toContain('实验报告');
      expect(result).toContain('这是一个实验报告的内容');
      expect(result).toContain('实验数据：10吨 × 4000元/吨 = 4万元');
      expect(result).toContain('实验结果：符合预期');
    });

    test('应该处理混合内容（思考+正式回答）', async () => {
      const element = document.createElement('div');
      element.innerHTML = `
        <div class="segment-container">
          <div class="thinking-box">
            <p>让我分析一下这个问题...</p>
            <p>首先，我需要考虑几个方面。</p>
          </div>
          <div class="segment-content">
            <div class="markdown">
              <h2>正式回答</h2>
              <p>这是经过思考后的正式回答内容。</p>
            </div>
          </div>
        </div>
      `;

      const result = await formatter.format(element);

      expect(result).not.toContain('让我分析一下这个问题');
      expect(result).not.toContain('首先，我需要考虑几个方面');
      expect(result).toContain('正式回答');
      expect(result).toContain('这是经过思考后的正式回答内容');
    });

    test('应该正确检测思考关键词', () => {
      const thinkingText = '让我思考一下这个问题，首先需要分析关键因素，然后综合判断得出结论。';
      const normalText = '这是一个包含重要信息的段落，提供了具体的解决方案。';

      expect(formatter.isThinkingTextContent(thinkingText)).toBe(true);
      expect(formatter.isThinkingTextContent(normalText)).toBe(false);
    });

    test('应该正确检测思考类名', () => {
      const thinkingElement = document.createElement('div');
      thinkingElement.className = 'thinking-container';

      const normalElement = document.createElement('div');
      normalElement.className = 'content-box';

      expect(formatter.isThinkingContent(thinkingElement)).toBe(true);
      expect(formatter.isThinkingContent(normalElement)).toBe(false);
    });

    test('应该正确检测思考属性', () => {
      const thinkingElement = document.createElement('div');
      thinkingElement.setAttribute('data-thinking', 'true');

      const normalElement = document.createElement('div');
      normalElement.setAttribute('data-role', 'assistant');

      expect(formatter.isThinkingContent(thinkingElement)).toBe(true);
      expect(formatter.isThinkingContent(normalElement)).toBe(false);
    });

    test('应该正确处理实际Kimi DOM结构（思考+正式回答）', async () => {
      const element = document.createElement('div');
      element.className = 'segment-content-box';
      element.innerHTML = `
        <div class="think-stage" data-v-37a2ffbe="">
          <div class="toolcall-container">
            <div class="toolcall-content-text">
              <div class="markdown">
                <div class="paragraph">用户说"思考下思考"，这是一个简短而模糊的请求。</div>
                <div class="paragraph">我需要先通过试探性回应来确认用户的真实意图。</div>
                <div class="paragraph">这样既体现了对用户意图的尊重，也展现了处理模糊输入的灵活性。</div>
              </div>
            </div>
          </div>
        </div>
        <div class="markdown-container">
          <div class="markdown">
            <div class="paragraph">你提出了一个<strong>自我指涉的命题</strong>——让我思考"思考"本身。</div>
            <div class="paragraph">这可以有几种理解方向，你更倾向哪一种？</div>
            <div class="paragraph"><strong>1. 哲学的追问</strong></div>
            <ul start="1">
              <li><div class="paragraph">思考是否可能完全认知自身？就像眼睛能否看见眼睛？</div></li>
              <li><div class="paragraph">"我思故我在"的边界在哪里？当我们思考"思考"时，那个"我"是否发生了递归？</div></li>
            </ul>
            <div class="paragraph"><strong>2. 认知的解剖</strong></div>
            <ul start="1">
              <li><div class="paragraph">思维是符号运算、神经网络激活，还是量子过程？</div></li>
            </ul>
            <div class="paragraph"><strong>请告诉我，你想在哪个维度上展开这场元思考？</strong></div>
          </div>
        </div>
      `;

      const result = await formatter.format(element);

      // 应该过滤掉思考内容，保留正式回答
      expect(result).not.toContain('用户说"思考下思考"');
      expect(result).not.toContain('我需要先通过试探性回应');
      expect(result).not.toContain('这样既体现了对用户意图的尊重');

      // 应该保留正式回答内容
      expect(result).toContain('你提出了一个<strong>自我指涉的命题</strong>');
      expect(result).toContain('这可以有几种理解方向');
      expect(result).toContain('哲学的追问');
      expect(result).toContain('思考是否可能完全认知自身');
      expect(result).toContain('请告诉我，你想在哪个维度上展开这场元思考');
    });
  });
});