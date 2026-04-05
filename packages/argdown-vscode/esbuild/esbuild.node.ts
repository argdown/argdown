import { context } from "esbuild";
import { buildOptions, watch } from "./esbuild.common";

async function main() {
  const ctx = await context({
    ...buildOptions,
    entryPoints: ["src/main.node.ts"],
    platform: "node"
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
