const kimi = {
  "www.kimi.com": {
    name: "Kimi",
    selectors: [
      ".markdown",
      ".segment-content-box .markdown",
      ".markdown-container",
      ".segment-content-box",
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
    // 添加按钮容器选择器，用于Kimi的特殊注入逻辑
    buttonContainer: ".segment-assistant-actions-content",
    features: {
      textIndicators: ["我是", "我可以", "根据", "建议", "Kimi", "收到", "请问", "强平", "期货", "交易所"],
      roleAttributes: ["data-role=assistant", "data-author=assistant"],
      containerClasses: ["markdown", "markdown-container", "segment-content-box", "assistant", "ai"]
    }
  }
};

export default kimi; 