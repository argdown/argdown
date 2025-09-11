/**
 * Yarn configuration file to enforce dependency constraints.
 *
 * This configuration allows you to define constraints for dependencies in the workspace.
 * For example, you can enforce specific versions of dependencies or apply other rules
 * to ensure consistency across the monorepo.
 *
 * To add further constraints, modify the `constraints` function below. Use the `Yarn` API
 * to retrieve and manipulate dependencies. For example, you can use `Yarn.dependencies`
 * to target specific packages and apply updates or other rules.
 *
 * @type {import('@yarnpkg/types')} - Provides type definitions for Yarn configuration.
 */
const { defineConfig } = require('@yarnpkg/types');


module.exports = defineConfig({
  /**
   * Defines constraints for dependencies in the workspace.
   *
   * @param {Object} Yarn - The Yarn API object.
   * @param {Function} Yarn.dependencies - Retrieves dependencies matching the specified criteria.
   *
   * This function iterates over all dependencies with the identifier `@aduh95/viz.js`
   * and updates their version to `3.4.0`.
   *
   * To add further constraints:
   * - Use `Yarn.dependencies({ ident: '<package-name>' })` to target specific packages.
   * - Apply actions like `dep.update('<version>')` to enforce version constraints.
   * - Add additional `for` loops or logic to handle multiple packages.
   */
  async constraints({ Yarn }) {
    // Enforce version 3.4.0 for all instances of @aduh95/viz.js
    for (const dep of Yarn.dependencies({ ident: '@aduh95/viz.js' })) {
      dep.update(`3.4.0`);
    }

    // Enforce consistent versions for webpack and related plugins
    const webpackConstraints = [
      { ident: 'webpack', version: '5.99.9' },
      { ident: 'webpack-cli', version: '^6.0.1' },
      { ident: 'webpack-bundle-analyzer', version: '^4.10.1' }
    ];

    for (const { ident, version } of webpackConstraints) {
      for (const dep of Yarn.dependencies({ ident })) {
        dep.update(version);
      }
    }

    // Enforce consistent versions for lodash utilities
    const lodashConstraints = [
      { ident: 'lodash.clonedeep', version: '^4.5.0' },
      { ident: 'lodash.defaultsdeep', version: '^4.6.1' },
      { ident: 'lodash.last', version: '^3.0.0' },
      { ident: 'lodash.merge', version: '^4.6.2' },
      { ident: 'lodash.partialright', version: '^4.2.1' },
      { ident: 'lodash.union', version: '^4.6.0' },
      { ident: 'lodash.includes', version: '^4.3.0' },
      { ident: 'lodash.isempty', version: '^4.4.0' },
      { ident: 'lodash.isfunction', version: '^3.0.9' },
      { ident: 'lodash.isobject', version: '^3.0.2' },
      { ident: 'lodash.isstring', version: '^4.0.1' }
    ];

    for (const { ident, version } of lodashConstraints) {
      for (const dep of Yarn.dependencies({ ident })) {
        dep.update(version);
      }
    }

    // Enforce consistent version for typescript
    for (const dep of Yarn.dependencies({ ident: 'typescript' })) {
      dep.update('5.8.3');
    }    

    // Enforce consistent versions for @types packages
    const typesConstraints = [
      { ident: '@types/chai', version: '^5.2.2' },
      { ident: '@types/chai-fs', version: '^2.0.5' },
      { ident: '@types/d3', version: '7.4.3' },
      { ident: '@types/dagre-d3', version: '0.6.6' },
      { ident: '@types/js-yaml', version: '^4.0.0' },
      { ident: '@types/lodash', version: '^4.14.172' },
      { ident: '@types/lodash.clonedeep', version: '^4.5.9' },
      { ident: '@types/lodash.defaultsdeep', version: '^4.6.9' },
      { ident: '@types/lodash.includes', version: '^4.3.9' },
      { ident: '@types/lodash.isempty', version: '^4.4.9' },
      { ident: '@types/lodash.isfunction', version: '^3.0.9' },
      { ident: '@types/lodash.isobject', version: '^3.0.9' },
      { ident: '@types/lodash.isstring', version: '^4.0.9' },
      { ident: '@types/lodash.last', version: '^3.0.6' },
      { ident: '@types/lodash.merge', version: '^4.6.6' },
      { ident: '@types/lodash.partialright', version: '^4.2.6' },
      { ident: '@types/lodash.union', version: '^4.6.6' },
      { ident: '@types/markdown-it', version: '^14.1.2' },
      { ident: '@types/mdast', version: '^4.0.4' },
      { ident: '@types/mocha', version: '^10.0.10' },
      { ident: '@types/marked', version: '^6.0.0' },
      { ident: '@types/node', version: '^22.15.24' },
      { ident: '@types/pdfkit', version: '^0.13.9' },
      { ident: '@types/unist', version: '^3.0.3' },
      { ident: '@types/vscode', version: '^1.99.1' },
      { ident: '@types/webpack', version: '^5.28.5' },
      { ident: '@types/yargs', version: '^17.0.33' }
    ];

    for (const { ident, version } of typesConstraints) {
      for (const dep of Yarn.dependencies({ ident })) {
        dep.update(version);
      }
    }

    // Enforce consistent version for pdfkit
    for (const dep of Yarn.dependencies({ ident: 'pdfkit' })) {
      dep.update('^0.16.0');
    }

    // Enforce consistent version for punycode (userland alternative to deprecated Node.js module)
    for (const dep of Yarn.dependencies({ ident: 'punycode' })) {
      dep.update('^2.3.1');
    }

    // Enforce consistent version for css-loader
    for (const dep of Yarn.dependencies({ ident: 'css-loader' })) {
      dep.update('^7.1.2');
    }

    // Enforce consistent versions for common dependencies across packages
    const commonDependencyConstraints = [
      { ident: 'chai', version: '^4.3.10' },
      { ident: 'chalk', version: '^2.4.2' }, // Compatible with vuepress-plugin-sitemap
      { ident: 'commander', version: '^2.20.3' }, // Compatible with vuepress-plugin-sitemap
      { ident: '@parcel/core', version: '^2.14.4' },
      { ident: '@babel/core', version: '^7.24.1' }
    ];

    for (const { ident, version } of commonDependencyConstraints) {
      for (const dep of Yarn.dependencies({ ident })) {
        dep.update(version);
      }
    }

    // Enforce consistent Node.js engine requirement across all packages
    for (const workspace of Yarn.workspaces()) {
      if (workspace.manifest.name !== '@argdown/monorepo') {
        workspace.set('engines.node', '>= 22.14.0');
      }
    }
  },
});