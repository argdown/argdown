import path from "path";
import type { ExtensionContext } from "vscode";
import {
  LanguageClient,
  TransportKind,
  type ForkOptions,
  type LanguageClientOptions,
  type ServerOptions
} from "vscode-languageclient/node";
import { nodeConfigLoader } from "./config/loader/configLoader.node";
import { ArgdownExtension } from "./main.common";

function createClient(context: ExtensionContext): LanguageClient {
  // The debug options for the server
  const debugOptions: ForkOptions = {
    execArgv: ["--nolazy", "--inspect=6009"]
  };
  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const modulePath = context.asAbsolutePath(
    path.join("dist", "server", "server.node.js")
  );

  const serverOptions: ServerOptions = {
    run: {
      module: modulePath,
      transport: TransportKind.ipc
    },
    debug: {
      module: modulePath,
      transport: TransportKind.ipc,
      options: debugOptions
    }
  };
  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for plain text documents
    documentSelector: [
      { scheme: "untitled", language: "argdown" },
      { scheme: "file", language: "argdown" }
    ],
    outputChannelName: "Argdown Language Server"
  };
  // Create the language client and start the client.
  return new LanguageClient(
    "argdownLanguageServer",
    "Argdown Language Server",
    serverOptions,
    clientOptions
  );
}

const extension = new ArgdownExtension(createClient, nodeConfigLoader);

export async function activate(context: ExtensionContext) {
  await extension.activate(context);
}

export function deactivate(): Thenable<void> {
  return extension.deactivate();
}
