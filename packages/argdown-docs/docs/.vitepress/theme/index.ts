// https://vitepress.dev/guide/custom-theme
import { h } from "vue";
import { inBrowser, type Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";

// Web Component, required by the @argdown/markdown-it-plugin. But we can not import it from there because VitePress blocks it. Therefore create the plugin without importing the script and import the web component here. See also config.mts
// This is only imported in the browser, because it uses "document" to define the custom elements.
if (inBrowser) {
  // @ts-ignore: TODO: Refactor web-components to module
  import("@argdown/web-components");
  // import("@argdown/web-components/style.css");
}

// Vue Components
import ArgdownCheatSheet from "../components/ArgdownCheatSheet.vue";

// Styles
import "./style.css";
import "./md-it-container-custom.css";

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    });
  },

  enhanceApp({ app, router, siteData }) {
    app.component("ArgdownCheatSheet", ArgdownCheatSheet);
  }
} satisfies Theme;
