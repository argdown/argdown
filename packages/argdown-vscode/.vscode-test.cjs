// .vscode-test.js
const { defineConfig } = require('@vscode/test-cli');

module.exports = defineConfig({ 
  files: 'dist/test/**/*.test.js',
  extensionDevelopmentPath: '.',
  timeout: 30000
});
