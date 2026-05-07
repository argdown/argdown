/**
 * This script patches the dist, to support import as text/javascript. This is done by moving the generated es module to argdown-map.module.js and generating a argdown-map.js entry point with import("argdown-map.module.js)
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pjson from './package.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');
const moduleName = 'argdown-map.module.js';
const entryPoint = 'argdown-map.js';

// Copy the argdown-map.js file in dest to argdown-map.module.js
if (!existsSync(path.join(distDir, moduleName))) {
	copyFileSync(path.join(distDir, entryPoint), path.join(distDir, moduleName));
}

const code = `import("https://cdn.jsdelivr.net/npm/@argdown/web-components@${pjson.version}/dist/argdown-map.module.js");`;
writeFileSync(path.join(distDir, entryPoint), code, 'utf8');
