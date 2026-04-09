import * as vscode from "vscode";
import type { Command } from "../Command";
import { getUri, saveExportedFile, savePdf, savePng } from "./util";
import { ArgdownEngine } from "../../ArgdownEngine";
import { ArgdownConfiguration } from "../../config/ArgdownConfiguration";
import { TextDocument, workspace } from "vscode";

export class ExportContentToVizjsPngCommand implements Command {
  private static readonly id = "argdown.exportContentToVizjsPng";
  public readonly id = ExportContentToVizjsPngCommand.id;

  public static createCommandUri(path: string, fragment: string): vscode.Uri {
    return vscode.Uri.parse(
      `command:${ExportContentToVizjsPngCommand.id}?${encodeURIComponent(
        JSON.stringify({ path, fragment })
      )}`
    );
  }
  public execute(resource: vscode.Uri, content: string) {
    void savePng(resource, content);
  }
}
export class ExportDocumentToVizjsSvgCommand implements Command {
  private static readonly id = "argdown.exportDocumentToVizjsSvg";
  public readonly id = ExportDocumentToVizjsSvgCommand.id;

  constructor(private readonly engine: ArgdownEngine) {}

  public static createCommandUri(path: string, fragment: string): vscode.Uri {
    return vscode.Uri.parse(
      `command:${ExportDocumentToVizjsSvgCommand.id}?${encodeURIComponent(
        JSON.stringify({ path, fragment })
      )}`
    );
  }
  public async execute(resource: vscode.Uri) {
    const uri = getUri(resource);
    if (!uri) throw new Error("No file provided!");
    const config = new ArgdownConfiguration(uri, this.engine);
    const doc: TextDocument = await workspace.openTextDocument(uri);
    const { svg } = await this.engine.exportSvg(doc, config);
    await saveExportedFile(uri, svg, { svg: ["svg"] }, "svg");
  }
}
export class ExportDocumentToWebComponentCommand implements Command {
  private static readonly id = "argdown.exportDocumentToWebComponent";
  public readonly id = ExportDocumentToWebComponentCommand.id;

  constructor(private readonly engine: ArgdownEngine) {}

  public static createCommandUri(path: string, fragment: string): vscode.Uri {
    return vscode.Uri.parse(
      `command:${ExportDocumentToWebComponentCommand.id}?${encodeURIComponent(
        JSON.stringify({ path, fragment })
      )}`
    );
  }
  public async execute(resource: vscode.Uri) {
    const uri = getUri(resource);
    if (!uri) throw new Error("No file provided!");
    const config = new ArgdownConfiguration(uri, this.engine);
    const doc: TextDocument = await workspace.openTextDocument(uri);
    const result = await this.engine.exportWebComponent(doc, config);
    await saveExportedFile(uri, result, { html: ["html"] }, "html");
  }
}
export class ExportDocumentToVizjsPdfCommand implements Command {
  private static readonly id = "argdown.exportDocumentToVizjsPdf";
  public readonly id = ExportDocumentToVizjsPdfCommand.id;

  constructor(private readonly engine: ArgdownEngine) {}
  public static createCommandUri(path: string, fragment: string): vscode.Uri {
    return vscode.Uri.parse(
      `command:${ExportDocumentToVizjsPdfCommand.id}?${encodeURIComponent(
        JSON.stringify({ path, fragment })
      )}`
    );
  }
  public async execute(resource: vscode.Uri) {
    const uri = getUri(resource);
    if (!uri) throw new Error("No file provided!");
    const config = new ArgdownConfiguration(uri, this.engine);
    const doc: TextDocument = await workspace.openTextDocument(uri);
    const { svg, request } = await this.engine.exportSvg(doc, config);
    savePdf(uri, svg, request);
  }
}
