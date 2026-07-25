import {
  ArgdownPluginError,
  type IArgdownPlugin,
  type IRequestHandler
} from "@argdown/core";

export interface ICompileSettings {
  regEx?: RegExp;
}
declare module "@argdown/core" {
  interface IArgdownRequest {
    compile?: ICompileSettings;
    inputPath?: string;
  }
}

export class CompilePlugin implements IArgdownPlugin {
  /**
   * Loads a file from the given path, relative to the `from` path.
   * @param path The relative or absolute path of the file to load.
   * @param from The absolute path of the file that is including this file.
   * @returns A tuple containing the unique file id (e.g. absolute path of the file) and content.
   */
  private loadfile: (path: string, from: string) => [string, string];
  /**
   *
   * @param loadfile see {@link CompilePlugin.loadfile}
   */
  constructor(loadfile: (path: string, from: string) => [string, string]) {
    this.loadfile = loadfile;
  }
  name = "CompilePlugin";
  run: IRequestHandler = (request) => {
    const { input, inputPath } = request;
    if (!input) {
      throw new ArgdownPluginError(
        this.name,
        "missing-input-request-field",
        "Missing input."
      );
    }
    if (!inputPath) {
      throw new ArgdownPluginError(
        this.name,
        "missing-input-path-request-field",
        "Missing input Path."
      );
    }
    request.input = this.compile(input, inputPath);
  };

  private alreadyIncluded: Set<string> = new Set();

  // Recursively compiles the input string, replacing @include directives with the contents of the included files. Depth-first, not-parallel.
  private compile(input: string, from: string): string {
    const regex: RegExp = /@include\(([^)]+)\)/g;
    if (!input.match(regex)) return input;

    return input.replace(regex, (_, name) => {
      let id, content;
      try {
        [id, content] = this.loadfile(name, from);
      } catch {
        const lineNumber =
          input.split("\n").findIndex((line) => line.includes(name)) + 1;
        throw new ArgdownPluginError(
          this.name,
          "file-not-found",
          `File ${name} not found. Is included by ${from}:${lineNumber}.`
        );
      }
      if (!id || !content) return `<!-- Empty content: ${name} -->`;
      if (this.alreadyIncluded.has(id)) {
        return `<!-- Already included: ${id} -->`;
      }
      this.alreadyIncluded.add(id);
      return `<!-- Start: ${id} -->\n${this.compile(content, id)}\n<!-- End: ${id} -->`;
    });
  }
}
