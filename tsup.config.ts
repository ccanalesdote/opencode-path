import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  target: "node18",
  outDir: "dist",
  clean: true,
  shebang: "#!/usr/bin/env node",
  bundle: true,
  minify: false,
  sourcemap: true,
});
