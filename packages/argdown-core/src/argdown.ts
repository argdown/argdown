import { ArgdownApplication } from "./ArgdownApplication.js";
import { ParserPlugin } from "./plugins/ParserPlugin.js";
import { ModelPlugin } from "./plugins/ModelPlugin.js";
import { PreselectionPlugin } from "./plugins/PreselectionPlugin.js";
import { StatementSelectionPlugin } from "./plugins/StatementSelectionPlugin.js";
import { ArgumentSelectionPlugin } from "./plugins/ArgumentSelectionPlugin.js";
import { MapPlugin } from "./plugins/MapPlugin.js";
import { GroupPlugin } from "./plugins/GroupPlugin.js";
import { ColorPlugin } from "./plugins/ColorPlugin.js";
import { DotExportPlugin } from "./plugins/DotExportPlugin.js";
import { SyncDotToSvgExportPlugin } from "./plugins/SyncDotToSvgExportPlugin.js";
import { HighlightSourcePlugin } from "./plugins/HighlightSourcePlugin.js";
import { RegroupPlugin } from "./plugins/RegroupPlugin.js";
import { DataPlugin } from "./plugins/DataPlugin.js";
import { ClosedGroupPlugin } from "./plugins/ClosedGroupPlugin.js";
import { HtmlExportPlugin } from "./plugins/HtmlExportPlugin.js";
import { JSONExportPlugin } from "./plugins/JSONExportPlugin.js";
import { GraphMLExportPlugin } from "./plugins/GraphMLExportPlugin.js";
import { WebComponentExportPlugin } from "./plugins/WebComponentExportPlugin.js";
import { ExplodeArgumentsPlugin } from "./plugins/ExplodeArgumentsPlugin.js";
import { MapNodeImagesPlugin } from "./plugins/MapNodeImagesPlugin.js";

import { Graphviz } from "@hpcc-js/wasm-graphviz";
import { IncludePositionsPlugin } from "./plugins/IncludePositionsPlugin.js";
/***
 * Default instance of a sync ArgdownApplication with all plugins of @argdown/core loaded and default processes defined.
 *
 * If you are using Argdown in node and can use async processes use the AsyncArgdownApplication instance provided by @argdown/node instead.
 */
export const argdown = new ArgdownApplication();
argdown.addPlugin(new ParserPlugin(), "parse-input");
argdown.addPlugin(new DataPlugin(), "build-model");
argdown.addPlugin(new ModelPlugin(), "build-model");
argdown.addPlugin(new ExplodeArgumentsPlugin(), "build-model");
argdown.addPlugin(new RegroupPlugin(), "build-model");
argdown.addPlugin(new PreselectionPlugin(), "build-map");
argdown.addPlugin(new StatementSelectionPlugin(), "build-map");
argdown.addPlugin(new ArgumentSelectionPlugin(), "build-map");
argdown.addPlugin(new MapPlugin(), "build-map");
argdown.addPlugin(new GroupPlugin(), "build-map");
argdown.addPlugin(new ClosedGroupPlugin(), "transform-closed-groups");
argdown.addPlugin(new ColorPlugin(), "colorize");
argdown.addPlugin(new MapNodeImagesPlugin(), "add-images");
argdown.addPlugin(new HtmlExportPlugin(), "export-html");
argdown.addPlugin(new JSONExportPlugin(), "export-json");
argdown.addPlugin(new DotExportPlugin(), "export-dot");
argdown.addPlugin(new GraphMLExportPlugin(), "export-graphml");
argdown.addPlugin(new HighlightSourcePlugin(), "highlight-source");
argdown.addPlugin(new WebComponentExportPlugin(), "export-web-component");
argdown.addPlugin(new IncludePositionsPlugin(), "include-positions");

/**
 * Initializes the argdown application by loading Graphviz and adding the SyncDotToSvgExportPlugin.
 *
 */
export async function init() {
  if (argdown.getPlugin("SyncDotToSvgExportPlugin", "export-svg")) {
    return;
  }
  const graphviz = await Graphviz.load();
  argdown.addPlugin(new SyncDotToSvgExportPlugin(graphviz), "export-svg");
}

argdown.defaultProcesses = {
  "export-svg": [
    "parse-input",
    "build-model",
    "build-map",
    "transform-closed-groups",
    "colorize",
    "add-images",
    "export-dot",
    "export-svg"
  ],
  "export-dot": [
    "parse-input",
    "build-model",
    "build-map",
    "transform-closed-groups",
    "colorize",
    "add-images",
    "export-dot"
  ],
  "export-graphml": [
    "parse-input",
    "build-model",
    "build-map",
    "colorize",
    "add-images",
    "export-graphml"
  ],
  "export-json": [
    "parse-input",
    "build-model",
    "build-map",
    "colorize",
    "add-images",
    "export-json"
  ],
  "export-html": ["parse-input", "build-model", "colorize", "export-html"],
  "export-web-component": [
    "parse-input",
    "build-model",
    "build-map",
    "transform-closed-groups",
    "colorize",
    "add-images",
    "export-dot",
    "export-svg",
    "highlight-source",
    "export-web-component"
  ]
};
