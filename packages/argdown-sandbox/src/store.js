import { defineStore } from "pinia";
import _ from "lodash";
import { dagreDefaultSettings } from "@argdown/map-views";
import { vizJsDefaultSettings } from "@argdown/map-views";
import {
  ArgdownApplication,
  ParserPlugin,
  ModelPlugin,
  RegroupPlugin,
  ClosedGroupPlugin,
  ColorPlugin,
  HtmlExportPlugin,
  JSONExportPlugin,
  DataPlugin,
  PreselectionPlugin,
  StatementSelectionPlugin,
  ArgumentSelectionPlugin,
  MapPlugin,
  GroupPlugin,
  DotExportPlugin,
  StatementSelectionMode,
  LabelMode,
  tokensToString,
  astToString,
  GraphMLExportPlugin,
  ExplodeArgumentsPlugin,
} from "@argdown/core";
import axios from "axios";

const app = new ArgdownApplication();
const parserPlugin = new ParserPlugin();
const dataPlugin = new DataPlugin();
const modelPlugin = new ModelPlugin();
const explodeArgumentsPlugin = new ExplodeArgumentsPlugin();
const regroupPlugin = new RegroupPlugin();
const colorPlugin = new ColorPlugin();

const htmlExport = new HtmlExportPlugin({
  headless: true,
});
const jsonExport = new JSONExportPlugin({ removeEmbeddedRelations: true });
const preselectionPlugin = new PreselectionPlugin();
const statementSelectionPlugin = new StatementSelectionPlugin();
const argumentSelectionPlugin = new ArgumentSelectionPlugin();
const mapPlugin = new MapPlugin();
const groupPlugin = new GroupPlugin();
const dotExport = new DotExportPlugin();
const graphMLExport = new GraphMLExportPlugin();
import primer from "!!raw-loader!../public/examples/argdown-primer.argdown";

app.addPlugin(parserPlugin, "parse-input");
app.addPlugin(dataPlugin, "build-model");
app.addPlugin(modelPlugin, "build-model");
app.addPlugin(explodeArgumentsPlugin, "build-model");
app.addPlugin(regroupPlugin, "build-model");
app.addPlugin(colorPlugin, "colorize");
app.addPlugin(preselectionPlugin, "build-map");
app.addPlugin(statementSelectionPlugin, "build-map");
app.addPlugin(argumentSelectionPlugin, "build-map");
app.addPlugin(mapPlugin, "build-map");
app.addPlugin(groupPlugin, "build-map");
app.addPlugin(new ClosedGroupPlugin(), "transform-closed-groups");
app.addPlugin(htmlExport, "export-html");
app.addPlugin(dotExport, "export-dot");
app.addPlugin(graphMLExport, "export-graphml");
app.addPlugin(jsonExport, "export-json");

var examples = {
  "argdown-primer": {
    id: "argdown-primer",
    title: "Argdown Primer",
    url: "/sandbox/examples/argdown-primer.argdown",
    cachedContent: primer,
  },
  greenspan: {
    id: "greenspan",
    title:
      "Why the Fed didn't Intervene to Prevent the 2008 Financial Crisis -- An Analysis of Alan Greenspan's Arguments",
    url: "/sandbox/examples/greenspan-schefczyk_hardwrap.argdown",
  },
  softdrugs: {
    id: "softdrugs",
    title: "Pros and Cons Legalisation of Soft Drugs -- A Simple Analysis",
    url: "/sandbox/examples/legalisation-softdrugs.argdown",
  },
  semmelweis: {
    id: "semmelweis",
    title:
      "A Stylized Reconstruction of the Scientific Debate That led Ignaz Semmelweis to Understand Childbed Fever",
    url: "/sandbox/examples/semmelweis_betz.argdown",
  },
  "state-censorship": {
    id: "state-censorship",
    title:
      "Censorship from the State -- Some Pros and Cons Reconstructed in Detail",
    url: "/sandbox/examples/state-censorship.argdown",
  },
  populism: {
    id: "populism",
    title: "The Core Argument of Populism",
    url: "/sandbox/examples/Populism-Core-Argument-Argdown-Example.argdown",
  },
};

export const useArgdownStore = defineStore("argdown", {
  state: () => ({
    argdownInput: primer,
    examples: examples,
    useArgVu: false,
    config: {
      selection: {
        excludeDisconnected: true,
        statementSelectionMode: StatementSelectionMode.WITH_TITLE,
      },
      map: {
        statementLabelMode: LabelMode.HIDE_UNTITLED,
        argumentLabelMode: LabelMode.HIDE_UNTITLED,
      },
      group: {
        groupDepth: 2,
      },
      dot: {
        graphVizSettings: {
          rankdir: "BT",
          concentrate: "false",
          ratio: "auto",
          size: "10,10",
        },
      },
      dagre: _.defaultsDeep({}, dagreDefaultSettings),
      vizJs: _.defaultsDeep({}, vizJsDefaultSettings),
      model: {
        removeTagsFromText: false,
      },
      logLevel: "error",
    },
    viewState: "default",
    showSettings: false,
    showSaveAsPngDialog: false,
    pngScale: 1,
  }),

  getters: {
    argdownData: (state) => {
      const request = _.defaultsDeep(
        {
          input: state.argdownInput,
          process: ["parse-input", "build-model"],
        },
        state.config,
      );
      try {
        return app.run(request);
      } catch (e) {
        if (request.logLevel === "verbose") {
          console.log(e);
        }
        return {};
      }
    },
    configData(state) {
      const data = this.argdownData;
      return _.defaultsDeep({}, data.frontMatter, state.config);
    },
    examplesList: (state) => {
      return state.examples ? Object.values(state.examples) : [];
    },
    html() {
      const data = this.argdownData;
      if (!data?.ast) {
        return null;
      }
      const request = _.defaultsDeep(
        {
          process: ["colorize", "export-html"],
        },
        data.frontMatter,
        this.configData,
      );
      const response = app.run(request, data);
      return response.html;
    },
    dot() {
      const data = this.argdownData;
      if (!data?.ast) {
        return null;
      }
      const request = _.defaultsDeep(
        {
          process: [
            "build-map",
            "transform-closed-groups",
            "colorize",
            "export-dot",
          ],
        },
        data.frontMatter,
        this.configData,
      );
      const response = app.run(request, data);
      return response.dot;
    },
    graphml() {
      const data = this.argdownData;
      if (!data?.ast) {
        return null;
      }
      const request = _.defaultsDeep(
        {
          process: ["build-map", "colorize", "export-graphml"],
        },
        data.frontMatter,
        this.configData,
      );
      const response = app.run(request, data);
      return response.graphml;
    },
    json() {
      const data = this.argdownData;
      if (!data?.ast) {
        return null;
      }
      const request = _.defaultsDeep(
        {
          process: ["build-map", "colorize", "export-json"],
        },
        data.frontMatter,
        this.configData,
      );
      const response = app.run(request, data);
      return response.json;
    },
    parserErrors() {
      return this.argdownData?.parserErrors || [];
    },
    lexerErrors() {
      return this.argdownData?.lexerErrors || [];
    },
    statements() {
      return this.argdownData?.statements || [];
    },
    arguments() {
      return this.argdownData?.arguments || [];
    },
    relations() {
      return this.argdownData?.relations || [];
    },
    ast() {
      return this.argdownData?.ast ? astToString(this.argdownData.ast) : null;
    },
    tokens() {
      const data = this.argdownData;
      // eslint-disable-next-line
      return data?.tokens ? tokensToString(data.tokens) : null;
    },
    map() {
      const data = this.argdownData;
      if (!data?.ast) {
        return null;
      }
      const request = _.defaultsDeep(
        {
          process: ["build-map", "colorize", "transform-closed-groups"],
        },
        data.frontMatter,
        this.configData,
      );
      const response = app.run(request, data);
      return response.map;
    },
    tags() {
      return this.argdownData?.tags || [];
    },
    useArgVuState: (state) => {
      return state.useArgVu;
    },
  },

  actions: {
    setUseArgVu(value) {
      this.useArgVu = value;
    },
    setArgdownInput(value) {
      this.argdownInput = value;
    },
    setViewState(value) {
      this.viewState = value;
    },
    cacheExample({ id, content }) {
      var example = this.examples[id];
      if (example) {
        example.cachedContent = content;
      }
    },
    toggleSettings() {
      this.showSettings = !this.showSettings;
    },
    openSaveAsPngDialog() {
      this.showSaveAsPngDialog = true;
    },
    closeSaveAsPngDialog() {
      this.showSaveAsPngDialog = false;
    },
    async loadExample(payload) {
      var example = this.examples[payload.id];
      if (!example) {
        throw new Error("Could not find example");
      }
      if (example.cachedContent) {
        this.setArgdownInput(example.cachedContent);
        return;
      }
      const response = await axios.get(example.url);
      this.cacheExample({ id: example.id, content: response.data });
      this.setArgdownInput(response.data);
    },
  },
});
