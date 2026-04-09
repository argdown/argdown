import { type TextDocument, Uri, workspace, window } from "vscode";
import type { ArgdownEngine } from "../../ArgdownEngine";
import { ArgdownConfiguration } from "../../config/ArgdownConfiguration";
import type { Command } from "../Command";
import { getUri, saveExportedFile } from "./util";

export class ExportDocumentToJsonCommand implements Command {
  private static readonly id = "argdown.exportDocumentToJson";
  public readonly id = ExportDocumentToJsonCommand.id;

  constructor(private readonly engine: ArgdownEngine) {}

  public static createCommandUri(path: string, fragment: string): Uri {
    return Uri.parse(
      `command:${ExportDocumentToJsonCommand.id}?${encodeURIComponent(
        JSON.stringify({ path, fragment })
      )}`
    );
  }
  public async execute(resource: Uri) {
    const uri = getUri(resource);
    if (!uri) throw new Error("No file provided!");
    const config = new ArgdownConfiguration(uri, this.engine);
    const doc: TextDocument = await workspace.openTextDocument(uri);
    const result = this.engine.exportJson(doc, config);
    await saveExportedFile(uri, result, { JSON: ["json"] }, "json");
  }
}
