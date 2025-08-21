/**
 * 日志管理器 - 统一控制日志输出
 * 支持环境变量和运行时开关控制调试日志
 */
class Logger {
  constructor() {
    // 从环境变量或localStorage读取调试模式状态
    this.debugMode = this.initDebugMode();
    
    // 日志级别
    this.levels = {
      ERROR: 'error',
      WARN: 'warn',
      INFO: 'info',
      DEBUG: 'debug'
    };
    
    // 监听来自扩展的消息
    this.setupMessageListener();
  }
  
  /**
   * 初始化调试模式
   */
  initDebugMode() {
    // 优先检查localStorage（用户端开关）
    const userDebugMode = localStorage.getItem('puretext_debug_mode');
    if (userDebugMode !== null) {
      return userDebugMode === 'true';
    }
    
    // 检查环境变量（开发环境）
    // 在浏览器扩展中，我们使用构建时注入的变量
    if (typeof PURETEXT_DEBUG !== 'undefined') {
      return PURETEXT_DEBUG === 'true';
    }
    
    // 默认关闭调试模式
    return false;
  }
  
  /**
   * 设置消息监听器，用于接收调试开关命令
   */
  setupMessageListener() {
    // 监听来自扩展的消息
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
        if (request.action === 'toggleDebugMode') {
          this.toggleDebugMode();
          sendResponse({ debugMode: this.debugMode });
        } else if (request.action === 'getDebugMode') {
          sendResponse({ debugMode: this.debugMode });
        }
      });
    }
    
    // 同时监听键盘快捷键（Ctrl+Shift+D 或 Command+Shift+D）
    document.addEventListener('keydown', (e) => {
      const isMac = navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
      
      if (ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        console.log('[PureText] 键盘快捷键触发调试模式切换');
        this.toggleDebugMode();
        console.log(`[PureText] 键盘事件处理完成，当前调试模式: ${this.debugMode}`);
      }
    });
  }
  
  /**
   * 切换调试模式
   */
  toggleDebugMode() {
    const oldMode = this.debugMode;
    this.debugMode = !this.debugMode;
    localStorage.setItem('puretext_debug_mode', String(this.debugMode));
    
    console.log(`[PureText] toggleDebugMode 调用: ${oldMode} → ${this.debugMode}`);
    
    // 显示通知
    if (this.debugMode) {
      console.log('%c[PureText] 调试模式已开启', 'color: #4CAF50; font-weight: bold');
      const shortcut = navigator.userAgent.toUpperCase().indexOf('MAC') >= 0 ? 'Command+Shift+D' : 'Ctrl+Shift+D';
      console.log(`提示：再次按 ${shortcut} 可关闭调试模式`);
    } else {
      console.log('%c[PureText] 调试模式已关闭', 'color: #FF9800; font-weight: bold');
    }
  }
  
  /**
   * 启用调试模式
   */
  enableDebugMode() {
    this.debugMode = true;
    localStorage.setItem('puretext_debug_mode', 'true');
  }
  
  /**
   * 禁用调试模式
   */
  disableDebugMode() {
    this.debugMode = false;
    localStorage.setItem('puretext_debug_mode', 'false');
  }
  
  /**
   * 错误日志（始终显示）
   */
  error(message, ...args) {
    console.error(`[PureText Error] ${message}`, ...args);
  }
  
  /**
   * 警告日志（始终显示）
   */
  warn(message, ...args) {
    console.warn(`[PureText Warning] ${message}`, ...args);
  }
  
  /**
   * 信息日志（关键信息，始终显示）
   */
  info(message, ...args) {
    console.log(`[PureText] ${message}`, ...args);
  }
  
  /**
   * 调试日志（仅在调试模式下显示）
   */
  debug(message, ...args) {
    if (this.debugMode) {
      console.debug(`[PureText Debug] ${message}`, ...args);
    }
  }
  
  /**
   * 分组日志（仅在调试模式下显示）
   */
  group(label) {
    if (this.debugMode) {
      console.group(`[PureText] ${label}`);
    }
  }
  
  /**
   * 结束分组
   */
  groupEnd() {
    if (this.debugMode) {
      console.groupEnd();
    }
  }
  
  /**
   * 计时开始（仅在调试模式下显示）
   */
  time(label) {
    if (this.debugMode) {
      console.time(`[PureText] ${label}`);
    }
  }
  
  /**
   * 计时结束（仅在调试模式下显示）
   */
  timeEnd(label) {
    if (this.debugMode) {
      console.timeEnd(`[PureText] ${label}`);
    }
  }
  
  /**
   * 表格日志（仅在调试模式下显示）
   */
  table(data) {
    if (this.debugMode) {
      console.log('[PureText] Table Data:');
      console.table(data);
    }
  }
  
  /**
   * 获取当前调试模式状态
   */
  isDebugMode() {
    return this.debugMode;
  }
}

// 创建全局日志实例
const logger = new Logger();

// 导出
export default logger;