import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { context } from "esbuild";
import {
  buildOptions,
  esbuildProblemMatcherPlugin,
  watch
} from "./esbuild.common";

async function main() {
  const ctx = await context({
    ...buildOptions,
    entryPoints: ["src/server.browser.ts"],
    platform: "browser",
    define: {
      global: "globalThis"
    },
    plugins: [
      NodeGlobalsPolyfillPlugin({
        process: true,
        buffer: true
      }),
      {
        name: "path-alias",
        setup(build) {
          build.onResolve({ filter: /^path$/ }, () => {
            return { path: require.resolve("path-browserify") };
          });
        }
      },
      esbuildProblemMatcherPlugin
    ]
  });
  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
