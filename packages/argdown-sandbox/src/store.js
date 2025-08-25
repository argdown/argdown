import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
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

export const useArgdownStore = defineStore('argdown', () => {
  // State
  const argdownInput = ref(primer);
  const examplesData = ref(examples);
  const useArgVu = ref(false);
  const config = ref({
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
  });
  const viewState = ref("default");
  const showSettings = ref(false);
  const showSaveAsPngDialog = ref(false);
  const pngScale = ref(1);

  // Computed properties (getters)
  const argdownData = computed(() => {
    const request = _.defaultsDeep(
      {
        input: argdownInput.value,
        process: ["parse-input", "build-model"],
      },
      config.value,
    );
    try {
      const result = app.run(request);
      return result;
    } catch (e) {
      if (request.logLevel === "verbose") {
        console.log(e);
      }
      return {};
    }
  });

  const configData = computed(() => {
    const data = argdownData.value;
    return _.defaultsDeep({}, data.frontMatter, config.value);
  });

  const examplesList = computed(() => {
    return examplesData.value ? Object.values(examplesData.value) : [];
  });

  const html = computed(() => {
    const input = argdownInput.value;
    const request = _.defaultsDeep(
      {
        input: input,
        process: ["parse-input", "build-model", "colorize", "export-html"],
      },
      config.value,
    );
    try {
      const response = app.run(request);
      return response.html;
    } catch (e) {
      if (request.logLevel === "verbose") {
        console.log(e);
      }
      return null;
    }
  });

  const dot = computed(() => {
    const data = argdownData.value;
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
      configData.value,
    );
    const response = app.run(request, data);
    return response.dot;
  });

  const graphml = computed(() => {
    const data = argdownData.value;
    if (!data?.ast) {
      return null;
    }
    const request = _.defaultsDeep(
      {
        process: ["build-map", "colorize", "export-graphml"],
      },
      data.frontMatter,
      configData.value,
    );
    const response = app.run(request, data);
    return response.graphml;
  });

  const json = computed(() => {
    const data = argdownData.value;
    if (!data?.ast) {
      return null;
    }
    const request = _.defaultsDeep(
      {
        process: ["build-map", "colorize", "export-json"],
      },
      data.frontMatter,
      configData.value,
    );
    const response = app.run(request, data);
    return response.json;
  });

  const parserErrors = computed(() => {
    return argdownData.value?.parserErrors || [];
  });

  const lexerErrors = computed(() => {
    return argdownData.value?.lexerErrors || [];
  });

  const statements = computed(() => {
    return argdownData.value?.statements || [];
  });

  const arguments_ = computed(() => {
    return argdownData.value?.arguments || [];
  });

  const relations = computed(() => {
    return argdownData.value?.relations || [];
  });

  const ast = computed(() => {
    return argdownData.value?.ast ? astToString(argdownData.value.ast) : null;
  });

  const tokens = computed(() => {
    const data = argdownData.value;
    return data?.tokens ? tokensToString(data.tokens) : null;
  });

  const map = computed(() => {
    const data = argdownData.value;
    if (!data?.ast) {
      return null;
    }
    const request = _.defaultsDeep(
      {
        process: ["build-map", "colorize", "transform-closed-groups"],
      },
      data.frontMatter,
      configData.value,
    );
    const response = app.run(request, data);
    return response.map;
  });

  const tags = computed(() => {
    return argdownData.value?.tags || [];
  });

  const useArgVuState = computed(() => {
    return useArgVu.value;
  });

  // Actions
  function setUseArgVu(value) {
    useArgVu.value = value;
  }

  function setArgdownInput(value) {
    // Only update if we have a valid string value
    if (typeof value === 'string') {
      argdownInput.value = value;
    } else if (value && typeof value === 'object') {
      // For objects, be more conservative - only update if we can extract meaningful content
      if (value.content && typeof value.content === 'string') {
        argdownInput.value = value.content;
      } else if (value.data && typeof value.data === 'string') {
        argdownInput.value = value.data;
      } else if (value.text && typeof value.text === 'string') {
        argdownInput.value = value.text;
      } else {
        return;
      }
    } else {
      return;
    }
  }

  function setViewState(value) {
    viewState.value = value;
  }

  function cacheExample({ id, content }) {
    var example = examplesData.value[id];
    if (example) {
      example.cachedContent = content;
    }
  }

  function toggleSettings() {
    showSettings.value = !showSettings.value;
  }

  function openSaveAsPngDialog() {
    showSaveAsPngDialog.value = true;
  }

  function closeSaveAsPngDialog() {
    showSaveAsPngDialog.value = false;
  }

  async function loadExample(payload) {
    var example = examplesData.value[payload.id];
    if (!example) {
      throw new Error("Could not find example");
    }
    if (example.cachedContent) {
      setArgdownInput(example.cachedContent);
      return;
    }
    const response = await axios.get(example.url);
    // Ensure we cache the string content
    const content = typeof response.data === 'string' ? response.data : String(response.data || '');
    cacheExample({ id: example.id, content: content });
    setArgdownInput(content);
  }

  return {
    // State
    argdownInput,
    examples: examplesData,
    useArgVu,
    config,
    viewState,
    showSettings,
    showSaveAsPngDialog,
    pngScale,
    
    // Computed properties
    argdownData,
    configData,
    examplesList,
    html,
    dot,
    graphml,
    json,
    parserErrors,
    lexerErrors,
    statements,
    arguments: arguments_,
    relations,
    ast,
    tokens,
    map,
    tags,
    useArgVuState,
    
    // Actions
    setUseArgVu,
    setArgdownInput,
    setViewState,
    cacheExample,
    toggleSettings,
    openSaveAsPngDialog,
    closeSaveAsPngDialog,
    loadExample,
  };
});
