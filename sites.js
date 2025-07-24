// 内置站点配置
const SUPPORTED_SITES = {
  "chat.openai.com": {
    selector: "[data-message-author-role='assistant'] .markdown",
    name: "ChatGPT"
  },
  "chat.deepseek.com": {
    selector: ".message-content[data-role='assistant']",
    name: "DeepSeek"
  },
  "www.doubao.com": {
    selector: ".dialogue-text.assistant",
    name: "豆包"
  },
  "www.kimi.com": {
    selector: ".response-bubble",
    name: "Kimi"
  }
};

// 导出配置供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SUPPORTED_SITES };
}