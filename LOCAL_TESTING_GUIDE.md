# 本地测试指南

## 问题说明

你遇到的问题是扩展只在特定网站上运行，不会在本地文件 `file://` 协议上运行。这是因为 `manifest.json` 中的 `matches` 配置只包含了特定的网站域名。

## 解决方案

### 方案1：使用测试版 manifest（推荐）

1. **备份原始文件**：
   ```bash
   cp manifest.json manifest-production.json
   ```

2. **使用测试版配置**：
   ```bash
   cp manifest-test.json manifest.json
   ```

3. **重新加载扩展**：
   - 在 Chrome 中打开 `chrome://extensions/`
   - 找到你的扩展，点击"重新加载"按钮
   - 或者先删除扩展，然后重新加载文件夹

4. **刷新测试页面**：
   - 刷新 `test-page.html` 页面
   - 现在扩展应该能在本地文件上运行了

### 方案2：在真实网站上测试

直接在支持的网站上测试：
- https://chat.openai.com/
- https://chat.deepseek.com/
- https://www.doubao.com/
- https://www.kimi.com/

### 方案3：临时修改测试页面

在测试页面中添加以下脚本来模拟真实网站：

```javascript
// 临时修改 hostname 进行测试
Object.defineProperty(window.location, 'hostname', {
  writable: true,
  value: 'chat.openai.com'
});
```

## 测试步骤

1. **确认扩展已加载**：
   - 打开 `chrome://extensions/`
   - 确保扩展已启用
   - 检查是否有错误信息

2. **运行测试**：
   - 打开 `test-page.html`
   - 点击"测试按钮注入"按钮
   - 查看控制台输出

3. **预期结果**：
   - 应该看到复制按钮出现在模拟的聊天消息旁边
   - 控制台显示"✅ 发现 X 个复制按钮"

## 常见问题

### Q: 为什么本地文件不能直接使用扩展？
A: Chrome 扩展的安全机制要求明确指定可以运行的网站。`file://` 协议需要特殊权限。

### Q: 测试版 manifest 有什么不同？
A: 测试版添加了 `"file://*/*"` 匹配规则，允许扩展在本地文件上运行。

### Q: 生产环境需要注意什么？
A: 发布前记得恢复原始的 `manifest.json`，移除 `file://` 匹配规则。

## 调试技巧

1. **查看扩展控制台**：
   - 在 `chrome://extensions/` 中点击扩展的"检查视图"
   - 查看是否有 JavaScript 错误

2. **检查内容脚本加载**：
   - 在页面中按 F12 打开开发者工具
   - 在 Console 中输入 `typeof SUPPORTED_SITES`
   - 应该返回 "object" 而不是 "undefined"

3. **手动触发按钮注入**：
   ```javascript
   // 在控制台中运行
   if (window.buttonInjector) {
     window.buttonInjector.scanAndInjectButtons();
   }
   ```

## 恢复生产配置

测试完成后，恢复生产配置：

```bash
cp manifest-production.json manifest.json
```

然后重新加载扩展。