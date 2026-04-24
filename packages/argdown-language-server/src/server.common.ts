import { argdown, IArgdownRequest, IArgdownResponse } from "@argdown/core";
import { sep } from "path";
import type {
  Connection,
  DocumentSymbolParams,
  FoldingRangeParams,
  InitializeParams,
  Location,
  ReferenceParams,
  RenameParams,
  TextDocumentIdentifier,
  TextDocumentPositionParams,
  WorkspaceFolder
} from "vscode-languageserver";
import {
  Diagnostic,
  DiagnosticSeverity,
  DidChangeConfigurationNotification,
  DocumentHighlight,
  Range,
  TextDocuments,
  TextDocumentSyncKind
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { IArgdownSettings } from "./IArgdownSettings";
import {
  provideCompletion,
  provideDefinitions,
  provideHover,
  provideReferences,
  provideRenameWorkspaceEdit
} from "./providers";
import { DocumentSymbolPlugin } from "./providers/DocumentSymbolPlugin";
import { FoldingRangesPlugin } from "./providers/FoldingRangesPlugin";

export class Server {
  private static ONLY_WHITESPACE_PATTERN = /^\s*$/;

  private argdown = argdown;
  private loglevel = "verbose";
  private hasWorkspaceFolderCapability = false;
  private hasConfigurationCapability = false;
  private workspaceFolders: WorkspaceFolder[] = [];
  private documents: TextDocuments<TextDocument> = new TextDocuments(
    TextDocument
  );
  private documentSettings: Map<string, Thenable<IArgdownSettings>> = new Map();

  private pathSeperator = sep;

  constructor(private connection: Connection) {}

  public init() {
    this.argdown.addPlugin(new DocumentSymbolPlugin(), "add-document-symbols");
    this.argdown.addPlugin(new FoldingRangesPlugin(), "add-folding-ranges");
    this.addLogger();
    this.initializeDocumentSettings();
    this.initializeConnection();
    this.documents.listen(this.connection);
    this.connection.listen();
  }
  private initializeConnection() {
    this.connection.onInitialize((params: InitializeParams) => {
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
            triggerCharacters: ["[", "<", ":", "#"]
          }
        }
      };
    });
    this.connection.onInitialized(() => {
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
    });
    this.connection.onDidChangeConfiguration(() => {
      if (this.hasConfigurationCapability) {
        // Reset all cached document settings
        this.documentSettings.clear();
      }
      this.documents.all().forEach((x) => this.validateTextDocument(x));
    });
    this.connection.onRenameRequest(
      ({ newName, position, textDocument }: RenameParams) => {
        const doc = this.documents.get(textDocument.uri);
        if (!doc) return null;
        let response: IArgdownResponse | null = null;
        response = this.processDocForProviders(doc);
        if (!response) return null;
        return provideRenameWorkspaceEdit(
          response,
          newName,
          position,
          textDocument
        );
      }
    );
    this.connection.onHover(
      ({ textDocument, position }: TextDocumentPositionParams) => {
        const response = this.processDocForProviders(textDocument);
        if (!response) return null;
        return provideHover(response, position);
      }
    );
    this.connection.onCompletion(
      ({ textDocument, position }: TextDocumentPositionParams) => {
        const doc = this.documents.get(textDocument.uri);
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
          if (Server.ONLY_WHITESPACE_PATTERN.test(txtAfter)) {
            input = txt.slice(0, offset - 1) + txtAfter;
          }
        }
        const response = this.processTextForProviders(input);
        if (!response) return null;
        return provideCompletion(response, char, position, txt, offset);
      }
    );
    this.connection.onDocumentHighlight(
      ({ textDocument, position }: TextDocumentPositionParams) => {
        const response = this.processDocForProviders(textDocument);
        if (!response) return null;
        return provideReferences(response, textDocument.uri, position).map(
          (l: Location) => DocumentHighlight.create(l.range, 1)
        );
      }
    );
    this.connection.onReferences(
      ({ context, position, textDocument }: ReferenceParams) => {
        const response = this.processDocForProviders(textDocument);
        if (!response) return null;
        return provideReferences(response, textDocument.uri, position, context);
      }
    );
    this.connection.onDefinition(
      ({ textDocument, position }: TextDocumentPositionParams) => {
        const response = this.processDocForProviders(textDocument);
        if (!response) return null;
        return provideDefinitions(response, textDocument.uri, position);
      }
    );
    this.connection.onDocumentSymbol((params: DocumentSymbolParams) => {
      const doc = this.documents.get(params.textDocument.uri);
      if (!doc) return null;
      const request: IArgdownRequest & { inputUri: string } = {
        input: doc.getText(),
        process: ["parse-input", "build-model", "add-document-symbols"],
        inputUri: params.textDocument.uri,
        parser: {
          throwExceptions: true
        },
        throwExceptions: true
      };
      try {
        return this.argdown.run(request).documentSymbols;
      } catch {
        return null;
      }
    });
    this.connection.onFoldingRanges((params: FoldingRangeParams) => {
      const doc = this.documents.get(params.textDocument.uri);
      if (!doc) return null;
      const request: IArgdownRequest & { inputUri: string } = {
        input: doc.getText(),
        process: ["parse-input", "build-model", "add-folding-ranges"],
        inputUri: params.textDocument.uri,
        parser: {
          throwExceptions: true
        },
        throwExceptions: true
      };
      try {
        return this.argdown.run(request).foldingRanges;
      } catch {
        return null;
      }
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
  private addLogger() {
    this.argdown.logger = {
      setLevel: (level: string) => {
        this.loglevel = level;
      },
      log: (_level: string, message: string) => {
        if (this.loglevel === "verbose") {
          this.connection.console.log(message);
        }
      }
    };
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
  private validateTextDocument(textDocument: TextDocument): void {
    const text = textDocument.getText();
    const result = this.argdown.run({
      process: ["parse-input", "build-model"],
      input: text
    });

    const diagnostics: Diagnostic[] =
      result.parserErrors
        ?.map(
          ({
            message,
            token: { startLine, startColumn, endLine, endColumn }
          }) => {
            if (!startLine || !startColumn || !endLine || !endColumn) return; // Should never happen
            const start = {
              line: startLine - 1,
              character: startColumn - 1
            };
            const end = {
              line: endLine - 1,
              character: endColumn
            }; //end character is zero based, exclusive
            const range = Range.create(start, end);
            const severity = DiagnosticSeverity.Error;
            return Diagnostic.create(range, message, severity, "argdown");
          }
        )
        .filter((x): x is Diagnostic => !!x) ?? [];

    // Send the computed diagnostics to VSCode.
    void this.connection.sendDiagnostics({
      uri: textDocument.uri,
      diagnostics
    });
  }
  private processTextForProviders(text: string) {
    const request: IArgdownRequest = {
      input: text,
      process: ["parse-input", "build-model"],
      throwExceptions: true,
      parser: {
        throwExceptions: true
      }
    };
    try {
      return this.argdown.run(request);
    } catch {
      return null;
    }
  }
  private processDocForProviders(textDocument: TextDocumentIdentifier) {
    const doc = this.documents.get(textDocument.uri);
    if (doc) {
      const text = doc.getText();
      return this.processTextForProviders(text);
    }
    return null;
  }
}
