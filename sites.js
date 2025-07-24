// 内置站点配置 - 支持多层级选择器和智能匹配
const SUPPORTED_SITES = {
  "chat.openai.com": {
    name: "ChatGPT",
    selectors: [
      "[data-message-author-role='assistant'] .markdown",
      "[data-message-author-role='assistant']",
      ".group.w-full.text-token-text-primary",
      ".markdown.prose"
    ],
    features: {
      textIndicators: ["I'm", "I can", "Here's", "Based on"],
      roleAttributes: ["data-message-author-role=assistant"],
      containerClasses: ["markdown", "prose"]
    }
  },
  "chat.deepseek.com": {
    name: "DeepSeek",
    selectors: [
      ".ds-markdown.ds-markdown--block",
      ".message-content[data-role='assistant']",
      "[data-role='assistant'] .markdown",
      ".assistant-message .content"
    ],
    features: {
      textIndicators: ["我是", "我可以", "根据", "基于"],
      roleAttributes: ["data-role=assistant"],
      containerClasses: ["ds-markdown", "message-content"]
    }
  },
  "www.doubao.com": {
    name: "豆包",
    selectors: [
      ".dialogue-text.assistant",
      ".message.assistant .content",
      "[data-role='assistant']",
      ".ai-response"
    ],
    features: {
      textIndicators: ["我是", "我可以", "根据", "建议"],
      roleAttributes: ["data-role=assistant"],
      containerClasses: ["dialogue-text", "assistant"]
    }
  },
  "www.kimi.com": {
    name: "Kimi",
    selectors: [
      // 优先使用更精确的AI回复选择器
      "[data-role='assistant'] .segment-content-box",
      "[data-author='assistant'] .segment-content-box",
      ".ai-response .segment-content-box",
      ".assistant-message .segment-content-box",
      // 备用选择器（会通过isAIResponse函数进一步过滤）
      ".segment-content-box",
      ".markdown-container",
      ".markdown",
      "div[class*=\"assistant\"]",
      "div[class*=\"ai\"]",
      ".response-bubble",
      "[data-role='assistant']",
      ".ai-message .content",
      ".message-content.assistant",
      ".chat-message.assistant",
      ".kimi-response",
      ".assistant-bubble"
    ],
    features: {
      textIndicators: ["我是", "我可以", "根据", "建议", "Kimi", "收到", "您可以", "建议您", "以下是", "具体来说", "需要注意"],
      roleAttributes: ["data-role=assistant", "data-author=assistant"],
      containerClasses: ["segment-content-box", "markdown-container", "markdown", "assistant", "ai"]
    }
  }
}; 