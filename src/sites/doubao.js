const doubao = {
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
  }
};

export default doubao; 