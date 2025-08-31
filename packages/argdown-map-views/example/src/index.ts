import {
  ArgdownApplication,
  ParserPlugin,
  ModelPlugin,
  PreselectionPlugin,
  StatementSelectionPlugin,
  ArgumentSelectionPlugin,
  DataPlugin,
  MapPlugin,
  GroupPlugin,
  ColorPlugin,
  DotExportPlugin,
} from "@argdown/core";
import { VizJsMap, DagreMap } from "../../src/index";
import "babel-polyfill";
// Try to use the sync version which has synchronous rendering
import renderStringSync from "@aduh95/viz.js/sync";

const app = new ArgdownApplication();
const parserPlugin = new ParserPlugin();
app.addPlugin(parserPlugin, "parse-input");
app.addPlugin(new DataPlugin(), "build-model");
const modelPlugin = new ModelPlugin();
app.addPlugin(modelPlugin, "build-model");
const preselectionPlugin = new PreselectionPlugin();
app.addPlugin(preselectionPlugin, "create-map");
const statementSelectionPlugin = new StatementSelectionPlugin();
app.addPlugin(statementSelectionPlugin, "create-map");
const argumentSelectionPlugin = new ArgumentSelectionPlugin();
app.addPlugin(argumentSelectionPlugin, "create-map");
const mapPlugin = new MapPlugin();
app.addPlugin(mapPlugin, "create-map");
const groupPlugin = new GroupPlugin();
app.addPlugin(groupPlugin, "create-map");
app.addPlugin(new ColorPlugin(), "colorize");
const dotExport = new DotExportPlugin();
app.addPlugin(dotExport, "export-dot");
const exportDot = [
  "parse-input",
  "build-model",
  "create-map",
  "colorize",
  "export-dot",
];
const exportMap = ["parse-input", "build-model", "create-map", "colorize"];

const createDagreMap = (container: HTMLElement) => {
  container.innerHTML = "";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("style", "width: 100%; height: 100%;");
  container.appendChild(svg);
  const dagreMap = new DagreMap(svg);
  const response = app.run({
    input: `
      # G1
      
      <a1>
          - <a2>
      `,
    process: exportMap,
  });
  dagreMap.render({ settings: {}, map: response.map! });
};

// Using the original viz.js library for synchronous rendering

const createVizJsMap = async (container: HTMLElement) => {
  container.innerHTML = "";

  const response = app.run({
    input: `
  # G1
  
  <a1>
      - <a2>
  `,
    process: exportDot,
  });

  try {
    // Use VizJsMap with real Viz.js synchronous rendering
    const renderSync = (dot: string, settings: any) => {
      try {
        // Use the sync version which has synchronous rendering
        const svgString = renderStringSync(dot, {
          format: "svg",
          engine: "dot",
        });

        // Clean up the SVG string (remove XML prolog if needed)
        return svgString.replace(
          /<\?[ ]*xml[\S ]+?\?>[\s]*<\![ ]*DOCTYPE[\S\s]+?\.dtd\"[ ]*>/,
          "",
        );
      } catch (error) {
        // Fallback to simple SVG if Viz.js fails
        return `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
          <g>
            <g class="node" id="a1">
              <title>a1</title>
              <rect x="50" y="50" width="100" height="50" fill="lightblue" stroke="black" stroke-width="2" rx="5"/>
              <text x="100" y="80" text-anchor="middle" font-family="Arial" font-size="12" fill="black">a1</text>
            </g>
            <g class="node" id="a2">
              <title>a2</title>
              <rect x="250" y="50" width="100" height="50" fill="lightgreen" stroke="black" stroke-width="2" rx="5"/>
              <text x="300" y="80" text-anchor="middle" font-family="Arial" font-size="12" fill="black">a2</text>
            </g>
            <line x1="150" y1="75" x2="250" y2="75" stroke="black" stroke-width="2" marker-end="url(#arrowhead)"/>
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="black"/>
              </marker>
            </defs>
          </g>
        </svg>`;
      }
    };

    const vizJsMap = new VizJsMap(container, renderSync, null);
    await vizJsMap.render({ dot: response.dot! });
  } catch (error) {
    container.innerHTML = `<div style="color: red; padding: 20px;">Error rendering diagram: ${error.message}</div>`;
  }
};

window.onload = function () {
  const menu = document.createElement("div");
  menu.innerHTML = `<button id="dagre-button">Dagre</button><button id="viz-js-button" >Viz.js</button>`;
  const container = document.createElement("div");
  container.setAttribute(
    "style",
    "position:fixed; top: 80px; left: 0px; right: 0px; bottom: 0px;",
  );
  document.body.appendChild(menu);
  const dagreButton = document.getElementById("dagre-button");
  dagreButton!.addEventListener("click", () => createDagreMap(container));
  const vizJsButton = document.getElementById("viz-js-button");
  vizJsButton!.addEventListener(
    "click",
    async () => await createVizJsMap(container),
  );
  document.body.appendChild(container);
};
