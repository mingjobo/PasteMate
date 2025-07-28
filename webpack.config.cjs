const path = require('path');

module.exports = {
  mode: 'development',
  entry: './content.js',
  output: {
    filename: 'content.js',
    path: path.resolve(__dirname, 'dist'),
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
  },
  devtool: false, // 禁止 source map 里的 eval
  optimization: {
    minimize: false
  }
}; 