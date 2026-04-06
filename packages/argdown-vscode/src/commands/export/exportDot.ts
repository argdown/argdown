import { type TextDocument, Uri, workspace } from "vscode";
import type { ArgdownEngine } from "../../ArgdownEngine";
import { ArgdownConfiguration } from "../../config/ArgdownConfiguration";
import type { Command } from "../Command";
import { getUri, saveExportedFile } from "./util";

export class ExportDocumentToDotCommand implements Command {
  private static readonly id = "argdown.exportDocumentToDot";
  public readonly id = ExportDocumentToDotCommand.id;

  constructor(private readonly engine: ArgdownEngine) {}

  public static createCommandUri(path: string, fragment: string): Uri {
    return Uri.parse(
      `command:${ExportDocumentToDotCommand.id}?${encodeURIComponent(
        JSON.stringify({ path, fragment })
      )}`
    );
  }
  public async execute(resource: Uri) {
    const uri = getUri(resource);
    if (!uri) throw new Error("No file provided!");
    const config = new ArgdownConfiguration(uri, this.engine);
    const doc: TextDocument = await workspace.openTextDocument(uri);
    const { dot } = this.engine.exportDot(doc, config);
    await saveExportedFile(uri, dot, { Dot: ["dot"] }, "dot");
  }
}
