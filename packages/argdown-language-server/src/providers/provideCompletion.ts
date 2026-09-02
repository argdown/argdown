import {
  CompletionItem,
  CompletionItemKind,
  Position,
  Range,
  TextEdit
} from "vscode-languageserver";
import { IArgument, IEquivalenceClass, IArgdownResponse } from "@argdown/core";
import { formatStatementTitle } from "./utils.js";
const statementPattern = /\[([^[]+?)\]$/;
const argumentPattern = /<([^<]+?)>$/;
const normalizeStatementId = (id: string): string => {
  if (!id || id.length === 0) {
    return id;
  }
  const marker = id[0];
  if (marker === "!" || marker === "?" || marker === "@" || marker === ">") {
    return id.substring(1);
  }
  return id;
};
export const provideCompletion = (
  response: IArgdownResponse,
  char: string,
  position: Position,
  text: string,
  offset: number
) => {
  const range = Range.create(
    position.line,
    position.character - 1,
    position.line,
    position.character + 1
  );
  if (!response.statements || !response.arguments) {
    return [];
  }
  if (char === "[") {
    return Object.keys(response.statements).map((k: any) => {
      const eqClass = response.statements[k];
      const title = eqClass.title;
      const statementRef = formatStatementTitle(
        title,
        (eqClass as any).discussionPointType
      );
      const item = CompletionItem.create(statementRef);
      item.textEdit = TextEdit.replace(range, statementRef);
      item.kind = CompletionItemKind.Variable;
      item.detail = IEquivalenceClass.getCanonicalMemberText(eqClass);
      return item;
    });
  } else if (char === "<") {
    return Object.keys(response.arguments).map((k: any) => {
      const argument = response.arguments[k];
      const title = argument.title;
      const item = CompletionItem.create(`<${title}>`);
      item.textEdit = TextEdit.replace(range, `<${title}>`);
      item.kind = CompletionItemKind.Variable;
      const desc = IArgument.getCanonicalMemberText(argument);
      if (desc) {
        item.detail = desc;
      }
      return item;
    });
  } else if (char === ":") {
    const textBefore = text.slice(0, offset - 1);
    const statementMatch = textBefore.match(statementPattern);
    if (statementMatch && statementMatch.length > 1) {
      const title = normalizeStatementId(statementMatch[1]);
      const eqClass = response.statements[title];
      if (!eqClass) {
        return [];
      }
      if (!eqClass.members) {
        return [];
      }
      return eqClass.members
        .filter((member) => !member.isReference)
        .map((member) => {
          const item = CompletionItem.create(member.text);
          item.kind = CompletionItemKind.Value;
          item.detail = `${formatStatementTitle(
            eqClass.title,
            (eqClass as any).discussionPointType
          )}: ${member.text}`;
          item.insertText = ` ${member.text}
`;
          return item;
        });
    } else {
      const argumentMatch = textBefore.match(argumentPattern);
      if (argumentMatch && argumentMatch.length > 1) {
        const title = argumentMatch[1];
        const argument = response.arguments[title];
        if (argument.members) {
          return argument.members
            .filter((member) => !member.isReference)
            .map((member) => {
              const item = CompletionItem.create(member.text);
              item.kind = CompletionItemKind.Value;
              item.detail = `<${title}>: ${member.text}`;
              item.insertText = ` ${member.text}
`;
              item.kind = CompletionItemKind.Value;
              return item;
            });
        }
      }
    }
  } else if (char === "#" && response.tags) {
    return Object.keys(response.tags).map((t: any) => {
      const item = CompletionItem.create(`#(${t})`);
      item.insertText = `(${t})`;
      item.kind = CompletionItemKind.Keyword;
      return item;
    });
  }
  return [];
};
