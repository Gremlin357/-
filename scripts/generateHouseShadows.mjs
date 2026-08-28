import fs from "node:fs";

const svg = fs.readFileSync("генплан для Codex.svg", "utf8");
const SVG_W = 10144;
const SVG_H = 3831;
const WORLD_W = 160;
const SCALE = WORLD_W / SVG_W;
const OFFSET_X = 4961;
const OFFSET_Y = 9221;
const groundY = 0.08 + 0.1 + 0.004;
const sun = { x: -45, y: 80, z: 45 };
const target = { x: -13, y: 0, z: -1 };
const direction = normalize({ x: sun.x - target.x, y: sun.y - target.y, z: sun.z - target.z });

function normalize(v) {
  const length = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / length, y: v.y / length, z: v.z / length };
}

function worldPoint(x, y) {
  return { x: (SVG_W / 2 - (x - OFFSET_X)) * SCALE, z: (SVG_H / 2 - (y - OFFSET_Y)) * SCALE };
}

function hull(points) {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.z - b.z);
  const cross = (o, a, b) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  const lower = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower.at(-2), lower.at(-1), point) <= 0) lower.pop();
    lower.push(point);
  }
  const upper = [];
  for (const point of [...sorted].reverse()) {
    while (upper.length >= 2 && cross(upper.at(-2), upper.at(-1), point) <= 0) upper.pop();
    upper.push(point);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

const result = [];
const rectPattern = /<rect\s+([^>]*\bfill="(?:white|#FFFFFF)"[^>]*)\/>/gi;
for (const match of svg.matchAll(rectPattern)) {
  const attrs = match[1];
  const read = (name) => Number((attrs.match(new RegExp(`\\b${name}="([^\"]+)"`)) || [])[1]);
  const rotation = Number((attrs.match(/transform="rotate\(([-\d.]+)/i) || [])[1]) || 0;
  const x = read("x");
  const y = read("y");
  const width = read("width");
  const height = read("height");
  if (![x, y, width, height].every(Number.isFinite)) continue;

  const angle = rotation * Math.PI / 180;
  const center = worldPoint(x + width / 2, y + height / 2);
  const corners = [[-width / 2, -height / 2], [width / 2, -height / 2], [width / 2, height / 2], [-width / 2, height / 2]];
  const points = corners.map(([cx, cy]) => {
    const rx = cx * Math.cos(angle) - cy * Math.sin(angle);
    const rz = cx * Math.sin(angle) + cy * Math.cos(angle);
    const base = { x: center.x + rx * SCALE, z: center.z + rz * SCALE };
    const distance = (groundY - 0.65) / direction.y;
    return { x: base.x + direction.x * distance, z: base.z + direction.z * distance };
  });
  result.push(hull(points).map(({ x: px, z }) => [Number(px.toFixed(5)), Number(z.toFixed(5))]));
}

fs.mkdirSync("models", { recursive: true });
fs.writeFileSync("models/shadows.js", `// Generated for the standard sun position.\nexport const houseShadows = ${JSON.stringify(result)};\n`);
console.log(`Generated ${result.length} house shadows`);

