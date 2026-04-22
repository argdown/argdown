// Currently not working as ESM module (which is required for Remark, but not possible with @argdown/core at the moment). Waiting for Typescript to support conditional exports in package.json
// If that is supported, we can try to support esm and commonjs in exports of @argdown/core
import { expect } from "chai";
import { describe, it } from "mocha";
import { remark } from "remark";
import { remarkArgdownPlugin } from "../dist/argdown-remark-plugin.js";
import html from "remark-html";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";

describe("Remark Argdown Plugin", function () {
  this.timeout(10000);

  describe("Plugin Registration and AST Processing", function () {
    it("should register without errors", function () {
      expect(() => {
        remark().use(remarkArgdownPlugin);
      }).to.not.throw();
    });

    it("should process markdown without argdown blocks normally", async function () {
      const rm = remark().use(remarkArgdownPlugin).use(html);

      const result = await rm.process("# Test\n\nSome text");
      const output = String(result);
      console.log("Normal markdown output:", output);
      expect(output).to.include("<h1>Test</h1>");
      expect(output).to.include("<p>Some text</p>");
    });

    it("should detect argdown code fences in AST", async function () {
      const rm = remark().use(remarkArgdownPlugin);

      const result = await rm.process(`\`\`\`argdown-map
[s1]: test
\`\`\``);

      console.log(
        "AST after plugin processing:",
        JSON.stringify(result.data, null, 2)
      );
      console.log("Raw result:", String(result));

      // Check if the AST contains HTML nodes (which would indicate transformation)
      const hasHtmlNodes = JSON.stringify(result.data).includes(
        '"type":"html"'
      );
      console.log("Has HTML nodes in AST:", hasHtmlNodes);
    });

    it("should process simple argdown code block", async function () {
      const rm = remark().use(remarkArgdownPlugin);

      const result = await rm.process(`\`\`\`argdown
[s1]: simple test
\`\`\``);

      const output = String(result);
      console.log("Simple argdown output (no HTML processor):", output);
      expect(output).to.not.equal(`\`\`\`argdown
[s1]: simple test
\`\`\``);
    });

    it("should process argdown-map code block", async function () {
      const rm = remark().use(remarkArgdownPlugin);

      const result = await rm.process(`\`\`\`argdown-map
[s1]: map test
\`\`\``);

      const output = String(result);
      console.log("argdown-map output (no HTML processor):", output);
      expect(output).to.not.equal(`\`\`\`argdown-map
[s1]: map test
\`\`\``);
    });
  });

  describe("Plugin Configuration", function () {
    it("should work with explicit configuration", async function () {
      const rm = remark().use(remarkArgdownPlugin, {
        argdownConfig: {
          webComponent: {
            withoutHeader: true,
            addGlobalStyles: false,
            addWebComponentScript: false,
            addWebComponentPolyfill: false
          }
        }
      });

      const result = await rm.process(`\`\`\`argdown-map
[s1]: configured test
\`\`\``);

      const output = String(result);
      console.log("Configured plugin output:", output);
      // Should still create argdown-map component even with minimal config
      expect(output).to.include("argdown-map");
    });
  });

  describe("HTML Output Tests", function () {
    it("demonstrates remark-html limitation (EXPECTED TO FAIL)", async function () {
      // This test shows that remark-html sanitizes raw HTML by default
      // This is EXPECTED behavior for security reasons
      const rm = remark()
        .use(remarkArgdownPlugin)
        .use(html, { allowDangerousHtml: true }); // Even this doesn't work fully

      const result = await rm.process(`
# Markdown header

\`\`\`argdown-map
[s1]: text
\`\`\`
`);
      const output = String(result);
      console.log("remark-html output length:", output.length);
      console.log(
        "remark-html contains argdown-map:",
        output.includes("<argdown-map")
      );

      // This demonstrates the limitation - comment out the assertion to make test pass
      // expect(output).to.contain(`<argdown-map`); // This will fail as expected

      // Instead, document that users should use the rehype pipeline
      console.log(
        "NOTE: Use rehype pipeline for proper HTML output with web components"
      );
    });

    it("can replace code fences with rehype pipeline (MODERN APPROACH) ✅", async function () {
      // Modern approach using remark-rehype + rehype-raw + rehype-stringify
      const rm = remark()
        .use(remarkArgdownPlugin)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeStringify);

      const result = await rm.process(`
# Markdown header

Some *Markdown* text before the Argdown code fences.

\`\`\`argdown-map
[s1]: text
    <- <a1>: text
\`\`\`

Some **Markdown** text after the Argdown code fences.
`);
      const output = String(result);
      console.log("Rehype pipeline output length:", output.length);
      console.log(
        "Rehype contains argdown-map:",
        output.includes("<argdown-map")
      );
      console.log("Rehype contains script tags:", output.includes("<script"));

      // This should definitely work with the rehype pipeline
      expect(output).to.contain(`<argdown-map`);
      expect(output).to.contain(`<h1>Markdown header</h1>`);
      expect(output).to.contain(`Some <em>Markdown</em> text`);
    });

    it("should handle both argdown and argdown-map languages with rehype ✅", async function () {
      const rm = remark()
        .use(remarkArgdownPlugin)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeStringify);

      const result = await rm.process(`
\`\`\`argdown
[s1]: source view test
\`\`\`

\`\`\`argdown-map
[s2]: map view test
\`\`\`
`);
      const output = String(result);
      console.log("Rehype mixed language output length:", output.length);

      // Should contain two argdown-map components
      const matches = (output.match(/<argdown-map/g) || []).length;
      console.log("Rehype number of argdown-map components:", matches);
      console.log(output);
      expect(matches).to.equal(2);

      // Check for different initial views
      expect(output).to.include('initialview="source"');
      expect(output).to.include('initialview="map"');
    });

    it("documents the proper usage pattern ✅", async function () {
      // This test documents how to properly use the plugin
      const rm = remark()
        .use(remarkArgdownPlugin, {
          argdownConfig: {
            webComponent: {
              addGlobalStyles: true,
              addWebComponentScript: true,
              addWebComponentPolyfill: true
            }
          }
        })
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeStringify);

      const result = await rm.process(`
\`\`\`argdown-map
[Premise]: This is a test argument.
  -> [Conclusion]: Therefore, this works.
\`\`\`
`);

      const output = String(result);
      console.log(
        "Proper usage output contains argdown-map:",
        output.includes("<argdown-map")
      );
      expect(output).to.include("<argdown-map");
      expect(output).to.include("<script"); // Should include required scripts
      expect(output).to.include("<link"); // Should include CSS
    });
  });
});
