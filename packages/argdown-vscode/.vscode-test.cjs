// .vscode-test.js
const { defineConfig } = require('@vscode/test-cli');

module.exports = defineConfig({ 
  files: 'test/**/*.test.js',
  extensionDevelopmentPath: '.',
  workspaceFolder: 'test/fixtures/workspace_a',
  mocha: {
    ui: 'tdd',
    timeout: 30000,
    color: true
  }
});
