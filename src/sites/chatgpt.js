const chatgpt = {
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
  }
};

export default chatgpt; 