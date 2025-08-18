# Kimi 网站选择器调试指南

## 步骤 1: 使用调试工具

1. 打开 Kimi 网站 (kimi.com)
2. 打开浏览器开发者工具 (F12)
3. 在控制台中粘贴并运行 `debug-selector-finder.js` 的内容
4. 工具会自动分析页面并高亮可能的目标元素

## 步骤 2: 手动验证

如果自动工具没有找到合适的选择器，可以手动检查：

### 方法 1: 检查 AI 回复的 DOM 结构
1. 右键点击一个 AI 回复消息
2. 选择"检查元素"
3. 查看该元素及其父元素的类名和属性
4. 寻找包含以下特征的元素：
   - 类名包含: `message`, `response`, `ai`, `assistant`, `chat`, `bubble`
   - 属性包含: `data-role="assistant"`, `data-author="ai"`

### 方法 2: 使用控制台测试选择器
```javascript
// 测试不同的选择器
const selectors = [
  '.message.ai',
  '.chat-message.assistant', 
  '[data-role="assistant"]',
  '.response-content',
  '.ai-response',
  '.message-bubble.ai'
];

selectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    console.log(`✅ ${selector}: 找到 ${elements.length} 个元素`);
    elements.forEach(el => el.style.outline = '2px solid red');
  } else {
    console.log(`❌ ${selector}: 未找到元素`);
  }
});
```

### 方法 3: 查找文本特征
```javascript
// 查找包含 AI 回复特征的元素
const allDivs = document.querySelectorAll('div, section, article');
const candidates = [];

allDivs.forEach(div => {
  const text = div.textContent?.trim();
  if (text && text.length > 50) {
    // 检查是否包含 AI 回复的常见开头
    if (text.includes('我是') || text.includes('我可以') || 
        text.includes('根据') || text.includes('建议')) {
      candidates.push(div);
      div.style.outline = '3px solid green';
      console.log('找到候选元素:', div);
    }
  }
});

console.log(`找到 ${candidates.length} 个候选元素`);
```

## 步骤 3: 更新配置

找到正确的选择器后，有两种方式更新：

### 方式 1: 临时测试 (推荐)
在控制台中运行：
```javascript
// 临时更新 Kimi 的选择器进行测试
if (typeof SUPPORTED_SITES !== 'undefined') {
  SUPPORTED_SITES['www.kimi.com'].selectors = [
    '你找到的新选择器',
    '.response-bubble', // 保留原有的作为备用
  ];
  console.log('✅ 临时更新了 Kimi 选择器');
  
  // 重新扫描按钮
  if (window.buttonInjector) {
    window.buttonInjector.scanAndInjectButtons();
  }
}
```

### 方式 2: 永久更新
修改 `sites.js` 文件中 Kimi 的配置。

## 常见的 Kimi 选择器模式

基于其他 AI 聊天网站的经验，Kimi 可能使用以下模式：

```javascript
// 可能的选择器（按优先级排序）
const possibleSelectors = [
  // 基于角色属性
  '[data-role="assistant"]',
  '[data-author="assistant"]', 
  '[data-type="ai-response"]',
  
  // 基于类名模式
  '.message.assistant',
  '.chat-message.ai',
  '.response-bubble',
  '.ai-message',
  '.assistant-response',
  '.kimi-response',
  
  // 基于结构模式
  '.message-container .ai-content',
  '.chat-bubble.assistant',
  '.response-content',
  
  // 通用模式
  '.message:not(.user)',
  '.chat-item.ai'
];
```

## 调试技巧

1. **检查网络请求**: 查看 Kimi 如何标识 AI 回复
2. **观察 DOM 变化**: AI 回复通常是动态生成的
3. **测试多个对话**: 确保选择器在不同对话中都有效
4. **检查响应式设计**: 在不同屏幕尺寸下测试

## 报告结果

找到有效选择器后，请提供以下信息：
1. 有效的选择器字符串
2. 匹配的元素数量
3. 元素的示例 HTML 结构
4. 是否在不同对话中都有效