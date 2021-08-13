const baseConfig = require('../../.eslintrc.build');
baseConfig.parserOptions.project = __dirname + '/tsconfig.json';
module.exports = baseConfig;