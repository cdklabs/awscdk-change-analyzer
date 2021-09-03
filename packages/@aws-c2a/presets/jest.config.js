const base = require('../../../jest.config');
module.exports = {
  ...base,
  rootDir: './',
  setupFilesAfterEnv: ['./jest.js'],
};