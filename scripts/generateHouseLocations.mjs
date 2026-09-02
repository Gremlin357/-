import fs from "node:fs";

const svg = fs.readFileSync("генплан для Codex.svg", "utf8");
const result = [];
const pattern = /<rect\s+([^>]*\bfill="(?:white|#FFFFFF)"[^>]*)\/>/gi;
for (const match of svg.matchAll(pattern)) {
  const attrs = match[1];
  const read = (name) => Number((attrs.match(new RegExp(`\\b${name}="([^\"]+)"`)) || [])[1]);
  const rotation = Number((attrs.match(/transform="rotate\(([-\d.]+)/i) || [])[1]) || 0;
  const house = { x: read("x"), y: read("y"), width: read("width"), height: read("height"), rotation };
  if ([house.x, house.y, house.width, house.height].every(Number.isFinite)) result.push(house);
}

fs.writeFileSync("src/houseLocations.js", `// Generated from the settlement SVG.\nexport const houseLocations = ${JSON.stringify(result)};\n`);
console.log(`Generated ${result.length} house locations`);
