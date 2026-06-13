export class CompileArgdown {
  /**
   * Loads a file from the given path, relative to the `from` path.
   * @param path The relative or absolute path of the file to load.
   * @param from The absolute path of the file that is including this file.
   * @returns A tuple containing the unique file id (e.g. absolute path of the file) and content.
   */
  private loadfile: (path: string, from: string) => Promise<[string, string]>;
  /**
   *
   * @param loadfile see {@link CompilePlugin.loadfile}
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
    const regex: RegExp = /@include\(([^)]+)\)/g;
    const matches = Array.from(input.matchAll(regex));
    if (matches.length === 0) return input;
    const loads = await Promise.all(
      matches.map(async (match) => {
        const name = match[1];
        let id, content;
        try {
          [id, content] = await this.loadfile(name, from);
        } catch {
          const lineNumber =
            input.split("\n").findIndex((line) => line.includes(name)) + 1;
          throw new Error(
            `File ${name} not found. Is included by ${from}:${lineNumber}.`
          );
        }
        if (!id || !content) return `<!-- Empty content: ${name} -->`;
        if (alreadyIncluded.has(id)) {
          return `<!-- Already included: ${id} -->`;
        }
        alreadyIncluded.add(id);
        return `<!-- Start: ${id} -->\n${await this.compile(content, id, alreadyIncluded)}\n<!-- End: ${id} -->`;
      })
    );
    return input.replace(regex, () => loads.shift() || "");
  }
}
