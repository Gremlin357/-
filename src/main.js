import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { Sky } from "three/addons/objects/Sky.js";
import { createPine1 } from "../models/pine1.js";
import { createPine2 } from "../models/pine2.js";
import { createPine3 } from "../models/pine3.js";
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
const cameraReadout = document.createElement("div");
cameraReadout.className = "camera-readout";
host.appendChild(cameraReadout);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc9dce1);
scene.fog = new THREE.Fog(0xc9dce1, 135, 270);
const camera = new THREE.PerspectiveCamera(41, host.clientWidth / host.clientHeight, 0.1, 500);
camera.position.set(-17, 40, -42);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 30;
controls.maxDistance = 190;
const updateCameraReadout = () => {
  const format = (value) => value.toFixed(2);
  cameraReadout.innerHTML = `[${camera.position.toArray().map(format).join(", ")}]<br>[${controls.target.toArray().map(format).join(", ")}]`;
};
controls.addEventListener("change", () => {
  console.log("Camera:", camera.position.toArray(), "Target:", controls.target.toArray());
  updateCameraReadout();
});
updateCameraReadout();

scene.add(new THREE.HemisphereLight(0xffffff, 0x758775, 2.5));
const sun = new THREE.DirectionalLight(0xffffff, 2.8);
sun.position.set(-45, 80, 45);
sun.castShadow = true;
sun.target.position.set(-13, 0, -1);
scene.add(sun.target);
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -100;
sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100;
sun.shadow.camera.bottom = -100;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 220;
sun.shadow.bias = -0.00015;
scene.add(sun);

const sky = new Sky();
sky.scale.setScalar(450);
sky.material.uniforms.turbidity.value = 8;
sky.material.uniforms.rayleigh.value = 1.6;
sky.material.uniforms.mieCoefficient.value = 0.006;
sky.material.uniforms.mieDirectionalG.value = 0.82;
sky.material.uniforms.sunPosition.value.copy(sun.position).normalize();
sky.visible = false;

function createCloudTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  context.fillStyle = "rgba(255, 255, 255, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(255, 255, 255, 0.78)";
  [[52, 72, 34], [88, 52, 42], [132, 66, 48], [178, 76, 30]].forEach(([x, y, radius]) => {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSunTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(64, 64, 8, 64, 64, 58);
  gradient.addColorStop(0, "rgba(255, 248, 205, 1)");
  gradient.addColorStop(0.45, "rgba(255, 224, 132, 0.82)");
  gradient.addColorStop(1, "rgba(255, 224, 132, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function createCloudShadowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  context.fillStyle = "rgba(38, 55, 50, 0.32)";
  [[52, 72, 34], [88, 52, 42], [132, 66, 48], [178, 76, 30]].forEach(([x, y, radius]) => {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  });
  return new THREE.CanvasTexture(canvas);
}

const cloudGroup = new THREE.Group();
const cloudTexture = createCloudTexture();
const cloudShadowGroup = new THREE.Group();
const cloudShadowTexture = createCloudShadowTexture();
const cloudMaterial = new THREE.SpriteMaterial({ map: cloudTexture, transparent: true, depthWrite: false, opacity: 0.72 });
for (let index = 0; index < 14; index += 1) {
  const cloud = new THREE.Sprite(cloudMaterial);
  cloud.position.set(-190 + index * 28, 48 + (index % 4) * 13, -110 + (index % 5) * 48);
  cloud.scale.set(28 + (index % 3) * 12, 14 + (index % 2) * 6, 1);
  cloud.userData.speed = 0.008 + (index % 3) * 0.003;
  cloudGroup.add(cloud);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(28 + (index % 3) * 12, 14 + (index % 2) * 6),
    new THREE.MeshBasicMaterial({ color: 0x66796f, map: cloudShadowTexture, transparent: true, depthWrite: false, depthTest: false, opacity: 0.34 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(cloud.position.x + 18, 1.08, cloud.position.z + 10);
  shadow.renderOrder = 8;
  shadow.userData.cloud = cloud;
  cloudShadowGroup.add(shadow);
}
scene.add(cloudGroup);
scene.add(cloudShadowGroup);

const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: createSunTexture(), transparent: true, depthWrite: false }));
sunSprite.position.set(-72, 104, 72);
sunSprite.scale.setScalar(30);
scene.add(sunSprite);

const map = new THREE.Group();
scene.add(map);
const plotMeshes = [];
let hoveredPlot = null;
const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const environment = new THREE.Group();
scene.add(environment);
const environmentGround = new THREE.Mesh(
  new THREE.PlaneGeometry(2000, 1600),
  new THREE.MeshStandardMaterial({ color: 0xc2df78, roughness: 1 }),
);
environmentGround.rotation.x = -Math.PI / 2;
environmentGround.position.y = -0.08;
environmentGround.receiveShadow = true;
environment.add(environmentGround);

const horizonTrunk = new THREE.InstancedMesh(
  new THREE.CylinderGeometry(0.14, 0.22, 2.2, 6),
  new THREE.MeshBasicMaterial({ color: 0x76502f, depthTest: false, depthWrite: false }),
  900,
);
const horizonCrown = new THREE.InstancedMesh(
  new THREE.ConeGeometry(0.48, 1.2, 6),
  new THREE.MeshStandardMaterial({ color: 0x477a55, roughness: 1 }),
  900,
);
const horizonMatrix = new THREE.Matrix4();
horizonTrunk.renderOrder = 20;
environment.add(horizonTrunk, horizonCrown);
horizonTrunk.visible = false;
horizonCrown.visible = false;
const SVG_W = 10144;
const SVG_H = 3831;
const SOURCE_SVG_W = 37881;
const SOURCE_SVG_H = 11854;
const WORLD_W = 160;
const SCALE = WORLD_W / SVG_W;
const SVG_OFFSET_X = 4961;
const SVG_OFFSET_Y = 9221;
const settlementTarget = new THREE.Vector3(7, -6, 7);
const HEIGHT_UNIT = 0.06;

const layers = {
  "#93CE84": { name: "Территория вне поселка", elevation: 0, height: 0.1, color: 0xc2df78 },
  "#B7DAD2": { name: "Общая территория", elevation: HEIGHT_UNIT * 1.5, height: HEIGHT_UNIT, color: 0xb7dad2 },
  "#98B4BA": { name: "Региональная дорога", elevation: HEIGHT_UNIT * 2, height: HEIGHT_UNIT, color: 0x98b4ba },
  "#D3D7DE": { name: "Обочина", elevation: HEIGHT_UNIT, height: HEIGHT_UNIT * 0.8, color: 0xd3d7de },
  "#9AA0A3": { name: "Дороги поселка", elevation: HEIGHT_UNIT * 2, height: HEIGHT_UNIT, color: 0x9aa0a3 },
  "#59A37E": { name: "Лес", elevation: HEIGHT_UNIT, height: HEIGHT_UNIT, color: 0x59a37e },
  "#EAE3CA": { name: "Общественные места", elevation: HEIGHT_UNIT * 3, height: HEIGHT_UNIT, color: 0xeae3ca },
  "#CD80DD": { name: "Участки домов", elevation: HEIGHT_UNIT * 2.5, height: HEIGHT_UNIT, color: 0xcee593, isPlot: true },
};
const forestPolygons = [];
const treeTrunk = new THREE.MeshStandardMaterial({ color: 0x75583d, roughness: 0.9, depthTest: false, depthWrite: false });
const treeCrowns = [
  new THREE.MeshStandardMaterial({ color: 0x256b43, roughness: 0.92 }),
  new THREE.MeshStandardMaterial({ color: 0x3d8252, roughness: 0.92 }),
];
const tallFirCrowns = [
  new THREE.MeshStandardMaterial({ color: 0x1f603d, roughness: 0.92 }),
  new THREE.MeshStandardMaterial({ color: 0x35764a, roughness: 0.92 }),
];
const forestInstances = new THREE.Group();
forestInstances.visible = false;
map.add(forestInstances);
const instanceMatrix = new THREE.Matrix4();
const regularTreeInstances = {
  trunk: new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.18, 1.05, 7), treeTrunk, 7200),
  lower: new THREE.InstancedMesh(new THREE.ConeGeometry(0.72, 1.15, 9), treeCrowns[0], 7200),
  upper: new THREE.InstancedMesh(new THREE.ConeGeometry(0.5, 1.05, 9), treeCrowns[0], 7200),
};
const tallFirInstances = {
  trunk: new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.16, 1.25, 7), treeTrunk, 3600),
  lower: new THREE.InstancedMesh(new THREE.ConeGeometry(0.52, 0.92, 8), tallFirCrowns[0], 3600),
  middle: new THREE.InstancedMesh(new THREE.ConeGeometry(0.39, 0.88, 8), tallFirCrowns[0], 3600),
  top: new THREE.InstancedMesh(new THREE.ConeGeometry(0.25, 0.78, 8), tallFirCrowns[0], 3600),
};
Object.values({ ...regularTreeInstances, ...tallFirInstances }).forEach((mesh) => {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  forestInstances.add(mesh);
});
regularTreeInstances.trunk.renderOrder = 20;
tallFirInstances.trunk.renderOrder = 20;

function fillOf(path) {
  return (path.userData?.style?.fill || "").toUpperCase();
}

function isHouse(path) {
  const fill = fillOf(path);
  return fill === "WHITE" || fill === "#FFFFFF";
}

function worldPoint(point) {
  return new THREE.Vector2(
    (SVG_W / 2 - (point.x - SVG_OFFSET_X)) * SCALE,
    (SVG_H / 2 - (point.y - SVG_OFFSET_Y)) * SCALE,
  );
}

function extrudeShape(shape, height, material) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    curveSegments: 2,
  });
  geometry.translate(-SVG_OFFSET_X, -SVG_OFFSET_Y, 0);
  geometry.scale(-SCALE, SCALE, 1);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(SVG_W * SCALE / 2, 0, SVG_H * SCALE / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.castShadow = height > 0.75;
  return mesh;
}

function flatTexturedShape(shape, material) {
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.translate(-SVG_OFFSET_X, -SVG_OFFSET_Y, 0);
  geometry.scale(-SCALE, SCALE, 1);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(SVG_W * SCALE / 2, 0, SVG_H * SCALE / 2);
  const positions = geometry.getAttribute("position");
  const uvs = new Float32Array(positions.count * 2);
  for (let index = 0; index < positions.count; index += 1) {
    uvs[index * 2] = positions.getX(index) / 12;
    uvs[index * 2 + 1] = positions.getZ(index) / 12;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

function addPlotOutline(shape, elevation) {
  const points = shape.extractPoints(8).shape;
  const positions = new Float32Array(points.length * 3);
  const y = elevation + HEIGHT_UNIT * 2;
  points.forEach((point, index) => {
    const world = worldPoint(point);
    positions[index * 3] = world.x;
    positions[index * 3 + 1] = y;
    positions[index * 3 + 2] = world.y;
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const line = new THREE.LineLoop(
    geometry,
    new THREE.LineBasicMaterial({ color: 0x557a3b, transparent: false, depthTest: true }),
  );
  line.renderOrder = 110;
  map.add(line);
  const highlight = line.clone();
  highlight.material = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
  highlight.position.y = 0.1;
  highlight.renderOrder = 111;
  highlight.visible = false;
  map.add(highlight);
  return highlight;
}

function addTerritory(path, definition) {
  const material = new THREE.MeshStandardMaterial({
    color: definition.color,
    roughness: 0.9,
    side: THREE.DoubleSide,
    transparent: false,
    opacity: 1,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const shapes = SVGLoader.createShapes(path);
  shapes.forEach((shape) => {
    const mesh = flatTexturedShape(shape, material);
    mesh.position.y = definition.elevation;
    mesh.renderOrder = Math.round(definition.elevation * 100);
    map.add(mesh);
    if (definition.isPlot) {
      mesh.userData.plotHighlight = addPlotOutline(shape, definition.elevation + definition.height);
      plotMeshes.push(mesh);
    }
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

function seedPines() {
  const random = (() => {
    let value = 14051996;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  })();
  const pineFactories = [createPine1, createPine2, createPine3];
  const pineCapacity = 6300;
  const templates = pineFactories.map((factory) => factory());
  const pineBatches = templates.map((template) => template.children.map((part) => {
    const mesh = new THREE.InstancedMesh(part.geometry, part.material, pineCapacity);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }));
  const pines = new THREE.Group();
  pineBatches.flat().forEach((batch) => pines.add(batch));
  const counts = [0, 0, 0];
  const matrix = new THREE.Matrix4();
  const forestBaseY = layers["#59A37E"].elevation + layers["#59A37E"].height;
  let added = 0;
  for (let attempt = 0; attempt < 1350000 && added < 6300; attempt += 1) {
    const source = new THREE.Vector2(random() * SOURCE_SVG_W, random() * SOURCE_SVG_H);
    if (!pointInAnyForest(source)) continue;
    const point = worldPoint(source);
    const type = Math.floor(random() * pineFactories.length);
    const pine = templates[type];
    const instance = counts[type];
    const scale = 0.55 + random() * 0.65;
    const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), random() * Math.PI * 2);
    pine.children.forEach((part, partIndex) => {
      matrix.compose(
        new THREE.Vector3(point.x, forestBaseY + part.position.y * scale, point.y),
        rotation,
        new THREE.Vector3(scale, scale, scale),
      );
      pineBatches[type][partIndex].setMatrixAt(instance, matrix);
    });
    counts[type] += 1;
    added += 1;
  }
  pineBatches.forEach((batches, type) => batches.forEach((batch) => {
    batch.count = counts[type];
    batch.instanceMatrix.needsUpdate = true;
    batch.computeBoundingSphere();
  }));
  map.add(pines);
}

function pointInExpandedForest(point) {
  return forestPolygons.some((polygon) => {
    const center = polygon.reduce((sum, vertex) => sum.add(vertex), new THREE.Vector2()).multiplyScalar(1 / polygon.length);
    const expandedPoint = center.clone().add(point.clone().sub(center).multiplyScalar(1 / 1.2));
    return isInsidePolygon(expandedPoint, polygon) && !isInsidePolygon(point, polygon);
  });
}

function seedHorizonForest() {
  const random = (() => {
    let value = 7654321;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  })();
  const forestBaseY = layers["#59A37E"].elevation + layers["#59A37E"].height;
  let added = 0;
  for (let attempt = 0; attempt < 180000 && added < 900; attempt += 1) {
    const source = new THREE.Vector2(random() * SOURCE_SVG_W, random() * SOURCE_SVG_H);
    if (!pointInExpandedForest(source)) continue;
    const point = worldPoint(source);
    const scale = 0.8 + random() * 0.6;
    horizonMatrix.compose(new THREE.Vector3(point.x, forestBaseY + 1.1 * scale, point.y), new THREE.Quaternion(), new THREE.Vector3(scale, scale, scale));
    horizonTrunk.setMatrixAt(added, horizonMatrix);
    horizonMatrix.setPosition(point.x, forestBaseY + 2.4 * scale, point.y);
    horizonCrown.setMatrixAt(added, horizonMatrix);
    added += 1;
  }
  horizonTrunk.count = added;
  horizonCrown.count = added;
  horizonTrunk.instanceMatrix.needsUpdate = true;
  horizonCrown.instanceMatrix.needsUpdate = true;
  horizonTrunk.computeBoundingSphere();
  horizonCrown.computeBoundingSphere();
}

function addTree(x, z, scale) {
  const index = addTree.count;
  const baseY = layers["#59A37E"].elevation + layers["#59A37E"].height;
  const set = (mesh, y) => {
    instanceMatrix.compose(new THREE.Vector3(x, baseY + y * scale, z), new THREE.Quaternion(), new THREE.Vector3(scale, scale, scale));
    mesh.setMatrixAt(index, instanceMatrix);
    mesh.instanceMatrix.needsUpdate = true;
  };
  set(regularTreeInstances.trunk, 0.53);
  set(regularTreeInstances.lower, 2.05);
  set(regularTreeInstances.upper, 2.65);
  addTree.count += 1;
}
addTree.count = 0;

function addTallFir(x, z, scale) {
  const index = addTallFir.count;
  const baseY = layers["#59A37E"].elevation + layers["#59A37E"].height;
  const set = (mesh, y) => {
    instanceMatrix.compose(new THREE.Vector3(x, baseY + y * scale, z), new THREE.Quaternion(), new THREE.Vector3(scale, scale, scale));
    mesh.setMatrixAt(index, instanceMatrix);
    mesh.instanceMatrix.needsUpdate = true;
  };
  set(tallFirInstances.trunk, 0.63);
  set(tallFirInstances.lower, 1.4);
  set(tallFirInstances.middle, 1.9);
  set(tallFirInstances.top, 2.35);
  addTallFir.count += 1;
}
addTallFir.count = 0;

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
  for (let attempt = 0; attempt < 360000 && (firsAdded < 7200 || tallFirsAdded < 3600); attempt += 1) {
    const source = new THREE.Vector2(random() * SOURCE_SVG_W, random() * SOURCE_SVG_H);
    if (!pointInAnyForest(source)) continue;
    const point = worldPoint(source);
    if (firsAdded < 7200) {
      addTree(point.x, point.y, 0.6 + random() * 0.38);
      firsAdded += 1;
    } else if (tallFirsAdded < 500) {
      addTallFir(point.x, point.y, 0.62 + random() * 0.36);
      tallFirsAdded += 1;
    }
  }
  Object.values(regularTreeInstances).forEach((mesh) => { mesh.count = firsAdded; });
  Object.values(tallFirInstances).forEach((mesh) => { mesh.count = tallFirsAdded; });
  Object.values(regularTreeInstances).forEach((mesh) => mesh.computeBoundingSphere());
  Object.values(tallFirInstances).forEach((mesh) => mesh.computeBoundingSphere());
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
  seedPines();
  controls.target.copy(settlementTarget);
  controls.update();
  card.innerHTML = "<span class=\"eyebrow\">SVG</span><h1>3D генплан</h1><p>Все зоны и дома построены по векторным контурам исходного генплана.</p>";
}

function setCamera(position) {
  camera.position.set(...position);
  controls.target.copy(settlementTarget);
  controls.update();
}

document.querySelector("#reset-camera").addEventListener("click", () => setCamera([-17, 40, -42]));
document.querySelectorAll(".queue-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".queue-button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

renderer.domElement.addEventListener("pointermove", (event) => {
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(plotMeshes, false)[0]?.object || null;
  if (hoveredPlot === hit) return;
  if (hoveredPlot) hoveredPlot.userData.plotHighlight.visible = false;
  hoveredPlot = hit;
  if (hoveredPlot) hoveredPlot.userData.plotHighlight.visible = true;
});

window.addEventListener("resize", () => {
  camera.aspect = host.clientWidth / host.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(host.clientWidth, host.clientHeight);
});

function animate() {
  controls.update();
  cloudGroup.children.forEach((cloud) => {
    cloud.position.x += cloud.userData.speed;
    if (cloud.position.x > 210) cloud.position.x = -210;
  });
  cloudShadowGroup.children.forEach((shadow) => {
    shadow.position.x = shadow.userData.cloud.position.x + 18;
    shadow.position.y = 1.08;
    shadow.position.z = shadow.userData.cloud.position.z + 10;
  });
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

buildModel().catch((error) => {
  card.innerHTML = `<h1>Ошибка</h1><p>${error.message}</p>`;
  console.error(error);
});
animate();
