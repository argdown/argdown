import type { TextDocument } from "vscode";
import type { ArgdownEngine } from "../../ArgdownEngine";
import type { ArgdownPreviewConfiguration } from "../ArgdownPreviewConfiguration";
import type { IViewProvider } from "./IViewProvider";

export const htmlViewProvider: IViewProvider = {
  scripts: ["htmlView.js"],
  generateView: (_, argdownDocument: TextDocument) => {
    return `<div id="html-container"></div><div class="has-line" data-line="${argdownDocument.lineCount}"></div>`;
  },
  generateSubMenu: () => {
    return `<nav class="submenu">
	Export as <a data-command="argdown.exportDocumentToJson" title="save as json" href="#">json</a> | <a data-command="argdown.exportDocumentToHtml" title="save as html" href="#">html</a> | <a data-command="argdown.exportDocumentToDot" title="save as dot" href="#">dot</a> | <a title="save as graphml" data-command="argdown.exportDocumentToGraphML" href="#">graphml</a>
	</nav>`;
  },
  generateOnDidChangeTextDocumentMessage: async (
    argdownEngine: ArgdownEngine,
    argdownDocument: TextDocument,
    config: ArgdownPreviewConfiguration
  ) => {
    const html = await argdownEngine.exportHtml(argdownDocument, config);
    return {
      html: `<div id="html-container">${html}</div><div class="has-line" data-line="${argdownDocument.lineCount}"></div>`
    };
  },
  contributeToInitialState: async (
    s,
    argdownEngine,
    argdownDocument,
    config: ArgdownPreviewConfiguration
  ) => {
    s.html.lineCount = argdownDocument.lineCount;
    s.html.html = await argdownEngine.exportHtml(argdownDocument, config);
    return s;
  }
};
