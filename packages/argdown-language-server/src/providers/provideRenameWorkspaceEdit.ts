import {
  Position,
  TextDocumentIdentifier,
  TextEdit,
  WorkspaceEdit
} from "vscode-languageserver";
import { createRange } from "./utils.js";
import { findReferences } from "./findReferences.js";
import { findNodeAtPosition } from "./findNodeAtPosition.js";
import { IAstNode, isTokenNode } from "@argdown/core";

const statementReferencePattern = /^\[([^\]]+)\]$/;
const statementDefinitionPattern = /^\[([^\]]+)\]:$/;
const statementBlockDefinitionPattern = /^\[([^\]]+)\]\s*>>$/;
const statementMentionPattern = /^@\[(.+)\](\s?)$/;
const argumentMentionPattern = /^@<(.+)>(\s?)$/;

const getStatementMarker = (rawId: string): string => {
  if (!rawId || rawId.length === 0) {
    return "";
  }
  const marker = rawId[0];
  if (marker === "!" || marker === "?" || marker === "@" || marker === ">") {
    return marker;
  }
  return "";
};

const getStatementMarkerFromImage = (
  image: string,
  pattern: RegExp
): string => {
  const match = pattern.exec(image);
  if (!match || match.length < 2) {
    return getStatementMarker(image);
  }
  return getStatementMarker(match[1]);
};

const hasTrailingWhitespace = (image: string, pattern: RegExp): boolean => {
  const match = pattern.exec(image);
  if (!match || match.length < 3) {
    return false;
  }
  return match[2] === " ";
};

const createTextEdit = (node: IAstNode, newName: string): TextEdit | null => {
  if (isTokenNode(node) && node.tokenType) {
    const image = node.image || "";
    switch (node.tokenType.name) {
      case "ArgumentReference":
        return TextEdit.replace(createRange(node), `<${newName}>`);
      case "ArgumentDefinition":
        return TextEdit.replace(createRange(node), `<${newName}>:`);
      case "ArgumentMention":
        return TextEdit.replace(
          createRange(node),
          `@<${newName}>${
            hasTrailingWhitespace(image, argumentMentionPattern) ? " " : ""
          }`
        );
      case "StatementReference":
        return TextEdit.replace(
          createRange(node),
          `[${getStatementMarkerFromImage(
            image,
            statementReferencePattern
          )}${newName}]`
        );
      case "StatementDefinition":
        if (statementBlockDefinitionPattern.test(image)) {
          return TextEdit.replace(
            createRange(node),
            `[${getStatementMarkerFromImage(
              image,
              statementBlockDefinitionPattern
            )}${newName}] >>`
          );
        }
        return TextEdit.replace(
          createRange(node),
          `[${getStatementMarkerFromImage(
            image,
            statementDefinitionPattern
          )}${newName}]:`
        );
      case "StatementMention":
        return TextEdit.replace(
          createRange(node),
          `@[${getStatementMarkerFromImage(
            image,
            statementMentionPattern
          )}${newName}]${
            hasTrailingWhitespace(image, statementMentionPattern) ? " " : ""
          }`
        );
      case "Tag":
        return TextEdit.replace(createRange(node), `#(${newName})`); // we use the bracketed tag syntax, so we don't have to check the format of newName
    }
  }
  return null;
};
export const provideRenameWorkspaceEdit = (
  response: any,
  newName: string,
  position: Position,
  textDocument: TextDocumentIdentifier
): WorkspaceEdit => {
  const wsEdit: WorkspaceEdit = {
    changes: {}
  };
  const line = position.line + 1;
  const character = position.character + 1;
  const nodeAtPosition = findNodeAtPosition(response, line, character);
  if (!nodeAtPosition) {
    return wsEdit;
  }
  const nodes: IAstNode[] = findReferences(response, nodeAtPosition, true);
  if (nodes) {
    const edits: TextEdit[] = nodes.reduce<TextEdit[]>((acc, curr) => {
      const edit = createTextEdit(curr, newName);
      if (edit) {
        acc.push(edit);
      }
      return acc;
    }, []);
    wsEdit.changes[textDocument.uri] = edits;
    return wsEdit;
  }
  return {};
};
