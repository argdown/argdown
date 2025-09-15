"use strict";

// import * as vscode from "vscode";
import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
  ForkOptions
} from "vscode-languageclient/node";
import { CommandManager } from "./commands/CommandManager";
import * as commands from "./commands/index";

import { ArgdownEngine } from "./preview/ArgdownEngine";
import { ArgdownPreviewManager } from "./preview/ArgdownPreviewManager";
import { Logger } from "./preview/Logger";
import { ArgdownContentProvider } from "./preview/ArgdownContentProvider";
import {
  ExtensionContentSecurityPolicyArbiter,
  PreviewSecuritySelector
} from "./preview/security";
import createArgdownMarkdownItPlugin from "@argdown/markdown-it-plugin";
import { nodeConfigLoader } from "./nodeConfigLoader";
import { getArgdownExtensionContributions } from "./preview/ArgdownExtensions";
// import { ForkOptions } from "vscode-languageclient/lib/client";

let client: LanguageClient | undefined;

export function activate(context: vscode.ExtensionContext) {

  // ========================================
  // CORE FUNCTIONALITY
  // ========================================
  
  // -- PREVIEW --
  const logger = new Logger();
  logger.log('Argdown extension: Starting core functionality initialization');
  
  logger.log('Argdown extension: Creating logger');
  
  logger.log('Argdown extension: Creating argdown engine');
  const argdownEngine = new ArgdownEngine(logger, nodeConfigLoader);
  
  logger.log('Argdown extension: Creating CSP arbiter');
  const cspArbiter = new ExtensionContentSecurityPolicyArbiter(
    context.globalState,
    context.workspaceState
  );
  
  logger.log('Argdown extension: Getting contributions');
  const contributions = getArgdownExtensionContributions(context);
  
  logger.log('Argdown extension: Creating content provider');
  const contentProvider = new ArgdownContentProvider(
    argdownEngine,
    context,
    cspArbiter,
    contributions
  );
  
  logger.log('Argdown extension: Creating preview manager');
  const previewManager = new ArgdownPreviewManager(
    contentProvider,
    logger,
    contributions,
    argdownEngine
  );
  
  logger.log('Argdown extension: Creating preview security selector');
  const previewSecuritySelector = new PreviewSecuritySelector(
    cspArbiter,
    previewManager
  );

  // -- COMMANDS --
  logger.log('Argdown extension: Starting command registration');
  const commandManager = new CommandManager();
  context.subscriptions.push(commandManager);
  commandManager.register(new commands.ShowPreviewCommand(previewManager));
  commandManager.register(
    new commands.ShowPreviewToSideCommand(previewManager)
  );
  commandManager.register(
    new commands.ShowLockedPreviewToSideCommand(previewManager)
  );
  commandManager.register(new commands.ShowSourceCommand(previewManager));
  commandManager.register(new commands.RefreshPreviewCommand(previewManager));
  commandManager.register(new commands.MoveCursorToPositionCommand());
  commandManager.register(
    new commands.ShowPreviewSecuritySelectorCommand(
      previewSecuritySelector,
      previewManager
    )
  );
  commandManager.register(new commands.OnPreviewStyleLoadErrorCommand());
  commandManager.register(new commands.OpenDocumentLinkCommand());
  commandManager.register(new commands.ToggleLockCommand(previewManager));
  commandManager.register(new commands.ExportDocumentToHtmlCommand());
  commandManager.register(new commands.ExportDocumentToJsonCommand());
  commandManager.register(new commands.ExportDocumentToDotCommand());
  commandManager.register(new commands.ExportDocumentToGraphMLCommand());
  commandManager.register(new commands.ExportDocumentToVizjsSvgCommand());
  commandManager.register(new commands.CopyWebComponentToClipboardCommand());
  commandManager.register(new commands.ExportDocumentToVizjsPdfCommand());
  commandManager.register(new commands.ExportContentToVizjsPngCommand());
  commandManager.register(new commands.ExportContentToDagreSvgCommand());
  commandManager.register(new commands.ExportContentToDagrePngCommand());
  commandManager.register(new commands.ExportContentToDagrePdfCommand());
  
  logger.log('Argdown extension: Command registration completed');

  // ========================================
  // CONFIGURATION WATCHERS (Always Initialize)
  // ========================================
  
  logger.log('Argdown extension: Setting up configuration watchers');
  
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      logger.updateConfiguration();
      previewManager.updateConfiguration();
      if (e.affectsConfiguration("argdown.markdownWebComponent")) {
        vscode.commands.executeCommand("markdown.preview.refresh");
      }
    })
  );

  // ========================================
  // LANGUAGE SERVER (Always Initialize)
  // ========================================
  
  // --- LANGUGAGE SERVER ---
  // The debug options for the server
  let debugOptions: ForkOptions = { execArgv: ["--nolazy", "--inspect=6009"] };
  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverPath = context.asAbsolutePath("dist/server/server-node.js");
  let serverOptions: ServerOptions = {
    run: {
      module: serverPath,
      transport: TransportKind.ipc
    },
    debug: {
      module: serverPath,
      transport: TransportKind.ipc,
      options: debugOptions
    }
  };
  // Options to control the language client
  let clientOptions: LanguageClientOptions = {
    // Register the server for plain text documents
    documentSelector: [
      { scheme: "untitled", language: "argdown" },
      { scheme: "file", language: "argdown" }
    ],
    outputChannelName: "Argdown Language Server"
  };
  // Create the language client and start the client.
  client = new LanguageClient(
    "argdownLanguageServer",
    "Argdown Language Server",
    serverOptions,
    clientOptions
  );
  // Register new proposed protocol if available.
  client.registerProposedFeatures();
  // Start the client. This will also launch the server
  client.start();
  logger.log('Argdown extension: Language server started successfully');

  // ========================================
  // RETURN EXTENSION API
  // ========================================
  
  return {
    extendMarkdownIt(md: any) {
      const webComponentConfig = vscode.workspace.getConfiguration(
        "argdown.markdownWebComponent",
        null
      );
      const enabled = webComponentConfig.get<boolean>("enabled");
      if (enabled) {
        return md.use(
          createArgdownMarkdownItPlugin(() => {
            const webComponentConfig = vscode.workspace.getConfiguration(
              "argdown.markdownWebComponent",
              null
            );
            const withoutHeader = webComponentConfig.get<boolean>(
              "withoutHeader"
            );
            const withoutLogo = webComponentConfig.get<boolean>("withoutLogo");
            const withoutMaximize = webComponentConfig.get<boolean>(
              "withoutMaximize"
            );
            // const withoutHeader = false;
            // const withoutLogo = false;
            // const withoutMaximize = false;
            return {
              webComponent: {
                addWebComponentScript: false,
                addWebComponentPolyfill: false,
                addGlobalStyles: false,
                withoutHeader,
                withoutLogo,
                withoutMaximize
              }
            };
          })
        );
      }
      return md;
    }
  };
}

export function deactivate(): Thenable<void> {
  const logger = new Logger();
  
  if (!client) {
    logger.log('Argdown extension: No language server client to deactivate (test mode or initialization failed)');
    return Promise.resolve();
  }
  
  logger.log('Argdown extension: Stopping language server client');
  return client.stop();
}
