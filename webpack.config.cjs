const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: {
    content: './content.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    chunkFilename: '[name].chunk.js',
  },
  devtool: false, // 禁止 source map 里的 eval
  optimization: {
    minimize: false,
    splitChunks: {
      chunks: 'async',
      cacheGroups: {
        default: false,
        vendors: false,
      },
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      'PURETEXT_DEBUG': JSON.stringify(process.env.PURETEXT_DEBUG === 'true')
    })
  ],
  resolve: {
    fallback: {
      "fs": false,
      "path": false,
      "os": false,
      "crypto": false,
      "stream": false,
      "util": false,
      "buffer": false,
      "process": false
    }
  }
}; 