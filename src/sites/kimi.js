const kimi = {
  "www.kimi.com": {
    name: "Kimi",
    selectors: [
      // 优先选择正式回复内容容器，避免思考内容
      ".segment-content-box > .markdown-container:last-child .markdown",
      ".segment-content-box .markdown-container:not(.toolcall-content-text) .markdown",
      ".segment-content-box .markdown-container:not(:has(.toolcall-container)) .markdown",
      ".segment-content .markdown:not(.thinking)",
      ".response-content .markdown",
      ".final-answer .markdown",

      // 标准选择器（作为后备，但排除思考内容）
      ".segment-content-box .markdown:not(.toolcall-content-text)",
      ".markdown-container:not(.toolcall-content-text) .markdown",
      ".markdown:not(.toolcall-content-text)",
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
    // 新增：思考内容排除选择器
    excludeSelectors: [
      ".thinking-container",
      ".thought-process",
      ".reasoning-box",
      ".thinking-box",
      ".ai-thinking",
      ".thought-bubble",
      ".internal-thought",
      ".cognitive-process",
      "[data-thinking='true']",
      "[data-thought='true']",
      "[data-reasoning='true']",
      "[data-internal='true']",
      "[data-process='true']",
      ".thinking",
      ".thought-process",
      ".analysis-box",
      ".think-stage",
      ".toolcall-container",
      ".toolcall-content",
      ".toolcall-content-text"
    ],
    // 添加按钮容器选择器，用于Kimi的特殊注入逻辑
    buttonContainer: ".segment-assistant-actions-content",
    features: {
      textIndicators: ["我是", "我可以", "根据", "建议", "Kimi", "收到", "请问", "强平", "期货", "交易所"],
      roleAttributes: ["data-role=assistant", "data-author=assistant"],
      containerClasses: ["markdown", "markdown-container", "segment-content-box", "assistant", "ai"],
      // 新增：思考内容检测特征
      thinkingClasses: ["thinking", "thought-process", "reasoning", "analysis", "ai-thinking"],
      thinkingKeywords: ["思考", "分析", "推断", "考虑", "认为", "判断", "思路", "逻辑", "推理"]
    }
  }
};

export default kimi; 