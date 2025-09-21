// copy-web-components.js (CommonJS)
const fs = require("fs");
const path = require("path");

const srcDir = path.resolve("../argdown-web-components/dist");
const destDir = path.resolve("dist/assets");

fs.mkdirSync(destDir, { recursive: true });

const files = fs.readdirSync(srcDir).filter(f => f.startsWith("argdown-map."));
for (const file of files) {
  fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
  console.log(`Copied ${file}`);
}
