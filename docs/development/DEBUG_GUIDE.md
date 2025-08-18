# 扩展调试指南

## 🔍 逐步排查问题

### 第一步：检查扩展是否加载

1. **打开 DeepSeek 页面**：https://chat.deepseek.com/
2. **打开开发者工具**：按 F12 或右键 → 检查
3. **查看 Console 标签页**
4. **寻找以下日志**：

```
[时间] PureText-INFO: 🚀 Content script loaded
```

**如果没有看到这条日志**：
- ❌ 扩展内容脚本未加载
- 💡 解决方案：
  - 检查扩展是否已安装并启用
  - 在 `chrome://extensions/` 中重新加载扩展
  - 刷新页面

### 第二步：检查站点配置加载

**寻找以下日志**：

```
[时间] PureText-DEBUG: 🔍 Checking SUPPORTED_SITES availability: object
[时间] PureText-DEBUG: 📊 Available sites: ["chat.openai.com", "chat.deepseek.com", "www.doubao.com", "www.kimi.com"]
[时间] PureText-INFO: ✅ Using built-in site configuration
```

**如果看到错误**：
```
[时间] PureText-ERROR: ❌ SUPPORTED_SITES is undefined! sites.js may not be loaded.
```

- ❌ sites.js 文件未加载
- 💡 解决方案：检查 manifest.json 中的文件顺序

### 第三步：检查当前站点识别

**寻找以下日志**：

```
[时间] PureText-DEBUG: 🌐 Checking current hostname: chat.deepseek.com
[时间] PureText-INFO: ✅ Current site supported: DeepSeek
[时间] PureText-DEBUG: 🎯 Site selector: .message-content[data-role='assistant']
```

**如果看到错误**：
```
[时间] PureText-WARN: ❌ Current site not supported: chat.deepseek.com
```

- ❌ 站点配置问题
- 💡 解决方案：检查 sites.js 中的域名配置

### 第四步：检查元素查找

**寻找以下日志**：

```
[时间] PureText-DEBUG: 🔍 Scanning for elements with selector: .message-content[data-role='assistant']
[时间] PureText-INFO: 📊 Found X target elements
[时间] PureText-INFO: ✅ Successfully injected X buttons
```

**如果看到警告**：
```
[时间] PureText-WARN: ⚠️ No target elements found. Possible reasons:
```

- ❌ 页面上没有找到匹配的元素
- 💡 需要检查选择器是否正确

## 🛠️ 手动调试命令

在浏览器控制台中运行以下命令进行手动调试：

### 1. 检查基本环境

```javascript
// 检查扩展是否加载
console.log('Chrome API:', typeof chrome !== 'undefined');
console.log('SUPPORTED_SITES:', typeof SUPPORTED_SITES !== 'undefined' ? SUPPORTED_SITES : 'Not loaded');
console.log('Current hostname:', window.location.hostname);
```

### 2. 检查站点支持

```javascript
// 检查当前站点是否受支持
if (typeof SUPPORTED_SITES !== 'undefined') {
  const hostname = window.location.hostname;
  const siteConfig = SUPPORTED_SITES[hostname];
  console.log('Site config:', siteConfig);
  
  if (siteConfig) {
    console.log('✅ Site supported:', siteConfig.name);
    console.log('🎯 Selector:', siteConfig.selector);
  } else {
    console.log('❌ Site not supported');
    console.log('📋 Available sites:', Object.keys(SUPPORTED_SITES));
  }
}
```

### 3. 测试选择器

```javascript
// 测试 DeepSeek 的选择器
const selector = ".message-content[data-role='assistant']";
const elements = document.querySelectorAll(selector);
console.log(`Found ${elements.length} elements with selector:`, selector);

// 显示找到的元素
elements.forEach((el, index) => {
  console.log(`Element ${index + 1}:`, el);
  console.log(`Text preview:`, el.textContent.substring(0, 100) + '...');
});
```

### 4. 检查按钮注入

```javascript
// 检查是否有复制按钮
const buttons = document.querySelectorAll('.puretext-copy-btn');
console.log(`Found ${buttons.length} copy buttons`);

// 如果没有按钮，手动触发注入
if (buttons.length === 0 && typeof window.pureTextExtension !== 'undefined') {
  console.log('🔄 Manually triggering button injection...');
  window.pureTextExtension.buttonInjector?.scanAndInjectButtons();
}
```

### 5. 启用详细调试

```javascript
// 启用最详细的调试日志
window.PURETEXT_DEBUG_LEVEL = 3;
console.log('🔬 Debug level set to maximum');

// 重新触发扫描
if (typeof window.pureTextExtension !== 'undefined') {
  window.pureTextExtension.buttonInjector?.scanAndInjectButtons();
}
```

## 🎯 常见问题和解决方案

### 问题1：扩展未加载

**症状**：控制台没有任何 PureText 相关日志

**解决方案**：
1. 检查 `chrome://extensions/` 中扩展是否启用
2. 重新加载扩展
3. 刷新页面
4. 检查是否有 JavaScript 错误阻止了扩展加载

### 问题2：SUPPORTED_SITES 未定义

**症状**：看到 "SUPPORTED_SITES is undefined" 错误

**解决方案**：
1. 检查 manifest.json 中的文件加载顺序
2. 确保 sites.js 在 content.js 之前加载
3. 检查 sites.js 文件是否存在语法错误

### 问题3：站点不受支持

**症状**：看到 "Current site not supported" 警告

**解决方案**：
1. 检查当前页面的 hostname 是否与 sites.js 中的配置匹配
2. 确认你在正确的 DeepSeek 域名上（chat.deepseek.com）

### 问题4：找不到目标元素

**症状**：看到 "Found 0 target elements" 日志

**解决方案**：
1. 检查页面是否完全加载
2. 验证选择器是否正确
3. 检查 DeepSeek 页面结构是否发生变化

## 🔧 高级调试

### 检查页面结构

```javascript
// 查找所有可能的消息容器
const possibleSelectors = [
  '.message-content[data-role="assistant"]',
  '.message-content',
  '[data-role="assistant"]',
  '.assistant-message',
  '.ai-message',
  '.response'
];

possibleSelectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  console.log(`${selector}: ${elements.length} elements`);
});
```

### 监听 DOM 变化

```javascript
// 监听页面 DOM 变化
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    if (mutation.addedNodes.length > 0) {
      console.log('DOM changed, new nodes added');
      // 重新检查元素
      const elements = document.querySelectorAll('.message-content[data-role="assistant"]');
      console.log(`Now found ${elements.length} target elements`);
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
```

## 📝 报告问题

如果按照以上步骤仍然无法解决问题，请提供以下信息：

1. **浏览器版本**：Chrome/Edge 版本号
2. **扩展状态**：是否已启用，是否有错误
3. **控制台日志**：完整的 PureText 相关日志
4. **页面信息**：当前访问的具体 URL
5. **手动调试结果**：运行上述调试命令的输出

这样我就能更准确地帮你定位和解决问题。