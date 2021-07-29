module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '<rootDir>/node_modules',
    '<rootDir>/out',
    '<rootDir>/dist',
    '.d.ts',
    '.js',
  ]
};