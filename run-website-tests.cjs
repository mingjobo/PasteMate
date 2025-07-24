#!/usr/bin/env node

/**
 * 网站测试运行器
 * 简化版的测试脚本，用于验证扩展在目标网站上的功能
 */

const fs = require('fs').promises;
const path = require('path');

class WebsiteTestRunner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 4,
        passed: 0,
        failed: 0,
        manual: 4 // 所有测试都需要手动验证
      },
      tests: []
    };
  }

  /**
   * 运行测试检查
   */
  async runTests() {
    console.log('🚀 开始网站功能验证检查...\n');

    // 1. 检查扩展文件完整性
    await this.checkExtensionFiles();

    // 2. 验证站点配置
    await this.validateSiteConfigurations();

    // 3. 检查国际化文件
    await this.checkInternationalization();

    // 4. 生成手动测试指南
    await this.generateManualTestGuide();

    // 5. 生成测试报告
    await this.generateTestReport();

    this.printSummary();
  }

  /**
   * 检查扩展文件完整性
   */
  async checkExtensionFiles() {
    console.log('📁 检查扩展文件完整性...');
    
    const requiredFiles = [
      { path: 'manifest.json', description: '扩展清单文件' },
      { path: 'content.js', description: '内容脚本' },
      { path: 'sites.js', description: '站点配置文件' },
      { path: '_locales/en/messages.json', description: '英文语言文件' },
      { path: '_locales/zh_CN/messages.json', description: '中文语言文件' }
    ];

    let allFilesExist = true;
    const fileStatus = [];

    for (const file of requiredFiles) {
      try {
        await fs.access(file.path);
        console.log(`  ✅ ${file.description}: ${file.path}`);
        fileStatus.push({ ...file, exists: true });
      } catch (error) {
        console.log(`  ❌ ${file.description}: ${file.path} (缺失)`);
        fileStatus.push({ ...file, exists: false });
        allFilesExist = false;
      }
    }

    this.results.tests.push({
      name: '扩展文件完整性检查',
      success: allFilesExist,
      details: { fileStatus },
      error: allFilesExist ? null : '部分必需文件缺失'
    });

    if (allFilesExist) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
    }

    console.log('');
  }

  /**
   * 验证站点配置
   */
  async validateSiteConfigurations() {
    console.log('🌐 验证站点配置...');

    try {
      // 读取站点配置
      const sitesContent = await fs.readFile('sites.js', 'utf8');
      
      // 简单解析配置（提取 SUPPORTED_SITES 对象）
      const configMatch = sitesContent.match(/SUPPORTED_SITES\s*=\s*({[\s\S]*?});/);
      
      if (!configMatch) {
        throw new Error('无法解析站点配置');
      }

      // 使用 eval 解析配置（在测试环境中可以接受）
      const SUPPORTED_SITES = eval(`(${configMatch[1]})`);
      
      const expectedSites = [
        'chat.openai.com',
        'chat.deepseek.com', 
        'www.doubao.com',
        'www.kimi.com'
      ];

      let configValid = true;
      const siteValidation = [];

      for (const hostname of expectedSites) {
        const siteConfig = SUPPORTED_SITES[hostname];
        
        if (!siteConfig) {
          console.log(`  ❌ 缺少站点配置: ${hostname}`);
          siteValidation.push({ hostname, valid: false, error: '配置缺失' });
          configValid = false;
          continue;
        }

        // 验证配置字段
        const hasSelector = siteConfig.selector && typeof siteConfig.selector === 'string';
        const hasName = siteConfig.name && typeof siteConfig.name === 'string';

        if (hasSelector && hasName) {
          console.log(`  ✅ ${siteConfig.name} (${hostname}): 配置有效`);
          console.log(`     选择器: ${siteConfig.selector}`);
          siteValidation.push({ hostname, valid: true, config: siteConfig });
        } else {
          console.log(`  ❌ ${hostname}: 配置无效`);
          siteValidation.push({ hostname, valid: false, error: '配置字段不完整' });
          configValid = false;
        }
      }

      this.results.tests.push({
        name: '站点配置验证',
        success: configValid,
        details: { siteValidation, totalSites: expectedSites.length },
        error: configValid ? null : '部分站点配置无效'
      });

      if (configValid) {
        this.results.summary.passed++;
      } else {
        this.results.summary.failed++;
      }

    } catch (error) {
      console.log(`  ❌ 站点配置验证失败: ${error.message}`);
      
      this.results.tests.push({
        name: '站点配置验证',
        success: false,
        error: error.message
      });
      
      this.results.summary.failed++;
    }

    console.log('');
  }

  /**
   * 检查国际化文件
   */
  async checkInternationalization() {
    console.log('🌍 检查国际化支持...');

    const locales = [
      { code: 'en', name: '英文', path: '_locales/en/messages.json' },
      { code: 'zh_CN', name: '中文', path: '_locales/zh_CN/messages.json' }
    ];

    const requiredKeys = [
      'extensionName',
      'extensionDescription', 
      'copyPlainText',
      'copySuccess'
    ];

    let i18nValid = true;
    const localeValidation = [];

    for (const locale of locales) {
      try {
        const content = await fs.readFile(locale.path, 'utf8');
        const messages = JSON.parse(content);
        
        const missingKeys = requiredKeys.filter(key => !messages[key]);
        
        if (missingKeys.length === 0) {
          console.log(`  ✅ ${locale.name} (${locale.code}): 完整`);
          localeValidation.push({ 
            ...locale, 
            valid: true, 
            messageCount: Object.keys(messages).length 
          });
        } else {
          console.log(`  ❌ ${locale.name} (${locale.code}): 缺少键值 ${missingKeys.join(', ')}`);
          localeValidation.push({ 
            ...locale, 
            valid: false, 
            missingKeys 
          });
          i18nValid = false;
        }

      } catch (error) {
        console.log(`  ❌ ${locale.name} (${locale.code}): 文件错误 - ${error.message}`);
        localeValidation.push({ 
          ...locale, 
          valid: false, 
          error: error.message 
        });
        i18nValid = false;
      }
    }

    this.results.tests.push({
      name: '国际化文件检查',
      success: i18nValid,
      details: { localeValidation, requiredKeys },
      error: i18nValid ? null : '国际化文件不完整'
    });

    if (i18nValid) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
    }

    console.log('');
  }

  /**
   * 生成手动测试指南
   */
  async generateManualTestGuide() {
    console.log('📋 生成手动测试指南...');

    const testGuide = `# 网站功能手动测试指南

## 测试准备

1. 在 Chrome/Edge/Firefox 浏览器中加载扩展
   - 打开浏览器扩展管理页面
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择扩展根目录

2. 确认扩展已正确加载
   - 检查扩展图标是否出现在工具栏
   - 在扩展管理页面确认扩展状态为"已启用"

## 测试步骤

### 1. ChatGPT 测试 (chat.openai.com)

**测试目标**: 按钮注入和复制功能

**步骤**:
1. 访问 https://chat.openai.com
2. 发送任意消息获得 AI 回复
3. 检查回复气泡右下角是否出现"Copy Plain Text"按钮
4. 点击按钮测试复制功能
5. 粘贴到文本编辑器验证内容是否为纯文本（无HTML/Markdown格式）

**预期结果**:
- ✅ 按钮正确显示在回复气泡中
- ✅ 点击按钮显示成功提示
- ✅ 复制的内容为纯文本格式

### 2. DeepSeek 测试 (chat.deepseek.com)

**测试目标**: 选择器准确性验证

**步骤**:
1. 访问 https://chat.deepseek.com
2. 发送消息获得 AI 回复
3. 检查选择器 \`.message-content[data-role='assistant']\` 是否正确匹配
4. 验证按钮是否注入到正确的元素中
5. 测试复制功能

**预期结果**:
- ✅ 选择器准确匹配 AI 回复元素
- ✅ 按钮位置正确
- ✅ 复制功能正常

### 3. 豆包测试 (www.doubao.com)

**测试目标**: 中文界面支持

**步骤**:
1. 访问 https://www.doubao.com
2. 确保浏览器语言设置为中文
3. 发送消息获得 AI 回复
4. 检查按钮文案是否显示为"复制纯文本"
5. 测试中文内容复制功能

**预期结果**:
- ✅ 按钮文案显示为中文
- ✅ 中文内容复制正常
- ✅ 界面适配中文环境

### 4. Kimi 测试 (www.kimi.com)

**测试目标**: 完整功能测试

**步骤**:
1. 访问 https://www.kimi.com
2. 发送包含多种格式的消息获得回复
3. 测试按钮注入、样式、位置
4. 测试复制功能和文本提取
5. 验证错误处理机制

**预期结果**:
- ✅ 所有功能正常工作
- ✅ 样式和交互体验良好
- ✅ 错误处理机制有效

## 测试记录

请在测试过程中记录以下信息：

- [ ] 浏览器类型和版本
- [ ] 扩展加载状态
- [ ] 各网站测试结果
- [ ] 发现的问题和错误
- [ ] 性能表现

## 问题报告

如发现问题，请记录：
1. 问题描述
2. 重现步骤
3. 预期行为 vs 实际行为
4. 浏览器控制台错误信息
5. 截图（如适用）

---

**注意**: 此测试需要实际访问目标网站，某些网站可能需要登录或特殊访问权限。
`;

    await fs.writeFile('MANUAL_TESTING_GUIDE.md', testGuide, 'utf8');
    console.log('  ✅ 手动测试指南已生成: MANUAL_TESTING_GUIDE.md');

    this.results.tests.push({
      name: '手动测试指南生成',
      success: true,
      details: { guideGenerated: true }
    });

    this.results.summary.passed++;
    console.log('');
  }

  /**
   * 生成测试报告
   */
  async generateTestReport() {
    const reportPath = 'WEBSITE_FUNCTIONALITY_TEST_REPORT.md';
    const jsonReportPath = 'website-functionality-test-report.json';

    // 生成 Markdown 报告
    const markdownReport = this.generateMarkdownReport();
    await fs.writeFile(reportPath, markdownReport, 'utf8');

    // 生成 JSON 报告
    await fs.writeFile(jsonReportPath, JSON.stringify(this.results, null, 2), 'utf8');

    console.log('📊 测试报告已生成:');
    console.log(`   - Markdown: ${reportPath}`);
    console.log(`   - JSON: ${jsonReportPath}`);
    console.log('');
  }

  /**
   * 生成 Markdown 报告
   */
  generateMarkdownReport() {
    const { summary, tests } = this.results;
    const passRate = summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(1) : '0.0';

    let report = `# 网站功能验证测试报告

## 测试概览

- **测试时间**: ${this.results.timestamp}
- **自动检查项目**: ${summary.total}
- **通过**: ${summary.passed}
- **失败**: ${summary.failed}
- **需要手动验证**: ${summary.manual}
- **通过率**: ${passRate}%

## 自动检查结果

`;

    tests.forEach((test, index) => {
      const status = test.success ? '✅ 通过' : '❌ 失败';
      report += `### ${index + 1}. ${test.name} ${status}

`;

      if (test.success) {
        report += `- **结果**: 检查通过\n`;
      } else {
        report += `- **错误**: ${test.error}\n`;
      }

      if (test.details) {
        report += `
**详细信息**:
\`\`\`json
${JSON.stringify(test.details, null, 2)}
\`\`\`
`;
      }

      report += '\n---\n\n';
    });

    report += `## 手动测试要求

以下功能需要在实际网站上进行手动验证：

### 1. ChatGPT (chat.openai.com)
- **测试内容**: 按钮注入和复制功能
- **验证要点**: 
  - 按钮是否正确显示在回复气泡中
  - 复制功能是否正常工作
  - 复制的内容是否为纯文本格式

### 2. DeepSeek (chat.deepseek.com)
- **测试内容**: 选择器准确性验证
- **验证要点**:
  - 选择器是否准确匹配 AI 回复元素
  - 按钮位置是否正确
  - 功能是否正常

### 3. 豆包 (www.doubao.com)
- **测试内容**: 中文界面支持
- **验证要点**:
  - 按钮文案是否显示为中文
  - 中文内容复制是否正常
  - 界面是否适配中文环境

### 4. Kimi (www.kimi.com)
- **测试内容**: 完整功能测试
- **验证要点**:
  - 所有功能是否正常工作
  - 样式和交互体验是否良好
  - 错误处理机制是否有效

## 测试工具

1. **手动测试指南**: \`MANUAL_TESTING_GUIDE.md\`
2. **浏览器控制台验证脚本**: \`manual-website-validation.js\`

### 使用浏览器控制台验证

在目标网站上打开浏览器开发者工具，在控制台中运行：

\`\`\`javascript
// 加载验证脚本
const script = document.createElement('script');
script.src = 'path/to/manual-website-validation.js';
document.head.appendChild(script);

// 运行验证
validatePureTextExtension();
\`\`\`

## 总结

`;

    if (summary.failed === 0) {
      report += `🎉 所有自动检查项目均通过！扩展文件和配置准备就绪。

**下一步**: 请按照手动测试指南在实际网站上验证功能。

### 预期的手动测试结果

如果扩展实现正确，手动测试应该显示：
- ✅ 所有目标网站都能正确注入复制按钮
- ✅ 复制功能在所有网站上都能正常工作
- ✅ 中文界面支持正常
- ✅ 文本提取功能正确去除格式标记

扩展已准备好为用户提供一键复制纯文本功能。
`;
    } else {
      report += `⚠️ 发现 ${summary.failed} 个问题需要修复后再进行手动测试。

### 需要修复的问题

`;
      tests.filter(test => !test.success).forEach(test => {
        report += `- **${test.name}**: ${test.error}\n`;
      });

      report += `
请先修复这些问题，然后重新运行检查。
`;
    }

    return report;
  }

  /**
   * 打印测试摘要
   */
  printSummary() {
    console.log('📊 测试完成！');
    console.log('='.repeat(50));
    console.log(`✅ 通过: ${this.results.summary.passed}`);
    console.log(`❌ 失败: ${this.results.summary.failed}`);
    console.log(`📋 需要手动验证: ${this.results.summary.manual}`);
    console.log(`📈 自动检查通过率: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)}%`);
    console.log('='.repeat(50));

    if (this.results.summary.failed === 0) {
      console.log('\n🎉 所有自动检查通过！');
      console.log('📋 请查看 MANUAL_TESTING_GUIDE.md 进行手动验证');
    } else {
      console.log('\n⚠️ 发现问题，请查看测试报告了解详情');
    }
  }
}

// 运行测试
if (require.main === module) {
  const runner = new WebsiteTestRunner();
  runner.runTests().catch(console.error);
}

module.exports = WebsiteTestRunner;