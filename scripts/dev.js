// esbuild 在 dev 环境更快

const { build } = require("esbuild");
const { resolve, relative } = require("path");
// 格式化命令行参数
const args = require("minimist")(process.argv.slice(2));
// 控制台高亮插件
const chalk = require("chalk");

// 打包的目标包名
const target = args._[0] || "vue";
// 打包的格式，默认使用 global
const format = args.f || "global";
// 目标包的 package.json
const pkg = require(resolve(__dirname, `../packages/${target}/package.json`));

// 打包输出的格式
const outputFormat = format.startsWith("global")
  ? "iife"
  : format === "cjs"
  ? "cjs"
  : "esm";

// 打包输出包名的后缀
const postfix = format.endsWith("-runtime")
  ? `runtime.${format.replace(/-runtime$/, "")}`
  : format;

// 打包输出的文件路径
const outfile = resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${postfix}.js`
);
// 获取输出文件的相对路径
const relativeOutfile = relative(process.cwd(), outfile);

// 使用 esbuild 进行打包
// 为什么 pnpm build 使用 rollup，而 pnpm dev 使用 esbuild？
// 因为 esbuild 更快。rollup 打包产物更小

build({
  entryPoints: [resolve(__dirname, `../packages/${target}/src/index.ts`)],
  outfile,
  bundle: true,

  sourcemap: true,
  format: outputFormat,
  globalName: pkg.buildOptions?.name,
  platform: format === "cjs" ? "node" : "browser",

  define: {
    __VERSION__: `"${pkg.version}"`,
    __DEV__: `true`,
  },
  watch: {
    onRebuild(error) {
      if (!error) console.log(`rebuilt: ${relativeOutfile}`);
    },
  },
}).then(() => {
  console.log(chalk.green(`watching: ${relativeOutfile}`));
});
