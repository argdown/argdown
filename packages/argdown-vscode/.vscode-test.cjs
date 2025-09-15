// .vscode-test.cjs
const { defineConfig } = require('@vscode/test-cli');

module.exports = defineConfig({
  files: 'dist/test/**/*.test.js',
  extensionDevelopmentPath: '.',
  // Remove specific workspace folder to avoid node_modules issues
  workspaceFolder: 'test/fixtures/workspace_a',
  version: 'stable', // 'stable' '1.95.3'
  skipExtensionDependencies: true,
  mocha: {
    ui: 'tdd',
    timeout: 10000, // Shorter timeout to fail fast
    color: true,
    reporter: 'spec'
  },
  env: {
    NODE_ENV: 'test'
  },
  // Add launch arguments to help with stability
  launchArgs: [
    '--disable-extensions', // Disable other extensions during testing
    // '--verbose', // Enable verbose logging
  ]
});
