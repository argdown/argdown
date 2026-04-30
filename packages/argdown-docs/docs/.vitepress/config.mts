import { defineConfig } from "vitepress";
import createArgdownPlugin from "@argdown/markdown-it-plugin";
import { customBlockContainer } from "./markdown-it-container-config";
import { ArgdownCheatSheetPlugin } from "./markdown-it-plugin-argdown-cheat-sheet";
import { withPwa } from "@vite-pwa/vitepress";

const domain = "https://argdown.org";
const discord = "https://discord.gg/rFe7nuDbzs";

// Don't include webcomponent scripts, because vitepress does not allow <script> tags inside of markdown plugins. We add the scripts in the theme.
const MarkdownItPlugin = createArgdownPlugin({
  webComponent: {
    addWebComponentScript: false,
    addGlobalStyles: false,
    addWebComponentPolyfill: false
  }
});

// https://vitepress.dev/reference/site-config
export default withPwa(
  defineConfig({
    title: "Argdown",
    ignoreDeadLinks: true,
    description:
      "Argdown is a simple syntax for complex argumentation. Writing lists of pros & cons in Argdown is as simple as writing a twitter message, but you can also use it to logically reconstruct whole debates and visualize them as argument maps.",
    pwa: {
      workbox: {
        navigateFallbackDenylist: [
          /^\/sandbox\//,
          /^\/argdown-core\//,
          /^\/argdown-node\//
        ]
      }
    },
    head: [
      [
        "link",
        {
          rel: "shortcut icon",
          type: "image/x-icon",
          href: "/favicon.ico"
        }
      ],
      [
        "link",
        {
          rel: "icon",
          type: "image/png",
          href: "/favicon-32x32.png",
          sizes: "32x32"
        }
      ],
      [
        "link",
        {
          rel: "icon",
          type: "image/png",
          href: `/favicon-16x16.png`,
          sizes: "16x16"
        }
      ],
      ["link", { rel: "manifest", href: `/site.webmanifest` }],
      [
        "link",
        {
          rel: "apple-touch-icon-precomposed",
          href: `/apple-touch-icon.png`
        }
      ]
    ],
    // Exclude argdown-map webcomponent. See: https://github.com/vuejs/vitepress/discussions/468
    vue: {
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === "argdown-map"
        }
      }
    },
    sitemap: {
      hostname: domain
    },

    markdown: {
      config: async (md) => {
        md.use(...customBlockContainer("buttonlist"));
        md.use(...customBlockContainer("definition"));
        md.use(await MarkdownItPlugin);
        md.use(ArgdownCheatSheetPlugin);
      }
    },
    themeConfig: {
      logo: "/argdown-mark.svg",
      search: {
        provider: "local"
      },
      outline: {
        level: "deep"
      },
      sidebar: {
        "/changes/": [
          {
            text: "Changes",
            items: [
              {
                text: "Release Notes 2026",
                link: "/changes/"
              },
              {
                text: "Release Notes 2022",
                link: "/changes/2022"
              },
              {
                text: "Release Notes 2021",
                link: "/changes/2021"
              },
              {
                text: "Release Notes 2020",
                link: "/changes/2020"
              },
              {
                text: "Release Notes 2019",
                link: "/changes/2019"
              },
              {
                text: "Release Notes 2018",
                link: "/changes/2018"
              }
            ]
          }
        ],

        "/guide/": [
          {
            text: "Getting started",
            items: [
              {
                text: "Introduction",
                link: "/guide/"
              },
              {
                text: "Installing the VS Code extension",
                link: "/guide/installing-the-vscode-extension"
              },
              {
                text: "Installing the commandline tool",
                link: "/guide/installing-the-commandline-tool"
              },
              {
                text: "A first example",
                link: "/guide/a-first-example"
              }
            ]
          },
          {
            text: "Creating argument maps",
            items: [
              {
                text: "Introduction",
                link: "/guide/creating-argument-maps/"
              },
              {
                text: "Elements of an argument map",
                link: "/guide/elements-of-an-argument-map"
              },
              {
                text: "Changing the graph layout",
                link: "/guide/changing-the-graph-layout"
              },
              {
                text: "Creating statement and argument nodes",
                link: "/guide/creating-statement-and-argument-nodes"
              },
              {
                text: "Creating edges",
                link: "/guide/creating-edges"
              },
              {
                text: "Creating oldschool argument maps and inference trees",
                link: "/guide/creating-oldschool-argument-maps-and-inference-trees"
              },
              {
                text: "Creating group nodes",
                link: "/guide/creating-group-nodes"
              },
              {
                text: "Changing the node style",
                link: "/guide/changing-the-node-style"
              },
              {
                text: "Changing the node size",
                link: "/guide/changing-the-node-size"
              },
              {
                text: "Adding images",
                link: "/guide/adding-images"
              },
              {
                text: "Colorizing maps",
                link: "/guide/colorizing-maps"
              },
              {
                text: "Using logical symbols and emojis",
                link: "/guide/using-logical-symbols-and-emojis"
              }
            ]
          },
          {
            text: "Publishing argument maps",
            items: [
              {
                text: "Introduction",
                link: "/guide/publishing-argument-maps/"
              },
              {
                text: "Embedding your maps in a webpage",
                link: "/guide/embedding-your-maps-in-a-webpage"
              },
              {
                text: "Using Argdown in Markdown",
                link: "/guide/using-argdown-in-markdown"
              },
              {
                text: "Publishing Argdown Markdown with Pandoc",
                link: "/guide/publishing-argdown-markdown-with-pandoc"
              },
              {
                text: "Integrating Argdown Markdown into applications",
                link: "/guide/integrating-argdown-markdown-into-applications"
              }
            ]
          },
          {
            text: "Configuration",
            items: [
              {
                text: "Introduction",
                link: "/guide/configuration/"
              },
              {
                text: "Using configuration files",
                link: "/guide/configuration-with-config-files"
              },
              {
                text: "Using frontmatter for configuration",
                link: "/guide/configuration-in-the-frontmatter-section"
              },
              {
                text: "Running custom processes",
                link: "/guide/running-custom-processes"
              },
              {
                text: "Configuration cheatsheet",
                link: "/guide/configuration-cheatsheet"
              }
            ]
          },
          {
            text: "Extending Argdown",
            items: [
              {
                text: "Introduction",
                link: "/guide/extending-argdown/"
              },
              {
                text: "Writing custom plugins",
                link: "/guide/writing-custom-plugins"
              },
              {
                text: "Loading custom plugins in a config file",
                link: "/guide/loading-custom-plugins-in-a-config-file"
              },
              {
                text: "Using Argdown in your application",
                link: "/guide/using-argdown-in-your-application"
              }
            ]
          }
        ]
      },
      nav: [
        { text: "Home", link: "/" },
        { text: "Guide", link: "/guide/" },
        { text: "Syntax", link: "/syntax/" },
        {
          text: "API",
          items: [
            { text: "Overview", link: "/api/" },
            {
              text: "@argdown/core",
              link: domain + "/argdown-core/index.html"
            },
            { text: "@argdown/node", link: domain + "/argdown-node/index.html" }
          ]
        },
        { text: "Changes", link: "/changes/" },
        { text: "Sandbox", link: domain + "/sandbox/html" },
        { text: "Discord", link: discord }
      ]
    }
  })
);
