import { sep } from "path";
import {
  CompletionItem,
  DidChangeConfigurationNotification,
  DocumentHighlight,
  DocumentSymbolParams,
  FoldingRangeParams,
  InitializeParams,
  InitializeResult,
  Location,
  ReferenceParams,
  RenameParams,
  TextDocument,
  TextDocumentPositionParams,
  TextDocuments,
  TextDocumentSyncKind,
  WorkspaceFolder
} from "vscode-languageserver";
import { ArgdownEngine } from "./ArgdownEngine.common";
import {
  provideCompletion,
  provideDefinitions,
  provideHover,
  provideReferences,
  provideRenameWorkspaceEdit
} from "./providers";

const ONLY_WHITESPACE_PATTERN = /^\s*$/;

export abstract class ConnectionHandlers extends ArgdownEngine {
  private hasWorkspaceFolderCapability = false;
  private hasConfigurationCapability = false;
  private workspaceFolders: WorkspaceFolder[] = [];

  private pathSeperator = sep;

  protected abstract documents: TextDocuments<TextDocument>;

  constructor() {
    super();
    this.initializeDocumentSettings();
  }

  protected onInitialize(params: InitializeParams): InitializeResult {
    this.addCapabilities(params);
    return {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Full,
        documentSymbolProvider: true,
        foldingRangeProvider: true,
        definitionProvider: true,
        referencesProvider: true,
        documentHighlightProvider: true,
        hoverProvider: true,
        renameProvider: true,
        completionProvider: {
          triggerCharacters: ["[", "<", ":", "#", "@", "."]
        }
      }
    };
  }
  protected handleInitialized() {
    this.connection.console.log("Argdown language server initialized.");
    if (this.hasConfigurationCapability) {
      void this.connection.client.register(
        DidChangeConfigurationNotification.type,
        undefined
      );
    }

    if (this.hasWorkspaceFolderCapability) {
      this.connection.workspace.onDidChangeWorkspaceFolders((event) => {
        // Removed folders.
        for (const workspaceFolder of event.removed) {
          const index = this.workspaceFolders.findIndex(
            (folder) => folder.uri === workspaceFolder.uri
          );
          if (index !== -1) {
            this.workspaceFolders.splice(index, 1);
          }
        }
        // Added folders.
        for (const workspaceFolder of event.added) {
          this.workspaceFolders.push(workspaceFolder);
        }

        this.sortWorkspaceFolders();
      });
    }
  }

  protected handleDidChangeConfiguration() {
    if (this.hasConfigurationCapability) {
      // Reset all cached document settings
      this.documentSettings.clear();
    }
    this.documents.all().forEach((x) => this.validateTextDocument(x));
  }

  protected onRenameRequest({ newName, position, textDocument }: RenameParams) {
    const doc = this.getDocument(textDocument.uri);
    if (!doc) return null;
    const response = this.processDocForProviders(doc);
    if (!response) return null;
    return provideRenameWorkspaceEdit(
      response,
      newName,
      position,
      textDocument
    );
  }

  protected handleHover({
    textDocument,
    position
  }: TextDocumentPositionParams) {
    const response = this.processDocForProviders(textDocument);
    if (!response) return null;
    return provideHover(response, position);
  }
  protected onCompletion({
    textDocument,
    position
  }: TextDocumentPositionParams): CompletionItem[] {
    const doc = this.getDocument(textDocument.uri);
    if (!doc) return null;
    const txt = doc.getText();
    const offset = doc.offsetAt(position);
    const char = txt.charAt(offset - 1);

    /**
     * --- Dirty Hack: ---
     * We have to check if we are at the end of the document and if char equals ':'.
     * In this case the parser won't produce an ast, but only return a parser error.
     * To avoid this, we have to remove the ':' from the parsed text.
     **/
    let input = txt;
    if (char === ":") {
      const txtAfter = txt.slice(offset);
      if (ONLY_WHITESPACE_PATTERN.test(txtAfter)) {
        input = txt.slice(0, offset - 1) + txtAfter;
      }
    }
    const response = this.processTextForProviders(input);
    if (!response) return null;
    return provideCompletion(response, char, position, txt, offset);
  }

  protected onDocumentHighlight({
    textDocument,
    position
  }: TextDocumentPositionParams) {
    const response = this.processDocForProviders(textDocument);
    if (!response) return null;
    return provideReferences(response, textDocument.uri, position).map(
      (l: Location) => DocumentHighlight.create(l.range, 1)
    );
  }

  protected onReferences({ context, position, textDocument }: ReferenceParams) {
    const response = this.processDocForProviders(textDocument);
    if (!response) return null;
    return provideReferences(response, textDocument.uri, position, context);
  }

  protected onDefinition({
    textDocument,
    position
  }: TextDocumentPositionParams) {
    const response = this.processDocForProviders(textDocument);
    if (!response) return null;
    return provideDefinitions(response, textDocument.uri, position);
  }

  protected onDocumentSymbol(params: DocumentSymbolParams) {
    const doc = this.getDocument(params.textDocument.uri);
    if (!doc) return null;
    return this.getDocumentSymbols(doc.getText());
  }

  protected onFoldingRanges(params: FoldingRangeParams) {
    const doc = this.getDocument(params.textDocument.uri);
    if (!doc) return null;
    return this.getFoldingRanges(doc.getText());
  }

  private addCapabilities({
    capabilities: { workspace },
    workspaceFolders
  }: InitializeParams) {
    this.hasWorkspaceFolderCapability = workspace?.workspaceFolders ?? false;
    this.hasConfigurationCapability = workspace?.configuration ?? false;
    if (workspaceFolders) {
      this.workspaceFolders = workspaceFolders;
      this.sortWorkspaceFolders();
    }
  }

  private sortWorkspaceFolders() {
    if (!this.workspaceFolders) return;
    this.workspaceFolders.sort((folder1, folder2) => {
      let uri1 = folder1.uri.toString();
      let uri2 = folder2.uri.toString();

      if (!uri1.endsWith("/")) {
        uri1 += this.pathSeperator;
      }

      if (uri2.endsWith("/")) {
        uri2 += this.pathSeperator;
      }
      return uri1.length - uri2.length;
    });
  }
  private initializeDocumentSettings() {
    this.documents.onDidClose((e) => {
      this.documentSettings.delete(e.document.uri);
    });
    this.documents.onDidChangeContent((change) => {
      this.validateTextDocument(change.document);
    });
  }
}
