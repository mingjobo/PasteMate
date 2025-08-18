# 文件名生成功能修复说明

## 问题描述
用户反馈在下载PDF和Word文件时出现"生成文件名失败"的错误，控制台显示：
```
PureText: 生成文件名失败: ChunkLoadError: Loading chunk src_UserQuestionExtractor_js failed.
```

## 问题原因
1. **动态导入问题**：代码中使用了 `await import('./UserQuestionExtractor.js')` 动态导入
2. **CSP限制**：Content Security Policy阻止了从外部URL加载脚本
3. **路径解析错误**：动态导入会优先查找页面上的同名JS文件，而不是扩展自身的文件

## 解决方案
将动态导入改为静态导入，确保在Webpack打包时正确解析路径。

### 修改的文件

#### 1. src/export-to-pdf.js
```diff
import { UserQuestionExtractor } from './UserQuestionExtractor.js';

export async function exportToPdf(content, filename = 'PureText.pdf', aiResponseElement = null) {
  // ...
  
  // 生成智能文件名
  let finalFilename = filename;
  if (aiResponseElement && filename === 'PureText.pdf') {
    try {
      const userQuestion = UserQuestionExtractor.getUserQuestion(aiResponseElement);
      finalFilename = UserQuestionExtractor.generateFilename(userQuestion, 'pdf');
      console.log('PureText: 生成智能文件名:', finalFilename);
    } catch (error) {
      console.error('PureText: 生成文件名失败:', error);
    }
  }
  // ...
}
```

#### 2. src/export-to-word.js
```diff
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { UserQuestionExtractor } from './UserQuestionExtractor.js';

export async function exportToWord(content, filename = 'PureText.docx', aiResponseElement = null) {
  // ...
  
  // 生成智能文件名
  let finalFilename = filename;
  if (aiResponseElement && filename === 'PureText.docx') {
    try {
      const userQuestion = UserQuestionExtractor.getUserQuestion(aiResponseElement);
      finalFilename = UserQuestionExtractor.generateFilename(userQuestion, 'docx');
      console.log('PureText: 生成智能文件名:', finalFilename);
    } catch (error) {
      console.error('PureText: 生成文件名失败:', error);
    }
  }
  // ...
}
```

## 功能说明

### 文件名格式
生成的文件名格式为：`<日期时间>_<网站名>_<用户问题>.<扩展名>`

例如：
- `20241201_143022_deepseek_如何学习品牌运营.pdf`
- `20241201_143022_kimi_请帮我分析代码性能问题.docx`

### 支持的网站
- DeepSeek (chat.deepseek.com)
- Kimi (www.kimi.com)
- ChatGPT (chat.openai.com)
- 豆包 (www.doubao.com)
- 其他网站使用通用方法

### 用户问题提取逻辑
1. 从AI回复元素向上查找对话容器
2. 在对话容器中查找用户消息元素
3. 提取用户问题文本并清理
4. 限制长度避免文件名过长
5. 移除文件名中的非法字符

## 测试方法
1. 打开 `test/test-static-import.html` 测试导入是否正常
2. 打开 `test/test-filename-generation.html` 测试文件名生成功能
3. 在实际网站上测试下载功能

## 注意事项
1. 确保 `UserQuestionExtractor.js` 文件被正确打包到扩展目录
2. 如果用户问题为空，会使用默认的 "question" 作为问题文本
3. 文件名长度限制为50个字符，超长会被截断
4. 特殊字符会被替换为下划线 