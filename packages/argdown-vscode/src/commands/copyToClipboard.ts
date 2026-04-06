import * as vscode from "vscode";
import { TextDocument, workspace } from "vscode";
import { ArgdownEngine } from "../ArgdownEngine";
import { ArgdownConfiguration } from "../config/ArgdownConfiguration";
import { Command } from "./Command";

export class CopyWebComponentToClipboardCommand implements Command {
  private static readonly id = "argdown.copyWebComponentToClipboard";
  public readonly id = CopyWebComponentToClipboardCommand.id;

  constructor(private readonly engine: ArgdownEngine) {}

  public static createCommandUri(path: string, fragment: string): vscode.Uri {
    return vscode.Uri.parse(
      `command:${CopyWebComponentToClipboardCommand.id}?${encodeURIComponent(
        JSON.stringify({ path, fragment })
      )}`
    );
  }
  public async execute(resource: vscode.Uri) {
    const successMessage = `Web component html copied to the clipbard. Paste your component into any html file. For more information on how to use the web component visit the [component's documentation](https://argdown.org/guide/embed-your-map-in-html.html).`;

    const config = new ArgdownConfiguration(resource, this.engine);
    const doc: TextDocument = await workspace.openTextDocument(resource);
    const result = await this.engine.exportWebComponent(doc, config);
    await vscode.env.clipboard.writeText(result);
    vscode.window.showInformationMessage(successMessage);
  }
}
