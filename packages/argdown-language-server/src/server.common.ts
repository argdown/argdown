import { Connection, DocumentUri, TextDocuments } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ConnectionHandlers } from "./ConnectionHandlers.common";

export class Server extends ConnectionHandlers {
  protected documents: TextDocuments<TextDocument> = new TextDocuments(
    TextDocument
  );
  protected getDocument(uri: DocumentUri): TextDocument {
    return this.documents.get(uri);
  }
  constructor(protected connection: Connection) {
    super();
  }
  public init() {
    this.initializeConnection();
    this.documents.listen(this.connection);
    this.connection.listen();
  }
  private initializeConnection() {
    this.connection.onInitialize(this.onInitialize.bind(this));
    this.connection.onInitialized(this.handleInitialized.bind(this));
    this.connection.onDidChangeConfiguration(
      this.handleDidChangeConfiguration.bind(this)
    );
    this.connection.onRenameRequest(this.onRenameRequest.bind(this));
    this.connection.onHover(this.handleHover.bind(this));
    this.connection.onCompletion(this.onCompletion.bind(this));
    this.connection.onDocumentHighlight(this.onDocumentHighlight.bind(this));
    this.connection.onReferences(this.onReferences.bind(this));
    this.connection.onDefinition(this.onDefinition.bind(this));
    this.connection.onDocumentSymbol(this.onDocumentSymbol.bind(this));
    this.connection.onFoldingRanges(this.onFoldingRanges.bind(this));
  }
}
