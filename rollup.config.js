import path from "path";
import ts from "rollup-plugin-typescript2";
import json from "@rollup/plugin-json";

if (!process.env.TARGET) {
  throw new Error("TARGET package must be specified via --environment flag.");
}

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
const packageFormats = packageOptions.formats || defaultFormats;

const tsPlugin = ts({
  tsconfig: path.resolve(__dirname, "tsconfig.json"),
  cacheRoot: path.resolve(__dirname, "node_modules/.rts2_cache"),
});

const packageConfigs = packageFormats.map((format) =>
  createConfig(format, outputConfigs[format])
);

if (process.env.NODE_ENV === "production") {
  packageFormats.forEach((format) => {
    if (/^(global|esm-browser)(-runtime)?/.test(format)) {
      packageConfigs.push(createMinifiedConfig(format));
    }
  });
}

export default packageConfigs;

function createConfig(format, output, plugins = []) {
  let entryFile = /runtime$/.test(format) ? `src/runtime.ts` : `src/index.ts`;

  const isGlobalBuild = /global/.test(format);

  output.exports = "auto";
  output.sourcemap = !!process.env.SOURCE_MAP;

  if (isGlobalBuild) {
    output.name = packageOptions.name;
  }

  return {
    input: resolve(entryFile),
    output,
    plugins: [
      json({
        namedExports: false,
      }),
      tsPlugin,
      ...plugins
    ],
  };
}

function createMinifiedConfig(format) {
  const { terser } = require("rollup-plugin-terser");
  return createConfig(
    format,
    {
      file: outputConfigs[format].file.replace(/\.js$/, ".prod.js"),
      format: outputConfigs[format].format,
    },
    [
      terser({
        module: /^esm/.test(format),
        compress: {
          ecma: 2015,
          pure_getters: true,
        },
        safari10: true,
      }),
    ]
  );
}
