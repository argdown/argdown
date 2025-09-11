import { expect } from "chai";
import { it, describe } from "mocha";
import {
  IArgdownRequest,
  ArgdownApplication,
  ParserPlugin,
  ModelPlugin,
  PreselectionPlugin,
  StatementSelectionPlugin,
  ArgumentSelectionPlugin,
  MapPlugin,
  GroupPlugin,
  ColorPlugin,
  DotExportPlugin
} from "../src";
import { SyncDotToSvgExportPlugin } from "../src/plugins/SyncDotToSvgExportPlugin";

describe("SyncDotToSvgExportPlugin", function() {
  const app = new ArgdownApplication();
  app.addPlugin(new ParserPlugin(), "parse-input");
  app.addPlugin(new ModelPlugin(), "build-model");
  app.addPlugin(new PreselectionPlugin(), "create-map");
  app.addPlugin(new StatementSelectionPlugin(), "create-map");
  app.addPlugin(new ArgumentSelectionPlugin(), "create-map");
  app.addPlugin(new MapPlugin(), "create-map");
  app.addPlugin(new GroupPlugin(), "create-map");
  app.addPlugin(new ColorPlugin(), "add-colors");
  app.addPlugin(new DotExportPlugin(), "export-dot");
  app.addPlugin(new SyncDotToSvgExportPlugin(), "export-dot-as-svg");
  it("can generate svg (sanity test)", async () => {
    const input = `
        [B]: test

        <A>: test
            - [B]
            + <C>: test
        `;
    const request: IArgdownRequest = {
      input,
      process: [
        "parse-input",
        "build-model",
        "create-map",
        "add-colors",
        "export-dot",
        "export-dot-as-svg"
      ],
      logLevel: "error"
    };
    const response = await app.run(request);
    //let's do some tests for the labels
    expect(response.svg).to.contain(">A</text>");
    expect(response.svg).to.contain(">B</text>");
    expect(response.svg).to.contain(">C</text>");
    expect(response.svg).to.contain(">test</text>");
    expect(response.svg).to.exist;
  });
  it("can generate tooltips in svg format", async () => {
    const input = `
        [Statement Title]: Statement text content
        
        <Argument Title>: Argument text content
            - [Statement Title]
            + <Another Argument>: More argument text
        `;
    const request: IArgdownRequest = {
      input,
      process: [
        "parse-input",
        "build-model",
        "create-map",
        "add-colors",
        "export-dot",
        "export-dot-as-svg"
      ],
      logLevel: "error"
    };
    const response = await app.run(request);
    
    try {
      // Verify the SVG is generated successfully
      expect(response.svg).to.exist;
      expect(response.svg).to.contain("<svg");
      expect(response.svg).to.contain("</svg>");

      // Check that tooltips are converted to SVG <title> elements
      // SVG tooltips are represented as <title> elements within <g> or other elements
      expect(response.svg).to.contain('xlink:title="Statement text content"');
      expect(response.svg).to.contain('xlink:title="Argument text content"');
      expect(response.svg).to.contain('xlink:title="More argument text"');
    } catch (error) {
      console.error("Generated SVG:", response.svg);
      throw error;
    }
  });
});
