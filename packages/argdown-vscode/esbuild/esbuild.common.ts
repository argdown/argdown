import type { BuildOptions, Plugin } from "esbuild";

export const production = process.argv.includes("--production");
export const watch = process.argv.includes("--watch");

/**
 * This plugin hooks into the build process to print errors in a format that the problem matcher in
 * Visual Studio Code can understand.
 */
export const esbuildProblemMatcherPlugin: Plugin = {
  name: "esbuild-problem-matcher",

  setup(build) {
    build.onStart(() => {
      console.log("[watch] build started");
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        if (location == null) return;
        console.error(
          `    ${location.file}:${location.line}:${location.column}:`
        );
      });
      console.log("[watch] build finished");
    });
  }
};

export const buildOptions: BuildOptions = {
  bundle: true,
  format: "cjs",
  // minify: production, // minification does not work. Probably because we use functions.prototype.name somewhere: https://code.visualstudio.com/api/working-with-extensions/bundling-extension#minification
  sourcemap: !production,
  sourcesContent: false,
  outdir: "dist",
  external: ["vscode"],
  logLevel: "info",
  plugins: [esbuildProblemMatcherPlugin]
};
