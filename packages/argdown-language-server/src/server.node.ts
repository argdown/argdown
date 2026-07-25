#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CompletionItem,
  CompletionItemKind,
  CompletionParams,
  createConnection,
  ProposedFeatures,
  TextDocumentIdentifier,
  Range,
  TextEdit
} from "vscode-languageserver/node";
import { CompileArgdown } from "./CompileArgdown";
import { Server } from "./server.common";
import { getFilePaths } from "./utils/fs.node";

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
  }: CompletionParams): Promise<CompletionItem[]> {
    const doc = this.documents.get(textDocument.uri);
    if (!doc) return null;
    const { includes } = this.argdown.run({
      process: ["parse-input", "include-positions"],
      input: doc.getText()
    });
    const currentLine = position.line + 1;

    const candidate = includes.filter(({ startLine, endLine, startColumn, endColumn }) => {
      const inLine = startLine <= currentLine && currentLine <= endLine
      const inParentesis = startColumn + "@include(".length - 1 <= position.character && position.character <= endColumn - 1;
      return inLine && inParentesis
    })
    if (candidate.length !== 1) return super.onCompletion({ textDocument, position });

    console.log("We are in a position: ", candidate)
    const { payload: { filePath }, startLine, endLine, startColumn, endColumn } = candidate[0];
    if(typeof filePath !== "string") return super.onCompletion({ textDocument, position });
    const thisFile = fileURLToPath(textDocument.uri);

    const base = join(dirname(thisFile), dirname(filePath));

    const norm = (s: string) => s.replace(base + "/", "");

    const x = await getFilePaths({
      globPattern: "**/*.argdown",
      rootPath: base,
      maxItems: 20
    });

    const range = Range.create(
      startLine - 1,
      startColumn + "@include(".length - 1,
      endLine - 1,
      endColumn - 1
    );
    const repl =  x.map((file) => ({
      ...CompletionItem.create(norm(file)),
      kind: CompletionItemKind.File,
      textEdit: TextEdit.replace(range, norm(file)),
    }));
    console.log(range, position, repl)
    return repl;
  }
  protected async doc2String(textDocument: TextDocumentIdentifier) {
    const input = await super.doc2String(textDocument);
    const compiled = await this.argdownCompiler.compile(
      input,
      fileURLToPath(textDocument.uri)
    );
    return compiled;
  }
}

const connection = createConnection(ProposedFeatures.all);
const serverNode = new ServerNode(connection);

serverNode.init();
