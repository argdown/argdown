import type { TextDocument } from "vscode";
import type { ArgdownEngine } from "../../ArgdownEngine";
import type { ArgdownPreviewConfiguration } from "../ArgdownPreviewConfiguration";
import type { IViewProvider } from "./IViewProvider";

declare module "@argdown/core" {
  interface IArgdownRequest {
    dagre?: Record<string, unknown>;
  }
}

export const dagreViewProvider: IViewProvider = {
  scripts: ["dagreView.js"],
  generateView: () => {
    return `<svg id="dagre-svg" ref="svg" width="100%" height="100%">
          <g class="dagre" style="transform: translate(0, 10px)">
          </g>
        </svg>`;
  },
  generateSubMenu: () => {
    return `<nav class="submenu">Export as <a data-command="argdown.exportContentToDagreSvg" title="save as svg" href="#">svg</a> | <a data-command="argdown.exportContentToDagrePng" title="save as png" href="#">png</a>
	</nav>`;
  },
  generateOnDidChangeTextDocumentMessage: (
    argdownEngine: ArgdownEngine,
    argdownDocument: TextDocument,
    config: ArgdownPreviewConfiguration
  ) => {
    const map = argdownEngine.exportMapJson(argdownDocument, config);
    const settings =
      config.argdownConfig && config.argdownConfig.dagre
        ? JSON.stringify(config.argdownConfig.dagre)
        : "{}";
    return { map, settings };
  },
  contributeToInitialState: (s, argdownEngine, argdownDocument, config) => {
    const map = argdownEngine.getMap(argdownDocument, config);
    const settings =
      config.argdownConfig && config.argdownConfig.dagre
        ? config.argdownConfig.dagre
        : {};
    s.dagre.map = map;
    s.dagre.settings = settings;
    return s;
  }
};
