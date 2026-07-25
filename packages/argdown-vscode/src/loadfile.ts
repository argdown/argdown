import { Utils, URI } from "vscode-uri";
import { workspace } from "vscode";

export async function loadFile(
  path: string,
  from: string
): Promise<[string, string]> {
  const fromURI = URI.parse(from);
  const dir = Utils.dirname(fromURI);

  const resolvedPath = Utils.resolvePath(dir, path);
  const data = await workspace.fs.readFile(resolvedPath);
  const content = Buffer.from(data).toString("utf8");

  return [resolvedPath.toString(), content];
}
