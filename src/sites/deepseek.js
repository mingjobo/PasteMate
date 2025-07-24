const deepseek = {
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
  }
};

export default deepseek; 