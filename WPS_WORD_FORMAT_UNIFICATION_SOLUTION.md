# WPS与Word格式统一问题解决过程文档

## 问题背景
用户反馈：从Kimi网站复制内容到Word格式正常，但粘贴到WPS中显示为SVG图片，无法编辑。

## 问题分析过程

### 1. 初步诊断
- 用户提供了`wps_online.html`文件，显示WPS将复制的HTML内容渲染为SVG
- 分析发现WPS对复杂HTML的处理方式与Word不同
- 初步假设：HTML结构过于复杂，需要简化

### 2. 第一次尝试：HTML简化方案
**创建的文件：**
- `src/WpsCompatibleOptimizer.js` - 极简HTML生成器
- `test-wps.html`、`test-wps-improved.html`、`test-wps-minimal.html` - 测试文件

**测试结果：**
用户反馈：
- 文字可以编辑了
- 但无序列表圆圈显示不对
- 仍然显示SVG标签
- WPS默认把HTML当作图片处理

**结论：** 即使极简HTML也无法解决WPS的SVG渲染问题

### 3. 关键洞察：剪贴板数据格式问题
**核心发现：**
- WPS优先读取`text/html`格式的剪贴板数据
- 即使HTML很简单，WPS仍将其渲染为SVG
- 解决方案：只提供`text/plain`格式，避免HTML格式

### 4. 第二次尝试：统一文本格式方案
**修改的核心文件：**

#### `src/WordOptimizer.js`
- 添加`useUnifiedTextMode`标志（默认true）
- 新增`optimizeAsUnifiedText()`方法
- 生成纯文本格式，使用简单符号：
  - `•` 表示无序列表
  - `1.` 表示有序列表  
  - `【粗体】` 表示粗体
  - `【斜体】` 表示斜体

#### `src/ClipboardManager.js`
- 修改`copyHtmlToClipboard()`方法
- 只向剪贴板写入`text/plain`数据
- 移除`text/html`数据写入

### 5. 关键问题：文件引用错误
**问题发现：**
- 修改`src/ClipboardManager.js`后，Kimi中仍使用旧逻辑
- 通过日志发现实际使用的是`content-unified.js`中的嵌入式`ClipboardManager`

**解决方案：**
- 将统一文本逻辑同步到`content-unified.js`的嵌入式`ClipboardManager`类中

### 6. 最终修改：content-unified.js
**关键修改：**
```javascript
// 修改copyHtmlToClipboard方法
static copyHtmlToClipboard(element) {
    const unifiedText = this.convertElementToUnifiedText(element);
    // 只写入text/plain，不写入text/html
    navigator.clipboard.writeText(unifiedText);
}

// 新增统一文本转换方法
static convertElementToUnifiedText(element) {
    const cloned = element.cloneNode(true);
    this.removeUnwantedElements(cloned);
    return this.convertHtmlToUnifiedText(cloned.outerHTML);
}

static convertHtmlToUnifiedText(html) {
    // 解析HTML并转换为统一文本格式
    // 处理标题、段落、列表、引用、代码等
}
```

## 测试验证过程

### 测试文件创建
1. `test-unified-optimizer.html` - 测试统一文本生成器
2. `test-integration.html` - 测试完整复制流程
3. 在Kimi实际环境中测试

### 测试结果
- 统一文本格式在Word和WPS中都能正常显示
- 格式保持一致，无SVG问题
- 文本可编辑，列表格式正确

## 技术要点总结

### 1. 剪贴板数据格式优先级
- WPS优先读取`text/html`
- Word更灵活处理多种格式
- 解决方案：只提供`text/plain`

### 2. 文件引用关系
- `manifest.json`引用`content-unified.js`
- `content-unified.js`包含嵌入式`ClipboardManager`
- 修改需要同步到实际使用的文件

### 3. 统一文本格式设计
- 使用简单符号表示格式
- 避免复杂HTML结构
- 确保跨平台兼容性

## 最终解决方案
通过生成纯文本格式并只向剪贴板写入`text/plain`数据，成功解决了WPS与Word格式不统一的问题。关键是在`content-unified.js`中实现统一文本转换逻辑。

## 经验教训
1. 要确认实际使用的文件，不要只修改源码文件
2. 剪贴板数据格式的选择直接影响目标应用的处理方式
3. 复杂问题可能需要从根本策略上改变，而不是简单优化

## 相关文件清单
- `content-unified.js` - 主要修改文件（嵌入式ClipboardManager）
- `src/WordOptimizer.js` - 添加统一文本模式
- `src/ClipboardManager.js` - 修改剪贴板写入逻辑
- `example/wps_online.html` - 问题诊断文件
- 各种测试文件（已删除）

## 后续优化建议
1. 考虑添加配置选项，让用户选择HTML或纯文本模式
2. 优化统一文本格式的符号选择，提高可读性
3. 添加更多格式支持（表格、链接等） 