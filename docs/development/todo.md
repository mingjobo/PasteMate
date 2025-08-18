# 需求与设计文档

## 1. 需求背景

在 Kimi、DeepSeek 等 AI 问答页面，当前已支持“复制到 Word”按钮。为提升用户导出体验，需要在同一位置新增“下载为 Word”和“下载为 PDF”两个按钮，支持一键导出当前回答内容为 Word 或 PDF 文件。

## 2. 功能需求

- 在 Kimi、DeepSeek 回答区，注入“下载为 Word”“下载为 PDF”按钮。
- 按钮样式与现有按钮风格统一，支持后续切换为仅图标显示。
- 点击按钮后，自动提取当前回答内容，分别导出为 Word 或 PDF 文件并下载。
- 支持后续扩展更多导出格式或自定义按钮内容。

## 3. 技术设计

### 3.1 按钮体系

- 所有操作按钮（复制、下载等）均继承自 `BaseActionButton` 父类，统一样式、交互和事件处理。
- `BaseActionButton` 支持文本、图标或两者组合，便于后续切换为仅图标按钮。
- 每个具体按钮（如 DownloadWordButton、DownloadPdfButton）为单独文件，便于维护和扩展。

### 3.2 目录结构

```
src/
  BaseActionButton.js           // 按钮父类，统一交互和样式
  CopyButton.js                 // 复制按钮（已存在/可复用）
  DownloadWordButton.js         // 新增：下载为 Word 按钮
  DownloadPdfButton.js          // 新增：下载为 PDF 按钮
  utils/
    export-utils.js             // 新增：Word/PDF 导出工具函数
  sites/
    kimi.js                     // Kimi 站点注入逻辑
    deepseek.js                 // DeepSeek 站点注入逻辑
  content.js                    // 按钮注入主逻辑
```

### 3.3 主要扩展点

- `BaseActionButton.createBaseButton` 支持 `icon`、`iconPosition` 参数，灵活组合文本和图标。
- 子类按钮可只传 icon，不传 text，实现仅图标按钮。
- 导出工具函数（`export-utils.js`）封装 Word/PDF 导出逻辑，供各按钮调用。

### 3.4 依赖说明

- Word 导出：使用 Blob 方式，无需额外依赖。
- PDF 导出：推荐集成 `html2pdf.js` 或 `jsPDF`，可动态加载或全局引入。

---

# 实现待办文档（Todo List）

1. **扩展 BaseActionButton**
   - [ ] 支持 icon、iconPosition 参数，允许文本+图标或仅图标按钮
   - [ ] 优化样式，保证图标/文本自适应

2. **实现导出工具函数**
   - [ ] 新建 `src/utils/export-utils.js`
   - [ ] 实现 `downloadAsWord(html, filename)`，支持 HTML 导出为 Word
   - [ ] 实现 `downloadAsPdf(html, filename)`，集成 html2pdf.js 或 jsPDF

3. **实现 DownloadWordButton/DownloadPdfButton**
   - [ ] 新建 `src/DownloadWordButton.js`，继承 BaseActionButton
   - [ ] 新建 `src/DownloadPdfButton.js`，继承 BaseActionButton
   - [ ] 支持传入 icon、getContent 回调

4. **在 Kimi/DeepSeek 注入新按钮**
   - [ ] 修改 `src/sites/kimi.js`，在回答区插入新按钮
   - [ ] 修改 `src/sites/deepseek.js`，在回答区插入新按钮
   - [ ] 按钮点击时，自动提取当前回答内容并调用导出工具

5. **样式与交互优化**
   - [ ] 保证新按钮与现有按钮风格统一
   - [ ] 预留仅图标模式的样式和交互

6. **测试与兼容性检查**
   - [ ] 在 Kimi、DeepSeek 页面测试按钮注入与导出功能
   - [ ] 检查移动端/不同分辨率下的显示效果

7. **文档与后续扩展**
   - [ ] 补充 README/开发文档，说明如何扩展新按钮或导出格式 