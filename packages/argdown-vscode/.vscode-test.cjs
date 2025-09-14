// .vscode-test.cjs
const { defineConfig } = require('@vscode/test-cli');

module.exports = defineConfig({
  files: 'dist/test/**/*.test.js',
  extensionDevelopmentPath: '.',
  workspaceFolder: 'test/fixtures/workspace_a',
  version: 'stable',
  mocha: {
    ui: 'tdd',
    timeout: 60000, // Increase timeout
    color: true,
    reporter: 'spec'
  },
  env: {
    NODE_ENV: 'test'
  },
  // Add launch arguments to help with stability
  launchArgs: [
    '--verbose',
  ]
});
