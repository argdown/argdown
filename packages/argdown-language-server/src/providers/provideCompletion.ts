import { IArgdownResponse, IArgument, IEquivalenceClass } from "@argdown/core";
import {
  CompletionItem,
  CompletionItemKind,
  Position,
  Range,
  TextEdit
} from "vscode-languageserver";
const statementPattern = /\[([^[]+?)\]$/;
const argumentPattern = /<([^<]+?)>$/;

export const provideCompletion = (
  response: IArgdownResponse,
  char: string,
  position: Position,
  text: string,
  offset: number
): CompletionItem[] => {
  if (!response.statements || !response.arguments) return [];

  const range = Range.create(
    position.line,
    position.character - 1,
    position.line,
    position.character + 1
  );

  switch (char) {
    case "@":
      return [
        {
          ...CompletionItem.create("@include()"),
          kind: CompletionItemKind.Keyword,
          detail: "Include an external Argdown file",
          insertText: "include($1)",
          insertTextFormat: 2
        }
      ];
    case "[":
      return Object.keys(response.statements).map((k: string) => {
        const eqClass = response.statements[k];
        const title = eqClass.title;
        return {
          ...CompletionItem.create(`[${title}]`),
          textEdit: TextEdit.replace(range, `[${title}]`),
          kind: CompletionItemKind.Variable,
          detail: IEquivalenceClass.getCanonicalMemberText(eqClass)
        };
      });
    case "<":
      return Object.keys(response.arguments).map((k: string) => {
        const arg = response.arguments[k];
        const title = arg.title;
        return {
          ...CompletionItem.create(`<${title}>`),
          textEdit: TextEdit.replace(range, `<${title}>`),
          kind: CompletionItemKind.Variable,
          detail: IArgument.getCanonicalMemberText(arg)
        };
      });
    case "#":
      return Object.keys(response.tags ?? []).map((t: string) => ({
        ...CompletionItem.create(`#(${t})`),
        insertText: `(${t})`,
        kind: CompletionItemKind.Keyword
      }));
    case ":": {
      const textBefore = text.slice(0, offset - 1);
      const statementMatch = textBefore.match(statementPattern);
      if (statementMatch.length > 1) {
        const title = statementMatch[1];
        const eqClass = response.statements[title];
        if (!eqClass.members) return [];
        return eqClass.members
          .filter((member) => !member.isReference)
          .map((member) => {
            const item = CompletionItem.create(member.text);
            item.kind = CompletionItemKind.Value;
            item.detail = `[${title}]: ${member.text}`;
            item.insertText = ` ${member.text}
`;
            return item;
          });
      }
      const argumentMatch = textBefore.match(argumentPattern);
      if (argumentMatch.length > 1) {
        const title = argumentMatch[1];
        const argument = response.arguments[title];
        if (!argument.members) return [];
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

    default:
      return [];
  }
};
