# Design Document

## Overview

一键纯文（PureText One-Click）是一个轻量级的浏览器扩展，采用 Manifest V3 标准开发，支持 Chrome、Edge 和 Firefox 浏览器。扩展通过内容脚本（Content Script）在目标 AI 聊天网站中注入复制按钮，使用 MutationObserver 监听 DOM 变化以动态添加按钮，并通过 Clipboard API 实现纯文本复制功能。

## Architecture

### 整体架构

```
浏览器扩展架构 (按优先级排序)
├── 核心功能层 (高优先级)
│   ├── Manifest V3 配置层
│   │   ├── 权限声明 (clipboardWrite)
│   │   ├── 内容脚本注册
│   │   └── 国际化配置
│   ├── 内容脚本层 (Content Script)
│   │   ├── DOM 监听与按钮注入
│   │   ├── 站点识别与选择器匹配
│   │   └── 剪贴板操作
│   ├── 静态配置层
│   │   ├── 内置站点配置
│   │   └── 国际化文件 (locales/)
│   └── 用户界面层
│       └── 动态注入的复制按钮
└── 扩展功能层 (低优先级)
    ├── 配置管理
    │   ├── 选项页面 (options.html)
    │   ├── 存储管理 (storage API)
    │   └── 动态配置更新
    └── 高级功能
        ├── 自定义网站支持
        └── 网站启用/禁用控制
```

### 技术栈选择

- **核心语言**: 纯 JavaScript (ES6+)，无外部框架依赖
- **扩展标准**: Manifest V3 (确保未来兼容性)
- **构建工具**: 可选 esbuild (轻量级打包)
- **API 使用**: WebExtension APIs, Clipboard API, MutationObserver

## Components and Interfaces

### 1. Manifest 配置组件

**文件**: `manifest.json`

**职责**: 
- 定义扩展基本信息和权限
- 注册内容脚本的匹配规则
- 配置国际化支持

**关键配置**:
```json
{
  "manifest_version": 3,
  "name": "__MSG_extensionName__",
  "permissions": ["clipboardWrite", "storage"],
  "content_scripts": [{
    "matches": [
      "https://chat.openai.com/*",
      "https://chat.deepseek.com/*", 
      "https://www.doubao.com/*",
      "https://www.kimi.com/*"
    ],
    "js": ["content.js"],
    "run_at": "document_idle"
  }]
}
```

### 2. 站点配置组件 (核心功能)

**文件**: `sites.js` (内置配置)

**职责**: 
- 维护支持站点的域名和对应选择器映射
- 提供内置的静态配置，确保核心功能稳定

**数据结构**:
```javascript
// sites.js - 内置站点配置
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
```

### 3. 内容脚本核心组件

**文件**: `content.js`

**主要类和函数**:

#### SiteManager 类
```javascript
class SiteManager {
  constructor() {
    this.siteConfig = null;
    this.currentSite = null;
  }
  
  async loadSiteConfig() // 加载站点配置
  getCurrentSite()       // 获取当前站点配置
  isSupported()         // 检查当前站点是否支持
}
```

#### ButtonInjector 类
```javascript
class ButtonInjector {
  constructor(siteManager, i18n) {
    this.siteManager = siteManager;
    this.i18n = i18n;
    this.observer = null;
  }
  
  startObserving()      // 开始监听 DOM 变化
  stopObserving()       // 停止监听
  injectButton(element) // 向元素注入复制按钮
  createButton()        // 创建复制按钮元素
}
```

#### ClipboardManager 类
```javascript
class ClipboardManager {
  static async copyPlainText(element) // 复制元素的纯文本内容
  static extractPlainText(element)    // 提取纯文本，去除格式
}
```

### 4. 配置管理组件 (低优先级扩展功能)

**文件**: `options.html`, `options.js`

**职责**: 
- 提供图形化配置界面
- 管理网站启用/禁用状态
- 支持添加自定义网站配置

**界面设计**:
```html
<!-- options.html -->
<div class="config-section">
  <h3>支持的网站</h3>
  <div class="site-list">
    <!-- 动态生成网站列表 -->
  </div>
  <button id="add-site">添加网站</button>
</div>
```

**配置管理逻辑**:
```javascript
class ConfigManager {
  constructor() {
    this.storage = chrome.storage.sync;
  }
  
  async loadConfig()        // 加载用户配置
  async saveConfig(config)  // 保存配置到存储
  async addCustomSite(site) // 添加自定义网站
  validateSiteConfig(site)  // 验证网站配置
}
```

### 5. 国际化组件

**目录结构**:
```
locales/
├── en/
│   └── messages.json
├── zh_CN/
│   └── messages.json
└── zh_TW/
    └── messages.json
```

**消息定义**:
```json
{
  "extensionName": {
    "message": "一键纯文",
    "description": "Extension name"
  },
  "copyPlainText": {
    "message": "复制纯文本",
    "description": "Copy button text"
  },
  "copySuccess": {
    "message": "复制成功",
    "description": "Copy success message"
  }
}
```

## Data Models

### 站点配置模型

```javascript
interface SiteConfig {
  [hostname: string]: {
    selector: string;    // CSS 选择器，用于定位回复气泡
    name: string;        // 站点显示名称
    enabled?: boolean;   // 是否启用 (默认 true)
    customStyles?: {     // 自定义按钮样式
      position?: string;
      top?: string;
      right?: string;
      fontSize?: string;
    }
  }
}
```

### 按钮状态模型

```javascript
interface ButtonState {
  element: HTMLElement;     // 按钮 DOM 元素
  targetBubble: HTMLElement; // 目标气泡元素
  isInjected: boolean;      // 是否已注入
  lastUpdate: number;       // 最后更新时间戳
}
```

## Error Handling

### 1. 站点识别错误处理

```javascript
// 当站点配置加载失败时
try {
  const siteConfig = await loadSiteConfig();
} catch (error) {
  console.warn('PureText: Failed to load site config, using fallback');
  // 使用内置的默认配置
}

// 当选择器匹配失败时
const bubbles = document.querySelectorAll(selector);
if (bubbles.length === 0) {
  console.debug('PureText: No matching elements found for selector:', selector);
  return; // 静默失败，不影响页面
}
```

### 2. 剪贴板操作错误处理

```javascript
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showSuccessMessage();
  } catch (error) {
    console.error('PureText: Clipboard write failed:', error);
    // 降级到传统方法
    fallbackCopyMethod(text);
  }
}

function fallbackCopyMethod(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}
```

### 3. DOM 操作错误处理

```javascript
function injectButton(bubble) {
  try {
    // 检查元素是否仍在 DOM 中
    if (!document.contains(bubble)) {
      return;
    }
    
    // 检查是否已经注入过按钮
    if (bubble.querySelector('.puretext-copy-btn')) {
      return;
    }
    
    const button = createButton();
    bubble.appendChild(button);
    
  } catch (error) {
    console.error('PureText: Button injection failed:', error);
    // 不抛出错误，避免影响页面正常功能
  }
}
```

## Testing Strategy

### 1. 单元测试

**测试工具**: Jest + jsdom

**测试覆盖**:
- `ClipboardManager.extractPlainText()` - 纯文本提取逻辑
- `SiteManager.getCurrentSite()` - 站点识别逻辑
- `ButtonInjector.createButton()` - 按钮创建逻辑

**示例测试**:
```javascript
describe('ClipboardManager', () => {
  test('should extract plain text from markdown', () => {
    const element = document.createElement('div');
    element.innerHTML = '**Bold** and *italic* text';
    
    const plainText = ClipboardManager.extractPlainText(element);
    expect(plainText).toBe('Bold and italic text');
  });
});
```

### 2. 集成测试

**测试环境**: Puppeteer + Chrome Headless

**测试场景**:
- 在各个目标网站加载扩展
- 验证按钮正确注入
- 测试复制功能是否正常工作
- 验证国际化文案显示

**示例测试**:
```javascript
describe('Extension Integration', () => {
  test('should inject copy button on ChatGPT', async () => {
    await page.goto('https://chat.openai.com');
    
    // 等待聊天界面加载
    await page.waitForSelector('[data-message-author-role="assistant"]');
    
    // 检查复制按钮是否存在
    const copyButton = await page.$('.puretext-copy-btn');
    expect(copyButton).toBeTruthy();
  });
});
```

### 3. 手动测试清单

**浏览器兼容性测试**:
- [ ] Chrome 最新版本
- [ ] Edge 最新版本  
- [ ] Firefox 最新版本

**功能测试**:
- [ ] 按钮在所有目标网站正确显示
- [ ] 复制功能正常工作
- [ ] 纯文本提取正确（去除 Markdown）
- [ ] 国际化文案正确显示
- [ ] 不同主题下按钮可见性

**性能测试**:
- [ ] 页面加载时间无明显影响
- [ ] 内存使用量在合理范围
- [ ] 大量消息时性能稳定

### 4. 自动化测试流程

**CI/CD 集成**:
```yaml
# .github/workflows/test.yml
name: Test Extension
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run build
      - run: npm run test:integration
```

**测试数据管理**:
- 使用 fixtures 目录存储测试用的 HTML 片段
- 模拟各个网站的 DOM 结构
- 准备不同语言环境的测试数据

这个设计确保了扩展的可靠性、可维护性和良好的用户体验，同时为未来的功能扩展留下了灵活的架构基础。