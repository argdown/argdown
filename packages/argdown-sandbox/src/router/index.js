import { createRouter, createWebHistory } from "vue-router";
import HtmlOutput from "@/components/HtmlOutput";
import HtmlNavigation from "@/components/HtmlNavigation";
import JSONOutput from "@/components/JSONOutput";
// import ArgMLOutput from '@/components/ArgMLOutput'
import DotOutput from "@/components/DotOutput";
import GraphMLOutput from "@/components/GraphMLOutput";
import DebugLexerParserOutput from "@/components/DebugLexerParserOutput";
import DebugModelOutput from "@/components/DebugModelOutput";
import DebugNavigation from "@/components/DebugNavigation";
import MapNavigation from "@/components/MapNavigation";
import { useArgdownStore } from "../store";

const VizJsOutput = () => import("@/components/VizJsOutput.vue");

const DagreD3Output = () => import("@/components/DagreD3Output.vue");

const router = createRouter({
  history: createWebHistory("/sandbox/"),
  scrollBehavior(to) {
    if (to.hash) {
      return {
        el: to.hash,
      };
    }
  },
  routes: [
    {
      path: "/debug/lexer-parser",
      name: "debug-lexer-parser",
      components: {
        default: DebugLexerParserOutput,
        "output-header": DebugNavigation,
      },
    },
    { path: "/debug", redirect: { name: "debug-lexer-parser" } },
    {
      path: "/debug/model",
      name: "debug-model",
      components: {
        default: DebugModelOutput,
        "output-header": DebugNavigation,
      },
    },
    {
      path: "/map/viz-js",
      name: "map-viz-js",
      components: {
        default: VizJsOutput,
        "output-header": MapNavigation,
      },
    },
    {
      path: "/map/dagre-d3",
      name: "map-dagre-d3",
      components: {
        default: DagreD3Output,
        "output-header": MapNavigation,
      },
    },
    {
      path: "/map/dot",
      name: "map-dot",
      components: {
        default: DotOutput,
        "output-header": MapNavigation,
      },
    },
    {
      path: "/map/graphml",
      name: "map-graphml",
      components: {
        default: GraphMLOutput,
        "output-header": MapNavigation,
      },
    },
    {
      path: "/map",
      redirect: { name: "map-viz-js" }
    },
    {
      path: "/html",
      name: "html",
      components: {
        default: HtmlOutput,
        "output-header": HtmlNavigation,
      },
    },
    {
      path: "/json",
      name: "json",
      component: JSONOutput,
    },
    { path: "/", redirect: { name: "html" } },
    {
      path: "/html/source",
      name: "html-source",
      components: {
        default: HtmlOutput,
        "output-header": HtmlNavigation,
      },
      props: {
        default: { source: true },
      },
    },
  ],
});

let currentArgdownQuery = "";
router.beforeEach((to, from, next) => {
  if (to.query.argdown && to.query.argdown != currentArgdownQuery) {
    const store = useArgdownStore();
    store.setArgdownInput(decodeURIComponent(to.query.argdown));
    currentArgdownQuery = to.query.argdown;
    delete to.query.argdown;
    next(to);
    return;
  }
  next();
});

export default router;
