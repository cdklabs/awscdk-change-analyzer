const baseConfig = require('../../../.eslintrc.build');
baseConfig.extends.push('plugin:react/recommended');
baseConfig.parserOptions.project = __dirname + '/tsconfig.json';
baseConfig.plugins.push('react');
baseConfig.settings = { react: { version: 'detect' } };
module.exports = baseConfig;