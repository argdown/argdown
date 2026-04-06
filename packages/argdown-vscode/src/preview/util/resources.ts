import type { Uri } from "vscode";

export interface WebviewResourceProvider {
  asWebviewUri(resource: Uri): Uri;

  readonly cspSource: string;
}
