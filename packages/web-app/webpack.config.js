const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");

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
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json'],
  },
  devServer: {
    port: 3000,
    open: true,
    proxy: {
      '/api': 'http://localhost:8080'
    }
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: './data.json', to: '.' },
      ],
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: './index.html'
    }),
  ]
};
