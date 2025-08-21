// 模块化系统的入口文件
// 导入所有模块并暴露为全局变量

import { HtmlFormatter } from './formatters/HtmlFormatter.js';
import { StructureConverter } from './StructureConverter.js';
import { ContentCleaner } from './ContentCleaner.js';
import { GenericHtmlFormatter } from './formatters/GenericHtmlFormatter.js';
import { KimiHtmlFormatter } from './formatters/KimiHtmlFormatter.js';
import { DeepSeekHtmlFormatter } from './formatters/DeepSeekHtmlFormatter.js';
import { HtmlFormatterManager } from './HtmlFormatterManager.js';
import { ClipboardManager } from './ClipboardManager.js';
import { CopyButton } from './CopyButton.js';
import logger from './Logger.js';

// 暴露为全局变量
window.HtmlFormatter = HtmlFormatter;
window.StructureConverter = StructureConverter;
window.ContentCleaner = ContentCleaner;
window.GenericHtmlFormatter = GenericHtmlFormatter;
window.KimiHtmlFormatter = KimiHtmlFormatter;
window.DeepSeekHtmlFormatter = DeepSeekHtmlFormatter;
window.HtmlFormatterManager = HtmlFormatterManager;
window.ClipboardManager = ClipboardManager;
window.CopyButton = CopyButton;

logger.info('📦 All modules imported and exposed globally');