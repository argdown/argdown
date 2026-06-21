#!/usr/bin/env node
import {
  CompletionItem,
  CompletionItemKind,
  createConnection,
  ProposedFeatures,
  TextDocumentPositionParams
} from "vscode-languageserver/node";
import { Server } from "./server.common";
import { URI, Utils } from "vscode-uri";

class ServerNode extends Server {
  protected onCompletion({
    textDocument,
    position
  }: TextDocumentPositionParams): CompletionItem[] {
    const doc = this.documents.get(textDocument.uri);
    if (!doc) return null;
    const txt = doc.getText();
    const offset = doc.offsetAt(position);
    const char = txt.charAt(offset - 1);
    if (char === ".") {
      const base = Utils.dirname(URI.parse(textDocument.uri));
      const files = this.documents.all();

      const norm = (s: string) => s.replace(base.toString(), ".");

      return [
        {
          ...CompletionItem.create(norm(textDocument.uri)),
          kind: CompletionItemKind.File,
          insertText: norm(textDocument.uri)
        },
        ...files.map((file) => ({
          ...CompletionItem.create("Others: " + norm(file.uri)),
          kind: CompletionItemKind.File,
          insertText: norm(file.uri)
        }))
      ];
    }
    return super.onCompletion({ textDocument, position });
  }
}

const connection = createConnection(ProposedFeatures.all);
const serverNode = new ServerNode(connection);

serverNode.init();
