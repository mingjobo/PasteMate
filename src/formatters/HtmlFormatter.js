/**
 * HTML格式化器基类
 * 定义所有格式化器必须实现的接口
 */
class HtmlFormatter {
  /**
   * 格式化DOM元素为标准HTML
   * @param {HTMLElement} element - 要格式化的DOM元素
   * @returns {Promise<string>} 格式化后的HTML字符串
   */
  async format(element) {
    throw new Error('format method must be implemented by subclass');
  }
  
  /**
   * 检查是否支持当前DOM结构
   * @param {HTMLElement} element - DOM元素
   * @returns {boolean} 是否支持
   */
  canHandle(element) {
    return true;
  }
  
  /**
   * 获取格式化器的优先级
   * 数值越高优先级越高
   * @returns {number} 优先级
   */
  getPriority() {
    return 0;
  }
  
  /**
   * 获取格式化器名称
   * @returns {string} 格式化器名称
   */
  getName() {
    return this.constructor.name;
  }
}

// 导出类
export { HtmlFormatter };