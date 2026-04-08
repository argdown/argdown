import { context } from "esbuild";
import {
  buildOptions,
  esbuildProblemMatcherPlugin,
  watch
} from "./esbuild.common";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { raw } from "esbuild-raw-plugin";

async function main() {
  const ctx = await context({
    ...buildOptions,
    entryPoints: {
      htmlView: "preview/htmlView.ts",
      dagreView: "preview/dagreView.ts",
      vizjsView: "preview/vizjsView.ts",
      pre: "preview/pre.ts"
    },
    platform: "browser",
    outdir: "dist/preview",
    plugins: [
      raw(),
      NodeGlobalsPolyfillPlugin({
        process: true,
        buffer: true
      }),
      esbuildProblemMatcherPlugin
    ],
    define: {
      global: "globalThis"
    }
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
