import { type TextDocument, Uri, workspace } from "vscode";
import type { ArgdownEngine } from "../../ArgdownEngine";
import { ArgdownConfiguration } from "../../config/ArgdownConfiguration";
import type { Command } from "../Command";
import { getUri, saveExportedFile } from "./util";

export class ExportDocumentToGraphMLCommand implements Command {
  private static readonly id = "argdown.exportDocumentToGraphML";
  public readonly id = ExportDocumentToGraphMLCommand.id;

  constructor(private readonly engine: ArgdownEngine) {}

  public static createCommandUri(path: string, fragment: string): Uri {
    return Uri.parse(
      `command:${ExportDocumentToGraphMLCommand.id}?${encodeURIComponent(
        JSON.stringify({ path, fragment })
      )}`
    );
  }
  public async execute(resource: Uri) {
    const uri = getUri(resource);
    if (!uri) throw new Error("No file provided!");
    const config = new ArgdownConfiguration(uri, this.engine);
    const doc: TextDocument = await workspace.openTextDocument(uri);
    const result = this.engine.exportGraphML(doc, config);
    await saveExportedFile(uri, result, { graphml: ["graphml"] }, "graphml");
  }
}
