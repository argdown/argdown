#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CompletionItem,
  CompletionItemKind,
  createConnection,
  Position,
  ProposedFeatures,
  TextDocumentPositionParams
} from "vscode-languageserver/node";
import { Server } from "./server.common";
import { getFilePaths } from "./utils/fs.node";

const incl: RegExp = /@include\(([^)]+)\)/g;
class ServerNode extends Server {
  protected async onCompletion({
    textDocument,
    position
  }: TextDocumentPositionParams): Promise<CompletionItem[]> {
    const doc = this.documents.get(textDocument.uri);
    if (!doc) return null;
    const line = doc.getText({
      start: Position.create(position.line, 0),
      end: Position.create(position.line, Number.MAX_SAFE_INTEGER)
    });
    const matches = Array.from(line.matchAll(incl));
    const inclUnderCurser = matches
      .filter((match) => {
        const startPos = match.index + match[0].indexOf(match[1]);
        const endPos = match.index + match[0].length - 1;
        return startPos <= position.character && position.character <= endPos;
      })
      .pop();

    if (inclUnderCurser) {
      const [_, fileName] = inclUnderCurser;
      const thisFile = fileURLToPath(textDocument.uri);
      const base = join(dirname(thisFile), dirname(fileName));

      const norm = (s: string) => s.replace(base + "/", "");

      const x = await getFilePaths({
        globPattern: "**/*.argdown",
        rootPath: base,
        maxItems: 20
      });

      return x.map((file) => ({
        ...CompletionItem.create(norm(file)),
        kind: CompletionItemKind.File,
        insertText: norm(file)
      }));
    }
    return super.onCompletion({ textDocument, position });
  }
}

const connection = createConnection(ProposedFeatures.all);
const serverNode = new ServerNode(connection);

serverNode.init();
