import fs from "node:fs";
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const swPath = "public/sw.js";
const sw = fs.readFileSync(swPath, "utf8");
const next = sw.replace(/const VERSION = ".*";/, `const VERSION = "${pkg.version}";`);
if (next !== sw) fs.writeFileSync(swPath, next);
