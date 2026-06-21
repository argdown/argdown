#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CompletionItem,
  CompletionItemKind,
  createConnection,
  Position,
  ProposedFeatures,
  TextDocumentIdentifier
} from "vscode-languageserver/node";
import { CompileArgdown } from "./CompileArgdown";
import { Server } from "./server.common";
import { getFilePaths } from "./utils/fs.node";

const incl: RegExp = /@include\(([^)]+)\)/g;
class ServerNode extends Server {
  private argdownCompiler = new CompileArgdown(
    async (path: string, from: string) => {
      const dir = dirname(from);
      const resolved = resolve(dir, path);
      const content = await readFile(resolved, "utf8");
      return [resolved, content];
    }
  );
  protected async onCompletion({
    textDocument,
    position
  }): Promise<CompletionItem[]> {
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
  protected async doc2String(textDocument: TextDocumentIdentifier) {
    const input = await super.doc2String(textDocument);
    const compiled = await this.argdownCompiler.compile(
      input,
      fileURLToPath(textDocument.uri)
    );
    this.connection.console.log(compiled);
    return compiled;
  }
}

const connection = createConnection(ProposedFeatures.all);
const serverNode = new ServerNode(connection);

serverNode.init();
