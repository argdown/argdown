import * as dagreD3 from "dagre-d3";
import pixelWidth from "string-pixel-width";
import { select } from "d3-selection";
import "d3-transition";
import {
  ArgdownTypes,
  IMapNode,
  IGroupMapNode,
  isGroupMapNode,
  IMap,
  mergeDefaults,
  ensure,
  DefaultSettings,
  isObject
} from "@argdown/core";
import { splitByLineWidth, splitByCharactersInLine } from "@argdown/core";
import { graphlib } from "dagre-d3";
import { ZoomManager, OnZoomChangedHandler } from "./ZoomManager.js";
import { CanSelectNode, OnSelectionChangedHandler } from "./CanSelectNode.js";

export interface IDagreLabelSettings {
  bold?: boolean;
  font?: string;
  fontSize?: number;
  charactersInLine?: number;
}
export interface IDagreNodeSettings {
  lineWidth?: number;
  rx?: number;
  ry?: number;
  title?: IDagreLabelSettings;
  text?: IDagreLabelSettings;
}
export interface IDagreSettings {
  rankDir?: string;
  rankSep?: number;
  nodeSep?: number;
  measureLineWidth?: boolean;
  argument?: IDagreNodeSettings;
  statement?: IDagreNodeSettings;
  group?: {
    lineWidth?: number;
    title?: IDagreLabelSettings;
  };
}
export const dagreDefaultSettings: DefaultSettings<IDagreSettings> = {
  rankDir: "BT",
  rankSep: 50,
  nodeSep: 70,
  measureLineWidth: false,
  argument: ensure.object({
    lineWidth: 150,
    rx: 5,
    ry: 5,
    title: ensure.object({
      bold: true,
      font: "arial",
      fontSize: 14,
      charactersInLine: 25
    }),
    text: ensure.object({
      bold: false,
      font: "arial",
      fontSize: 14,
      charactersInLine: 25
    })
  }),
  statement: ensure.object({
    lineWidth: 150,
    rx: 5,
    ry: 5,
    title: ensure.object({
      bold: true,
      font: "arial",
      fontSize: 14,
      charactersInLine: 25
    }),
    text: ensure.object({
      bold: false,
      font: "arial",
      fontSize: 14,
      charactersInLine: 25
    })
  }),
  group: ensure.object({
    lineWidth: 300,
    title: ensure.object({
      bold: false,
      font: "arial",
      fontSize: 18,
      charactersInLine: 40
    })
  })
};
export interface IDagreMapProps {
  settings?: IDagreSettings;
  map: IMap;
  selectedNode?: string | null;
  position?: { x?: number; y?: number };
  scale?: number;
}
export class DagreMap implements CanSelectNode {
  svgElement: SVGSVGElement;
  zoomManager: ZoomManager;
  selectedElement?: SVGGraphicsElement | null;
  onSelectionChanged?: OnSelectionChangedHandler;
  constructor(
    svgElement: SVGSVGElement,
    onZoomChanged?: OnZoomChangedHandler,
    onSelectionChanged?: OnSelectionChangedHandler
  ) {
    this.svgElement = svgElement;
    this.zoomManager = new ZoomManager(onZoomChanged);
    this.onSelectionChanged = onSelectionChanged;
  }
  render(props: IDagreMapProps) {
    const settings: IDagreSettings = isObject(props.settings)
      ? props.settings
      : {};
    mergeDefaults(settings, dagreDefaultSettings);

    if (
      !this.svgElement ||
      !props.map ||
      !props.map.nodes ||
      !props.map.edges ||
      props.map.nodes.length === 0
    ) {
      // console.log('svg or map undefined')
      const svg = select(this.svgElement);
      svg.selectAll("*").remove();
      return;
    }
    // Create the input graph
    const g = new dagreD3.graphlib.Graph({ compound: true, multigraph: true });

    g.setGraph({
      rankdir: settings.rankDir,
      ranksep: settings.rankSep,
      nodesep: settings.nodeSep,
      marginx: 20,
      marginy: 20
    }).setDefaultEdgeLabel(function () {
      return {};
    });

    for (const node of props.map.nodes) {
      createDagreNode(node, g, null, settings);
    }

    for (const edge of props.map.edges) {
      const relationType = edge.relationType as any;
      const edgeProperties: { [key: string]: any } = {
        id: edge.id,
        class: relationType
      };
      if (relationType === "contradictory") {
        edgeProperties.arrowhead = "diamond";
        edgeProperties.arrowtail = "diamond";
      } else if (
        relationType === "equal" ||
        relationType === "potentially-equal"
      ) {
        edgeProperties.arrowhead = "normal";
        edgeProperties.arrowtail = "normal";
      }
      // if the map data is json data, from and to will be ids, otherwise the original objects
      const from = isObject(edge.from) ? edge.from.id : edge.from;
      const to = isObject(edge.to) ? edge.to.id : edge.to;
      g.setEdge(from, to, edgeProperties, edge.id);
    }

    //   const nodes = g.nodes();

    //   for (let v of nodes) {
    //     const node = g.node(v);
    //     // Round the corners of the nodes
    //     node.rx = node.ry = 5;
    //   }

    // Create the renderer
    const render = new dagreD3.render();
    // Add our custom arrow
    render.arrows().diamond = function normal(parent, id, edge, type) {
      const marker = parent
        .append("marker")
        .attr("id", id)
        .attr("viewBox", "0 0 10 10")
        .attr("refX", 9)
        .attr("refY", 5)
        .attr("markerUnits", "strokeWidth")
        .attr("markerWidth", 10)
        .attr("markerHeight", 10)
        .attr("orient", "auto");

      const path = marker
        .append("path")
        .attr("d", "M 0 5 L 5 2 L 10 5 L 5 8 z")
        .style("stroke-width", 0)
        .style("stroke-dasharray", "1,0");
      (<any>dagreD3).util.applyStyle(path, (<any>edge)[type + "Style"]);
      if ((<any>edge)[type + "Class"]) {
        path.attr("class", (<any>edge)[type + "Class"]);
      }
    };

    // Set up an SVG group so that we can translate the final graph.
    const svg = select(this.svgElement);
    svg.selectAll("*").remove();

    svg.append("g");
    const svgGraph = select<SVGGraphicsElement, null>("g");
    svgGraph.attr("class", "dagre");

    // Run the renderer. This is what draws the final graph.
    try {
      render(svgGraph as any, g as any); // don't know whats wrong with types, so using any for now
    } catch (e) {
      console.log(e);
    }
    const width = (g.graph() as any).width || 0;
    const height = (g.graph() as any).height || 0;

    this.zoomManager.init(svg, svgGraph, width, height);
    if (!props.scale || !props.position) {
      this.zoomManager.showAllAndCenterMap();
    } else {
      this.zoomManager.setZoom(
        props.position.x || 0,
        props.position.y || 0,
        props.scale,
        0
      );
    }
    svgGraph?.attr(
      "height",
      this.zoomManager.state.size.width * this.zoomManager.state.scale + 40
    );
    if (props.selectedNode) {
      this.selectNode(props.selectedNode);
    }
  }
  deselectNode() {
    this._deselectNode();
    if (this.onSelectionChanged) {
      this.onSelectionChanged(null);
    }
  }
  private _deselectNode() {
    if (this.selectedElement) {
      this.selectedElement.classList.remove("selected");
    }
  }
  selectNode(id: string): void {
    this._deselectNode();
    this.selectedElement = select<SVGGraphicsElement, null>(`#${id}`).node()!;
    if (this.selectedElement) {
      this.selectedElement.classList.add("selected");
      this.zoomManager.moveToElement(this.selectedElement);
    }
    if (this.onSelectionChanged) {
      this.onSelectionChanged(id);
    }
  }
}

const createTSpan = (
  str: string,
  font: string,
  fontSize: number,
  bold: boolean,
  color: string,
  dy = "1em"
) => {
  const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
  tspan.setAttributeNS(
    "http://www.w3.org/XML/1998/namespace",
    "xml:space",
    "preserve"
  );
  let styles = `font-family: ${font}; font-size:${fontSize}px; color:${color};`;
  if (bold) {
    styles = styles + "font-weight: bold;";
  }
  tspan.setAttribute("style", styles);
  tspan.setAttribute("dy", dy);
  // tspan.setAttribute("x", "0");
  tspan.setAttribute("text-anchor", "middle");
  tspan.innerHTML = escapeHtml(str);
  tspan.setAttribute("x", "0");

  // var lineWidth = tspan.getComputedTextLength();
  // const width = 200;
  // tspan.setAttribute("x", (width + (width - lineWidth)) * 0.5);
  return tspan;
};

function escapeHtml(str: string) {
  str = str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;");

  return str;
}
const createDagreNode = function (
  node: IMapNode,
  g: graphlib.Graph,
  currentGroup: IGroupMapNode | null,
  settings: IDagreSettings
) {
  const svgLabel = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );

  const docFrag = document.createDocumentFragment();
  let maxWidth = 0;
  let lineWidth = 0;
  let rx = 0;
  let ry = 0;
  let titleSettings = null;
  let textSettings = null;
  if (node.type === ArgdownTypes.ARGUMENT_MAP_NODE) {
    lineWidth = settings.argument!.lineWidth!;
    titleSettings = settings.argument!.title;
    textSettings = settings.argument!.text;
    rx = settings.argument!.rx!;
    ry = settings.argument!.ry!;
  } else if (node.type === ArgdownTypes.STATEMENT_MAP_NODE) {
    lineWidth = settings.statement!.lineWidth!;
    titleSettings = settings.statement!.title;
    textSettings = settings.statement!.text;
    rx = settings.statement!.rx!;
    ry = settings.statement!.ry!;
  } else {
    lineWidth = settings.group!.lineWidth!;
    titleSettings = settings.group!.title;
    textSettings = null;
  }
  if (node.labelTitle) {
    const {
      bold = true,
      fontSize = 14,
      font = "arial",
      charactersInLine = 25
    } = titleSettings || {};
    const titleArr = settings.measureLineWidth
      ? splitByLineWidth(node.labelTitle, {
          maxWidth: lineWidth,
          fontSize,
          bold,
          font
        })
      : splitByCharactersInLine(node.labelTitle, charactersInLine, true);
    for (const str of titleArr) {
      const width = pixelWidth(str, {
        font: font as any,
        size: fontSize,
        bold: bold
      });
      maxWidth = width > maxWidth ? width : maxWidth;
      docFrag.appendChild(
        createTSpan(str, font, fontSize, bold, node.fontColor!)
      );
    }
  }
  if (node.labelText) {
    const {
      bold = false,
      fontSize = 14,
      font = "arial",
      charactersInLine = 25
    } = textSettings || {};
    const textArr = settings.measureLineWidth
      ? splitByLineWidth(node.labelText, {
          maxWidth: lineWidth,
          fontSize,
          bold,
          font
        })
      : splitByCharactersInLine(node.labelText, charactersInLine, true);
    let dy = node.labelTitle ? "1.5em" : "1em";
    for (const str of textArr) {
      const width = pixelWidth(str, {
        font: font as any,
        size: fontSize,
        bold: bold
      });
      maxWidth = width > maxWidth ? width : maxWidth;
      docFrag.appendChild(
        createTSpan(str, font, fontSize, bold, node.fontColor!, dy)
      );
      dy = "1em";
    }
  }
  svgLabel.appendChild(docFrag);
  const translate = (lineWidth - (lineWidth - maxWidth)) * 0.5;
  svgLabel.setAttribute("transform", `translate(${translate})`);
  const nodeProperties: { [key: string]: any } = {
    labelType: "svg",
    id: node.id,
    label: svgLabel,
    class: [<string>node.type, node.discussionPointType, node.entityKind]
      .filter(Boolean)
      .join(" "),
    rx,
    ry,
    width: lineWidth + 20
  };
  // Old ForeignObject label (buggy in Chrome):
  // nodeProperties.label = '<div class="node-label">';
  // if (node.labelTitle) {
  //   nodeProperties.label += "<h3>" + escapeHtml(node.labelTitle) + "</h3>";
  // }
  // // eslint-disable-next-line
  // if (
  //   node.labelText &&
  //   (node.type === ArgdownTypes.STATEMENT_MAP_NODE ||
  //     node.type === ArgdownTypes.ARGUMENT_MAP_NODE)
  // ) {
  //   nodeProperties.label += "<p>" + escapeHtml(node.labelText) + "</p>";
  // }
  // nodeProperties.label += "</div>";
  if (node.color) {
    if (node.type === ArgdownTypes.STATEMENT_MAP_NODE) {
      nodeProperties.style = `stroke:${node.color};`;
    } else {
      nodeProperties.style = `fill:${node.color};`;
    }
  }

  if (isGroupMapNode(node)) {
    nodeProperties.clusterLabelPos = "top";
    nodeProperties.class += " level-" + node.level;
  }
  g.setNode(node.id, nodeProperties);
  if (currentGroup) {
    g.setParent(node.id, currentGroup.id);
  }
  if (isGroupMapNode(node) && node.children) {
    for (const child of node.children) {
      createDagreNode(child, g, node, settings);
    }
  }
};
