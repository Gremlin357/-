import fs from "node:fs";

const svg = fs.readFileSync("генплан для Codex.svg", "utf8");
fs.writeFileSync("src/sceneData.js", `// Generated from the settlement plan. Update this file only through the export script.\nexport const sceneSvg = ${JSON.stringify(svg)};\n`);
console.log(`Embedded scene plan: ${svg.length} characters`);
