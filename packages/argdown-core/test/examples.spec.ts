import { expect } from "chai";
import { describe, it } from "mocha";
import * as fs from "fs";
import { fileURLToPath } from "url";
import {
  ArgdownApplication,
  DataPlugin,
  ModelPlugin,
  ParserPlugin
} from "../src";

const examplesDirectory = fileURLToPath(
  new URL("../../../examples/", import.meta.url)
);
const exampleFiles = fs
  .readdirSync(examplesDirectory)
  .filter((file) => file.endsWith(".argdown"))
  .sort();

describe("Published Argdown examples", function () {
  for (const file of exampleFiles) {
    it(`${file} parses without errors`, function () {
      const app = new ArgdownApplication();
      app.addPlugin(new ParserPlugin(), "parse-input");
      app.addPlugin(new DataPlugin(), "build-model");
      app.addPlugin(new ModelPlugin(), "build-model");
      const response = app.run({
        process: ["parse-input", "build-model"],
        input: fs.readFileSync(`${examplesDirectory}${file}`, "utf8")
      });
      const errors = (response.diagnostics || []).filter(
        (diagnostic) => diagnostic.severity === "error"
      );

      expect(
        response.exceptions || [],
        (response.exceptions || [])
          .map((exception) => `${exception.code}: ${exception.message}`)
          .join("\n")
      ).to.be.empty;
      expect(
        errors,
        errors
          .map((diagnostic) => `${diagnostic.code}: ${diagnostic.message}`)
          .join("\n")
      ).to.be.empty;
    });
  }
});
