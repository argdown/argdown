import * as vscode from "vscode";
import { Command } from "../Command";
import { saveExportedFile, savePdf, savePng } from "../export/util";
import { ArgdownEngine } from "../../ArgdownEngine";

/**
 * Thoses commands can be invoked from the dagre view or via the command pallet.
 */

export class ExportContentToDagreSvgCommand implements Command {
  private static readonly id = "argdown.exportContentToDagreSvg";
  public readonly id = ExportContentToDagreSvgCommand.id;

  constructor() {}

  public static createCommandUri(path: string, fragment: string): vscode.Uri {
    return vscode.Uri.parse(
      `command:${ExportContentToDagreSvgCommand.id}?${encodeURIComponent(
        JSON.stringify({ path, fragment })
      )}`
    );
  }
  public execute(resource: vscode.Uri, content: string) {
    void saveExportedFile(resource, content, { SVG: ["svg"] }, "svg");
  }
}
export class ExportContentToDagrePngCommand implements Command {
  private static readonly id = "argdown.exportContentToDagrePng";
  public readonly id = ExportContentToDagrePngCommand.id;

  public static createCommandUri(path: string, fragment: string): vscode.Uri {
    return vscode.Uri.parse(
      `command:${ExportContentToDagrePngCommand.id}?${encodeURIComponent(
        JSON.stringify({ path, fragment })
      )}`
    );
  }
  public execute(resource: vscode.Uri, content: string) {
    void savePng(resource, content);
  }
}

/**
 * This command does not work, because svg-to-pdf does not apply css styles. Therefore the dagre svg output is not styled correctly.
 *
 */
export class ExportContentToDagrePdfCommand implements Command {
  private static readonly id = "argdown.exportContentToDagrePdf";
  public readonly id = ExportContentToDagrePdfCommand.id;

  constructor(private readonly engine: ArgdownEngine) {}
  public static createCommandUri(path: string, fragment: string): vscode.Uri {
    return vscode.Uri.parse(
      `command:${ExportContentToDagrePdfCommand.id}?${encodeURIComponent(
        JSON.stringify({ path, fragment })
      )}`
    );
  }
  public execute(resource: vscode.Uri, content: string) {
    savePdf(resource, content, {});
  }
}
