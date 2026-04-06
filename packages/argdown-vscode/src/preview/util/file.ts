import type { TextDocument } from "vscode";

export function isArgdownFile(document: TextDocument) {
  return document.languageId === "argdown";
}
