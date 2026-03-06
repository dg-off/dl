import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const tunePath = path.join(repoRoot, "data", "portrait-tune.json");
const configPath = path.join(repoRoot, "data", "portrait-config.json");

const toKey = (value) => value.toLowerCase().trim().replace(/\s+/g, "_");
const toPortraitKey = (value) => {
  const key = toKey(value);
  const overrides = {
    mo: "mo_&_krill",
    krill: "mo_&_krill",
    viper: "vyper",
    doorman: "the_doorman",
  };
  return overrides[key] ?? key;
};

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const writeJson = (filePath, value) => {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const tune = readJson(tunePath);
const config = readJson(configPath);

const charKey = typeof tune.charKey === "string" ? toPortraitKey(tune.charKey) : "";
if (!charKey) {
  console.error("portrait-tune.json needs a valid `charKey`.");
  process.exit(1);
}

const settings = {
  x: Number.isFinite(tune.x) ? tune.x : 215,
  y: Number.isFinite(tune.y) ? tune.y : 340,
  scale: Number.isFinite(tune.scale) ? tune.scale : 1.92,
  rotation: Number.isFinite(tune.rotation) ? tune.rotation : 0,
};

config[charKey] = settings;

writeJson(configPath, config);
console.log(`Saved ${charKey} -> data/portrait-config.json`);
console.log(
  `x=${settings.x} y=${settings.y} scale=${settings.scale} rotation=${settings.rotation}`
);
