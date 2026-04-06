import type { TextDocument } from "vscode";
import type { ArgdownEngine } from "../../ArgdownEngine";
import type { ArgdownPreviewConfiguration } from "../ArgdownPreviewConfiguration";
import type { IViewProvider } from "./IViewProvider";

export const htmlViewProvider: IViewProvider = {
  scripts: ["htmlView.js"],
  generateView: (
    argdownEngine: ArgdownEngine,
    argdownDocument: TextDocument,
    config: ArgdownPreviewConfiguration
  ) => {
    const html = argdownEngine.exportHtml(argdownDocument, config);
    return `${html}<div class="has-line" data-line="${argdownDocument.lineCount}"></div>`;
  },
  generateSubMenu: () => {
    return `<nav class="submenu">
	Export as <a data-command="argdown.exportDocumentToJson" title="save as json" href="#">json</a> | <a data-command="argdown.exportDocumentToHtml" title="save as html" href="#">html</a> | <a data-command="argdown.exportDocumentToDot" title="save as dot" href="#">dot</a> | <a title="save as graphml" data-command="argdown.exportDocumentToGraphML" href="#">graphml</a>
	</nav>`;
  },
  generateOnDidChangeTextDocumentMessage: (
    argdownEngine: ArgdownEngine,
    argdownDocument: TextDocument,
    config: ArgdownPreviewConfiguration
  ) => {
    const html = argdownEngine.exportHtml(argdownDocument, config);
    return {
      html: `${html}<div class="has-line" data-line="${argdownDocument.lineCount}"></div>`
    };
  },
  contributeToInitialState: (s, _argdownEngine, argdownDocument) => {
    s.html.lineCount = argdownDocument.lineCount;
    return s;
  }
};
