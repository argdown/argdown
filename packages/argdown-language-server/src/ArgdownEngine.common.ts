import { argdown, IArgdownRequest } from "@argdown/core";
import {
  Connection,
  Diagnostic,
  DiagnosticSeverity,
  DocumentSymbol,
  DocumentUri,
  FoldingRange,
  Range,
  TextDocument,
  TextDocumentIdentifier
} from "vscode-languageserver";
import { IArgdownSettings } from "./IArgdownSettings";
import { DocumentSymbolPlugin } from "./providers/DocumentSymbolPlugin";
import { FoldingRangesPlugin } from "./providers/FoldingRangesPlugin";

export abstract class ArgdownEngine {
  protected argdown = argdown;
  private loglevel = "verbose";

  protected abstract connection: Connection;

  protected documentSettings: Map<string, Thenable<IArgdownSettings>> =
    new Map();

  constructor() {
    this.argdown.addPlugin(new DocumentSymbolPlugin(), "add-document-symbols");
    this.argdown.addPlugin(new FoldingRangesPlugin(), "add-folding-ranges");
    this.addLogger();
  }

  protected abstract getDocument(uri: DocumentUri): TextDocument;

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

  protected validateTextDocument(textDocument: TextDocument): void {
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
  protected doc2String(
    textDocument: TextDocumentIdentifier
  ): string | Promise<string> {
    const doc = this.getDocument(textDocument.uri);
    if (!doc) return null;
    return doc.getText();
  }
  protected async processDocForProviders(textDocument: TextDocumentIdentifier) {
    return this.processTextForProviders(await this.doc2String(textDocument));
  }

  protected async getDocumentSymbols(textDocument: TextDocumentIdentifier) {
    const request: IArgdownRequest = {
      input: await this.doc2String(textDocument),
      process: ["parse-input", "build-model", "add-document-symbols"],
      parser: { throwExceptions: true },
      throwExceptions: true
    };
    try {
      return this.argdown.run(request).documentSymbols ?? null;
    } catch {
      return null;
    }
  }

  protected async getFoldingRanges(textDocument: TextDocumentIdentifier) {
    const request: IArgdownRequest = {
      input: await this.doc2String(textDocument),
      process: ["parse-input", "build-model", "add-folding-ranges"],
      parser: { throwExceptions: true },
      throwExceptions: true
    };
    try {
      return this.argdown.run(request).foldingRanges ?? null;
    } catch {
      return null;
    }
  }
}
