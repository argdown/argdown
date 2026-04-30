/**
 * This script patches the 404.html file to inject the spaFix.js script into the head. This is necessary for single-page applications with github pages, like the argdown sandbox. See: https://github.com/rafrex/spa-github-pages
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const spaFixName = "spaFix.js";
const spaFixPath = path.join(__dirname, spaFixName);
const distDir = path.join(__dirname, "../docs/.vitepress/dist");

// Copy the spaFix.js file to the dist directory if it doesn't exist
if (!existsSync(path.join(distDir, spaFixName))) {
  copyFileSync(spaFixPath, path.join(distDir, spaFixName));
}
const filePath = path.join(distDir, "404.html");

const scriptToInject = `<script src="/${spaFixName}"></script>`;
let html = readFileSync(filePath, "utf8");

// Inject the spaFix.js script into the 404.html file if it doesn't already exist
if (!html.includes(scriptToInject)) {
  html = html.replace("<head>", `<head>\n\t${scriptToInject}`);
  writeFileSync(filePath, html, "utf8");
}
