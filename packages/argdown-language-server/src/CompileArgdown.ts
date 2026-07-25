import { argdown } from "@argdown/core";

export class CompileArgdown {

  private argdown = argdown;
  /**
   * Loads a file from the given path, relative to the `from` path.
   * @param path The relative or absolute path of the file to load.
   * @param from The absolute path of the file that is including this file.
   * @returns A tuple containing the unique file id (e.g. absolute path of the file) and content.
   */
  private loadfile: (path: string, from: string) => Promise<[string, string]>;
  /**
   *
   * @param loadfile see {@link CompileArgdown.loadfile}
   */
  constructor(
    loadfile: (path: string, from: string) => Promise<[string, string]>
  ) {
    this.loadfile = loadfile;
  }

  // Recursively compiles the input string, replacing @include directives with the contents of the included files. Depth-first, not-parallel.
  public async compile(
    input: string,
    from: string,
    alreadyIncluded: Set<string> = new Set()
  ): Promise<string> {
    const { includes } = this.argdown.run({
      process: ["parse-input", "include-positions"],
      input
    });
    if (!includes || includes.length === 0) return input;
    const loads = await Promise.all(
      includes.map(async ({payload, startLine}) => {
        const name: string = payload.filePath;
        let id, content;
        try {
          [id, content] = await this.loadfile(name, from);
        } catch {
          return `<!-- File ${name} not found. Is included by ${from}:${startLine} -->`;
        }
        if (!id || !content) return `<!-- Empty content: ${name} -->`;
        if (alreadyIncluded.has(id)) {
          return `<!-- Already included: ${id} -->`;
        }
        alreadyIncluded.add(id);
        return `<!-- Start: ${id} -->\n${await this.compile(content, id, alreadyIncluded)}\n<!-- End: ${id} -->`;
      })
    );
    loads.forEach((load, i) => {
      input = input.replace(includes[i].image, load);
    });
    return input;
  }
}
