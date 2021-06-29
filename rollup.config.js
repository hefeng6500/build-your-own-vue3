import path from "path";
import ts from "rollup-plugin-typescript2";
import json from "@rollup/plugin-json";
import { getBabelOutputPlugin } from "@rollup/plugin-babel";

const masterVersion = require("./package.json").version;
const packagesDir = path.resolve(__dirname, "packages");
const packageDir = path.resolve(packagesDir, process.env.TARGET);
const resolve = (p) => path.resolve(packageDir, p);
const pkg = require(resolve(`package.json`));
const packageOptions = pkg.buildOptions || {};
const name = packageOptions.filename || path.basename(packageDir);

const outputConfigs = {
  "esm-bundler": {
    file: resolve(`dist/${name}.esm-bundler.js`),
    format: `es`,
  },
  "esm-browser": {
    file: resolve(`dist/${name}.esm-browser.js`),
    format: `es`,
  },
  cjs: {
    file: resolve(`dist/${name}.cjs.js`),
    format: `cjs`,
  },
  global: {
    file: resolve(`dist/${name}.global.js`),
    format: `iife`,
  },

  // runtime-only builds, for main "vue" package only
  "esm-bundler-runtime": {
    file: resolve(`dist/${name}.runtime.esm-bundler.js`),
    format: `es`,
  },
  "esm-browser-runtime": {
    file: resolve(`dist/${name}.runtime.esm-browser.js`),
    format: "es",
  },
  "global-runtime": {
    file: resolve(`dist/${name}.runtime.global.js`),
    format: "iife",
  },
};
// const defaultFormats = ["esm-bundler", "cjs"];
// const inlineFormats = process.env.FORMATS && process.env.FORMATS.split(",");

// const packageFormats = inlineFormats || packageOptions.formats || defaultFormats

// packageOptions.formats 配置了多种打包格式
const packageFormats = packageOptions.formats || defaultFormats

console.log("packageFormats", packageFormats);

const tsPlugin = ts({
  tsconfig: path.resolve(__dirname, "tsconfig.json"),
  cacheRoot: path.resolve(__dirname, "node_modules/.rts2_cache"),
});

const packageConfigs = packageFormats.map((format) =>
  createConfig(format, outputConfigs[format])
);

export default packageConfigs;

function createConfig(format, output, plugins = []) {
  let entryFile = /runtime$/.test(format) ? `src/runtime.ts` : `src/index.ts`;

  const isGlobalBuild = /global/.test(format)
  
  output.exports = 'auto';
  
  if (isGlobalBuild) {
    output.name = packageOptions.name
  }

  return {
    input: resolve(entryFile),
    output,
    plugins: [
      json({
        namedExports: false,
      }),
      tsPlugin,
      getBabelOutputPlugin({
        allowAllFormats: true,
        presets: ["@babel/preset-env"],
      }),
    ],
  };
}
