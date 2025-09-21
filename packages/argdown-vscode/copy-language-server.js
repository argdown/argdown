// copy-language-server.js (CommonJS)
const fs = require("fs");
const path = require("path");

const srcFile = path.resolve("../argdown-language-server/dist/node/server-node.js");
const destDir = path.resolve("dist/server");
const destFile = path.join(destDir, "server-node.js");

// Ensure dest dir exists
fs.mkdirSync(destDir, { recursive: true });

// Copy file
fs.copyFileSync(srcFile, destFile);

console.log(`Copied server-node.js to ${destDir}`);
