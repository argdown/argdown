import * as vscode from "vscode";
import { Command } from "../Command";
import { saveExportedFile, savePng } from "../export/util";

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

export class ExportContentToDagrePdfCommand implements Command {
  private static readonly id = "argdown.exportContentToDagrePdf";
  public readonly id = ExportContentToDagrePdfCommand.id;

  public static createCommandUri(path: string, fragment: string): vscode.Uri {
    return vscode.Uri.parse(
      `command:${ExportContentToDagrePdfCommand.id}?${encodeURIComponent(
        JSON.stringify({ path, fragment })
      )}`
    );
  }
  public execute(resource: vscode.Uri, content: string) {
    vscode.window.showInformationMessage("Not implemented yet");
    // void sendToLanguageServer(
    //   resource,
    //   content,
    //   { PDF: ["pdf"] },
    //   "pdf",
    //   "dagre-to-pdf"
    // );
  }
}
