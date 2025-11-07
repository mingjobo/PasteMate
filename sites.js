// 内置站点配置 - 支持多层级选择器和智能匹配
// 这个文件定义了浏览器扩展支持的AI聊天网站列表
// 每个网站都有特定的配置，告诉扩展如何找到AI助手的回复内容

export const SUPPORTED_SITES = {
  // ChatGPT 网站配置
  "chat.openai.com": {
    name: "ChatGPT", // 网站显示名称
    // CSS选择器数组 - 告诉扩展在哪里找到AI回复的内容
    // 按优先级排序，第一个最精确，后面的作为备选
    selectors: [
      "[data-message-author-role='assistant'] .markdown", // 最精确：找到助手角色的markdown内容
      "[data-message-author-role='assistant']", // 备选：找到助手角色的整个消息
      ".group.w-full.text-token-text-primary", // 备选：通过CSS类名找到
      ".markdown.prose" // 最后备选：找到所有markdown内容
    ],
    // 特征配置 - 帮助扩展识别和优化内容
    features: {
      textIndicators: ["I'm", "I can", "Here's", "Based on"], // 英文AI回复的常见开头词
      roleAttributes: ["data-message-author-role=assistant"], // 助手角色的HTML属性
      containerClasses: ["markdown", "prose"] // 内容容器的CSS类名
    }
  },

  // DeepSeek 网站配置
  "chat.deepseek.com": {
    name: "DeepSeek",
    selectors: [
      ".ds-markdown.ds-markdown--block", // DeepSeek特有的markdown容器（旧版本）
      ".ds-markdown", // 新版/通用的 DeepSeek markdown 容器
      ".message-content[data-role='assistant']", // 助手角色的消息内容
      "[data-role='assistant'] .markdown", // 助手角色的markdown内容
      ".assistant-message .content" // 助手消息的内容区域
    ],
    features: {
      textIndicators: ["我是", "我可以", "根据", "基于"], // 中文AI回复的常见开头词
      roleAttributes: ["data-role=assistant"], // 助手角色的HTML属性
      containerClasses: ["ds-markdown", "message-content"] // DeepSeek特有的CSS类名
    }
  },

  // 豆包网站配置
  "www.doubao.com": {
    name: "豆包",
    selectors: [
      ".dialogue-text.assistant", // 豆包特有的助手对话文本
      ".message.assistant .content", // 助手消息的内容
      "[data-role='assistant']", // 助手角色的消息
      ".ai-response" // AI回复的通用选择器
    ],
    features: {
      textIndicators: ["我是", "我可以", "根据", "建议"], // 中文AI回复的常见开头词
      roleAttributes: ["data-role=assistant"], // 助手角色的HTML属性
      containerClasses: ["dialogue-text", "assistant"] // 豆包特有的CSS类名
    }
  },

  // Kimi 网站配置
  "www.kimi.com": {
    name: "Kimi",
    selectors: [
      // 精确选择器 - 最优先使用
      "[data-role='assistant'] .segment-content-box", // 助手角色的内容框
      "[data-author='assistant'] .segment-content-box", // 助手作者的内容框
      ".ai-response .segment-content-box", // AI回复的内容框
      ".assistant-message .segment-content-box", // 助手消息的内容框

      // 下面这些宽泛的选择器放最后 - 作为备选方案
      ".segment-content-box", // 所有内容框
      ".markdown-container", // markdown容器
      ".markdown", // markdown内容
      "div[class*=\"assistant\"]", // 包含"assistant"的div
      "div[class*=\"ai\"]", // 包含"ai"的div
      ".response-bubble", // 回复气泡
      "[data-role='assistant']", // 助手角色
      ".ai-message .content", // AI消息内容
      ".message-content.assistant", // 助手消息内容
      ".chat-message.assistant", // 助手聊天消息
      ".kimi-response", // Kimi回复
      ".assistant-bubble" // 助手气泡
    ],
    // 指定按钮容器 - 按钮将注入到这个容器中
    buttonContainer: ".segment-assistant-actions-content",
    features: {
      textIndicators: ["我是", "我可以", "根据", "建议", "Kimi", "收到", "您可以", "建议您", "以下是", "具体来说", "需要注意"], // Kimi特有的中文回复开头词
      roleAttributes: ["data-role=assistant", "data-author=assistant"], // Kimi使用的两种角色属性
      containerClasses: ["segment-content-box", "markdown-container", "markdown", "assistant", "ai"] // Kimi的CSS类名
    }
  }
}; 
