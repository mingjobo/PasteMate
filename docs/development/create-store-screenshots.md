# 创建商店截图指南

## 准备工作

1. **安装扩展到浏览器**
   - 打开 Edge 浏览器
   - 访问 `edge://extensions/`
   - 开启"开发者模式"
   - 点击"加载已解压的扩展"
   - 选择 `dist` 文件夹

2. **准备测试环境**
   - 打开一个支持的AI聊天网站（如 ChatGPT）
   - 准备一些对话内容用于截图

## 需要的截图

### 截图 1：主功能展示（必需）
**文件名**：screenshot1_main_function.png
**内容**：
- 显示ChatGPT的对话界面
- 清晰展示"复制纯文本"按钮
- 最好包含一个正在复制的提示

**制作步骤**：
1. 打开 ChatGPT (chat.openai.com)
2. 发送一个包含代码或格式化文本的问题
3. 等待AI回复
4. 将鼠标悬停在复制按钮上
5. 截图（包含整个对话框）

### 截图 2：Word导出功能（必需）
**文件名**：screenshot2_word_export.png
**内容**：
- 显示"下载为Word"按钮
- 可以包含下载提示或已下载文件

**制作步骤**：
1. 在同一个对话中
2. 点击"下载为Word"按钮
3. 在下载开始时截图

### 截图 3：PDF导出功能（推荐）
**文件名**：screenshot3_pdf_export.png
**内容**：
- 显示"下载为PDF"按钮
- 展示PDF导出功能

### 截图 4：多网站支持（推荐）
**文件名**：screenshot4_multi_sites.png
**内容**：
- 显示在其他支持的网站（如Kimi）使用

### 截图 5：功能按钮详情（可选）
**文件名**：screenshot5_buttons.png
**内容**：
- 近距离展示所有功能按钮

## 截图工具推荐

### Windows用户
- **Snipping Tool**（系统自带）：Win + Shift + S
- **ShareX**（免费）：功能强大，支持标注
- **Snagit**（付费）：专业截图工具

### Mac用户
- **系统截图**：Cmd + Shift + 4
- **CleanShot X**（付费）：专业截图工具
- **Xnapper**：美化截图

### 通用工具
- **Lightshot**：跨平台，简单易用
- **浏览器开发者工具**：F12 → Ctrl/Cmd + Shift + P → "Capture screenshot"

## 截图规范

### 尺寸要求
- **推荐**：1280 x 800 像素
- **最小**：640 x 400 像素
- **最大**：1280 x 800 像素
- **格式**：PNG 或 JPG

### 内容要求
- ✅ 清晰展示扩展功能
- ✅ 界面干净整洁
- ✅ 文字可读
- ❌ 避免个人信息
- ❌ 避免敏感内容
- ❌ 避免其他扩展的图标

## 制作宣传图（可选）

### 小型宣传图（440 x 280）
可以使用在线工具制作：
1. 访问 Canva.com
2. 创建自定义尺寸 440x280
3. 添加扩展名称和主要功能说明
4. 使用品牌颜色和图标

### 推荐的设计元素
- 扩展图标
- 扩展名称："贴伴"
- 副标题："AI聊天纯文本复制工具"
- 支持的网站图标
- 简洁的背景

## 截图美化技巧

1. **添加浏览器框架**
   - 使用 Browser Frame (browserframe.com)
   - 让截图看起来更专业

2. **添加标注**
   - 用箭头指向重要功能
   - 添加简短说明文字

3. **统一风格**
   - 所有截图使用相同的浏览器主题
   - 保持一致的缩放比例

4. **优化文件大小**
   - 使用 TinyPNG.com 压缩
   - 保持文件在 1MB 以下

## 检查清单

提交前确认：
- [ ] 至少准备2张截图
- [ ] 所有截图尺寸正确
- [ ] 截图清晰，文字可读
- [ ] 没有个人信息泄露
- [ ] 功能展示明确
- [ ] 文件命名规范
- [ ] 文件大小合适（< 1MB）

## 示例对话内容（用于截图）

可以使用以下对话内容制作截图：

**用户**：请帮我写一个Python函数，实现快速排序算法

**AI回复**：这里是一个Python快速排序算法的实现：

```python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quicksort(left) + middle + quicksort(right)

# 使用示例
numbers = [3, 6, 8, 10, 1, 2, 1]
sorted_numbers = quicksort(numbers)
print(sorted_numbers)  # 输出: [1, 1, 2, 3, 6, 8, 10]
```

这个实现使用了列表推导式，简洁易懂。