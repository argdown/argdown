import { type TextDocument, Uri, workspace } from "vscode";
import type { ArgdownEngine } from "../../ArgdownEngine";
import { ArgdownConfiguration } from "../../config/ArgdownConfiguration";
import type { Command } from "../Command";
import { saveExportedFile } from "./util";

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
    const config = new ArgdownConfiguration(resource, this.engine);
    const doc: TextDocument = await workspace.openTextDocument(resource);
    const result = this.engine.exportJson(doc, config);
    await saveExportedFile(resource, result, { JSON: ["json"] }, "json");
  }
}
