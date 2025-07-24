# 一键纯文 (PureText One-Click)

一个轻量级的浏览器扩展，为 AI 聊天网站提供一键复制纯文本功能。

A lightweight browser extension that provides one-click plain text copying for AI chat websites.

## 🌟 功能特性 / Features

- **一键复制**: 在 AI 聊天回复中自动添加复制按钮
- **纯文本提取**: 自动去除 Markdown 格式和 HTML 标签
- **多网站支持**: 支持 ChatGPT、DeepSeek、豆包、Kimi 等主流 AI 聊天平台
- **多浏览器兼容**: 支持 Chrome、Edge、Firefox (Manifest V3)
- **国际化**: 支持中英文界面
- **轻量级**: 无外部依赖，性能优化

---

- **One-Click Copy**: Automatically adds copy buttons to AI chat responses
- **Plain Text Extraction**: Removes Markdown formatting and HTML tags automatically
- **Multi-Site Support**: Works with ChatGPT, DeepSeek, Doubao, Kimi, and other AI chat platforms
- **Cross-Browser**: Compatible with Chrome, Edge, Firefox (Manifest V3)
- **Internationalization**: Supports Chinese and English interfaces
- **Lightweight**: No external dependencies, performance optimized

## 🚀 支持的网站 / Supported Websites

| 网站 / Website | 域名 / Domain | 状态 / Status |
|---|---|---|
| ChatGPT | chat.openai.com | ✅ |
| DeepSeek | chat.deepseek.com | ✅ |
| 豆包 / Doubao | www.doubao.com | ✅ |
| Kimi | www.kimi.com | ✅ |

## 📦 安装方法 / Installation

### 从源码安装 / Install from Source

1. **克隆仓库 / Clone Repository**
   ```bash
   git clone https://github.com/your-username/puretext-copy-extension.git
   cd puretext-copy-extension
   ```

2. **安装依赖 / Install Dependencies**
   ```bash
   npm install
   ```

3. **构建扩展 / Build Extension**
   ```bash
   npm run build
   ```

4. **加载到浏览器 / Load in Browser**
   
   **Chrome/Edge:**
   - 打开 `chrome://extensions/` 或 `edge://extensions/`
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择 `dist` 文件夹
   
   **Firefox:**
   - 打开 `about:debugging`
   - 点击"此 Firefox"
   - 点击"临时载入附加组件"
   - 选择 `dist/manifest.json`

### 从扩展商店安装 / Install from Extension Store

*即将上线 / Coming Soon*

## 🛠️ 开发指南 / Development Guide

### 项目结构 / Project Structure

```
puretext-copy-extension/
├── src/                    # 源代码 / Source code
│   └── ClipboardManager.js # 剪贴板管理 / Clipboard management
├── _locales/              # 国际化文件 / Localization files
│   ├── en/messages.json   # 英文 / English
│   └── zh_CN/messages.json # 中文 / Chinese
├── icons/                 # 扩展图标 / Extension icons
├── test/                  # 测试文件 / Test files
├── content.js             # 内容脚本 / Content script
├── sites.js               # 网站配置 / Site configurations
├── manifest.json          # 扩展清单 / Extension manifest
└── build.js               # 构建脚本 / Build script
```

### 开发命令 / Development Commands

```bash
# 运行测试 / Run tests
npm test

# 监听测试 / Watch tests
npm run test:watch

# 生成覆盖率报告 / Generate coverage report
npm run test:coverage

# 生成图标 / Generate icons
npm run icons

# 构建扩展 / Build extension
npm run build

# 打包发布 / Package for release
npm run package

# 清理构建文件 / Clean build files
npm run clean
```

### 添加新网站支持 / Adding New Website Support

1. 在 `sites.js` 中添加网站配置：
   ```javascript
   "example.com": {
     selector: ".response-message",
     name: "Example AI"
   }
   ```

2. 在 `manifest.json` 中添加域名匹配：
   ```json
   "matches": ["https://example.com/*"]
   ```

3. 运行测试确保功能正常

## 🧪 测试 / Testing

项目包含完整的测试套件：

- **单元测试**: 测试核心功能模块
- **集成测试**: 测试浏览器兼容性
- **手动测试**: 在实际网站中验证功能

```bash
# 运行所有测试
npm test

# 查看测试覆盖率
npm run test:coverage
```

## 🔧 技术栈 / Tech Stack

- **核心**: 纯 JavaScript (ES6+)
- **构建**: esbuild
- **测试**: Vitest + jsdom
- **图标**: Sharp (SVG to PNG)
- **打包**: Archiver
- **标准**: Manifest V3

## 📄 许可证 / License

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献 / Contributing

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📞 支持 / Support

如果您遇到问题或有建议，请：

- 提交 [GitHub Issue](https://github.com/your-username/puretext-copy-extension/issues)
- 查看 [FAQ](docs/FAQ.md)
- 阅读 [故障排除指南](docs/TROUBLESHOOTING.md)

## 🎯 路线图 / Roadmap

- [ ] 更多 AI 聊天网站支持
- [ ] 自定义按钮样式
- [ ] 快捷键支持
- [ ] 复制历史记录
- [ ] 批量复制功能

---

**Made with ❤️ for the AI community**