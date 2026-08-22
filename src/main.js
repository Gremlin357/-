import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { Sky } from "three/addons/objects/Sky.js";
import { createPine1 } from "../models/pine1.js";
import { createPine2 } from "../models/pine2.js";
import { createPine3 } from "../models/pine3.js";
import { createCar1 } from "../models/car1.js";
import { createCar2 } from "../models/car2.js";
import { createCar3 } from "../models/car3.js";
import { createFruitTree1 } from "../models/fruitTree1.js";
import { createFruitTree2 } from "../models/fruitTree2.js";
import { createFruitTree3 } from "../models/fruitTree3.js";
import { createSlide } from "../models/slide.js";
import { createCarousel } from "../models/carousel.js";
import { createSandbox } from "../models/sandbox.js";
import { createClimbingFrame } from "../models/climbingFrame.js";
import { createSwings } from "../models/swings.js";
import planUrl from "../генплан для Codex.svg?url";

const host = document.querySelector("#scene");
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
const plotLabel = document.createElement("div");
plotLabel.className = "plot-label";
host.appendChild(plotLabel);

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

const ambientLight = new THREE.HemisphereLight(0xffffff, 0x758775, 1.8);
scene.add(ambientLight);
const sun = new THREE.DirectionalLight(0xffffff, 2.8);
sun.position.set(-45, 80, 45);
sun.castShadow = true;
sun.target.position.set(-13, 0, -1);
scene.add(sun.target);
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.camera.left = -100;
sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100;
sun.shadow.camera.bottom = -100;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 220;
sun.shadow.bias = -0.00015;
sun.shadow.normalBias = 0.025;
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
    new THREE.MeshBasicMaterial({ color: 0x405a48, map: cloudShadowTexture, transparent: true, depthWrite: false, depthTest: false, opacity: 0.52 }),
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

const moonLight = new THREE.HemisphereLight(0x9ebdff, 0x17243d, 0);
scene.add(moonLight);
function createMoonTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(64, 64, 12, 64, 64, 58);
  gradient.addColorStop(0, "rgba(220, 235, 255, 1)");
  gradient.addColorStop(0.65, "rgba(170, 205, 255, 0.75)");
  gradient.addColorStop(1, "rgba(170, 205, 255, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}
const moonSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: createMoonTexture(), transparent: true, depthWrite: false, opacity: 0 }));
moonSprite.position.set(72, 92, -72);
moonSprite.scale.setScalar(24);
scene.add(moonSprite);

const sunDial = document.createElement("div");
sunDial.className = "sun-dial";
sunDial.innerHTML = "<div class=\"sun-dial__title\">Солнце</div><div class=\"sun-dial__ring\"><span class=\"sun-dial__dot\"></span><b class=\"sun-dial__east\">Восток</b><b class=\"sun-dial__zenith\">Зенит</b><b class=\"sun-dial__west\">Запад</b><b class=\"sun-dial__nadir\">Надир</b></div>";
host.appendChild(sunDial);
const sunDialRing = sunDial.querySelector(".sun-dial__ring");
const sunDialDot = sunDial.querySelector(".sun-dial__dot");
// The dial uses: left = east, top = zenith, right = west, bottom = nadir.
let sunPhase = Math.PI;
let sunDragging = false;
let daylightLevel = 0;
function setSunPhase(phase) {
  sunPhase = (phase + Math.PI * 2) % (Math.PI * 2);
  const horizontal = Math.cos(sunPhase);
  const height = Math.sin(sunPhase);
  const daylight = Math.max(0, height);
  const eastWest = Math.sin(sunPhase);
  // SVG is mirrored into world X/Z, so the east-west axis is world Z.
  sun.position.set(eastWest * 75, Math.max(-45, height * 90), horizontal * 75);
  const dawn = new THREE.Color(0xff5f91);
  const noon = new THREE.Color(0xffffff);
  const dusk = new THREE.Color(0xffb36e);
  const night = new THREE.Color(0x101a30);
  let sunColor = night;
  const daylightCurve = THREE.MathUtils.smoothstep(daylight, 0.015, 0.32);
  daylightLevel = daylightCurve;
  if (height > 0) {
    if (sunPhase > Math.PI / 2) {
      // East to zenith: pink sunrise fades into white daylight.
      const t = THREE.MathUtils.smoothstep((Math.PI - sunPhase) / (Math.PI / 2), 0, 0.28);
      sunColor = dawn.clone().lerp(noon, t);
    } else {
      // Zenith to west: white daylight fades into orange sunset.
      const t = THREE.MathUtils.smoothstep(sunPhase / (Math.PI / 2), 0, 0.24);
      sunColor = dusk.clone().lerp(noon, t);
    }
  }
  sun.color.copy(sunColor);
  sun.intensity = daylight > 0 ? 0.35 + daylightCurve * 3.45 : 0;
  ambientLight.intensity = daylight > 0 ? 0.48 + daylightCurve * 1.62 : 0.32;
  moonLight.intensity = (1 - daylight) * 0.22;
  sunSprite.position.copy(sun.position).multiplyScalar(1.35);
  sunSprite.material.opacity = daylight > 0.015 ? Math.min(1, daylight * 3) : 0;
  moonSprite.material.opacity = daylight < 0.12 ? Math.min(0.8, (0.12 - daylight) * 7) : 0;
  sky.material.uniforms.sunPosition.value.copy(sun.position).normalize();
  sunDialDot.style.left = `${50 + horizontal * 42}%`;
  sunDialDot.style.top = `${50 - height * 42}%`;
}
function phaseFromPointer(event) {
  const rect = sunDialRing.getBoundingClientRect();
  const x = event.clientX - (rect.left + rect.width / 2);
  const y = event.clientY - (rect.top + rect.height / 2);
  return Math.atan2(-y, x);
}
sunDialRing.addEventListener("pointerdown", (event) => { sunDragging = true; sunDialRing.setPointerCapture(event.pointerId); setSunPhase(phaseFromPointer(event)); });
sunDialRing.addEventListener("pointermove", (event) => { if (sunDragging) setSunPhase(phaseFromPointer(event)); });
sunDialRing.addEventListener("pointerup", () => { sunDragging = false; });
sunDialRing.addEventListener("pointercancel", () => { sunDragging = false; });
setSunPhase(sunPhase);

const map = new THREE.Group();
scene.add(map);
const houseShadows = [];
const houseLights = [];
const houseGlows = [];
const poleLights = [];
const poleGlows = [];
let lastDaylightLevel = daylightLevel;
let nightScheduleActive = false;
const plantingTrees = [];
const plantingShadows = [];
const forestShadowRecords = [];
let forestShadowMesh = null;
const forestShadowMaterial = new THREE.MeshBasicMaterial({ color: 0x0b160f, transparent: true, opacity: 0.16, depthWrite: false, depthTest: true, side: THREE.DoubleSide });
const plantingShadowMaterial = new THREE.MeshBasicMaterial({ color: 0x0b160f, transparent: true, opacity: 0.18, depthWrite: false, depthTest: true, side: THREE.DoubleSide });
const glowCanvas = document.createElement("canvas");
glowCanvas.width = 128;
glowCanvas.height = 128;
const glowContext = glowCanvas.getContext("2d");
const glowGradient = glowContext.createRadialGradient(64, 64, 4, 64, 64, 64);
glowGradient.addColorStop(0, "rgba(255, 181, 107, 0.8)");
glowGradient.addColorStop(0.35, "rgba(255, 181, 107, 0.38)");
glowGradient.addColorStop(0.72, "rgba(255, 181, 107, 0.1)");
glowGradient.addColorStop(1, "rgba(255, 181, 107, 0)");
glowContext.fillStyle = glowGradient;
glowContext.fillRect(0, 0, 128, 128);
const glowTexture = new THREE.CanvasTexture(glowCanvas);
glowTexture.colorSpace = THREE.SRGBColorSpace;
const houseGlowMaterial = new THREE.MeshBasicMaterial({ map: glowTexture, transparent: true, opacity: 0, depthWrite: false, depthTest: true, toneMapped: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
const headlightCanvas = document.createElement("canvas");
headlightCanvas.width = 128;
headlightCanvas.height = 128;
const headlightContext = headlightCanvas.getContext("2d");
const headlightGradient = headlightContext.createRadialGradient(64, 22, 2, 64, 64, 70);
headlightGradient.addColorStop(0, "rgba(255, 247, 198, 0.86)");
headlightGradient.addColorStop(0.32, "rgba(255, 231, 143, 0.48)");
headlightGradient.addColorStop(0.72, "rgba(255, 214, 116, 0.12)");
headlightGradient.addColorStop(1, "rgba(255, 214, 116, 0)");
headlightContext.fillStyle = headlightGradient;
headlightContext.fillRect(0, 0, 128, 128);
const headlightTexture = new THREE.CanvasTexture(headlightCanvas);
headlightTexture.colorSpace = THREE.SRGBColorSpace;
const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xfff1b0, toneMapped: false, transparent: true, opacity: 0, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending });
const headlightBeamMaterial = new THREE.MeshBasicMaterial({ map: headlightTexture, transparent: true, opacity: 0, depthWrite: false, depthTest: true, toneMapped: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
const houseShadowMaterial = new THREE.MeshBasicMaterial({ color: 0x0b160f, transparent: true, opacity: 0.49, depthWrite: false, depthTest: true, side: THREE.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
const plotMeshes = [];
const interactiveMeshes = [];
const publicMeshes = [];
const movingCars = [];
const publicLabels = ["Спортивная площадка", "Магазин", "Детская площадка", "Фруктовый сад", null, null];
const firstQueueNumbers = new Map([
  [57, 30], [49, 29], [48, 28], [50, 27], [51, 26], [52, 25], [53, 24], [71, 23],
  [31, 21], [38, 20], [39, 19], [40, 18], [41, 17], [85, 16], [82, 58], [83, 59], [76, 60],
]);
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
const playgroundMarks = [
  [9313, 11452], [9355, 11283], [9424, 11374], [9583, 11330], [9508, 11436],
].map(([x, y]) => new THREE.Vector2(x, y));
const orchardMarks = [
  [9676.5, 11454.5], [9735.5, 11409.5], [9793.5, 11366.5], [9769.5, 11445.5],
  [9824.5, 11403.5], [9883.5, 11357.5], [9943.5, 11312.5], [10000.5, 11268.5],
  [9851.5, 11321.5], [9855.5, 11438.5], [9913.5, 11396.5], [9913.5, 11275.5],
  [9969.5, 11354.5], [9943.5, 11431.5], [9969.5, 11232.5], [10000.5, 11388.5],
  [10093.5, 11377.5], [10031.5, 11304.5], [10063.5, 11341.5], [10033.5, 11423.5],
  [10122.5, 11414.5], [10061.5, 11224.5], [10091.5, 11259.5], [10120.5, 11297.5],
  [10027.5, 11187.5], [10151.5, 11333.5], [10182.5, 11369.5], [10209.5, 11406.5],
].map(([x, y]) => new THREE.Vector2(x, y));
const settlementTarget = new THREE.Vector3(7, -6, 7);
const HEIGHT_UNIT = 0.06;

const layers = {
  "#93CE84": { name: "Территория вне поселка", elevation: 0, height: 0.1, color: 0xc2df78 },
  "#B7DAD2": { name: "Общая территория", elevation: HEIGHT_UNIT * 1.5, height: HEIGHT_UNIT, color: 0xb7dad2 },
  "#98B4BA": { name: "Региональная дорога", elevation: HEIGHT_UNIT * 2, height: HEIGHT_UNIT, color: 0x98b4ba },
  "#D3D7DE": { name: "Обочина", elevation: HEIGHT_UNIT, height: HEIGHT_UNIT * 0.8, color: 0xd3d7de },
  "#9AA0A3": { name: "Дороги поселка", elevation: HEIGHT_UNIT * 2, height: HEIGHT_UNIT, color: 0x9aa0a3 },
  "#59A37E": { name: "Лес", elevation: HEIGHT_UNIT, height: HEIGHT_UNIT, color: 0x59a37e },
  "#B4ED92": { name: "Посадка", elevation: 0, height: 0, color: 0xb4ed92, hidden: true },
  "#EAE3CA": { name: "Общественные места", elevation: HEIGHT_UNIT * 3, height: HEIGHT_UNIT, color: 0xeae3ca },
  "#A4C1E3": { name: "Электрическая подстанция", elevation: HEIGHT_UNIT * 3, height: HEIGHT_UNIT, color: 0xa4c1e3, isSubstation: true },
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
  mesh.castShadow = false;
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
  if (definition.hidden) {
    const receiverMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    SVGLoader.createShapes(path).forEach((shape) => {
      const receiver = flatTexturedShape(shape, receiverMaterial);
      receiver.position.y = definition.elevation;
      receiver.receiveShadow = true;
      receiver.renderOrder = 5;
      map.add(receiver);
    });
    return;
  }
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
      const points = shape.extractPoints(8).shape;
      const center = points.reduce((sum, point) => sum.add(point), new THREE.Vector2()).multiplyScalar(1 / points.length);
      mesh.userData.plotCenter = center;
      mesh.userData.plotNumber = firstQueueNumbers.get(plotMeshes.length) ?? null;
      plotMeshes.push(mesh);
      interactiveMeshes.push(mesh);
    } else if (definition.color === 0xeae3ca) {
      const points = shape.extractPoints(8).shape;
      const center = points.reduce((sum, point) => sum.add(point), new THREE.Vector2()).multiplyScalar(1 / points.length);
      publicMeshes.push({ mesh, point: worldPoint(center), shape, name: publicLabels[publicMeshes.length] ?? null });
    }
    if (definition.color === 0xeae3ca || definition.isSubstation) {
      mesh.userData.hoverHighlight = addPlotOutline(shape, definition.elevation + definition.height);
      interactiveMeshes.push(mesh);
    }
    if (definition.isSubstation) addSubstation(shape, definition.elevation + definition.height);
  });
    if (definition.color === 0x59a37e) {
    shapes.forEach((shape) => forestPolygons.push(shape.extractPoints(8).shape));
  }
}

function addPlantingPines(paths) {
  const factories = [createPine1, createPine2, createPine3];
  const profiles = [
    { radius: 0.72, height: 3.05 },
    { radius: 0.86, height: 2.875 },
    { radius: 0.62, height: 1.975 },
  ];
  let planted = 0;
  paths.forEach((path) => {
    SVGLoader.createShapes(path).forEach((shape) => {
      const points = shape.extractPoints(8).shape;
      if (!points.length) return;
      const center = points.reduce((sum, point) => sum.add(point), new THREE.Vector2()).multiplyScalar(1 / points.length);
      const world = worldPoint(center);
      const variant = planted % factories.length;
      const tree = factories[variant]();
      const scale = 0.22 + (planted % 3) * 0.035;
      tree.scale.setScalar(scale);
      tree.position.set(world.x, HEIGHT_UNIT + 0.1, world.y);
      tree.rotation.y = planted * 1.7;
      tree.traverse((object) => {
        if (object.isMesh) { object.castShadow = false; object.receiveShadow = true; }
      });
      map.add(tree);
      plantingTrees.push({ tree, scale, profile: profiles[variant] });
      planted += 1;
    });
  });
}

function createPlantingShadows() {
  // Keep planting shadows above the lower forest surface and plot/road surfaces,
  // while remaining below house bases so they are visible without covering buildings.
  const groundY = layers["#CD80DD"].elevation + layers["#CD80DD"].height + 0.001;
  plantingTrees.forEach(({ tree, scale, profile }) => {
    const shadow = new THREE.Mesh(new THREE.BufferGeometry(), plantingShadowMaterial);
    // Shadow vertices are written in world coordinates, so the mesh stays at the origin.
    shadow.position.set(0, 0, 0);
    shadow.renderOrder = 22;
    map.add(shadow);
    plantingShadows.push({ tree, shadow, scale, profile, groundY });
  });
}

function createForestShadows() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([
    -1, 0, 0, 1, 0, 0, 0, 0, 1,
  ], 3));
  geometry.setIndex([0, 1, 2]);
  forestShadowMesh = new THREE.InstancedMesh(geometry, forestShadowMaterial, forestShadowRecords.length);
  forestShadowMesh.count = forestShadowRecords.length;
  forestShadowMesh.renderOrder = 21;
  map.add(forestShadowMesh);
}

function addSubstation(shape, baseY) {
  const points = shape.extractPoints(8).shape;
  const bounds = points.reduce((box, point) => box.expandByPoint(point), new THREE.Box2());
  const center = worldPoint(bounds.getCenter(new THREE.Vector2()));
  const edge = points[1].clone().sub(points[0]);
  const nextEdge = points[2].clone().sub(points[1]);
  const width = 0.3;
  const depth = 0.3;
  const rotation = -Math.atan2(edge.y, edge.x);
  const group = new THREE.Group();
  group.position.set(center.x, baseY, center.y);
  group.rotation.y = rotation;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.5, depth),
    new THREE.MeshStandardMaterial({ color: 0xf8f8f2, roughness: 0.78 }),
  );
  body.position.y = 0.25;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
  map.add(group);
}

function extractCarRoute(parsed) {
  const routePath = parsed.paths.find((path) => {
    const stroke = String(path.userData?.style?.stroke || "")
      .replace(/^#/, "")
      .toUpperCase();
    return stroke === "FF0000" && path.subPaths?.length;
  });
  if (!routePath) return null;

  const points = [];
  routePath.subPaths.forEach((subPath) => {
    subPath.getPoints(32).forEach((point) => {
      const previous = points[points.length - 1];
      if (!previous || previous.distanceToSquared(point) > 0.01) {
        points.push(point.clone());
      }
    });
  });
  return points.length > 1 ? points : null;
}

function seedCars(routeSourcePoints = null) {
  const roadY = layers["#98B4BA"].elevation + layers["#98B4BA"].height + 0.04;
  const roadPoint = (x, z) => {
    const point = worldPoint(new THREE.Vector2(x, z));
    return new THREE.Vector3(point.x, roadY, point.y);
  };
  const fallbackRoute = [
    [14.5, 12819], [10732, 11865], [10987, 11843],
    [11680.5, 11820.5], [12342.5, 11887.5], [14370.5, 12212.5],
    [15826, 12157.5], [16275, 12191], [16690.5, 12447], [18709, 14820],
  ];
  const routePoints = routeSourcePoints?.map((point) => roadPoint(point.x, point.y))
    || fallbackRoute.map(([x, z]) => roadPoint(x, z));
  // Проходим исходную красную траекторию по сегментам: CurvePath сохраняет
  // равномерную скорость и не создаёт петлю/замедление на перекрёстках.
  const route = new THREE.CurvePath();
  for (let index = 1; index < routePoints.length; index += 1) {
    route.add(new THREE.LineCurve3(routePoints[index - 1], routePoints[index]));
  }
  [createCar1(), createCar2()].forEach((car, index) => {
    car.scale.setScalar(0.48);
    const headlights = [];
    [-0.34, 0.34].forEach((x) => {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), headlightMaterial);
      lamp.position.set(x, 0.53, 1.12);
      car.add(lamp);
      headlights.push(lamp);
    });
    const beams = [];
    [-0.34, 0.34].forEach((x) => {
      const beamGeometry = new THREE.BufferGeometry();
      beamGeometry.setAttribute("position", new THREE.Float32BufferAttribute([
        -0.11, 0, 0, 0.11, 0, 0, 0.24, 0, 1.8,
        -0.11, 0, 0, 0.24, 0, 1.8, -0.24, 0, 1.8,
      ], 3));
      beamGeometry.setAttribute("uv", new THREE.Float32BufferAttribute([
        0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1,
      ], 2));
      const beam = new THREE.Mesh(beamGeometry, headlightBeamMaterial);
      beam.position.set(x, 0.012, 1.85);
      beam.scale.setScalar(3);
      beam.renderOrder = 24;
      car.add(beam);
      beams.push(beam);
    });
    car.userData.headlights = headlights;
    car.userData.headlightBeams = beams;
    car.userData.route = route;
    car.userData.progress = index / 2;
    // Скорость задаётся в долях длины маршрута, поэтому не меняется на поворотах.
    car.userData.speed = 0.025;
    map.add(car);
    movingCars.push(car);
  });
}

function seedFruitTrees() {
  const garden = publicMeshes.find(({ name }) => name === "Фруктовый сад");
  if (!garden) return;
  const polygon = garden.shape.extractPoints(8).shape;
  const bounds = polygon.reduce((box, point) => box.expandByPoint(point), new THREE.Box2());
  const factories = [createFruitTree1, createFruitTree2, createFruitTree3];
  const baseY = layers["#EAE3CA"].elevation + layers["#EAE3CA"].height + 0.02;
  orchardMarks.forEach((sourcePoint, planted) => {
    if (!isInsidePolygon(sourcePoint, polygon)) return;
    const point = worldPoint(sourcePoint);
    const tree = factories[planted % factories.length]();
    tree.scale.setScalar(0.46 + (planted % 3) * 0.04);
    tree.position.set(point.x, baseY, point.y);
    tree.rotation.y = (planted * 1.7) % (Math.PI * 2);
    map.add(tree);
  });
}

function seedPlaygroundEquipment() {
  const playground = publicMeshes.find(({ name }) => name === "Детская площадка");
  if (!playground) return;
  const polygon = playground.shape.extractPoints(8).shape;
  const bounds = polygon.reduce((box, point) => box.expandByPoint(point), new THREE.Box2());
  const factories = [createSlide, createCarousel, createSandbox, createClimbingFrame, createSwings];
  const markedPoints = playgroundMarks.filter((point) => isInsidePolygon(point, polygon));
  if (markedPoints.length === factories.length) {
    const baseY = layers["#EAE3CA"].elevation + layers["#EAE3CA"].height + 0.02;
    factories.forEach((factory, index) => {
      const world = worldPoint(markedPoints[index]);
      const equipment = factory();
      equipment.scale.setScalar(0.38);
      equipment.position.set(world.x, baseY, world.y);
      equipment.rotation.y = index * 0.35;
      map.add(equipment);
    });
    return;
  }
  const center = bounds.getCenter(new THREE.Vector2());
  // Keep a model-sized safety margin from the playground boundary.
  const modelMargin = 0.35;
  const svgMargin = modelMargin / SCALE;
  const insetX = Math.max((bounds.max.x - bounds.min.x) * 0.1, modelMargin);
  const insetY = Math.max((bounds.max.y - bounds.min.y) * 0.1, modelMargin);
  const distanceToEdge = (point, start, end) => {
    const edge = end.clone().sub(start);
    const t = THREE.MathUtils.clamp(point.clone().sub(start).dot(edge) / edge.lengthSq(), 0, 1);
    return point.distanceTo(start.clone().add(edge.multiplyScalar(t)));
  };
  const candidates = [];
  for (let x = 0; x <= 60; x += 1) {
    for (let y = 0; y <= 60; y += 1) {
      const point = new THREE.Vector2(
        bounds.min.x + insetX + x / 60 * ((bounds.max.x - bounds.min.x) - insetX * 2),
        bounds.min.y + insetY + y / 60 * ((bounds.max.y - bounds.min.y) - insetY * 2),
      );
      const edgeDistance = Math.min(...polygon.map((start, index) => (
        distanceToEdge(point, start, polygon[(index + 1) % polygon.length])
      )));
      if (isInsidePolygon(point, polygon) && edgeDistance >= svgMargin) candidates.push(point);
    }
  }
  if (!candidates.length) {
    const fallback = center.clone();
    if (isInsidePolygon(fallback, polygon)) candidates.push(fallback);
  }
  const chosen = [];
  while (chosen.length < factories.length && candidates.length) {
    let bestIndex = 0;
    let bestDistance = -Infinity;
    candidates.forEach((candidate, index) => {
      const distance = chosen.length === 0
        ? candidate.distanceTo(center)
        : Math.min(...chosen.map((point) => candidate.distanceTo(point)));
      if (distance > bestDistance) { bestDistance = distance; bestIndex = index; }
    });
    chosen.push(candidates.splice(bestIndex, 1)[0]);
  }
  if (chosen.length < factories.length) return;
  const baseY = layers["#EAE3CA"].elevation + layers["#EAE3CA"].height + 0.02;
  factories.forEach((factory, index) => {
    const world = worldPoint(chosen[index]);
    const equipment = factory();
    equipment.scale.setScalar(0.38);
    equipment.position.set(world.x, baseY, world.y);
    equipment.rotation.y = index * 0.35;
    map.add(equipment);
  });
}

function addHouse(spec) {
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xf8f8f2, roughness: 0.78 });
  const roofMaterial = bodyMaterial.clone();
  bodyMaterial.emissive.set(0xffb56b);
  roofMaterial.emissive.set(0xffb56b);
  bodyMaterial.emissiveIntensity = 0;
  roofMaterial.emissiveIntensity = 0;
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
    const light = new THREE.PointLight(0xffb56b, 0, 4.5, 2);
    light.position.set(0, 0.7, 0);
    light.castShadow = false;
    group.add(light);
    map.add(group);
    houseLights.push({ light, materials: [bodyMaterial, roofMaterial] });
    const glow = new THREE.Mesh(new THREE.CircleGeometry(1, 16), houseGlowMaterial);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(center.x, layers["#CD80DD"].elevation + layers["#CD80DD"].height + 0.012, center.y);
    glow.scale.set(1.35, 1.35, 1);
    glow.renderOrder = 25;
    map.add(glow);
    houseGlows.push(glow);
    const shadow = new THREE.Mesh(new THREE.BufferGeometry(), houseShadowMaterial);
    // Vertices are already written in world X/Y/Z coordinates.
    shadow.rotation.x = 0;
    shadow.renderOrder = 20;
    map.add(shadow);
    houseShadows.push({ group, width, depth, bodyHeight, roofHeight, shadow });
}

function convexHull(points) {
  const sorted = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower = [];
  sorted.forEach((point) => { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop(); lower.push(point); });
  const upper = [];
  sorted.slice().reverse().forEach((point) => { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop(); upper.push(point); });
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

function updateHouseShadows() {
  // На дальнем плане малый постоянный offset теряется в depth-buffer.
  const cameraDistance = camera.position.distanceTo(controls.target);
  const surfaceOffset = Math.max(0.004, cameraDistance * 0.00018);
  const groundY = layers["#CD80DD"].elevation + layers["#CD80DD"].height + surfaceOffset;
  const direction = new THREE.Vector3().subVectors(sun.position, sun.target.position).normalize();
  houseShadows.forEach(({ group, width, depth, bodyHeight, roofHeight, shadow }) => {
    shadow.visible = direction.y > -0.12;
    shadow.material.opacity = 0.39 * THREE.MathUtils.smoothstep(daylightLevel, 0, 1);
    if (!shadow.visible) return;
    const local = [
      [-width / 2, 0, -depth / 2], [width / 2, 0, -depth / 2], [width / 2, 0, depth / 2], [-width / 2, 0, depth / 2],
      [-width / 2, bodyHeight, -depth / 2], [width / 2, bodyHeight, -depth / 2], [width / 2, bodyHeight, depth / 2], [-width / 2, bodyHeight, depth / 2],
      [0, bodyHeight + roofHeight, 0],
    ];
    const projected = local.map(([x, y, z]) => {
      const point = new THREE.Vector3(x, y, z).applyMatrix4(group.matrixWorld);
      const distance = (groundY - point.y) / direction.y;
      return new THREE.Vector2(point.x + direction.x * distance, point.z + direction.z * distance);
    });
    const hull = convexHull(projected);
    const positions = new Float32Array(hull.length * 3);
    hull.forEach((point, index) => { positions[index * 3] = point.x; positions[index * 3 + 1] = groundY; positions[index * 3 + 2] = point.y; });
    shadow.geometry.dispose();
    shadow.geometry = new THREE.BufferGeometry();
    shadow.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    shadow.geometry.setIndex(hull.slice(1, -1).flatMap((_, index) => [0, index + 1, index + 2]));
    shadow.geometry.computeVertexNormals();
    shadow.geometry.computeBoundingSphere();
    shadow.geometry.computeBoundingBox();
  });
  plantingShadows.forEach(({ tree, shadow, scale, profile, groundY }) => {
    const dayFactor = THREE.MathUtils.smoothstep(daylightLevel, 0, 1);
    shadow.visible = sun.position.y > 0 && dayFactor > 0.001;
    shadow.material.opacity = 0.18 * dayFactor;
    if (!shadow.visible) return;
    const direction = new THREE.Vector3().subVectors(sun.position, sun.target.position).normalize();
    const baseRadius = profile.radius * scale * 0.72;
    const apex = new THREE.Vector3(
      tree.position.x,
      tree.position.y + profile.height * scale,
      tree.position.z,
    );
    const apexDistance = (groundY - apex.y) / direction.y;
    const projectedApex = new THREE.Vector3(
      apex.x + direction.x * apexDistance,
      groundY,
      apex.z + direction.z * apexDistance,
    );
    const points = [];
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      points.push(new THREE.Vector2(
        tree.position.x + Math.cos(angle) * baseRadius,
        tree.position.z + Math.sin(angle) * baseRadius,
      ));
    }
    points.push(new THREE.Vector2(projectedApex.x, projectedApex.z));
    const hull = convexHull(points);
    const positions = new Float32Array(hull.length * 3);
    hull.forEach((point, index) => {
      positions[index * 3] = point.x;
      positions[index * 3 + 1] = groundY;
      positions[index * 3 + 2] = point.y;
    });
    shadow.geometry.dispose();
    shadow.geometry = new THREE.BufferGeometry();
    shadow.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    shadow.geometry.setIndex(hull.slice(1, -1).flatMap((_, index) => [0, index + 1, index + 2]));
    shadow.geometry.computeBoundingSphere();
  });
  if (forestShadowMesh) {
    const groundY = layers["#CD80DD"].elevation + layers["#CD80DD"].height + 0.001;
    const direction = new THREE.Vector3().subVectors(sun.position, sun.target.position).normalize();
    const daylight = THREE.MathUtils.smoothstep(daylightLevel, 0, 1);
    forestShadowMesh.visible = direction.y > 0 && daylight > 0.001;
    forestShadowMaterial.opacity = 0.16 * daylight;
    if (forestShadowMesh.visible) {
      const horizontal = Math.hypot(direction.x, direction.z);
      const matrix = new THREE.Matrix4();
      forestShadowRecords.forEach(({ position, scale, radius, height }, index) => {
        const shadowLength = Math.min(45, Math.max(0.05, (height * scale - (groundY - position.y)) * horizontal / Math.max(0.08, direction.y)));
        const awayX = -direction.x / Math.max(0.001, horizontal);
        const awayZ = -direction.z / Math.max(0.001, horizontal);
        const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(awayX, awayZ));
        matrix.compose(
          new THREE.Vector3(position.x, groundY + 0.001, position.z),
          rotation,
          new THREE.Vector3(radius * scale, shadowLength, 1),
        );
        forestShadowMesh.setMatrixAt(index, matrix);
      });
      forestShadowMesh.instanceMatrix.needsUpdate = true;
    }
  }
}

function startNightSchedules() {
  nightScheduleActive = true;
  houseLights.forEach((house) => {
    house.turnOnAfter = 10 + Math.random() * 20;
    house.turnOffAfter = house.turnOnAfter + 60 + Math.random() * 240;
  });
}

function updateHouseLights() {
  const night = THREE.MathUtils.smoothstep(1 - daylightLevel, 0.05, 0.72);
  if (!nightScheduleActive && daylightLevel <= 0.08) startNightSchedules();
  if (lastDaylightLevel <= 0.08 && daylightLevel > 0.08) nightScheduleActive = false;
  const nightMinutes = nightScheduleActive
    ? THREE.MathUtils.clamp(((Math.PI * 2 - sunPhase) / Math.PI) * 720, 0, 720)
    : 0;
  houseLights.forEach((house) => {
    const scheduledOn = nightScheduleActive && nightMinutes >= house.turnOnAfter && nightMinutes < house.turnOffAfter;
    const intensity = scheduledOn ? night : 0;
    house.light.intensity = 2.6 * intensity;
    house.materials.forEach((material) => { material.emissiveIntensity = 0.56 * intensity; });
  });
  houseGlowMaterial.opacity = 0.84 * night;
  houseGlows.forEach((glow, index) => {
    const house = houseLights[index];
    const scheduledOn = nightScheduleActive && house && nightMinutes >= house.turnOnAfter && nightMinutes < house.turnOffAfter;
    glow.visible = scheduledOn && night > 0.001;
    const cameraDistance = camera.position.distanceTo(controls.target);
    glow.position.y = layers["#CD80DD"].elevation + layers["#CD80DD"].height + Math.max(0.004, cameraDistance * 0.00018);
  });
  lastDaylightLevel = daylightLevel;
}

function updatePoleLights() {
  const fiveMinutes = (Math.PI * 2 * 5) / 1440;
  const thirtyMinutes = (Math.PI * 2 * 30) / 1440;
  const night = THREE.MathUtils.smoothstep(1 - daylightLevel, 0.05, 0.72);
  const active = sunPhase > Math.PI + thirtyMinutes && sunPhase < Math.PI * 2 - fiveMinutes;
  const intensity = active ? night : 0;
  poleLights.forEach(({ light, lamp }) => {
    light.intensity = 0.85 * intensity;
    lamp.material.emissiveIntensity = 1.4 * intensity;
  });
  const cameraDistance = camera.position.distanceTo(controls.target);
  poleGlows.forEach((glow) => {
    glow.visible = active && night > 0.001;
    glow.material.opacity = 0.84 * intensity;
    glow.position.y = layers["#98B4BA"].elevation + layers["#98B4BA"].height + Math.max(0.004, cameraDistance * 0.00018);
  });
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

function seedLightPoles(lightPolePaths, guidePaths = []) {
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x343a3d, roughness: 0.68, metalness: 0.35 });
  const lampMaterial = new THREE.MeshStandardMaterial({
    color: 0xffe4a3,
    emissive: 0xffb45e,
    emissiveIntensity: 0.8,
    roughness: 0.35,
  });
  const poleBaseY = layers["#98B4BA"].elevation + layers["#98B4BA"].height + 0.02;
  const guides = guidePaths.map((path) => {
    const subPaths = path.subPaths
      .map((subPath) => subPath.getPoints(3))
      .filter((points) => points.length >= 2);
    if (!subPaths.length) return null;

    // Current SVG guides are simple lines: start near the pole, end points
    // toward the luminaire orientation.
    if (subPaths.length === 1) {
      const points = subPaths[0];
      const start = points[0];
      const end = points[points.length - 1];
      const worldStart = worldPoint(start);
      const worldEnd = worldPoint(end);
      return {
        anchor: start,
        center: start.clone().lerp(end, 0.5),
        direction: worldEnd.sub(worldStart).normalize(),
      };
    }

    const average = (points) => points.reduce(
      (sum, point) => sum.add(point),
      new THREE.Vector2(),
    ).multiplyScalar(1 / points.length);
    const headCenter = average(subPaths[0]);
    const shaftCenter = average(subPaths[1]);
    const worldHead = worldPoint(headCenter);
    const worldShaft = worldPoint(shaftCenter);
    const direction = worldHead.sub(worldShaft).normalize();
    return {
      anchor: shaftCenter,
      center: headCenter.clone().lerp(shaftCenter, 0.5),
      direction,
    };
  }).filter(Boolean);
  let poleNumber = 0;
  lightPolePaths.forEach((path) => {
    SVGLoader.createShapes(path).forEach((shape) => {
      const points = shape.extractPoints(4).shape;
      if (points.length < 3) return;
      const bounds = points.reduce((box, point) => box.expandByPoint(point), new THREE.Box2());
      const sourceCenter = bounds.getCenter(new THREE.Vector2());
      const center = worldPoint(sourceCenter);
      const pole = new THREE.Group();
      pole.position.set(center.x, poleBaseY, center.y);
      poleNumber += 1;
      const nearestGuide = guides.reduce((best, guide) => {
        if (!best) return guide;
        return guide.anchor.distanceToSquared(sourceCenter) < best.anchor.distanceToSquared(sourceCenter) ? guide : best;
      }, null);
      if (nearestGuide) {
        // The red base only locates the pole; its SVG rotation is ignored.
        // Orientation comes exclusively from the green guide line.
        pole.rotation.y = Math.atan2(-nearestGuide.direction.y, nearestGuide.direction.x);
      }
      if (poleNumber === 3) pole.rotation.y += Math.PI;
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.35, 8), poleMaterial);
      shaft.position.y = 0.675;
      shaft.castShadow = false;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.035), poleMaterial);
      arm.position.set(0.09, 1.35, 0);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), lampMaterial);
      lamp.position.set(0.19, 1.31, 0);
      pole.add(shaft, arm, lamp);
      map.add(pole);
      const light = new THREE.PointLight(0xffc36e, 0, 3.8, 2);
      light.position.set(0.19, 1.28, 0);
      pole.add(light);
      poleLights.push({ light, lamp });
      const glow = new THREE.Mesh(new THREE.CircleGeometry(1, 16), houseGlowMaterial);
      glow.rotation.x = -Math.PI / 2;
      glow.position.set(center.x, poleBaseY + 0.018, center.y);
      glow.scale.set(1.9, 1.9, 1);
      glow.renderOrder = 25;
      map.add(glow);
      poleGlows.push(glow);
    });
  });
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
  const pineProfiles = [
    { radius: 0.72, height: 3.05 },
    { radius: 0.86, height: 2.875 },
    { radius: 0.62, height: 1.975 },
  ];
  const pineCapacity = 6300;
  const templates = pineFactories.map((factory) => factory());
  const pineBatches = templates.map((template) => template.children.map((part) => {
    const mesh = new THREE.InstancedMesh(part.geometry, part.material, pineCapacity);
    mesh.castShadow = false;
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
    forestShadowRecords.push({ position: new THREE.Vector3(point.x, forestBaseY, point.y), scale, ...pineProfiles[type] });
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
      batch.castShadow = false;
    batch.receiveShadow = true;
    batch.count = counts[type];
    batch.instanceMatrix.needsUpdate = true;
    batch.computeBoundingSphere();
  }));
  map.add(pines);
  pines.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = false;
      object.receiveShadow = true;
    }
  });
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
  const carRoute = extractCarRoute(parsed);
  const plantingPaths = parsed.paths.filter((path) => fillOf(path) === "#9A0062");
  const lightPolePaths = parsed.paths.filter((path) => fillOf(path) === "#A93030");
  const guidePaths = parsed.paths.filter((path) => {
    const style = path.userData?.style || {};
    const stroke = String(style.stroke || "").replace(/^#/, "").toUpperCase();
    const fill = String(style.fill || "").replace(/^#/, "").toUpperCase();
    return stroke === "04FE9A" || fill === "04FE9A";
  });
  parsed.paths.forEach((path) => {
    const fill = fillOf(path);
    if (layers[fill]) addTerritory(path, layers[fill]);
  });
  readHouses(svgText).forEach(addHouse);
  seedPines();
  addPlantingPines(plantingPaths);
  seedLightPoles(lightPolePaths, guidePaths);
  map.updateMatrixWorld(true);
  updateHouseShadows();
  updateHouseLights();
  updatePoleLights();
  seedCars(carRoute);
  seedFruitTrees();
  seedPlaygroundEquipment();
  controls.target.copy(settlementTarget);
  controls.update();
}

function setCamera(position) {
  camera.position.set(...position);
  controls.target.copy(settlementTarget);
  controls.update();
}

document.querySelector("#reset-camera").addEventListener("click", () => setCamera([-17, 40, -42]));
renderer.domElement.addEventListener("pointermove", (event) => {
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(interactiveMeshes, false)[0]?.object || null;
  if (hoveredPlot === hit) {
    if (hit?.userData.plotNumber) {
      plotLabel.style.left = `${event.clientX + 14}px`;
      plotLabel.style.top = `${event.clientY - 34}px`;
    }
    return;
  }
  if (hoveredPlot) (hoveredPlot.userData.plotHighlight || hoveredPlot.userData.hoverHighlight).visible = false;
  hoveredPlot = hit;
  if (hoveredPlot) {
    (hoveredPlot.userData.plotHighlight || hoveredPlot.userData.hoverHighlight).visible = true;
    if (hoveredPlot.userData.plotNumber) {
      plotLabel.textContent = hoveredPlot.userData.plotNumber;
      plotLabel.style.left = `${event.clientX + 14}px`;
      plotLabel.style.top = `${event.clientY - 34}px`;
      plotLabel.classList.add("visible");
    }
  } else {
    plotLabel.classList.remove("visible");
  }
});

renderer.domElement.addEventListener("pointerleave", () => {
  if (hoveredPlot) (hoveredPlot.userData.plotHighlight || hoveredPlot.userData.hoverHighlight).visible = false;
  hoveredPlot = null;
  plotLabel.classList.remove("visible");
});

window.addEventListener("resize", () => {
  camera.aspect = host.clientWidth / host.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(host.clientWidth, host.clientHeight);
});

function animate() {
  controls.update();
  if (!sunDragging) setSunPhase(sunPhase - 0.0007);
  map.updateMatrixWorld(true);
  updateHouseShadows();
  updateHouseLights();
  updatePoleLights();
  movingCars.forEach((car) => {
    const route = car.userData.route;
    car.userData.progress = (car.userData.progress + car.userData.speed * 0.016) % 1;
    const position = route.getPointAt(car.userData.progress);
    const tangent = route.getTangentAt(car.userData.progress);
    car.position.copy(position);
    car.rotation.y = Math.atan2(tangent.x, tangent.z);
    const night = THREE.MathUtils.smoothstep(1 - daylightLevel, 0.08, 0.72);
    car.userData.headlights?.forEach((lamp) => { lamp.material.opacity = 0.95 * night; });
    car.userData.headlightBeams?.forEach((beam) => { beam.material.opacity = 0.72 * night; });
  });
  publicMeshes.forEach(({ mesh, point, name }) => {
    if (!name) return;
    const projected = new THREE.Vector3(point.x, mesh.position.y + 0.45, point.y).project(camera);
    const visible = projected.z > -1 && projected.z < 1;
    if (!mesh.userData.publicLabel) {
      const label = document.createElement("div");
      label.className = "public-label";
      label.textContent = name;
      host.appendChild(label);
      mesh.userData.publicLabel = label;
    }
    const label = mesh.userData.publicLabel;
    label.style.display = visible ? "block" : "none";
    if (visible) {
      label.style.left = `${(projected.x * 0.5 + 0.5) * host.clientWidth}px`;
      label.style.top = `${(-projected.y * 0.5 + 0.5) * host.clientHeight}px`;
    }
  });
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
  console.error(error);
  console.error(error);
});
animate();
