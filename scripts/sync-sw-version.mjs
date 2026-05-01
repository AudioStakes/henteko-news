import fs from "node:fs";
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const swPath = "public/sw.js";
const sw = fs.readFileSync(swPath, "utf8");
const versionPattern = /const VERSION = ".*";/;
if (!versionPattern.test(sw)) {
  throw new Error(`Could not find Service Worker version declaration matching ${versionPattern} in ${swPath}`);
}
const next = sw.replace(versionPattern, `const VERSION = "${pkg.version}";`);
if (next !== sw) fs.writeFileSync(swPath, next);
