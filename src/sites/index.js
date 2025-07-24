import chatgpt from './chatgpt.js';
import deepseek from './deepseek.js';
import doubao from './doubao.js';
import kimi from './kimi.js';

export const SUPPORTED_SITES = {
  ...chatgpt,
  ...deepseek,
  ...doubao,
  ...kimi
}; 