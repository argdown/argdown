## 2.0.0

### Major Changes

- PR: https://github.com/argdown/argdown/pull/517
- update so version 2.0
- remove webpack from language server
- remove command capability from language server (vs code extension already has this capability)
- move from mocha to vitest in for language server tests
- update vs code package.json
- move from webpack to esbuild (see build headline)
- moved common browser and node server entry points into a abstract class that gets extended by the representing platform entry file
