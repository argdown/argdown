import { type TextDocument, Uri, workspace } from "vscode";
import type { ArgdownEngine } from "../../ArgdownEngine";
import { ArgdownConfiguration } from "../../config/ArgdownConfiguration";
import type { Command } from "../Command";
import { saveExportedFile } from "./util";

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
    const config = new ArgdownConfiguration(resource, this.engine);
    const doc: TextDocument = await workspace.openTextDocument(resource);
    const result = this.engine.exportGraphML(doc, config);
    await saveExportedFile(
      resource,
      result,
      { graphml: ["graphml"] },
      "graphml"
    );
  }
}
