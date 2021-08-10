const base = require('../../jest.config');
module.exports = {
  ...base,
  rootDir: './',
  moduleNameMapper: {
    "aws-sdk": "<rootDir>/test/utils/mocks/aws-sdk.ts"
  }
};