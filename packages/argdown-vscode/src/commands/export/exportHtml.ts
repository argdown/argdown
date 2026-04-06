import { type TextDocument, Uri, workspace } from "vscode";
import type { ArgdownEngine } from "../../ArgdownEngine";
import { ArgdownConfiguration } from "../../config/ArgdownConfiguration";
import type { Command } from "../Command";
import { saveExportedFile } from "./util";

export class ExportDocumentToHtmlCommand implements Command {
  private static readonly id = "argdown.exportDocumentToHtml";
  public readonly id = ExportDocumentToHtmlCommand.id;

  constructor(private readonly engine: ArgdownEngine) {}

  public static createCommandUri(path: string, fragment: string): Uri {
    return Uri.parse(
      `command:${ExportDocumentToHtmlCommand.id}?${encodeURIComponent(
        JSON.stringify({ path, fragment })
      )}`
    );
  }
  public async execute(resource: Uri) {
    const config = new ArgdownConfiguration(resource, this.engine);
    const doc: TextDocument = await workspace.openTextDocument(resource);
    const result = this.engine.exportHtml(doc, config);
    await saveExportedFile(resource, result, { HTML: ["html"] }, "html");
  }
}
