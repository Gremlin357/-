import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import planUrl from "../генплан для Codex.svg?url";

const host = document.querySelector("#scene");
const card = document.querySelector("#plot-card");
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(host.clientWidth, host.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdbe5dd);
scene.fog = new THREE.Fog(0xdbe5dd, 120, 250);
const camera = new THREE.PerspectiveCamera(41, host.clientWidth / host.clientHeight, 0.1, 500);
camera.position.set(0, 84, 100);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 30;
controls.maxDistance = 190;

scene.add(new THREE.HemisphereLight(0xffffff, 0x758775, 2.5));
const sun = new THREE.DirectionalLight(0xffffff, 2.8);
sun.position.set(-45, 80, 45);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -100;
sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100;
sun.shadow.camera.bottom = -100;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 220;
sun.shadow.bias = -0.00015;
scene.add(sun);

const map = new THREE.Group();
scene.add(map);
const SVG_W = 10144;
const SVG_H = 3831;
const WORLD_W = 160;
const SCALE = WORLD_W / SVG_W;

const layers = {
  "#D7EAD3": { name: "Территория вне поселка", elevation: 0, height: 0.1, color: 0xd7ead3 },
  "#B7DAD2": { name: "Общая территория", elevation: 0.12, height: 0.12, color: 0xb7dad2 },
  "#C8D6D9": { name: "Региональная дорога", elevation: 0.26, height: 0.12, color: 0xc8d6d9 },
  "#9AA0A3": { name: "Дороги поселка", elevation: 0.4, height: 0.12, color: 0x9aa0a3 },
  "#59A37E": { name: "Лес", elevation: 0.54, height: 0.12, color: 0x59a37e },
  "#EAE3CA": { name: "Общественные пространства", elevation: 0.68, height: 0.12, color: 0xeae3ca },
  "#CD80DD": { name: "Участки домов", elevation: 0.82, height: 0.12, color: 0xcd80dd },
};
const forestPolygons = [];
const treeTrunk = new THREE.MeshStandardMaterial({ color: 0x75583d, roughness: 0.9 });
const treeCrowns = [
  new THREE.MeshStandardMaterial({ color: 0x256b43, roughness: 0.92 }),
  new THREE.MeshStandardMaterial({ color: 0x3d8252, roughness: 0.92 }),
];
const tallFirCrowns = [
  new THREE.MeshStandardMaterial({ color: 0x1f603d, roughness: 0.92 }),
  new THREE.MeshStandardMaterial({ color: 0x35764a, roughness: 0.92 }),
];

function fillOf(path) {
  return (path.userData?.style?.fill || "").toUpperCase();
}

function isHouse(path) {
  const fill = fillOf(path);
  return fill === "WHITE" || fill === "#FFFFFF";
}

function worldPoint(point) {
  return new THREE.Vector2((SVG_W / 2 - point.x) * SCALE, (SVG_H / 2 - point.y) * SCALE);
}

function extrudeShape(shape, height, material) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    curveSegments: 2,
  });
  geometry.scale(-SCALE, SCALE, 1);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(SVG_W * SCALE / 2, 0, SVG_H * SCALE / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.castShadow = height > 0.75;
  return mesh;
}

function addTerritory(path, definition) {
  const material = new THREE.MeshStandardMaterial({ color: definition.color, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const shapes = SVGLoader.createShapes(path);
  shapes.forEach((shape) => {
    const mesh = extrudeShape(shape, definition.height, material);
    mesh.position.y = definition.elevation;
    mesh.renderOrder = Math.round(definition.elevation * 100);
    map.add(mesh);
  });
  if (definition.color === 0x59a37e) {
    shapes.forEach((shape) => forestPolygons.push(shape.extractPoints(8).shape));
  }
}

function addHouse(spec) {
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xf8f8f2, roughness: 0.78 });
  const roofMaterial = bodyMaterial.clone();
  roofMaterial.flatShading = true;
  roofMaterial.needsUpdate = true;
  const radians = THREE.MathUtils.degToRad(spec.rotation);
  const localCenter = new THREE.Vector2(spec.width / 2, spec.height / 2);
  const rotatedCenter = localCenter.rotateAround(new THREE.Vector2(), radians);
  const center = worldPoint(new THREE.Vector2(spec.x + rotatedCenter.x, spec.y + rotatedCenter.y));
  const width = Math.max(spec.width * SCALE, 0.75);
  const depth = Math.max(spec.height * SCALE, 0.55);
    const baseY = layers["#CD80DD"].elevation + layers["#CD80DD"].height + 0.02;
    const group = new THREE.Group();
    group.position.set(center.x, baseY, center.y);
    // SVG rotates in screen coordinates; the model mirrors both screen axes into X/Z.
    group.rotation.y = Math.PI - radians;

    const bodyHeight = 0.65;
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, bodyHeight, depth), bodyMaterial);
    body.position.y = bodyHeight / 2;
    body.castShadow = true;
    body.receiveShadow = true;

    const roofHeight = 0.4;
    const roofBase = bodyHeight;
    const roof = new THREE.Mesh(new THREE.BufferGeometry(), roofMaterial);
    roof.geometry.setAttribute("position", new THREE.Float32BufferAttribute([
      -width / 2, roofBase, -depth / 2, width / 2, roofBase, -depth / 2, width / 2, roofBase, depth / 2, -width / 2, roofBase, depth / 2,
      -width / 2, roofBase + roofHeight, 0, width / 2, roofBase + roofHeight, 0,
    ], 3));
    roof.geometry.setIndex([
      0, 5, 1, 0, 4, 5,
      3, 5, 4, 3, 2, 5,
      0, 3, 4,
      1, 5, 2,
    ]);
    roof.geometry.computeVertexNormals();
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(body, roof);
    map.add(group);
}

function readHouses(svgText) {
  const houses = [];
  const rectPattern = /<rect\s+([^>]*\bfill="white"[^>]*)\/>/gi;
  for (const match of svgText.matchAll(rectPattern)) {
    const attrs = match[1];
    const number = (name) => Number((attrs.match(new RegExp(`\\b${name}="([^"]+)"`)) || [])[1]);
    const transform = (attrs.match(/transform="rotate\(([-\d.]+)/i) || [])[1];
    const x = number("x");
    const y = number("y");
    const width = number("width");
    const height = number("height");
    if ([x, y, width, height].every(Number.isFinite)) {
      houses.push({ x, y, width, height, rotation: Number(transform) || 0 });
    }
  }
  return houses;
}

function isInsidePolygon(point, polygon) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const current = polygon[index];
    const before = polygon[previous];
    const crosses = (current.y > point.y) !== (before.y > point.y);
    if (crosses && point.x < ((before.x - current.x) * (point.y - current.y)) / (before.y - current.y) + current.x) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInAnyForest(point) {
  return forestPolygons.some((polygon) => isInsidePolygon(point, polygon));
}

function addTree(x, z, scale) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.8, 8), treeTrunk);
  trunk.position.y = 0.42;
  const crownMaterial = treeCrowns[Math.round(x * 7 + z * 3) & 1];
  const lowerCrown = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.15, 9), crownMaterial);
  lowerCrown.position.y = 1.02;
  const upperCrown = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.05, 9), crownMaterial);
  upperCrown.position.y = 1.58;
  trunk.castShadow = lowerCrown.castShadow = upperCrown.castShadow = true;
  group.add(trunk, lowerCrown, upperCrown);
  group.position.set(x, layers["#59A37E"].elevation + layers["#59A37E"].height, z);
  group.scale.setScalar(scale);
  map.add(group);
}

function addTallFir(x, z, scale) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 1.05, 8), treeTrunk);
  trunk.position.y = 0.53;
  const crownMaterial = tallFirCrowns[Math.round(x * 5 + z * 11) & 1];
  const lower = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.92, 8), crownMaterial);
  lower.position.y = 0.98;
  const middle = new THREE.Mesh(new THREE.ConeGeometry(0.39, 0.88, 8), crownMaterial);
  middle.position.y = 1.43;
  const top = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.78, 8), crownMaterial);
  top.position.y = 1.84;
  trunk.castShadow = lower.castShadow = middle.castShadow = top.castShadow = true;
  group.add(trunk, lower, middle, top);
  group.position.set(x, layers["#59A37E"].elevation + layers["#59A37E"].height, z);
  group.scale.setScalar(scale);
  map.add(group);
}

function seedTrees() {
  const random = (() => {
    let value = 31051991;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  })();
  let firsAdded = 0;
  let tallFirsAdded = 0;
  for (let attempt = 0; attempt < 42000 && (firsAdded < 960 || tallFirsAdded < 500); attempt += 1) {
    const source = new THREE.Vector2(random() * SVG_W, random() * SVG_H);
    if (!pointInAnyForest(source)) continue;
    const point = worldPoint(source);
    if (firsAdded < 960) {
      addTree(point.x, point.y, 0.6 + random() * 0.38);
      firsAdded += 1;
    } else if (tallFirsAdded < 500) {
      addTallFir(point.x, point.y, 0.62 + random() * 0.36);
      tallFirsAdded += 1;
    }
  }
}

async function buildModel() {
  const response = await fetch(planUrl);
  if (!response.ok) throw new Error("SVG plan could not be loaded");
  const svgText = await response.text();
  const parsed = new SVGLoader().parse(svgText);
  parsed.paths.forEach((path) => {
    const fill = fillOf(path);
    if (layers[fill]) addTerritory(path, layers[fill]);
  });
  readHouses(svgText).forEach(addHouse);
  seedTrees();
  controls.target.set(0, 0, 0);
  controls.update();
  card.innerHTML = "<span class=\"eyebrow\">SVG</span><h1>3D генплан</h1><p>Все зоны и дома построены по векторным контурам исходного генплана.</p>";
}

function setCamera(position) {
  camera.position.set(...position);
  controls.target.set(0, 0, 0);
  controls.update();
}

document.querySelector("#reset-camera").addEventListener("click", () => setCamera([0, 84, -100]));
document.querySelector("#top-camera").addEventListener("click", () => setCamera([0, 132, -0.1]));
document.querySelectorAll(".queue-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".queue-button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

window.addEventListener("resize", () => {
  camera.aspect = host.clientWidth / host.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(host.clientWidth, host.clientHeight);
});

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

buildModel().catch((error) => {
  card.innerHTML = `<h1>Ошибка</h1><p>${error.message}</p>`;
  console.error(error);
});
animate();
