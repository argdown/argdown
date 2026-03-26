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
    entryPoints: ["src/browser-main.ts"],
    platform: "browser",
    define: {
      "process.env.NODE_DEBUG": "false",
      "process.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV || "development"
      ),
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

    // inject: ["process/browser"]
    // fallback: {
    //   assert: require.resolve("assert"),
    //   fs: false,
    //   stream: false,
    //   crypto: require.resolve("crypto-browserify"),
    //   path: require.resolve("path-browserify"),
    //   vm: require.resolve("vm-browserify")
    // }
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
