// See: https://rollupjs.org/introduction/

import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

/** @type {import('rollup').RollupOptions[]} */
const config = [
  {
    input: "src/create.ts",
    output: {
      esModule: true,
      file: "dist/create/index.js",
      format: "es",
      sourcemap: true,
    },
    plugins: [typescript({ outDir: "dist/create" }), nodeResolve(), commonjs()],
  },
  {
    input: "src/publish.ts",
    output: {
      esModule: true,
      file: "dist/publish/index.js",
      format: "es",
      sourcemap: true,
    },
    plugins: [typescript({ outDir: "dist/publish" }), nodeResolve(), commonjs()],
  },
];

export default config;
