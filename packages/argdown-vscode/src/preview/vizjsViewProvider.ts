import { ArgdownEngine } from "../ArgdownEngine";
import * as vscode from "vscode";
import { ArgdownPreviewConfiguration } from "./ArgdownPreviewConfiguration";
import { IArgdownPreviewState } from "./IArgdownPreviewState";
import { IViewProvider } from "./IViewProvider";
import { IVizSettings } from "@argdown/core";

type VizSettingsWithImages = IVizSettings & {
  images?: Array<{
    path: string;
    width: number;
    height: number;
    dataUrl?: string;
  }>;
  removeProlog?: boolean;
};

const buildVizSettings = (
  config: ArgdownPreviewConfiguration,
  request: any
): VizSettingsWithImages => {
  const settings: VizSettingsWithImages =
    config.argdownConfig && config.argdownConfig.vizJs
      ? { ...config.argdownConfig.vizJs }
      : {};
  if (request.images && request.images.files) {
    settings.images = Object.values(
      request.images.files
    ) as VizSettingsWithImages["images"];
  }
  return settings;
};
export const vizjsViewProvider: IViewProvider = {
  // full.render.js has to be loaded after vizJsView.js
  // scripts: ["vizjsView.js", "full.render.js"],
  scripts: ["vizjsView.js"],
  generateView: () => {
    return `<div id="svg-container"></div>`;
  },
  generateSubMenu: () => {
    return `<nav class="submenu">
	Export as <a data-command="argdown.exportDocumentToVizjsSvg" title="save as svg" href="#">svg</a> | <a data-command="argdown.exportContentToVizjsPng" title="save as png" href="#">png</a> | <a data-command="argdown.exportDocumentToVizjsPdf" title="save as pdf" href="#">pdf</a> | <a data-command="argdown.copyWebComponentToClipboard" title="copy to clipboard as web component" href="#">web component</a>
	</nav>`;
  },
  generateOnDidChangeTextDocumentMessage: async (
    argdownEngine: ArgdownEngine,
    argdownDocument: vscode.TextDocument,
    config: ArgdownPreviewConfiguration
  ) => {
    const { svg, request } = await argdownEngine.exportSvg(
      argdownDocument,
      config
    );

    const settings = buildVizSettings(config, request);

    return { svg, settings };
  },
  contributeToInitialState: async (
    data: IArgdownPreviewState,
    argdownEngine: ArgdownEngine,
    argdownDocument: vscode.TextDocument,
    config: ArgdownPreviewConfiguration
  ) => {
    const { svg, dot, request } = await argdownEngine.exportSvg(
      argdownDocument,
      config
    );
    const settings = buildVizSettings(config, request);

    data.vizJs.dot = dot;
    data.vizJs.settings = settings;
    data.vizJs.svg = svg;
    return data;
  }
};
