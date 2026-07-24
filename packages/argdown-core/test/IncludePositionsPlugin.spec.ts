import { expect } from "chai";
import { describe, it } from "mocha";
import {
  ArgdownApplication,
  IncludePositionsPlugin,
  ParserPlugin,
  RuleNames
} from "../src/index";

let app = new ArgdownApplication();

describe("IncludePositionsPlugin", function () {
  const parserPlugin = new ParserPlugin();
  const includePlugin = new IncludePositionsPlugin();
  app.addPlugin(parserPlugin, "parse-input");

  app.addPlugin(includePlugin, "include-positions");

  it("can parse includes", function () {
    const source = `
<B> {auf: wiedersehen}

@include(file.argdown)

<?-- @include(file2.argdown) -->

@include(../file.ad)
`;
    const request = {
      process: ["parse-input", "include-positions"],
      input: source,
      logLevel: "error",
    };
    const result = app.run(request);
    console.log(JSON.stringify(result.includes, null, 2));
    expect(result.parserErrors!.length).to.equal(0);
    expect(result.lexerErrors!.length).to.equal(0);

    expect(result.includes!.length).to.equal(2);
    expect(result.includes!.every((node) => node.tokenType.name === "Include")).to.be.true;
  });
});
