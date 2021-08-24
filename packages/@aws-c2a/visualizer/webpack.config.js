const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const {DefinePlugin} = require('webpack');

const outputDirectory = 'dist';

module.exports = {
  entry: './src/index',
  output: {
    path: path.join(__dirname, outputDirectory),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: ["/**/node_modules/"],
        use: {
          loader: 'babel-loader'
        }
      },
      { test: /\.css$/, use: ["style-loader", "css-loader",] },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json'],
    fallback: { crypto: false },
  },
  devServer: {
    port: 3000,
    open: true,
    proxy: {
      '/api': 'http://localhost:8080'
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: './public/index.html',
      filename: './index.html',
      inlineSource: '.(js|css)$' // embed all javascript and css inline
    }),
    // Inlines chunks with `runtime` in the name
    new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/bundle/]),
    new DefinePlugin({
      IS_PRODUCTION: process.env.NODE_ENV === 'production',
    })
  ]
};
