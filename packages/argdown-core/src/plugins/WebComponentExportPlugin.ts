import { IRequestHandler, IArgdownPlugin } from "../IArgdownPlugin.js";
import {
  mergeDefaults,
  DefaultSettings,
  ensure,
  isObject,
  escapeHtml,
  escapeCSSWidthOrHeight
} from "../utils.js";
import { checkResponseFields } from "../ArgdownPluginError.js";
import { IArgdownRequest } from "../index.js";
import defaultsDeep from "lodash.defaultsdeep";

/**
 * Settings used by the WebComponentExportPlugin
 */
export interface IWebComponentExportSettings {
  width?: string;
  height?: string;
  initialView?: "map" | "source";
  withoutZoom?: boolean;
  withoutMaximize?: boolean;
  withoutLogo?: boolean;
  withoutHeader?: boolean;
  withoutFigure?: boolean;
  views?: {
    map?: boolean;
    source?: boolean;
  };
  useArgVu?: boolean;
  figureCaption?: string;
  addWebComponentScript?: boolean;
  addGlobalStyles?: boolean;
  addWebComponentPolyfill?: boolean;
  webComponentScriptUrl?: string;
  globalStylesUrl?: string;
  webComponentPolyfillUrl?: string;
}
declare module "../index.js" {
  interface IArgdownRequest {
    /**
     * Settings for the [[WebComponentExportPlugin]]
     */
    webComponent?: IWebComponentExportSettings;
  }
  interface IArgdownResponse {
    /**
     * JSON data
     *
     * Provided by the [[WebComponentExportPlugin]]
     */
    webComponent?: string;
  }
}

const webcomponentVersion = "2.0.1";
const defaultSettings: DefaultSettings<IWebComponentExportSettings> = {
  initialView: "map",
  views: ensure.object({
    map: true,
    source: true
  }),
  withoutFigure: false,
  useArgVu: false,
  addGlobalStyles: true,
  addWebComponentScript: true,
  addWebComponentPolyfill: true,
  globalStylesUrl: `https://cdn.jsdelivr.net/npm/@argdown/web-components@${webcomponentVersion}/dist/argdown-map.css`,
  webComponentScriptUrl: `https://cdn.jsdelivr.net/npm/@argdown/web-components@${webcomponentVersion}/dist/argdown-map.js`,
  webComponentPolyfillUrl:
    "https://cdn.jsdelivr.net/npm/@webcomponents/webcomponentsjs/webcomponents-bundle.js"
};
/**
 * Generates the web component html that makes it possible to embed Argdown maps into html files.
 * The result ist stored in the [[IArgdownResponse.webComponent]] response object property.
 *
 * Depends on data from: [[DotToSvgExportPlugin]] or [[SyncDotSvgExportPlugin]] and [[HighlightSourcePlugin]]
 */
export class WebComponentExportPlugin implements IArgdownPlugin {
  name = "WebComponentExportPlugin";
  defaults: IWebComponentExportSettings;
  constructor(config?: IWebComponentExportSettings) {
    this.defaults = defaultsDeep({}, config, defaultSettings);
  }
  getSettings(request: IArgdownRequest) {
    if (isObject(request.webComponent)) {
      return request.webComponent;
    } else {
      request.webComponent = {};
      return request.webComponent;
    }
  }
  prepare: IRequestHandler = (request) => {
    mergeDefaults(this.getSettings(request), this.defaults);
  };
  run: IRequestHandler = (request, response) => {
    const settings = this.getSettings(request);

    const requiredResponseFields: string[] = [];
    if (settings?.views?.source) {
      requiredResponseFields.push("highlightedSource");
    }
    if (settings?.views?.map) {
      requiredResponseFields.push("svg");
    }
    checkResponseFields(this, response, requiredResponseFields);

    const map = settings?.views?.map
      ? `<div slot="map">${response.svg}</div>`
      : "";
    const source = settings?.views?.source
      ? `<div slot="source" class="${settings.useArgVu ? "argvu" : ""}">${
          response.highlightedSource
        }</div>`
      : "";
    let style = "";
    if (settings.width) {
      style += `width: ${escapeCSSWidthOrHeight(settings.width)};`;
    }
    if (settings.height) {
      style += `height: ${escapeCSSWidthOrHeight(settings.height)};`;
    }
    if (style !== "") {
      style = `style="${style}"`;
    }
    const flags = [
      "withoutZoom",
      "withoutMaximize",
      "withoutLogo",
      "withoutHeader"
    ] as const;

    const flagAttrs = flags
      .filter((flag) => settings[flag])
      .map((x) => x + "='true'")
      .join(" ");

    response.webComponent = `<argdown-map ${
      settings.withoutFigure ? style : ""
    } ${flagAttrs} initialView="${
      settings.initialView
    }">${source}${map}</argdown-map>`;
    if (!settings?.withoutFigure) {
      let figureCaption =
        settings.figureCaption || this.createFigureCaption(request);
      if (figureCaption && figureCaption !== "") {
        figureCaption = `<figcaption>${escapeHtml(figureCaption)}</figcaption>`;
      }
      response.webComponent = `<figure ${style} role="group" class="argdown-figure">${response.webComponent}${figureCaption}</figure>`;
    }
    if (settings.addWebComponentScript) {
      response.webComponent = `<script type="module" src="${settings.webComponentScriptUrl}"></script>${response.webComponent}`;
    }
    if (settings.addWebComponentPolyfill) {
      response.webComponent = `<script src="${settings.webComponentPolyfillUrl}" type="module"></script>${response.webComponent}`;
    }
    if (settings.addGlobalStyles) {
      response.webComponent = `<link rel="stylesheet" type="text/css" href="${settings.globalStylesUrl}">${response.webComponent}`;
    }
    return response;
  };
  createFigureCaption = (request: IArgdownRequest) => {
    if (request.title) {
      let caption = request.title;
      if (request.subTitle) {
        caption = `${request.title} — ${request.subTitle}`;
      }
      if (request.abstract) {
        caption = `${caption}: ${request.abstract}`;
      }
      return caption;
    } else if (request.abstract) {
      return request.abstract;
    }
    return "";
  };
}
