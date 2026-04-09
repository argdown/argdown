import type MarkdownIt from "markdown-it";
import {
  type ExtensionContext,
  commands as vsCommands,
  workspace
} from "vscode";

import createArgdownMarkdownItPlugin from "@argdown/markdown-it-plugin";
import type { BaseLanguageClient } from "vscode-languageclient";
import { ArgdownEngine } from "./ArgdownEngine";
import { CommandManager } from "./commands/CommandManager";
import * as commands from "./commands/index";
import { Logger } from "./Logger";
import { ArgdownContentProvider } from "./preview/ArgdownContentProvider";
import { getArgdownExtensionContributions } from "./preview/ArgdownExtensions";
import { ArgdownPreviewManager } from "./preview/ArgdownPreviewManager";
import {
  ExtensionContentSecurityPolicyArbiter,
  PreviewSecuritySelector
} from "./preview/security";
import type { IArgdownConfigLoader } from "./config/IArgdownConfigLoader";

export class ArgdownExtension {
  private logger = new Logger();
  private client: BaseLanguageClient | undefined = undefined;

  constructor(
    private createClient: (context: ExtensionContext) => BaseLanguageClient,
    private configLoader: IArgdownConfigLoader
  ) {}

  public async activate(context: ExtensionContext) {
    this.logger.log("Activating Argdown extension!");

    this.logger.log("Argdown extension: Creating argdown engine");
    const argdownEngine = new ArgdownEngine(this.logger, this.configLoader);

    this.logger.log("Argdown extension: Creating CSP arbiter");
    const cspArbiter = new ExtensionContentSecurityPolicyArbiter(
      context.globalState,
      context.workspaceState
    );

    this.logger.log("Argdown extension: Getting contributions");
    const contributions = getArgdownExtensionContributions(context);

    this.logger.log("Argdown extension: Creating content provider");
    const contentProvider = new ArgdownContentProvider(
      argdownEngine,
      context,
      cspArbiter,
      contributions
    );

    this.logger.log("Argdown extension: Creating preview manager");
    const previewManager = new ArgdownPreviewManager(
      contentProvider,
      this.logger,
      contributions,
      argdownEngine
    );

    this.logger.log("Argdown extension: Creating preview security selector");
    const previewSecuritySelector = new PreviewSecuritySelector(
      cspArbiter,
      previewManager
    );

    this.logger.log("Argdown extension: Starting command registration");
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
    commandManager.register(
      new commands.ExportDocumentToHtmlCommand(argdownEngine)
    );
    commandManager.register(
      new commands.ExportDocumentToJsonCommand(argdownEngine)
    );
    commandManager.register(
      new commands.ExportDocumentToDotCommand(argdownEngine)
    );
    commandManager.register(
      new commands.ExportDocumentToGraphMLCommand(argdownEngine)
    );
    commandManager.register(
      new commands.ExportDocumentToVizjsSvgCommand(argdownEngine)
    );
    commandManager.register(
      new commands.CopyWebComponentToClipboardCommand(argdownEngine)
    );
    commandManager.register(
      new commands.ExportDocumentToVizjsPdfCommand(argdownEngine)
    );
    commandManager.register(new commands.ExportContentToVizjsPngCommand());
    commandManager.register(new commands.ExportContentToDagreSvgCommand());
    commandManager.register(new commands.ExportContentToDagrePngCommand());
    // commandManager.register(
    //   new commands.ExportContentToDagrePdfCommand(argdownEngine)
    // );

    this.logger.log("Argdown extension: Command registration completed");

    // ========================================
    // CONFIGURATION WATCHERS (Always Initialize)
    // ========================================

    this.logger.log("Argdown extension: Setting up configuration watchers");
    context.subscriptions.push(
      workspace.onDidChangeConfiguration((e) => {
        this.logger.updateConfiguration();
        previewManager.updateConfiguration();
        if (e.affectsConfiguration("argdown.markdownWebComponent")) {
          vsCommands.executeCommand("markdown.preview.refresh");
        }
      })
    );

    // ========================================
    // LANGUAGE SERVER (Always Initialize)
    // ========================================

    this.logger.log("Starting language server");
    this.client = this.createClient(context);

    context.subscriptions.push(this.client);

    this.client.registerProposedFeatures();
    await this.client.start();
    this.logger.log("Language server started");

    // ========================================
    // RETURN EXTENSION API
    // ========================================
    const markdownItPlugin = await createArgdownMarkdownItPlugin(() => {
      const webComponentConfig = workspace.getConfiguration(
        "argdown.markdownWebComponent",
        null
      );
      const withoutHeader = webComponentConfig.get<boolean>("withoutHeader");
      const withoutLogo = webComponentConfig.get<boolean>("withoutLogo");
      const withoutMaximize =
        webComponentConfig.get<boolean>("withoutMaximize");
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
    });
    return {
      extendMarkdownIt(md: MarkdownIt) {
        const webComponentConfig = workspace.getConfiguration(
          "argdown.markdownWebComponent",
          null
        );
        const enabled = webComponentConfig.get<boolean>("enabled");
        if (enabled) {
          return md.use(markdownItPlugin);
        }
        return md;
      }
    };
  }

  public deactivate(): Thenable<void> {
    if (!this.client) {
      this.logger.log(
        "Argdown extension: No language server client to deactivate (test mode or initialization failed)"
      );
      return Promise.resolve();
    }
    this.logger.log("Argdown extension: Stopping language server client");
    return this.client.stop();
  }
}
