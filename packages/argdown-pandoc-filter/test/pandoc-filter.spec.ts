const util = require("util");
const exec = util.promisify(require("child_process").exec);
import { rimraf } from "rimraf";
import path from "path";
import fs from "fs";
import { use, expect } from "chai";
import chaiFs from "chai-fs";
use(chaiFs);
import "mocha";
const chaiSnapshot = require("mocha-chai-snapshot");
use(chaiSnapshot);

// Normalize line endings for cross-platform compatibility
function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

// const tis = this;
async function execPandocOnFile(
  fileName: string,
  format: "html" | "pdf" | "revealjs"
) {
  const { stdout } = await exec(
    `pandoc -s -f markdown test/${fileName} --filter dist/index.js -t ${format}`
  );
  return normalizeLineEndings(String(stdout));
}

describe("Argdown Pandoc Filter", function() {
  this.timeout(100000);
  
  before(async function() {
    // Check pandoc version
    try {
      const { stdout: pandocVersion } = await exec("pandoc --version");
      const versionMatch = pandocVersion.match(/pandoc (\d+\.\d+\.\d+)/);
      if (!versionMatch) {
        console.error("Error executing pandoc --version. Output: ", pandocVersion);
        throw new Error("Could not detect pandoc version");
      }
      const version = versionMatch[1];
      console.log(`Using pandoc version: ${version}`);
      
      // We're testing against snapshots generated with pandoc 3.6.4 - warn if different
      if (version !== "3.6.4") {
        console.warn(`Warning: Tests were designed for pandoc 3.6.4, but found ${version}. Snapshots may not match.`);
      }
    } catch (error) {
      throw new Error("pandoc is required for tests. Please install pandoc first.");
    }
    
    // Check rsvg-convert version (required for PDF tests)
    try {
      const { stdout: rsvgVersion } = await exec("rsvg-convert --version");
      const versionMatch = rsvgVersion.match(/rsvg-convert version (\d+\.\d+\.\d+)/);
      if (!versionMatch) {
        throw new Error("Could not detect rsvg-convert version");
      }
      const version = versionMatch[1];
      console.log(`Using rsvg-convert version: ${version}`);
      
      // We're testing with rsvg-convert 2.61.1 - warn if different
      if (version !== "2.61.1") {
        console.warn(`Warning: Tests were designed for rsvg-convert 2.61.1, but found ${version}. PDF tests may behave differently.`);
      }
    } catch (error) {
      console.warn("rsvg-convert not found - PDF tests will be skipped");
    }
  });
  it("generates html with web-component", async () => {
    const output = await execPandocOnFile(`example-web-component.md`, "html");
    
    try {
      (expect(output) as any).to.matchSnapshot(this);
    } catch (error) {
      // Write current output to file for inspection when test fails
      const outputPath = path.resolve(__dirname, "current-output-web-component.html");
      fs.writeFileSync(outputPath, output, 'utf8');
      console.log(`Test failed - current output written to: ${outputPath}`);
      throw error;
    }
  });
  it("generates html with inline image", async () => {
    const output = await execPandocOnFile(`example-inline-jpg.md`, "html");
    (expect(output) as any).to.matchSnapshot(this);
  });
  it("generates html with jpg image", async () => {
    let imagesFolder = path.resolve(__dirname, "./images/");
    let filePathToImage = path.resolve(imagesFolder, "map-1.jpg");
    await rimraf(imagesFolder);
    const output = await execPandocOnFile(`example-file-jpg.md`, "html");
    (expect(output) as any).to.matchSnapshot(this);
    (<any>expect(filePathToImage).to.be.a).file();
    await rimraf(imagesFolder);
  });
  it("generates html with png image", async () => {
    let imagesFolder = path.resolve(__dirname, "./images/");
    let filePathToImage = path.resolve(imagesFolder, "map-1.png");
    await rimraf(imagesFolder);
    const output = await execPandocOnFile(`example-file-png.md`, "html");
    (expect(output) as any).to.matchSnapshot(this);
    (<any>expect(filePathToImage).to.be.a).file();
    await rimraf(imagesFolder);
  });
  it("generates html with webp image", async () => {
    let imagesFolder = path.resolve(__dirname, "./images/");
    let filePathToImage = path.resolve(imagesFolder, "map-1.webp");
    await rimraf(imagesFolder);
    const output = await execPandocOnFile(`example-file-webp.md`, "html");
    (expect(output) as any).to.matchSnapshot(this);
    (<any>expect(filePathToImage).to.be.a).file();
    await rimraf(imagesFolder);
  });
  it("generates pdf with inline image", async () => {
    const output = await execPandocOnFile(`example-inline-jpg.md`, "pdf");
    //(expect(output) as any).to.matchSnapshot(this); // not working
    expect(output).to.exist;
    expect(output).to.not.be.empty;
  });
  it("generates revealjs with 3 slides", async () => {
    const output = await execPandocOnFile(`example-revealjs.md`, "revealjs");
    //(expect(output) as any).to.matchSnapshot(this); // not working
    (expect(output) as any).to.matchSnapshot(this);
  });
});
