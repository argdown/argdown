import { expect } from "chai";
import {
  ArgdownApplication,
  ParserPlugin,
  ModelPlugin,
  MapPlugin,
  DataPlugin,
  DotExportPlugin,
  PreselectionPlugin,
  StatementSelectionPlugin,
  ArgumentSelectionPlugin,
  GroupPlugin,
  ColorPlugin
} from "../src/index";

const app = new ArgdownApplication();
const parserPlugin = new ParserPlugin();
app.addPlugin(parserPlugin, "parse-input");
app.addPlugin(new DataPlugin(), "build-model");
const modelPlugin = new ModelPlugin();
app.addPlugin(modelPlugin, "build-model");
const preselectionPlugin = new PreselectionPlugin();
app.addPlugin(preselectionPlugin, "create-map");
const statementSelectionPlugin = new StatementSelectionPlugin();
app.addPlugin(statementSelectionPlugin, "create-map");
const argumentSelectionPlugin = new ArgumentSelectionPlugin();
app.addPlugin(argumentSelectionPlugin, "create-map");
const mapPlugin = new MapPlugin();
app.addPlugin(mapPlugin, "create-map");
const groupPlugin = new GroupPlugin();
app.addPlugin(groupPlugin, "create-map");
app.addPlugin(new ColorPlugin(), "colorize");
const dotExport = new DotExportPlugin();
app.addPlugin(dotExport, "export-dot");

describe("DotExport", function() {
  it("sanity test", function() {
    let source = `
    # Section 1
    
    <Argument with a very very long title 1>
      + [Statement with a very very long title 1]: Hello World!
          +<Argument 2>: Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim.
            -[Äüö'quotes']: Some text
                -<A very convincing argument>:Too complicated to explain
                  +>[And yet another statement]: Some more text
                    +<Another Argument>: Some more text
    
    ## Section 2
    
    <Argument with a very very long title 1>: text
      - [And yet another statement]
      
    ### Section 3
    
    [And yet another statement]
      + <Argument>
        - text
    `;

    let result = app.run({
      process: [
        "parse-input",
        "build-model",
        "create-map",
        "colorize",
        "export-dot"
      ],
      input: source,
      logLevel: "error"
    });
    // console.log(result.dot);
    expect(result.dot).to.exist;
  });
  it("can create samerank sections", function() {
    let source = `===
    dot:
      sameRank:
        - {statements:[s1, s2], arguments: [a1, a2]}
    ===

      [s1]: test
       - [s2]: test
        + <a1>
        + <a2>
        + <a3> {rank: r2}
        + <a4> {rank: r2}
       + [s3]: test {rank: r2}
       + [s4]: test {rank: r2}

    `;

    let result = app.run({
      process: [
        "parse-input",
        "build-model",
        "create-map",
        "colorize",
        "export-dot"
      ],
      input: source,
      logLevel: "error"
    });
    //console.log(result.dot);
    const rankSections = `{ rank = same;
n4;
n5;
n0;
n1;
};
{ rank = same;
n6;
n7;
n2;
n3;
};`;
    expect(result.dot!.includes(rankSections)).to.be.true;
  });
  it("can create ranges in labels", function() {
    let source = `

      [s1]: test *test* **test**
       - <s2>: test`;

    let result = app.run({
      process: [
        "parse-input",
        "build-model",
        "create-map",
        "colorize",
        "export-dot"
      ],
      input: source,
      logLevel: "error"
    });
    const s1Text = "test&#x20;<i>test</i> &#x20;<b>test</b> ";
    expect(result.dot!.includes(s1Text)).to.be.true;
  });
  it("can generate tooltips for statements and arguments", function() {
    let source = `
      [Statement Title]: Statement text content
       - <Argument Title>: Argument text content
       + [Another Statement]: More text
       + <Argument with "quotes">: Text with "embedded quotes"
    `;

    let result = app.run({
      process: [
        "parse-input",
        "build-model",
        "create-map",
        "colorize",
        "export-dot"
      ],
      input: source,
      logLevel: "error"
    });

    // Check that tooltips are generated for statements (should use labelText if available, otherwise labelTitle)
    expect(result.dot!.includes('tooltip="Statement text content"')).to.be.true;
    expect(result.dot!.includes('tooltip="More text"')).to.be.true;
    
    // Check that tooltips are generated for arguments
    expect(result.dot!.includes('tooltip="Argument text content"')).to.be.true;
    
    // Check that quotes in tooltips are properly escaped (DOT format uses \" for escaping)
    // The tooltip should use labelText if available, which is "Text with \"embedded quotes\""
    expect(result.dot!.includes('tooltip="Text with \\"embedded quotes\\""')).to.be.true;
  });
  it("can handle tooltips for nodes without text content", function() {
    let source = `
      [Statement Only Title]
       - <Argument Only Title>
    `;

    let result = app.run({
      process: [
        "parse-input",
        "build-model",
        "create-map",
        "colorize",
        "export-dot"
      ],
      input: source,
      logLevel: "error"
    });

    // When there's no labelText, should fall back to labelTitle for tooltip
    expect(result.dot!.includes('tooltip="Statement Only Title"')).to.be.true;
    expect(result.dot!.includes('tooltip="Argument Only Title"')).to.be.true;
  });
});
