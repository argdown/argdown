import { type TextDocument, Uri, workspace } from "vscode";
import type { ArgdownEngine } from "../../ArgdownEngine";
import { ArgdownConfiguration } from "../../config/ArgdownConfiguration";
import type { Command } from "../Command";
import { saveExportedFile } from "./util";

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
    const config = new ArgdownConfiguration(resource, this.engine);
    const doc: TextDocument = await workspace.openTextDocument(resource);
    const { dot } = this.engine.exportDot(doc, config);
    await saveExportedFile(resource, dot, { Dot: ["dot"] }, "dot");
  }
}
