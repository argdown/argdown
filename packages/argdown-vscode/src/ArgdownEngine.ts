import {
  argdown,
  ArgdownTypes,
  IArgument,
  IEquivalenceClass,
  init,
  isGroupMapNode,
  stringifyArgdownData,
  type IArgdownRequest,
  type IMap,
  type IMapNode,
  type ISection
} from "@argdown/core";
import { Range, type TextDocument, type Uri } from "vscode";
import type { Logger } from "./Logger";
import type { ArgdownConfiguration } from "./config/ArgdownConfiguration";
import type { IArgdownConfigLoader } from "./config/IArgdownConfigLoader";
import { findElementAtPositionPlugin } from "./preview/FindElementAtPositionPlugin";

argdown.addPlugin(findElementAtPositionPlugin, "find-element-at-position");

export class ArgdownEngine {
  public constructor(
    private logger: Logger,
    private configLoader: IArgdownConfigLoader
  ) {
    let logLevel = "verbose";
    argdown.logger = {
      setLevel(level: string) {
        logLevel = level;
      },
      log(_level: string, message: string) {
        if (logLevel == "verbose") {
          logger.log(message);
        }
      }
    };
  }
  public exportHtml(doc: TextDocument, config: ArgdownConfiguration): string {
    const argdownConfig = config.argdownConfig || {};
    const input = doc.getText();
    const request: IArgdownRequest = {
      ...argdownConfig,
      input: input,
      process: ["parse-input", "build-model", "export-html"],
      html: {
        ...argdownConfig.html,
        headless: true
      },
      throwExceptions: false
    };
    const { html } = argdown.run(request);
    if (!html) throw new Error("No HTML response");
    return html;
  }
  public getMapNodeId(
    doc: TextDocument,
    config: ArgdownConfiguration,
    line: number,
    character: number
  ): string {
    const argdownConfig = config.argdownConfig;
    const input = doc.getText();
    const request: IArgdownRequest = {
      ...argdownConfig,
      input: input,
      findElementAtPosition: {
        line: line + 1,
        character: character + 1
      },
      process: [
        "parse-input",
        "build-model",
        "build-map",
        "colorize",
        "find-element-at-position"
      ],
      throwExceptions: false
    };
    const response = argdown.run(request);
    if (!response.elementAtPosition) {
      return "";
    }
    const title = response.elementAtPosition.title;
    let nodeType = ArgdownTypes.ARGUMENT_MAP_NODE;
    if (response.elementAtPosition.type === ArgdownTypes.EQUIVALENCE_CLASS) {
      nodeType = ArgdownTypes.STATEMENT_MAP_NODE;
    }
    if (!response.map) throw new Error("No map response");
    const node = this.findNodeInMapNodeTree(
      response.map.nodes,
      (n) => n.title === title && n.type === nodeType
    );
    if (!node) {
      return "";
    }
    return node.id || "";
  }
  public getRangeOfHeading(
    doc: TextDocument,
    config: ArgdownConfiguration,
    headingText: string
  ): Range {
    const argdownConfig = config.argdownConfig;
    const input = doc.getText();
    const request: IArgdownRequest = {
      ...argdownConfig,
      input: input,
      process: ["parse-input", "build-model"],
      throwExceptions: false
    };
    const response = argdown.run(request);
    if (!response.sections || response.sections.length == 0) {
      return new Range(0, 0, 0, 0);
    }
    const section = this.findSection(response.sections, headingText);
    if (section) {
      return new Range(
        (section.startLine || 1) - 1,
        (section.startColumn || 1) - 1,
        (section.startLine || 1) - 1,
        (section.startColumn || 1) - 1
      );
    }
    return new Range(0, 0, 0, 0);
  }
  private findSection(
    sections: ISection[],
    headingText: string
  ): ISection | null {
    for (const section of sections) {
      if (section.title === headingText) {
        return section;
      }
      if (section.children) {
        const descSection = this.findSection(section.children, headingText);
        if (descSection) {
          return descSection;
        }
      }
    }
    return null;
  }
  public getRangeOfMapNode(
    doc: TextDocument,
    config: ArgdownConfiguration,
    id: string
  ): Range {
    const argdownConfig = config.argdownConfig;
    const input = doc.getText();
    const request: IArgdownRequest = {
      ...argdownConfig,
      input: input,
      process: ["parse-input", "build-model", "build-map", "colorize"],
      throwExceptions: false
    };
    const response = argdown.run(request);
    if (!response.map) throw new Error("No map response");

    const node = this.findNodeInMapNodeTree(
      response.map.nodes,
      (n) => n.id === id
    );
    if (!node || !node.title) return new Range(0, 0, 0, 0);

    switch (node.type) {
      case ArgdownTypes.ARGUMENT_MAP_NODE: {
        if (!response.arguments) break;
        const argument = response.arguments[node.title];
        const desc = IArgument.getCanonicalMember(argument);
        if (!desc) break;
        return new Range(
          (desc.startLine || 1) - 1,
          (desc.startColumn || 1) - 1,
          (desc.endLine || 1) - 1,
          desc.endColumn || 1
        );
      }
      case ArgdownTypes.STATEMENT_MAP_NODE: {
        if (!response.statements) break;
        const eqClass = response.statements[node.title];
        const statement = IEquivalenceClass.getCanonicalMember(eqClass);
        if (!statement) break;

        return new Range(
          (statement.startLine || 1) - 1,
          (statement.startColumn || 1) - 1,
          (statement.endLine || 1) - 1,
          statement.endColumn || 1
        );
      }
      default:
        return new Range(0, 0, 0, 0);
    }
    return new Range(0, 0, 0, 0);
  }

  private findNodeInMapNodeTree(
    nodes: IMapNode[],
    handler: (n: IMapNode) => boolean
  ): IMapNode | null {
    for (const node of nodes) {
      if (handler(node)) {
        return node;
      }
      if (isGroupMapNode(node) && node.children) {
        const result = this.findNodeInMapNodeTree(node.children, handler);
        if (result) {
          return result;
        }
      }
    }
    return null;
  }
  public getMap(doc: TextDocument, config: ArgdownConfiguration): IMap {
    const argdownConfig = config.argdownConfig;
    const input = doc.getText();
    const request = {
      ...argdownConfig,
      input: input,
      inputPath: doc.uri.fsPath,
      process: [
        "parse-input",
        "build-model",
        "build-map",
        "transform-closed-groups",
        "colorize",
        "add-images"
      ],
      throwExceptions: false
    };
    const { map } = argdown.run(request);
    if (!map) throw new Error("No map in response");
    return map;
  }
  public exportMapJson(
    doc: TextDocument,
    config: ArgdownConfiguration
  ): string {
    const map = this.getMap(doc, config);
    return stringifyArgdownData(map);
  }
  public exportJson(doc: TextDocument, config: ArgdownConfiguration): string {
    const argdownConfig = config.argdownConfig;
    const input = doc.getText();
    const request = {
      ...argdownConfig,
      input: input,
      inputPath: doc.uri.fsPath,
      process: [
        "parse-input",
        "build-model",
        "build-map",
        "transform-closed-groups",
        "colorize",
        "export-json"
      ],
      throwExceptions: false
    };
    const { json } = argdown.run(request);
    if (!json) throw new Error("No JSON response");
    return json;
  }
  public exportDot(
    doc: TextDocument,
    config: ArgdownConfiguration
  ): { dot: string; request: IArgdownRequest } {
    const argdownConfig = config.argdownConfig || {};
    const input = doc.getText();
    const request = {
      ...argdownConfig,
      input: input,
      inputPath: doc.uri.fsPath,
      process: [
        "parse-input",
        "build-model",
        "build-map",
        "transform-closed-groups",
        "colorize",
        "add-images",
        "export-dot"
      ],
      throwExceptions: false
    };
    const { dot } = argdown.run(request);
    if (!dot) throw new Error("No DOT response");
    return { dot, request };
  }

  public async exportSvg(
    doc: TextDocument,
    config: ArgdownConfiguration
  ): Promise<{ svg: string; dot: string; request: IArgdownRequest }> {
    const argdownConfig = config.argdownConfig || {};
    const input = doc.getText();
    const request = {
      ...argdownConfig,
      input: input,
      inputPath: doc.uri.fsPath,
      process: [
        "parse-input",
        "build-model",
        "build-map",
        "transform-closed-groups",
        "colorize",
        "add-images",
        "export-dot",
        "export-svg"
      ],
      throwExceptions: false
    };
    await init();
    const { svg, dot } = argdown.run(request);
    if (!svg) throw new Error("No SVG response");
    if (!dot) throw new Error("No DOT response");

    return {
      svg,
      dot,
      request
    };
  }

  public async exportWebComponent(
    doc: TextDocument,
    config: ArgdownConfiguration
  ): Promise<string> {
    const argdownConfig = config.argdownConfig || {};
    const input = doc.getText();
    const request = {
      ...argdownConfig,
      input: input,
      inputPath: doc.uri.fsPath,
      process: [
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
      ],
      throwExceptions: false
    };
    await init();
    const { webComponent } = argdown.run(request);
    if (!webComponent) throw new Error("No web component response");
    return webComponent;
  }
  public exportGraphML(
    doc: TextDocument,
    config: ArgdownConfiguration
  ): string {
    const argdownConfig = config.argdownConfig || {};
    const input = doc.getText();
    const request = {
      ...argdownConfig,
      input: input,
      inputPath: doc.uri.fsPath,
      process: [
        "parse-input",
        "build-model",
        "build-map",
        "colorize",
        "add-images",
        "export-graphml"
      ],
      throwExceptions: false
    };
    const { graphml } = argdown.run(request);
    if (!graphml) throw new Error("No GraphML response");
    return graphml;
  }
  public async loadConfig(
    configFile: string | undefined,
    resource: Uri
  ): Promise<IArgdownRequest> {
    return await this.configLoader(configFile, resource, this.logger);
  }
}
