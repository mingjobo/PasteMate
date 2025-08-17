# 贴伴 (PasteMate) - AI对话完美保存为Word文档

A lightweight browser extension that exports AI chat conversations to perfectly formatted Word documents.

## ❌ 你是否遇到这些问题？

从AI聊天网站保存内容时：
- **复制粘贴格式全乱**：代码块、表格、公式在Word中显示混乱
- **手动整理费时费力**：需要重新调整格式、缩进、字体样式
- **分享不便**：无法优雅地将AI分析结果制作成正式文档

## ✅ 一键生成Word文档

贴伴让你**一键将AI对话导出为格式正常的Word文档**：
- 📄 **格式保留**：段落工整、表格结构、数学公式完美呈现
- 🎨 **专业排版**：自动应用合适的字体、间距、标题层级
- 📤 **即时导出**：点击按钮立即下载，无需等待和转换

## 🌟 核心功能 / Core Features

### 📄 智能Word文档生成
- **完美格式保留**：内容格式保持正常显示
- **表格精准还原**：复杂表格在Word中正常显示
- **数学公式支持**：LaTeX公式转换为Word原生公式


### 🎯 典型使用场景
- **学术研究**：导出包含公式和数据的研究资料
- **工作报告**：制作包含AI分析结果的正式报告
- **学习笔记**：保存AI讲解的知识点，制作学习资料
- **项目规划**：导出AI协助制定的项目方案和时间表

### 💻 技术特性
- **多浏览器兼容**: 支持 Chrome、Edge、Firefox (Manifest V3)
- **国际化**: 支持中英文界面
- **轻量级**: 优化性能，快速响应

## 🔄 导出效果展示 / Export Effect Comparison

### ❌ 传统复制粘贴到Word
- 代码块失去语法高亮，缩进混乱
- 表格边框消失，数据排列错乱  
- 数学公式显示为纯文本代码
- 需要花费大量时间手动调整格式

### ✅ 使用贴伴一键导出
- 代码块保持完美缩进和语法高亮
- 表格结构清晰，边框和样式完整
- 数学公式自动转换为Word原生格式
- 标题层级自动设置，段落间距合理
- 立即获得可直接使用的专业文档

## 🌐 当前支持平台 / Supported Platforms

| AI平台 / Platform | 网址 / Domain | Word导出 / Word Export | 状态 / Status |
|---|---|---|---|
| DeepSeek | chat.deepseek.com | ✅ | 完整支持 |
| Kimi | kimi.moonshot.cn | ✅ | 完整支持 |
| ChatGPT | chat.openai.com | 🚧 | 开发中 |
| 豆包 | doubao.com | 🚧 | 开发中 |

> 我们正在努力扩展更多平台支持

## 🚀 快速开始 / Quick Start

### 安装使用 / Installation & Usage
1. **克隆项目 / Clone Project**：
   ```bash
   git clone https://github.com/mingjobo/PureTextOne-Click.git
   cd PureTextOne-Click
   ```

2. **构建扩展 / Build Extension**：
   ```bash
   npm install && npm run build
   ```

3. **加载扩展 / Load Extension**：
   - **Chrome/Edge**: 打开 `chrome://extensions/`，启用开发者模式，加载 `dist` 文件夹
   - **Firefox**: 打开 `about:debugging`，临时载入 `dist/manifest.json`

4. **访问AI网站 / Visit AI Sites**：打开 DeepSeek 或 Kimi
5. **开始对话 / Start Chat**：与AI正常对话
6. **导出文档 / Export Document**：点击回复旁的📄按钮，立即下载Word文档

### 💡 使用技巧 / Tips
- 长对话建议分段导出，便于文档管理
- 导出前可预览格式效果
- 支持自定义文档标题和作者信息

### 从扩展商店安装 / Install from Extension Store

*即将上线 / Coming Soon*

## 🛠️ 开发指南 / Development Guide

### 项目结构 / Project Structure

```
PureTextOne-Click/
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

**学习许可，禁止商用 / Educational License, Commercial Use Prohibited**

本项目仅供学习和研究使用，禁止任何形式的商业用途。

This project is for educational and research purposes only. Commercial use is strictly prohibited.

- ✅ **允许 / Allowed**: 学习、研究、个人使用
- ❌ **禁止 / Prohibited**: 商业用途、销售、商业分发

详见 [LICENSE](LICENSE) 文件

## 🤝 贡献 / Contributing

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📞 支持 / Support

如果您遇到问题或有建议，请：

- 提交 [GitHub Issue](https://github.com/mingjobo/PasteMate/issues)
- 查看 [FAQ](docs/FAQ.md)
- 阅读 [故障排除指南](docs/TROUBLESHOOTING.md)

## 🎯 路线图 / Roadmap

- [ ] 更多 AI 聊天网站支持
- [ ] 批量复制功能

---

**Made with ❤️ for the AI community**

## 站点配置架构（2024重构）

- 每个目标网站的配置已独立为单独文件，位于 `src/sites/` 目录：
  - `chatgpt.js`、`deepseek.js`、`doubao.js`、`kimi.js` 等
- `src/sites/index.js` 汇总所有站点配置，导出 `SUPPORTED_SITES`
- `content.js` 只需从 `src/sites/index.js` 导入，无需关心具体站点细节

这样便于维护、扩展和管理各站点的支持。