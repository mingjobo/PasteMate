# DeepSeek 多按钮功能实现文档

## 概述

本文档描述了如何在 DeepSeek 网页中实现多按钮注入功能，包括"复制到 Word"、"下载为 Word"和"下载为 PDF"三个按钮。

## 实现原理

### 1. 按钮注入位置

在 DeepSeek 中，按钮注入到 `.ds-icon-button` 的父容器中，具体位置是：
- 查找 AI 回复内容（`.ds-markdown.ds-markdown--block`）
- 在其下一个兄弟节点或父节点中查找 `.ds-icon-button`
- 在最后一个 `.ds-icon-button` 后面插入我们的按钮组

### 2. 按钮组结构

使用 `.puretext-button-group` 容器来组织三个按钮：
- 复制到 Word 按钮（使用 `CopyButton` 类）
- 下载为 Word 按钮（使用 `DownloadWordButton` 类）
- 下载为 PDF 按钮（使用 `DownloadPdfButton` 类）

### 3. 样式适配

针对 DeepSeek 的特殊样式需求：
- 按钮高度：20px（比标准 24px 小）
- 字体大小：11px（比标准 12px 小）
- 内边距：2px 6px（比标准 4px 8px 小）
- 颜色方案：透明背景，白色半透明文字
- 间距：按钮组内 4px 间距

## 代码修改

### 1. content.js 主要修改

#### DeepSeek 特殊处理逻辑
```javascript
// DeepSeek特殊处理：按钮插入到所有ds-icon-button同级，且在其右侧
if (window.location.hostname === 'chat.deepseek.com') {
    // ... 查找 AI 回复内容 ...
    
    // 创建按钮组容器
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'puretext-button-group';
    buttonGroup.style.display = 'inline-flex';
    buttonGroup.style.alignItems = 'center';
    buttonGroup.style.gap = '4px';
    
    // 创建三个按钮
    const copyBtn = CopyButton.create(bubble, onCopy);
    const wordBtn = DownloadWordButton.create(bubble, onDownloadWord);
    const pdfBtn = DownloadPdfButton.create(bubble, onDownloadPdf);
    
    // 将按钮添加到按钮组
    buttonGroup.appendChild(copyBtn);
    buttonGroup.appendChild(wordBtn);
    buttonGroup.appendChild(pdfBtn);
    
    // 插入到最后一个ds-icon-button后面
    parent.insertBefore(buttonGroup, iconButtons[iconButtons.length - 1].nextSibling);
}
```

#### 按钮检查逻辑更新
```javascript
// 检查是否已插入
if (parent.querySelector('.puretext-button-group')) continue;

// 清理时包含按钮组
document.querySelectorAll('.puretext-button-container, .puretext-button-group').forEach(btn => btn.remove());

// 统计时包含按钮组
injectedButtonsCount: document.querySelectorAll('.puretext-button-container, .puretext-button-group').length
```

### 2. BaseActionButton.js 样式适配

DeepSeek 专用的颜色方案：
```javascript
static getColorScheme(isDeepSeek = false) {
    if (isDeepSeek) {
        return {
            background: 'transparent',
            text: 'rgba(255, 255, 255, 0.7)',
            border: 'none',
            shadow: 'none',
            hoverBackground: 'rgba(255, 255, 255, 0.1)',
            hoverShadow: 'none',
            activeBackground: 'rgba(255, 255, 255, 0.15)',
            focus: '#3b82f6'
        };
    }
    // ... 其他网站的默认样式
}
```

### 3. 按钮类实现

#### DownloadWordButton.js
```javascript
static create(targetElement, onDownload, options = {}) {
    const buttonText = chrome?.i18n ? chrome.i18n.getMessage('downloadAsWord') : '下载为 Word';
    const isDeepSeek = window.location.hostname === 'chat.deepseek.com';
    const { customStyle = {} } = options;
    return super.createBaseButton(buttonText, onDownload, {
        targetElement,
        isKimi: false,
        isDeepSeek,
        customStyle
    });
}
```

#### DownloadPdfButton.js
```javascript
static create(targetElement, onDownload, options = {}) {
    const buttonText = chrome?.i18n ? chrome.i18n.getMessage('downloadAsPdf') : '下载为 PDF';
    const isDeepSeek = window.location.hostname === 'chat.deepseek.com';
    const { customStyle = {} } = options;
    return super.createBaseButton(buttonText, onDownload, {
        targetElement,
        isKimi: false,
        isDeepSeek,
        customStyle
    });
}
```

## 功能特性

### 1. 智能检测
- 自动检测 DeepSeek 网站
- 智能查找 AI 回复内容
- 避免重复注入按钮

### 2. 响应式设计
- 适配 DeepSeek 的界面风格
- 按钮大小和间距优化
- 悬停和点击效果

### 3. 错误处理
- 完善的错误捕获和日志
- 用户友好的错误提示
- 按钮状态反馈

### 4. 国际化支持
- 使用 chrome.i18n API
- 支持多语言文本
- 默认中文回退

## 测试

### 1. 测试文件
- `test/test-deepseek-multi-buttons.html` - 模拟 DeepSeek 界面
- `test/test-deepseek-multi-buttons.js` - 测试脚本

### 2. 测试要点
- 按钮正确注入到指定位置
- 三个按钮功能正常
- 样式适配正确
- 避免重复注入
- 错误处理正常

## 部署说明

### 1. 文件依赖
确保以下文件已正确导入：
- `src/CopyButton.js`
- `src/DownloadWordButton.js`
- `src/DownloadPdfButton.js`
- `src/export-to-word.js`
- `src/export-to-pdf.js`

### 2. 构建要求
- 确保 webpack 配置正确
- 检查依赖包是否完整
- 验证 manifest.json 权限

### 3. 浏览器兼容性
- Chrome 88+
- Firefox 85+
- Safari 14+

## 注意事项

1. **DOM 结构依赖**：依赖于 DeepSeek 的特定 DOM 结构，如果网站结构变化需要相应调整
2. **样式冲突**：确保按钮样式不与网站原有样式冲突
3. **性能考虑**：按钮注入逻辑已优化，避免频繁的 DOM 操作
4. **用户体验**：提供清晰的视觉反馈和操作状态提示

## 未来改进

1. **配置化**：支持用户自定义按钮组合
2. **主题适配**：更好的深色/浅色主题支持
3. **快捷键**：支持键盘快捷键操作
4. **批量操作**：支持批量导出多个回复 