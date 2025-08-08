# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在处理此代码库时提供指导。

## 命令

### 开发
- `npm install` - 安装依赖
- `npm run build` - 构建扩展（生成图标并使用 esbuild 打包）
- `npm run package` - 构建并创建发布 zip 文件
- `npm run clean` - 删除构建产物

### 测试
- `npm test` - 运行所有测试一次
- `npm run test:watch` - 监听模式运行测试
- `npm run test:coverage` - 生成测试覆盖率报告
- 测试单个文件：`npm test -- test/ClipboardManager.test.js`

### 构建工具
- `npm run icons` - 从 SVG 源生成扩展图标
- 同时使用 esbuild (`build.js`) 和 webpack (`webpack.config.cjs`) 进行打包
- Webpack 处理 docx、html2pdf 等依赖的 vendor chunks

## 架构

### 核心结构
这是一个用于从 AI 聊天网站（ChatGPT、DeepSeek、Kimi、豆包）复制纯文本的浏览器扩展。

**入口点**：`content.js` - 注入到支持网站的主内容脚本
- 使用 `SiteManager` 检测并配置当前网站
- `ButtonInjector` 向聊天消息添加复制/下载按钮
- `ClipboardManager` 处理文本提取和复制

### 网站配置
- 每个网站在 `src/sites/` 中有自己的配置（如 `chatgpt.js`、`kimi.js`）
- 配置定义选择器、按钮位置和格式化规则
- `sites.js` 汇总所有网站配置

### 关键组件
- **ClipboardManager** (`src/ClipboardManager.js`)：处理剪贴板操作和文本清理
- **HtmlFormatterManager** (`src/HtmlFormatterManager.js`)：管理特定网站的 HTML 格式化
- **StructureConverter** (`src/StructureConverter.js`)：将 DOM 转换为中间结构
- **导出功能**：Word (`export-to-word.js`) 和 PDF (`export-to-pdf.js`) 导出功能

### 按钮系统
- **CopyButton** (`src/CopyButton.js`)：纯文本复制功能
- **DownloadWordButton** (`src/DownloadWordButton.js`)：导出为 Word 文档
- **DownloadPdfButton** (`src/DownloadPdfButton.js`)：导出为 PDF

### 测试方法
- 使用 Vitest 和 jsdom 进行 DOM 测试
- 测试文件在 `test/` 目录中镜像源代码结构
- 为格式化器、清理器和管理器提供广泛的单元测试
- 包含浏览器兼容性测试

## 处理网站

### 添加新网站支持
1. 在 `src/sites/` 中创建新配置文件（如 `newsite.js`）
2. 定义消息和按钮位置的选择器
3. 导入并添加到 `src/sites/index.js`
4. 将域名添加到 `manifest.json` 的 content_scripts matches
5. 使用特定网站的 HTML 样本进行测试

### 特定网站格式化器
- Kimi 有专门的格式化器（`KimiHtmlFormatter.js`）处理复杂格式
- 通用格式化器（`GenericHtmlFormatter.js`）用于标准网站
- 格式化器处理代码块、列表、表格和特殊元素

## 依赖

### 生产依赖
- `docx` - Word 文档生成
- `file-saver` - 文件下载处理
- `html2pdf.js` - PDF 导出功能

### 构建依赖
- `esbuild` - 主要打包工具
- `webpack` - 处理 vendor chunk 分割
- `vitest` - 测试框架
- `sharp` - 从 SVG 生成图标

## 扩展清单
- 使用 Manifest V3 规范
- 需要 `clipboardWrite` 权限
- 使用 `_locales/` 国际化（en、zh_CN）
- 内容脚本在 `document_idle` 时运行