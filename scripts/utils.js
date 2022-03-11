const fs = require("fs");
const chalk = require("chalk");

// 读取 packages 目录下需要打包的目录
const targets = (exports.targets = fs
  .readdirSync("packages")
  .filter((f) => {
    if (!fs.statSync(`packages/${f}`).isDirectory()) {
      return false;
    }
    const pkg = require(`../packages/${f}/package.json`);
    if (pkg.private && !pkg.buildOptions) {
      return false;
    }
    return true;
  }));

// 模糊匹配需要打包的 package name
exports.fuzzyMatchTarget = (partialTargets, includeAllMatching) => {
  const matched = [];
  partialTargets.forEach((partialTarget) => {
    for (const target of targets) {
      if (target.match(partialTarget)) {
        matched.push(target);
        if (!includeAllMatching) {
          break;
        }
      }
    }
  });
  if (matched.length) {
    return matched;
  } else {
    console.log();
    console.error(
      `  ${chalk.bgRed.white(" ERROR ")} ${chalk.red(
        `Target ${chalk.underline(partialTargets)} not found!`
      )}`
    );
    console.log();

    process.exit(1);
  }
};
