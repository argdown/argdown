import { type ExtensionContext, Uri } from "vscode";
import {
  LanguageClient,
  type LanguageClientOptions
} from "vscode-languageclient/browser";
import { browserConfigLoader } from "./config/loader/configLoader.browser";
import { ArgdownExtension } from "./main.common";

const clientOptions: LanguageClientOptions = {
  // Register the server for plain text documents
  documentSelector: [
    { scheme: "untitled", language: "argdown" },
    { scheme: "file", language: "argdown" }
  ],
  outputChannelName: "Argdown Language Server"
};
function createClient(context: ExtensionContext) {
  // Create a worker. The worker main file implements the language server.
  const serverMain = Uri.joinPath(
    context.extensionUri,
    "dist",
    "server",
    "server.browser.js"
  );
  const worker = new Worker(serverMain.toString(true));

  // create the language server client to communicate with the server running in the worker
  return new LanguageClient(
    "argdown",
    "Argdown Language Server Client",
    clientOptions,
    worker
  );
}

const extension = new ArgdownExtension(createClient, browserConfigLoader);

export async function activate(context: ExtensionContext) {
  await extension.activate(context);
}

export function deactivate(): Thenable<void> {
  return extension.deactivate();
}
