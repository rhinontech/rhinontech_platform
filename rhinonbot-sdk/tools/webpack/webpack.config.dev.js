// tools/webpack/webpack.config.dev.js
const path = require('path');
const webpack = require('webpack');

// Load environment variables at build time (not bundled)
require('dotenv').config();

module.exports = {
  mode: 'development',
  entry: ['./src/main.tsx'],
  module: {
    rules: require('./webpack.rules'),
  },
  output: {
    path: path.resolve(__dirname, '../../dist'),
    filename: 'rhinonbot.js',
    library: {
      name: 'RhinonBot',
      type: 'umd',
    },
    globalObject: 'this',
    clean: true,
  },
  plugins: [
    ...require('./webpack.plugins'),
    // Define environment variables at build time
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.REACT_APP_NEW_SERVER_API_URL': JSON.stringify(
        process.env.REACT_APP_NEW_SERVER_API_URL ||
        'https://api.rhinontech.com/api',
      ),
      'process.env.REACT_APP_SOCKET_URL': JSON.stringify(
        process.env.REACT_APP_SOCKET_URL || 'https://api.rhinontech.com/api',
      ),
      'process.env.REACT_APP_API_KEY': JSON.stringify(
        process.env.REACT_APP_API_KEY || 'dev_key',
      ),
      'process.env.REACT_APP_VERSION': JSON.stringify(
        process.env.npm_package_version || '1.0.0',
      ),
      'process.env.REACT_APP_API_URL_AI': JSON.stringify(
        process.env.REACT_APP_API_URL_AI || 'https://ai.rhinontech.com',
      ),
      // Add any other env vars you need here
    }),
  ],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    alias: {
      ...require('./webpack.aliases'),
    },
    // Add fallbacks for Node.js modules
    fallback: {
      path: false,
      os: false,
      crypto: false,
      fs: false,
      util: false,
      stream: false,
      buffer: false,
    },
  },
  stats: 'errors-warnings',
  devtool: 'cheap-module-source-map',
  devServer: {
    static: [
      { directory: path.join(__dirname, '../../dist') },
      { directory: path.join(__dirname, '../../public') },
    ],
    open: true,
    hot: true,
    compress: true,
    port: 8081,
  },
  optimization: {
    minimize: false,
    sideEffects: true,
    concatenateModules: true,
    runtimeChunk: false,
    splitChunks: false,
  },
  performance: {
    hints: false,
  },
};
