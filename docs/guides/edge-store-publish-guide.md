# Edge 浏览器商店发布指南

## 发布包准备 ✅
您的扩展包已经准备好了：
- 文件名：`pastemate-v1.0.0.zip`
- 大小：590KB
- 版本：1.0.0

## 第一步：注册 Edge 开发者账号

### 1.1 访问 Edge 开发者中心
- 打开浏览器访问：https://partner.microsoft.com/en-us/dashboard/microsoftedge/overview
- 点击 "Sign up" 或 "登录"

### 1.2 账号类型选择
- **个人开发者**：选择 "Individual" （推荐新手使用）
- **公司开发者**：选择 "Company"（需要公司信息验证）

### 1.3 完成账号注册
- 填写个人信息：
  - 姓名
  - 邮箱地址
  - 国家/地区
  - 电话号码
- **注册费用**：一次性支付 $19 美元（约130人民币）
- 支付方式：支持信用卡、借记卡

## 第二步：准备商店发布材料

### 2.1 扩展基本信息
- **扩展名称（中文）**：贴伴
- **扩展名称（英文）**：PasteMate
- **简短描述（中文）**：在AI聊天网站中一键复制纯文本内容，去除Markdown格式
- **简短描述（英文）**：One-click copy plain text content from AI chat websites, removing Markdown formatting

### 2.2 详细描述（中文版）
```
贴伴 - AI聊天纯文本复制工具

支持的网站：
✅ ChatGPT (chat.openai.com)
✅ DeepSeek (chat.deepseek.com)
✅ Kimi (www.kimi.com)
✅ 豆包 (www.doubao.com)

主要功能：
• 一键复制纯文本 - 自动去除Markdown格式，直接获得干净的纯文本
• 导出为Word文档 - 保留格式结构，方便编辑和分享
• 导出为PDF文档 - 生成专业的PDF文件，适合存档和打印
• 智能格式化 - 保留必要的结构（标题、列表、代码块），去除多余标记

使用方法：
1. 安装扩展后，访问支持的AI聊天网站
2. 在每条AI回复消息旁会出现复制和下载按钮
3. 点击按钮即可复制或下载内容

隐私承诺：
• 不收集任何用户数据
• 所有操作都在本地完成
• 无需网络权限，安全可靠
```

### 2.3 详细描述（英文版）
```
PasteMate - AI Chat Plain Text Copy Tool

Supported Websites:
✅ ChatGPT (chat.openai.com)
✅ DeepSeek (chat.deepseek.com)
✅ Kimi (www.kimi.com)
✅ Doubao (www.doubao.com)

Key Features:
• One-click Plain Text Copy - Automatically removes Markdown formatting for clean text
• Export to Word - Preserves structure for easy editing and sharing
• Export to PDF - Generate professional PDF files for archiving and printing
• Smart Formatting - Retains essential structure (headings, lists, code blocks) while removing excess markup

How to Use:
1. After installation, visit any supported AI chat website
2. Copy and download buttons will appear next to each AI response
3. Click the buttons to copy or download content

Privacy Commitment:
• No user data collection
• All operations performed locally
• No network permissions required
```

### 2.4 商店截图要求
您需要准备以下截图（建议尺寸：1280x800 或 640x400）：

1. **主功能截图**：展示在ChatGPT中使用复制按钮
2. **Word导出截图**：展示导出为Word文档的功能
3. **PDF导出截图**：展示导出为PDF的功能
4. **多网站支持截图**：展示在不同AI网站的使用

### 2.5 图标和宣传图
- **商店图标**：128x128 PNG（已有：icons/pastemate_cute_128.png）
- **小型宣传图**：440x280 PNG
- **大型宣传图**：1400x560 PNG（可选）
- **侯爵宣传图**：1400x560 PNG（可选）

## 第三步：提交扩展到商店

### 3.1 登录开发者中心
1. 访问：https://partner.microsoft.com/dashboard
2. 使用您注册的账号登录

### 3.2 创建新的扩展提交
1. 点击 "新建扩展" 或 "New extension"
2. 上传扩展包：选择 `pastemate-v1.0.0.zip`
3. 系统会自动验证您的扩展包

### 3.3 填写商店列表信息

#### 可用性设置
- **发布地区**：选择 "所有地区" 或指定地区
- **定价**：选择 "免费"
- **类别**：选择 "生产力" (Productivity)
- **年龄分级**：3岁及以上

#### 属性设置
- **主要语言**：中文（简体）
- **其他支持语言**：英语

#### 商店列表详情
1. **扩展名称**：填写 "贴伴" 或 "PasteMate"
2. **简短描述**：复制上面准备的简短描述
3. **详细描述**：复制上面准备的详细描述
4. **搜索关键词**：
   - 中文：AI聊天, 纯文本, 复制, ChatGPT, Markdown, 文本提取
   - 英文：AI chat, plain text, copy, ChatGPT, Markdown, text extraction
5. **网站URL**（可选）：您的GitHub项目地址
6. **支持邮箱**：您的联系邮箱
7. **隐私政策URL**（可选但推荐）

### 3.4 上传视觉资源
1. 上传商店图标（128x128）
2. 上传至少2张截图（最多5张）
3. 上传宣传图（如果有）

### 3.5 提交审核
1. 检查所有信息是否正确
2. 点击 "提交审核" 或 "Submit for review"
3. 等待审核结果（通常1-3个工作日）

## 第四步：审核和发布

### 4.1 审核流程
- **审核时间**：通常1-3个工作日
- **审核内容**：
  - 功能测试
  - 安全检查
  - 政策合规性
  - 商店列表信息

### 4.2 可能的审核结果
1. **通过**：扩展将自动发布到商店
2. **需要修改**：根据反馈修改后重新提交
3. **拒绝**：需要解决重大问题后重新提交

### 4.3 常见审核问题
- 描述与实际功能不符
- 缺少隐私政策
- 权限使用不当
- 图标或截图质量问题

## 第五步：发布后维护

### 5.1 监控反馈
- 定期查看用户评论和评分
- 及时回复用户问题

### 5.2 更新扩展
1. 修改代码后，更新 manifest.json 中的版本号
2. 运行 `npm run package` 生成新的zip包
3. 在开发者中心上传新版本
4. 等待审核通过

### 5.3 查看分析数据
- 安装量统计
- 活跃用户数
- 地区分布
- 错误报告

## 常见问题解答

**Q: 一定要付费才能发布吗？**
A: 是的，Microsoft需要一次性支付$19的开发者注册费。

**Q: 审核要多久？**
A: 通常1-3个工作日，首次提交可能需要更长时间。

**Q: 可以同时发布到Chrome商店吗？**
A: 可以，代码完全兼容。Chrome商店需要单独注册（一次性$5）。

**Q: 如何制作商店截图？**
A: 
1. 在浏览器中实际使用扩展
2. 使用截图工具（如Windows的Snipping Tool或Mac的截图）
3. 确保截图清晰，展示核心功能

**Q: 没有信用卡怎么办？**
A: 可以使用：
- 虚拟信用卡（如Wise、Payoneer）
- 让朋友代付
- 使用PayPal（如果支持）

## 需要帮助？

如果在发布过程中遇到任何问题，可以：
1. 查看官方文档：https://docs.microsoft.com/microsoft-edge/extensions-chromium/
2. 访问开发者论坛：https://techcommunity.microsoft.com/t5/microsoft-edge-insider/bd-p/MicrosoftEdgeInsider
3. 联系Edge支持团队

---

祝您发布顺利！🎉