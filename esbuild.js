const fs = require("fs");
const path = require("path");

const outDir = "./dist";

const treeSitterWasmPlugin = {
  name: "treeSitterWasm",
  setup(build) {
    const wasmPaths = [
      "./node_modules/web-tree-sitter/tree-sitter.wasm",
      "./node_modules/tree-sitter-sourcepawn/tree-sitter-sourcepawn.wasm",
    ];
    wasmPaths.forEach((wasmPath) => {
      fs.copyFileSync(wasmPath, path.join(outDir, path.basename(wasmPath)));
    });
  },
};

const nativeNodeModulesPlugin = {
  name: "native-node-modules",
  setup(build) {
    // If a ".node" file is imported within a module in the "file" namespace, resolve
    // it to an absolute path and put it into the "node-file" virtual namespace.
    build.onResolve({ filter: /\.node$/, namespace: "file" }, (args) => ({
      path: require.resolve(args.path, { paths: [args.resolveDir] }),
      namespace: "node-file",
    }));

    // Files in the "node-file" virtual namespace call "require()" on the
    // path from esbuild of the ".node" file in the output directory.
    build.onLoad({ filter: /.*/, namespace: "node-file" }, (args) => ({
      contents: `
        import path from ${JSON.stringify(args.path)}
        try { module.exports = require(path) }
        catch {}
      `,
    }));

    // If a ".node" file is imported within a module in the "node-file" namespace, put
    // it in the "file" namespace where esbuild's default loading behavior will handle
    // it. It is already an absolute path since we resolved it to one above.
    build.onResolve({ filter: /\.node$/, namespace: "node-file" }, (args) => ({
      path: args.path,
      namespace: "file",
    }));

    // Tell esbuild's default loading behavior to use the "file" loader for
    // these ".node" files.
    let opts = build.initialOptions;
    opts.loader = opts.loader || {};
    opts.loader[".node"] = "file";
  },
};

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}
const watch = process.argv[2] === "watch";

require("esbuild")
  .build({
    entryPoints: ["./src/spIndex.ts"],
    bundle: true,
    sourcemap: true,
    minify: !watch,
    outfile: `${outDir}/spIndex.js`,
    logLevel: "info",
    external: ["vscode"],
    format: "cjs",
    platform: "node",
    plugins: [treeSitterWasmPlugin, nativeNodeModulesPlugin],
    watch: watch,
  })
  .catch(() => process.exit(1));
