import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
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
import { houseShadows as cachedHouseShadows } from "../models/shadows.js";
import { houseLocations } from "./houseLocations.js";
import { sceneData } from "./sceneData.js";
import { firstQueueFlagUrl, secondQueueFlagUrl, thirdQueueFlagUrl } from "./queueFlagAssets.js";
import entranceLogoSvg from "../лого.svg?raw";
const host = document.querySelector("#scene");
const DEVELOPER_TOOLS_COMMAND = "покажи инструменты разработчика";
const HIDE_DEVELOPER_TOOLS_COMMAND = "спрячь инструменты разработчика";
let developerCommandBuffer = "";
const showDeveloperTools = () => {
  document.body.classList.add("developer-tools-visible");
};
const hideDeveloperTools = () => {
  document.body.classList.remove("developer-tools-visible");
};
window.showDeveloperTools = showDeveloperTools;
window.hideDeveloperTools = hideDeveloperTools;
window.addEventListener("keydown", (event) => {
  if (event.key.length !== 1) return;
  developerCommandBuffer = `${developerCommandBuffer}${event.key.toLowerCase()}`.slice(-Math.max(DEVELOPER_TOOLS_COMMAND.length, HIDE_DEVELOPER_TOOLS_COMMAND.length));
  if (developerCommandBuffer === DEVELOPER_TOOLS_COMMAND) showDeveloperTools();
  if (developerCommandBuffer === HIDE_DEVELOPER_TOOLS_COMMAND) hideDeveloperTools();
});
import { firstQueuePlots } from "./firstQueuePlots.js";
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
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
// Protected visual settings: change only after explicit confirmation.
const GROUND_FOG_PEAK_DENSITY = 0.012;
const GROUND_FOG_COLOR = new THREE.Color(0xffffff);
scene.fog = new THREE.FogExp2(0xffffff, 0);
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(-17, 40, -42);
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(7, -6, 7);
const camera = new THREE.PerspectiveCamera(41, host.clientWidth / host.clientHeight, 0.1, 500);
camera.position.copy(DEFAULT_CAMERA_POSITION);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(DEFAULT_CAMERA_TARGET);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 30;
controls.maxDistance = 80;
controls.update();
const MIN_CAMERA_HEIGHT = 0.2;
let settlementBounds = null;
const clampCameraTarget = () => {
  if (!settlementBounds) return;
  const viewMargin = Math.min(25, controls.getDistance() * 0.3);
  const minX = settlementBounds.min.x + viewMargin;
  const maxX = settlementBounds.max.x - viewMargin;
  const minZ = settlementBounds.min.y + viewMargin;
  const maxZ = settlementBounds.max.y - viewMargin;
  controls.target.x = THREE.MathUtils.clamp(controls.target.x, Math.min(minX, maxX), Math.max(minX, maxX));
  controls.target.z = THREE.MathUtils.clamp(controls.target.z, Math.min(minZ, maxZ), Math.max(minZ, maxZ));
};
const updateCameraReadout = () => {
  const format = (value) => value.toFixed(2);
  const zoomDistance = controls.getDistance().toFixed(2);
  cameraReadout.innerHTML = `[${camera.position.toArray().map(format).join(", ")}]<br>[${controls.target.toArray().map(format).join(", ")}]<br>Масштаб: ${zoomDistance}`;
};
controls.addEventListener("change", () => {
  clampCameraTarget();
  if (camera.position.y < MIN_CAMERA_HEIGHT) camera.position.y = MIN_CAMERA_HEIGHT;
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
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -100;
sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100;
sun.shadow.camera.bottom = -100;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 220;
sun.shadow.bias = -0.00015;
sun.shadow.normalBias = 0.025;
scene.add(sun);

function createNightSkyTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  context.fillStyle = "#071326";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  return texture;
}

function createNightStars() {
  const positions = [];
  const colors = [];
  let seed = 28101996;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const starColors = [new THREE.Color(0xffd9a3), new THREE.Color(0xfff4d6), new THREE.Color(0xd9e8ff), new THREE.Color(0xaecbff)];
  for (let index = 0; index < 850; index += 1) {
    const theta = random() * Math.PI * 2;
    const phi = random() * Math.PI / 2;
    const radius = 300;
    positions.push(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta),
    );
    const color = starColors[Math.floor(random() * starColors.length)];
    colors.push(color.r, color.g, color.b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const stars = new THREE.Points(geometry, new THREE.PointsMaterial({ size: 2.6, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: false, depthWrite: false, depthTest: false, fog: false, blending: THREE.AdditiveBlending }));
  stars.frustumCulled = false;
  stars.renderOrder = -999;
  return stars;
}

const nightSky = new THREE.Mesh(
  new THREE.SphereGeometry(430, 32, 16),
  new THREE.MeshBasicMaterial({ map: createNightSkyTexture(), side: THREE.BackSide, transparent: false, opacity: 1, depthWrite: false, depthTest: false, fog: false }),
);
const nightStars = createNightStars();
nightSky.frustumCulled = false;
nightSky.renderOrder = -1000;
scene.add(nightSky);
scene.add(nightStars);
// Start in the same night state as the initial sun position.
scene.background = nightSky.material.map;
nightSky.visible = false;
nightStars.visible = false;

function createCloudTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.filter = "blur(10px)";
  [
    [88, 144, 72, 0.58],
    [158, 116, 88, 0.72],
    [246, 128, 104, 0.78],
    [340, 130, 78, 0.62],
    [414, 150, 56, 0.45],
  ].forEach(([x, y, radius, opacity]) => {
    const gradient = context.createRadialGradient(x, y, radius * 0.15, x, y, radius);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
    gradient.addColorStop(0.68, `rgba(255, 255, 255, ${opacity * 0.42})`);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  });
  context.filter = "none";
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
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.filter = "blur(18px)";
  [
    [102, 144, 82, 0.18],
    [202, 128, 108, 0.22],
    [322, 132, 96, 0.2],
    [424, 148, 68, 0.14],
  ].forEach(([x, y, radius, opacity]) => {
    const gradient = context.createRadialGradient(x, y, radius * 0.1, x, y, radius);
    gradient.addColorStop(0, `rgba(31, 48, 43, ${opacity})`);
    gradient.addColorStop(0.72, `rgba(31, 48, 43, ${opacity * 0.34})`);
    gradient.addColorStop(1, "rgba(31, 48, 43, 0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  });
  context.filter = "none";
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const cloudGroup = new THREE.Group();
const cloudTexture = createCloudTexture();
const cloudShadowGroup = new THREE.Group();
const cloudShadowTexture = createCloudShadowTexture();
let groundSurfaceBounds = null;
const cloudMaterial = new THREE.SpriteMaterial({ map: cloudTexture, transparent: true, depthWrite: false, opacity: 0.64, fog: false });
const cloudShadowMaterial = new THREE.MeshBasicMaterial({
  color: 0x2f443d,
  map: cloudShadowTexture,
  transparent: true,
  depthWrite: false,
  depthTest: false,
  opacity: 0.38,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
});
const cloudSpecs = [
  [-185, 72, -104, 82, 34, 0.006],
  [-118, 88, 16, 104, 42, 0.0045],
  [-42, 66, 124, 92, 36, 0.0055],
  [46, 94, -72, 120, 44, 0.004],
  [132, 78, 58, 96, 38, 0.005],
  [188, 86, -132, 108, 40, 0.0046],
  [-224, 102, 118, 112, 42, 0.0038],
  [226, 70, 156, 86, 34, 0.0058],
  [-248, 82, -12, 94, 36, 0.0048],
  [-156, 64, 178, 78, 30, 0.0062],
  [-82, 104, -168, 116, 44, 0.0039],
  [18, 76, 196, 98, 38, 0.0052],
  [92, 62, -8, 84, 32, 0.006],
  [166, 108, 118, 124, 46, 0.0036],
  [254, 92, -48, 106, 40, 0.0044],
  [-282, 68, -156, 88, 34, 0.0056],
];
function updateCloudShadowPosition(shadow) {
  const data = shadow.userData;
  const random = (value) => {
    const result = Math.sin(value * 12.9898) * 43758.5453;
    return result - Math.floor(result);
  };
  if (groundSurfaceBounds && !data.initialized) {
    data.x = THREE.MathUtils.lerp(groundSurfaceBounds.min.x, groundSurfaceBounds.max.x, random(data.seed));
    data.baseZ = THREE.MathUtils.lerp(groundSurfaceBounds.min.y, groundSurfaceBounds.max.y, random(data.seed + 17));
    data.initialized = true;
  }
  const halfWidth = data.width * 0.5;
  const fadeDistance = 24;
  data.x += data.speed;
  if (groundSurfaceBounds && data.x > groundSurfaceBounds.max.x + halfWidth) {
    data.cycle += 1;
    data.baseZ = THREE.MathUtils.lerp(
      groundSurfaceBounds.min.y,
      groundSurfaceBounds.max.y,
      random(data.seed + data.cycle * 23),
    );
    data.speed = 0.09 + random(data.seed + data.cycle * 31) * 0.08;
    data.x = groundSurfaceBounds.min.x + fadeDistance;
    data.entryOpacity = 0;
  }
  if (groundSurfaceBounds) {
    data.entryOpacity = Math.min(1, (data.entryOpacity ?? 1) + data.speed / fadeDistance);
    const enterProgress = data.entryOpacity;
    const exitProgress = 1 - THREE.MathUtils.smoothstep(
      data.x,
      groundSurfaceBounds.max.x + halfWidth - fadeDistance,
      groundSurfaceBounds.max.x + halfWidth,
    );
    data.edgeOpacity = enterProgress * exitProgress;
    shadow.material.opacity = data.baseOpacity * data.edgeOpacity;
  }
  shadow.position.x = data.x;
  // Plot surfaces end at 0.18; keep the overlay just above them.
  shadow.position.y = 0.186;
  shadow.position.z = data.baseZ + Math.sin(data.x * 0.035 + data.phase) * 4;
}
cloudSpecs.forEach(([x, y, z, width, height, speed], index) => {
  const cloud = new THREE.Sprite(cloudMaterial);
  cloud.position.set(x, y, z);
  cloud.scale.set(width, height, 1);
  cloud.userData.speed = speed;
  cloud.userData.width = width;
  cloudGroup.add(cloud);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 1.18, height * 1.45),
    cloudShadowMaterial.clone(),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.renderOrder = 8;
  shadow.userData.x = -78 + (index % 8) * 22;
  shadow.userData.baseZ = -24 + Math.floor(index / 8) * 34;
  shadow.userData.speed = 0.09 + (index % 5) * 0.02;
  shadow.userData.cycle = 0;
  shadow.userData.phase = index * 1.7;
  shadow.userData.seed = index + 1;
  shadow.userData.width = width * 1.18;
  shadow.userData.edgeOpacity = 0;
  shadow.userData.baseOpacity = 0;
  updateCloudShadowPosition(shadow);
  cloudShadowGroup.add(shadow);
});
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
sunDial.innerHTML = "<div class=\"sun-dial__ring\"><span class=\"sun-dial__dot\"></span><b class=\"sun-dial__east\">Восток</b><b class=\"sun-dial__zenith\">Зенит</b><b class=\"sun-dial__west\">Запад</b><b class=\"sun-dial__nadir\">Надир</b></div>";
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
      // Zenith to west: start warming while the sun still has enough intensity.
      const t = THREE.MathUtils.smoothstep(sunPhase / (Math.PI / 2), 0.1, 0.78);
      sunColor = dusk.clone().lerp(noon, t);
    }
  }
  sun.color.copy(sunColor);
  const nightAmount = 1 - THREE.MathUtils.smoothstep(daylightCurve, 0.015, 0.55);
  const sunsetWarmth = height > 0 && sunPhase < Math.PI / 2
    ? 1 - THREE.MathUtils.smoothstep(sunPhase / (Math.PI / 2), 0.1, 0.78)
    : 0;
  const daySkyColor = new THREE.Color(0xc9dce1).lerp(dusk, sunsetWarmth * 0.3);
  const skyColor = daySkyColor.lerp(new THREE.Color(0x071326), nightAmount);
  scene.background = skyColor;
  nightSky.visible = false;
  nightStars.visible = true;
  nightStars.material.opacity = 0.9 * nightAmount;
  sun.intensity = daylightCurve * 3.8;
  ambientLight.intensity = 0.32 + daylightCurve * 1.78;
  ambientLight.color.copy(noon).lerp(dusk, sunsetWarmth * 0.38);
  ambientLight.groundColor.set(0x758775).lerp(new THREE.Color(0x705446), sunsetWarmth * 0.25);
  moonLight.intensity = nightAmount * 0.22;
  cloudShadowGroup.children.forEach((shadow) => {
    shadow.visible = daylightCurve > 0.001;
    shadow.userData.baseOpacity = 0.62 * daylightCurve;
    shadow.material.opacity = shadow.userData.baseOpacity * (shadow.userData.edgeOpacity ?? 1);
  });
  sunSprite.position.copy(sun.position).multiplyScalar(1.35);
  sunSprite.material.opacity = THREE.MathUtils.smoothstep(daylight, 0.005, 0.16);
  moonSprite.material.opacity = nightAmount * 0.8;
  const threeHours = Math.PI / 4;
  const oneHour = Math.PI / 12;
  const mistFadeIn = 1 - THREE.MathUtils.smoothstep(sunPhase, Math.PI + oneHour, Math.PI + threeHours);
  const mistFadeOut = THREE.MathUtils.smoothstep(sunPhase, Math.PI - oneHour * 0.7, Math.PI - oneHour * 0.35);
  const mistIntensity = mistFadeIn * mistFadeOut;
  scene.fog.density = mistIntensity * GROUND_FOG_PEAK_DENSITY;
  scene.fog.color.copy(GROUND_FOG_COLOR);
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
let createHouseModel = null;
let houseOffMaterial = null;
let houseOnMaterial = null;
const poleLights = [];
const poleLabels = [];
const entranceLights = [];
const entranceGlows = [];
const poleGlows = [];
const axisLabels = [];
const entranceGateGroups = [];
let lastDaylightLevel = daylightLevel;
let nightScheduleActive = false;
let plantingPineFactories = [];
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
const houseGlowGeometry = new THREE.CircleGeometry(1, 16);
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
const firstQueueOutline = new THREE.Group();
firstQueueOutline.visible = false;
map.add(firstQueueOutline);
const secondQueueOutline = new THREE.Group();
secondQueueOutline.visible = false;
map.add(secondQueueOutline);
const thirdQueueOutline = new THREE.Group();
thirdQueueOutline.visible = false;
map.add(thirdQueueOutline);
const villageFence = new THREE.Group();
map.add(villageFence);
const innerFence = new THREE.Group();
map.add(innerFence);
const gateOpeningCenters = [];
const publicMeshes = [];
const movingCars = [];
const publicLabels = ["Спортивная площадка", "Магазин", "Фруктовый сад", "Детская площадка", null, null];
const firstQueueNumbers = new Map([
  [57, 30], [49, 29], [48, 28], [50, 27], [51, 26], [52, 25], [53, 24], [71, 23],
  [31, 21], [38, 20], [39, 19], [40, 18], [41, 17], [85, 16], [82, 58], [83, 59], [76, 60],
]);
const firstQueuePlotData = new Map(firstQueuePlots.map((plot) => [plot.number, plot]));
let hoveredPlot = null;
const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const SVG_W = 10144;
const SVG_H = 3831;
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
const settlementTarget = DEFAULT_CAMERA_TARGET.clone();
const HEIGHT_UNIT = 0.06;

const layers = {
  "#93CE84": { name: "Территория вне поселка", elevation: 0, height: 0.1, color: 0xc2df78 },
  "#B7DAD2": { name: "Общая территория", elevation: HEIGHT_UNIT * 1.5, height: HEIGHT_UNIT, color: 0xb7dad2 },
  "#98B4BA": { name: "Региональная дорога", elevation: HEIGHT_UNIT * 2, height: HEIGHT_UNIT, color: 0x98b4ba },
  "#D3D7DE": { name: "Обочина", elevation: HEIGHT_UNIT, height: HEIGHT_UNIT * 0.8, color: 0xd3d7de },
  "#9AA0A3": { name: "Дороги поселка", elevation: HEIGHT_UNIT * 2, height: HEIGHT_UNIT, color: 0x9aa0a3 },
  "#59A37E": { name: "Лес", elevation: HEIGHT_UNIT, height: HEIGHT_UNIT, color: 0x59a37e },
  "#509874": { name: "Лес", elevation: HEIGHT_UNIT, height: HEIGHT_UNIT, color: 0x509874 },
  "#498F6C": { name: "Лес", elevation: HEIGHT_UNIT, height: HEIGHT_UNIT, color: 0x498f6c },
  "#B4ED92": { name: "Посадка", elevation: 0, height: 0, color: 0xb4ed92, hidden: true },
  "#EAE3CA": { name: "Общественные места", elevation: HEIGHT_UNIT * 3, height: HEIGHT_UNIT, color: 0xeae3ca },
  "#A4C1E3": { name: "Электрическая подстанция", elevation: HEIGHT_UNIT * 3, height: HEIGHT_UNIT, color: 0xa4c1e3, isSubstation: true },
  "#CD80DD": { name: "Участки домов", elevation: 0.08, height: HEIGHT_UNIT, color: 0xcee593, isPlot: true },
};
layers["#9AA0A3"].elevation = 0.085;
layers["#B7DAD2"].elevation = 0.07;
const forestZonePolygons = { "#59A37E": [], "#509874": [], "#498F6C": [] };
const forestZoneBounds = { "#59A37E": [], "#509874": [], "#498F6C": [] };

function fillOf(path) {
  const value = String(path.userData?.style?.fill || "").trim().toUpperCase();
  const rgb = value.match(/^RGB\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  const rgbPercent = value.match(/^RGB\(\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*\)$/);
  if (rgb) return `#${rgb.slice(1).map((channel) => Number(channel).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
  if (rgbPercent) return `#${rgbPercent.slice(1).map((channel) => Math.round(Number(channel) * 2.55).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
  return value;
}

function sceneShapes(path) {
  const pointSets = (path.shapes || []).filter((points) => points.length >= 3);
  const contains = (polygon, point) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i += 1) {
      const a = polygon[i];
      const b = polygon[j];
      const ax = Array.isArray(a) ? a[0] : a.x;
      const ay = Array.isArray(a) ? a[1] : a.y;
      const bx = Array.isArray(b) ? b[0] : b.x;
      const by = Array.isArray(b) ? b[1] : b.y;
      if ((ay > point.y) !== (by > point.y) && point.x < ((bx - ax) * (point.y - ay)) / (by - ay) + ax) inside = !inside;
    }
    return inside;
  };
  const shapes = pointSets.map((points) => {
    const getPoint = (point) => Array.isArray(point) ? { x: point[0], y: point[1] } : point;
    const shape = new THREE.Shape();
    shape.moveTo(getPoint(points[0]).x, getPoint(points[0]).y);
    points.slice(1).forEach((point) => {
      const value = getPoint(point);
      shape.lineTo(value.x, value.y);
    });
    return { shape, points };
  });
  const evenOdd = String(path.userData?.style?.fillRule || path.userData?.style?.fillrule || "").toLowerCase() === "evenodd";
  if (!evenOdd || shapes.length < 2) return shapes.map(({ shape }) => shape);
  // This road is exported as an outer boundary followed by its inner boundary.
  // The contours touch at the left connection, so point-in-polygon nesting is
  // unreliable there; preserve the SVG order and make the second contour a hole.
  if (shapes.length === 2) {
    const innerPoints = shapes[1].points.slice(0, -1);
    const innerShape = new THREE.Shape();
    const first = innerPoints[0];
    const firstValue = Array.isArray(first) ? { x: first[0], y: first[1] } : first;
    innerShape.moveTo(firstValue.x, firstValue.y);
    innerPoints.slice(1).forEach((point) => {
      const value = Array.isArray(point) ? { x: point[0], y: point[1] } : point;
      innerShape.lineTo(value.x, value.y);
    });
    shapes[0].shape.holes.push(innerShape);
    return [shapes[0].shape];
  }
  const result = [];
  shapes.forEach((candidate, index) => {
    const point = candidate.points[0];
    const pointValue = Array.isArray(point) ? { x: point[0], y: point[1] } : point;
    const container = shapes.find((other, otherIndex) => otherIndex !== index && contains(other.points, pointValue));
    if (!container) result.push(candidate.shape);
  });
  shapes.forEach((candidate, index) => {
    const point = candidate.points[0];
    const pointValue = Array.isArray(point) ? { x: point[0], y: point[1] } : point;
    const container = shapes.find((other, otherIndex) => otherIndex !== index && contains(other.points, pointValue));
    if (container) container.shape.holes.push(candidate.shape);
  });
  return result;
}

function adaptSceneData(data) {
  return data.paths.map((entry) => ({
    userData: { style: entry.style },
    shapes: entry.shapes,
    subPaths: entry.subPaths.map((points) => ({
      getPoints: () => points.map((point) => new THREE.Vector2(
        Array.isArray(point) ? point[0] : point.x,
        Array.isArray(point) ? point[1] : point.y,
      )),
    })),
  }));
}

function worldPoint(point) {
  return new THREE.Vector2(
    (SVG_W / 2 - (point.x - SVG_OFFSET_X)) * SCALE,
    (SVG_H / 2 - (point.y - SVG_OFFSET_Y)) * SCALE,
  );
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
    sceneShapes(path).forEach((shape) => {
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
  const shapes = sceneShapes(path);
  if (!groundSurfaceBounds) groundSurfaceBounds = new THREE.Box2();
  shapes.forEach((shape) => shape.extractPoints(8).shape.forEach((point) => groundSurfaceBounds.expandByPoint(worldPoint(point))));
  shapes.forEach((shape) => {
    const mesh = flatTexturedShape(shape, material);
    mesh.position.y = definition.elevation;
    mesh.renderOrder = Math.round(definition.elevation * 100);
    map.add(mesh);
    if (definition.isPlot) {
      mesh.userData.plotHighlight = addPlotOutline(shape, definition.elevation + definition.height);
      const points = shape.extractPoints(8).shape;
      if (!settlementBounds) settlementBounds = new THREE.Box2();
      points.forEach((point) => {
        const world = worldPoint(point);
        settlementBounds.expandByPoint(world);
      });
      const center = points.reduce((sum, point) => sum.add(point), new THREE.Vector2()).multiplyScalar(1 / points.length);
      mesh.userData.plotCenter = center;
      mesh.userData.plotNumber = firstQueueNumbers.get(plotMeshes.length) ?? null;
      mesh.userData.plotData = firstQueuePlotData.get(mesh.userData.plotNumber) ?? null;
      plotMeshes.push(mesh);
      interactiveMeshes.push(mesh);
    } else if (definition.color === 0xeae3ca) {
      const points = shape.extractPoints(8).shape;
      const center = points.reduce((sum, point) => sum.add(point), new THREE.Vector2()).multiplyScalar(1 / points.length);
      mesh.visible = false;
      publicMeshes.push({ mesh, point: worldPoint(center), shape, name: publicLabels[publicMeshes.length] ?? null });
    }
    if (definition.isSubstation) {
      mesh.userData.hoverHighlight = addPlotOutline(shape, definition.elevation + definition.height);
      interactiveMeshes.push(mesh);
    }
    if (definition.isSubstation) addSubstation(shape, definition.elevation + definition.height);
  });
}

function addPlantingPines(paths, markerPaths = []) {
  const factories = plantingPineFactories;
  if (factories.length !== 3) return;
  const profiles = [
    { radius: 0.72, height: 3.05 },
    { radius: 0.86, height: 2.875 },
    { radius: 0.62, height: 1.975 },
  ];
  let planted = 0;
  const placements = [];
  const markers = markerPaths.flatMap((path) => sceneShapes(path).map((shape) => {
    const points = shape.extractPoints(8).shape;
    return points.reduce((center, point) => center.add(point), new THREE.Vector2()).multiplyScalar(1 / points.length);
  }));
  paths.forEach((path) => {
    sceneShapes(path).forEach((shape) => {
      const points = shape.extractPoints(8).shape;
      if (!points.length) return;
      const bounds = points.reduce((box, point) => box.expandByPoint(point), new THREE.Box2());
      const step = 75;
      const shapeStart = planted;
      const addTree = (sourcePoint) => {
        const world = worldPoint(sourcePoint);
        const variant = planted % factories.length;
        const scale = 0.22 + (planted % 3) * 0.035;
        const position = new THREE.Vector3(world.x, HEIGHT_UNIT + 0.1, world.y);
        placements.push({ variant, scale, rotation: planted * 1.7, position });
        planted += 1;
      };
      const areaMarkers = markers.filter((marker) => isInsidePolygon(marker, points));
      areaMarkers.forEach(addTree);
      if (areaMarkers.length) return;
      for (let y = bounds.min.y; y <= bounds.max.y; y += step) {
        for (let x = bounds.min.x; x <= bounds.max.x; x += step) {
          const sourcePoint = new THREE.Vector2(x, y);
          if (!isInsidePolygon(sourcePoint, points)) continue;
          addTree(sourcePoint);
        }
      }
      if (planted === shapeStart) {
        const center = points.reduce((sum, point) => sum.add(point), new THREE.Vector2()).multiplyScalar(1 / points.length);
        addTree(center);
      }
    });
  });

  const templates = factories.map((factory) => factory());
  const batches = templates.map((template) => template.children.map((part, partIndex) => {
    const mesh = new THREE.InstancedMesh(part.geometry, part.material, planted);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    return mesh;
  }));
  const counts = [0, 0, 0];
  const matrix = new THREE.Matrix4();
  const treeMatrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scaleVector = new THREE.Vector3();
  placements.forEach(({ variant, scale, rotation, position }) => {
    const instance = counts[variant]++;
    quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation);
    scaleVector.setScalar(scale);
    treeMatrix.compose(position, quaternion, scaleVector);
    templates[variant].children.forEach((part, partIndex) => {
      part.updateMatrix();
      matrix.copy(treeMatrix).multiply(part.matrix);
      batches[variant][partIndex].setMatrixAt(instance, matrix);
    });
  });
  const instances = new THREE.Group();
  batches.forEach((parts, variant) => parts.forEach((mesh) => {
    mesh.count = counts[variant];
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    instances.add(mesh);
  }));
  map.add(instances);
}

function mergeFenceParts(geometries, material, group, { castShadow = false, renderOrder } = {}) {
  if (!geometries.length) return;
  const geometry = mergeGeometries(geometries, false);
  geometries.forEach((source) => source.dispose());
  if (!geometry) return;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = castShadow;
  if (renderOrder !== undefined) mesh.renderOrder = renderOrder;
  group.add(mesh);
}

function addFence(paths) {
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x4e5554, roughness: 0.72, metalness: 0.82 });
  const boardMaterial = new THREE.MeshStandardMaterial({ color: 0x4e413c, roughness: 0.95 });
  const posts = [];
  const boards = [];
  paths.forEach((path) => path.subPaths.forEach((subPath) => {
    const points = subPath.getPoints(8).map((point) => {
      const world = worldPoint(point);
      return new THREE.Vector3(world.x, 0, world.y);
    });
    for (let index = 0; index < points.length - 1; index += 1) {
      const start = points[index];
      const end = points[index + 1];
      const segment = new THREE.Vector3().subVectors(end, start);
      const length = segment.length();
      const direction = segment.clone().normalize();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction);
      const steps = Math.max(1, Math.ceil(length / 2.1));
      for (let step = 0; step < steps; step += 1) {
        const position = start.clone().lerp(end, step / steps);
        const geometry = new THREE.BoxGeometry(0.04, 0.98, 0.04);
        geometry.applyMatrix4(new THREE.Matrix4().compose(position.setY(0.49), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)));
        posts.push(geometry);
      }
      [0.28, 0.46, 0.64, 0.82].forEach((height) => {
        const geometry = new THREE.BoxGeometry(length, 0.14, 0.014);
        geometry.applyMatrix4(new THREE.Matrix4().compose(start.clone().add(end).multiplyScalar(0.5).setY(height), quaternion, new THREE.Vector3(1, 1, 1)));
        boards.push(geometry);
      });
    }
  }));
  mergeFenceParts(posts, postMaterial, villageFence, { castShadow: true });
  mergeFenceParts(boards, boardMaterial, villageFence);
}

function addInnerFence(paths) {
  const boardMaterial = new THREE.MeshStandardMaterial({ color: 0x777b7a, roughness: 0.9 });
  const supportMaterial = new THREE.MeshStandardMaterial({ color: 0x606463, roughness: 0.88, metalness: 0.15 });
  const boardWidth = 0.06;
  const fenceHeight = 0.4116;
  const boards = [];
  const supports = [];
  paths.forEach((path) => path.subPaths.forEach((subPath) => {
    const sourcePoints = subPath.getPoints(8);
    if (sourcePoints.length < 2) return;
    const points = sourcePoints.map((point) => {
      const world = worldPoint(point);
      return new THREE.Vector3(world.x, 0, world.y);
    });
    for (let index = 0; index < points.length - 1; index += 1) {
      const start = points[index];
      const end = points[index + 1];
      const segment = new THREE.Vector3().subVectors(end, start);
      const length = segment.length();
      const direction = segment.clone().normalize();
      // Build every SVG segment. Gate openings are separate objects and must
      // not remove complete fence fragments that happen to pass nearby.
      [[0, length]].forEach(([from, to]) => {
        const intervalLength = to - from;
        if (intervalLength <= 0.01) return;
        const intervalStart = start.clone().add(direction.clone().multiplyScalar(from));
        const intervalEnd = start.clone().add(direction.clone().multiplyScalar(to));
        const boardPitch = boardWidth * 2;
        const boardCount = Math.max(1, Math.ceil(intervalLength / boardPitch));
        for (let boardIndex = 0; boardIndex < boardCount; boardIndex += 1) {
          const board = new THREE.BoxGeometry(boardWidth, fenceHeight, 0.014);
          board.applyMatrix4(new THREE.Matrix4().compose(
            intervalStart.clone().add(intervalEnd).multiplyScalar(0.5).add(direction.clone().multiplyScalar((boardIndex + 0.5) * intervalLength / boardCount - intervalLength / 2)).setY(fenceHeight / 2 + 0.006),
            new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction), new THREE.Vector3(1, 1, 1),
          ));
          boards.push(board);
        }
        [0.1176, 0.3108].forEach((height) => {
          const support = new THREE.BoxGeometry(intervalLength, 0.0275, 0.01375);
          support.applyMatrix4(new THREE.Matrix4().compose(
            intervalStart.clone().add(intervalEnd).multiplyScalar(0.5).setY(height + 0.006),
            new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction), new THREE.Vector3(1, 1, 1),
          ));
          supports.push(support);
        });
      });
    }
  }));
  mergeFenceParts(boards, boardMaterial, innerFence, { renderOrder: 32 });
  mergeFenceParts(supports, supportMaterial, innerFence, { renderOrder: 32 });
}

function addConcreteGate(path) {
  const shape = sceneShapes(path)[0];
  if (!shape) return;
  const points = shape.extractPoints(4).shape;
  if (points.length < 4) return;
  const bounds = points.reduce((box, point) => box.expandByPoint(point), new THREE.Box2());
  const centerSource = bounds.getCenter(new THREE.Vector2());
  const center = worldPoint(centerSource);
  const edge = worldPoint(points[1]).sub(worldPoint(points[0])).normalize();
  gateOpeningCenters.push(new THREE.Vector3(center.x, 0, center.y));
  const group = new THREE.Group();
  group.position.set(center.x, 0, center.y);
  group.rotation.y = Math.atan2(-edge.y, edge.x);
  group.scale.setScalar(1.2);
  const concrete = new THREE.MeshStandardMaterial({ color: 0x9b9b96, roughness: 0.92 });
  const addBox = (geometry, position) => {
    const mesh = new THREE.Mesh(geometry, concrete);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  };
  addBox(new THREE.BoxGeometry(0.06, 0.49, 0.11), [-0.085, 0.245, 0]);
  addBox(new THREE.BoxGeometry(0.06, 0.49, 0.11), [0.085, 0.245, 0]);
  addBox(new THREE.BoxGeometry(0.23, 0.06, 0.11), [0, 0.46, 0]);
  map.add(group);
}

function queueStrokeType(path) {
  const stroke = String(path.userData?.style?.stroke || "").replace(/\s/g, "").toUpperCase();
  if (stroke === "#9A0062" || stroke === "RGB(154,0,98)") return "first";
  if (stroke === "#F8C7DC" || stroke === "RGB(248,199,220)") return "second";
  if (stroke === "#DBC7F8" || stroke === "RGB(219,199,248)") return "third";
  return null;
}

function addQueueOutline(path, outlineGroup) {
  path.subPaths.forEach((subPath) => {
    const points = subPath.getPoints(8);
    if (points.length < 2) return;
    const positions = new Float32Array(points.length * 3);
    points.forEach((point, index) => {
      const world = worldPoint(point);
      positions[index * 3] = world.x;
      positions[index * 3 + 1] = HEIGHT_UNIT * 8;
      positions[index * 3 + 2] = world.y;
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const line = new THREE.LineLoop(geometry, new THREE.LineBasicMaterial({ color: 0xd7ffcd, linewidth: 2, depthTest: true }));
    line.renderOrder = 111;
    outlineGroup.add(line);
  });
}

function addSubstation(shape, baseY) {
  const points = shape.extractPoints(8).shape;
  const bounds = points.reduce((box, point) => box.expandByPoint(point), new THREE.Box2());
  const center = worldPoint(bounds.getCenter(new THREE.Vector2()));
  const edge = points[1].clone().sub(points[0]);
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

function addEntranceGroup(path) {
  const shape = sceneShapes(path)[0];
  if (!shape) return;
  const points = shape.extractPoints(4).shape;
  if (points.length < 4) return;
  const bounds = points.reduce((box, point) => box.expandByPoint(point), new THREE.Box2());
  const sourceCenter = bounds.getCenter(new THREE.Vector2());
  const center = worldPoint(sourceCenter);
  const worldEdge = worldPoint(points[1]).sub(worldPoint(points[0])).normalize();
  const group = new THREE.Group();
  group.position.set(center.x, 0, center.y);
  group.rotation.y = Math.atan2(-worldEdge.y, worldEdge.x);
  const green = new THREE.MeshStandardMaterial({ color: 0x4d7e42, roughness: 0.8 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x8fb7bd, roughness: 0.22, metalness: 0.1, transparent: true, opacity: 0.72, emissive: 0xffb56b, emissiveIntensity: 0 });
  const addBox = (geometry, material, position) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  addBox(new THREE.BoxGeometry(2.97, 0.72, 1.93), glass, [0, 0.36, 0]);
  addBox(new THREE.BoxGeometry(3.01, 0.38, 1.97), green, [0, 0.91, 0]);
  map.add(group);
  const light = new THREE.PointLight(0xffb56b, 0, 4.5, 2);
  light.position.set(0, 0.8, 0);
  group.add(light);
  entranceLights.push({ light, materials: [glass] });
  const glow = new THREE.Mesh(new THREE.CircleGeometry(1, 32), houseGlowMaterial);
  glow.rotation.x = -Math.PI / 2;
  glow.rotation.z = group.rotation.y;
  glow.position.set(center.x, 0.07, center.y);
  glow.scale.set(4.4, 2.9, 1);
  glow.renderOrder = 25;
  glow.visible = false;
  map.add(glow);
  entranceGlows.push(glow);
}

function addEntranceLogo(svgText) {
  const parsed = new SVGLoader().parse(svgText);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide, emissive: 0xffffff, emissiveIntensity: 0 });
  const shapes = parsed.paths.filter((path) => fillOf(path) === "#D7FFCD").flatMap((path) => SVGLoader.createShapes(path));
  entranceGateGroups.forEach((gate, index) => {
    const logoGroup = new THREE.Group();
    shapes.forEach((shape) => {
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false, curveSegments: 2 });
      geometry.translate(-2457, -1088, 0);
      geometry.scale(0.000475, -0.000475, 1);
      logoGroup.add(new THREE.Mesh(geometry, material));
    });
    logoGroup.position.set(0.22, 1.16, 0);
    logoGroup.rotation.y = Math.PI / 2;
    gate.add(logoGroup);
    entranceLights[index]?.materials.push(material);
  });
}

function addEntranceGate(path) {
  const shape = sceneShapes(path)[0];
  if (!shape) return;
  const points = shape.extractPoints(4).shape;
  const bounds = points.reduce((box, point) => box.expandByPoint(point), new THREE.Box2());
  const center = worldPoint(bounds.getCenter(new THREE.Vector2()));
  const edge = worldPoint(points[1]).sub(worldPoint(points[0])).normalize();
  const wood = new THREE.MeshStandardMaterial({ color: 0x744b35, roughness: 0.88 });
  const group = new THREE.Group();
  group.position.set(center.x, 0, center.y);
  group.rotation.y = Math.atan2(-edge.y, edge.x);
  const addBox = (geometry, material, position) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    group.add(mesh);
  };
  addBox(new THREE.BoxGeometry(0.36, 0.94, 0.16), wood, [0, 0.47, -1.07]);
  addBox(new THREE.BoxGeometry(0.36, 0.16, 2.30), wood, [0, 1.02, 0]);
  map.add(group);
  entranceGateGroups.push(group);
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
  const marks = orchardMarks.filter((point) => isInsidePolygon(point, polygon));
  if (marks.length === 0) {
    for (let y = bounds.min.y; y <= bounds.max.y; y += 1.8) {
      for (let x = bounds.min.x; x <= bounds.max.x; x += 1.8) {
        const point = new THREE.Vector2(x, y);
        if (isInsidePolygon(point, polygon)) marks.push(point);
      }
    }
  }
  marks.forEach((sourcePoint, planted) => {
    const point = worldPoint(sourcePoint);
    const tree = factories[planted % factories.length]();
    tree.scale.setScalar(0.345 + (planted % 3) * 0.03);
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
    const roofHeight = 0.4;
    const house = createHouseModel(width, depth);
    group.add(house);
    map.add(group);
    const turnOnAfter = 10 + Math.random() * 20;
    houseLights.push({
      mesh: house,
      isOn: false,
      turnOnAfter,
      turnOffAfter: turnOnAfter + 60 + Math.random() * 240,
    });
    const glow = new THREE.Mesh(houseGlowGeometry, houseGlowMaterial);
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
    const shadowIndex = houseShadows.length;
    if (cachedHouseShadows[shadowIndex]) setCachedHouseShadow(shadow, cachedHouseShadows[shadowIndex]);
    houseShadows.push({ group, width, depth, bodyHeight, roofHeight, shadow, shadowIndex });
}

function setCachedHouseShadow(shadow, points) {
  if (!Array.isArray(points) || points.length < 3 || points.some(([x, z]) => !Number.isFinite(x) || !Number.isFinite(z))) {
    shadow.visible = false;
    return;
  }
  const positions = new Float32Array(points.length * 3);
  points.forEach(([x, z], index) => {
    positions[index * 3] = x;
    positions[index * 3 + 1] = 0.184;
    positions[index * 3 + 2] = z;
  });
  shadow.geometry.dispose();
  shadow.geometry = new THREE.BufferGeometry();
  shadow.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  shadow.geometry.setIndex(points.slice(1, -1).flatMap((_, index) => [0, index + 1, index + 2]));
  shadow.geometry.computeVertexNormals();
  shadow.geometry.computeBoundingSphere();
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
  // A horizontal sun direction cannot produce a finite ground projection.
  if (!Number.isFinite(direction.y) || Math.abs(direction.y) < 0.0001) {
    houseShadows.forEach(({ shadow }) => { shadow.visible = false; });
    return;
  }
  const standardSun = sun.position.distanceTo(new THREE.Vector3(-45, 80, 45)) < 0.001;
  houseShadows.forEach(({ group, width, depth, bodyHeight, roofHeight, shadow, shadowIndex }) => {
    shadow.visible = direction.y > -0.12;
    shadow.material.opacity = 0.39 * THREE.MathUtils.smoothstep(daylightLevel, 0, 1);
    if (!shadow.visible) return;
    if (standardSun && cachedHouseShadows[shadowIndex]) return;
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
    if (hull.length < 3 || hull.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
      shadow.visible = false;
      return;
    }
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
    if (scheduledOn !== house.isOn) {
      house.mesh.material = scheduledOn ? houseOnMaterial : houseOffMaterial;
      house.isOn = scheduledOn;
    }
  });
  if (houseOnMaterial) houseOnMaterial.emissiveIntensity = 0.56 * night;
  houseGlowMaterial.opacity = 0.84 * night;
  const cameraDistance = camera.position.distanceTo(controls.target);
  const glowY = layers["#CD80DD"].elevation
    + layers["#CD80DD"].height
    + Math.max(0.004, cameraDistance * 0.00018);
  houseGlows.forEach((glow, index) => {
    const house = houseLights[index];
    const scheduledOn = nightScheduleActive && house && nightMinutes >= house.turnOnAfter && nightMinutes < house.turnOffAfter;
    glow.visible = scheduledOn && night > 0.001;
    glow.position.y = glowY;
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
  entranceLights.forEach(({ light, materials }) => {
    light.intensity = 2.2 * intensity;
    materials.forEach((material) => { material.emissiveIntensity = 0.9 * intensity; });
  });
  entranceGlows.forEach((glow) => {
    glow.visible = active && night > 0.001;
    glow.material.opacity = 0.84 * intensity;
  });
  poleGlows.forEach((glow) => {
    glow.visible = active && night > 0.001;
    glow.material.opacity = 0.84 * intensity;
    glow.position.y = 0.09;
  });
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

function registerForestZones(paths) {
  Object.keys(forestZonePolygons).forEach((key) => {
    forestZonePolygons[key].length = 0;
    forestZoneBounds[key].length = 0;
  });
  paths.forEach((path) => {
    const fill = fillOf(path);
    if (!forestZonePolygons[fill]) return;
    sceneShapes(path).forEach((polygonShape) => {
      const polygon = polygonShape.extractPoints(8).shape;
      const bounds = polygon.reduce((box, point) => box.expandByPoint(point), new THREE.Box2());
      forestZonePolygons[fill].push(polygon);
      forestZoneBounds[fill].push(bounds);
    });
  });
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
    sceneShapes(path).forEach((shape) => {
      const points = shape.extractPoints(4).shape;
      if (points.length < 3) return;
      const bounds = points.reduce((box, point) => box.expandByPoint(point), new THREE.Box2());
      const sourceCenter = bounds.getCenter(new THREE.Vector2());
      const center = worldPoint(sourceCenter);
      const pole = new THREE.Group();
      poleNumber += 1;
      pole.position.set(center.x, poleBaseY, center.y);
      const nearestGuide = guides.reduce((best, guide) => {
        if (!best) return guide;
        return guide.anchor.distanceToSquared(sourceCenter) < best.anchor.distanceToSquared(sourceCenter) ? guide : best;
      }, null);
      if (nearestGuide) {
        // The red base only locates the pole; its SVG rotation is ignored.
        // Orientation comes exclusively from the green guide line.
        pole.rotation.y = Math.atan2(-nearestGuide.direction.y, nearestGuide.direction.x);
      }
      if (poleNumber === 3) {
        pole.rotation.y += Math.PI;
      }
      const poleSection = 0.08 / 1.5;
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(poleSection, 1.35, poleSection), poleMaterial);
      shaft.position.y = 0.675;
      shaft.castShadow = false;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.035), poleMaterial);
      arm.position.set(0.09, 1.35, 0);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.18, poleSection, poleSection), lampMaterial);
      lamp.position.set(0.29, 1.35, 0);
      pole.add(shaft, arm, lamp);
      map.add(pole);
      const poleLabel = document.createElement("div");
      poleLabel.className = "pole-label";
      poleLabel.textContent = String(poleNumber);
      host.appendChild(poleLabel);
      poleLabels.push({ pole, label: poleLabel });
      const light = new THREE.PointLight(0xffc36e, 0, 3.8, 2);
      light.position.set(0.29, 1.35, 0);
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

function updatePoleLabels() {
  poleLabels.forEach(({ pole, label }) => {
    const point = new THREE.Vector3(0, 1.62, 0).applyMatrix4(pole.matrixWorld).project(camera);
    const visible = point.z > -1 && point.z < 1;
    label.style.display = visible ? "block" : "none";
    if (visible) {
      label.style.left = `${(point.x * 0.5 + 0.5) * host.clientWidth}px`;
      label.style.top = `${(-point.y * 0.5 + 0.5) * host.clientHeight}px`;
    }
  });
}

const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0));

async function seedPines() {
  const [pineModules, simpleModules, superModules] = await Promise.all([
    Promise.all([
      import("../models/pine1.js"),
      import("../models/pine2.js"),
      import("../models/pine3.js"),
    ]),
    Promise.all([
      import("../models/simplePine1.js"),
      import("../models/simplePine2.js"),
      import("../models/simplePine3.js"),
    ]),
    Promise.all([
      import("../models/SupersimplePine1.js"),
      import("../models/SupersimplePine2.js"),
      import("../models/SupersimplePine3.js"),
    ]),
  ]);
  plantingPineFactories = pineModules.map((module) => Object.values(module)[0]);
  const templates = pineModules.map((module) => Object.values(module)[0]());
  const batches = templates.map((template) => template.children.map((part, partIndex) => {
    const mesh = new THREE.InstancedMesh(part.geometry, partIndex === 0 ? forestSharedTrunkMaterial : forestSharedCrownMaterial, 1100);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.frustumCulled = false;
    return mesh;
  }));
  const trees = new THREE.Group();
  batches.flat().forEach((batch) => trees.add(batch));
  const polygons = forestZonePolygons["#59A37E"];
  const bounds = forestZoneBounds["#59A37E"];
  if (!polygons.length) return;
  const counts = [0, 0, 0];
  const matrix = new THREE.Matrix4();
  const baseY = layers["#59A37E"].elevation + layers["#59A37E"].height;
  const random = (() => { let value = 14051996; return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296); })();
  let index = 0;
  let attempts = 0;
  while (index < 1100 && attempts < 200000) {
    attempts += 1;
    if (attempts % 2000 === 0) await yieldToBrowser();
    const polygonIndex = attempts % polygons.length;
    const polygon = polygons[polygonIndex];
    const box = bounds[polygonIndex];
    const source = new THREE.Vector2(
      THREE.MathUtils.lerp(box.min.x, box.max.x, random()),
      THREE.MathUtils.lerp(box.min.y, box.max.y, random()),
    );
    if (!isInsidePolygon(source, polygon)) continue;
    const point = worldPoint(source);
    const type = index % templates.length;
    const instance = counts[type]++;
    const scale = 0.55 + random() * 0.65;
    const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), random() * Math.PI * 2);
    templates[type].children.forEach((part, partIndex) => {
      matrix.compose(new THREE.Vector3(point.x, baseY + part.position.y * scale, point.y), rotation, new THREE.Vector3(scale, scale, scale));
      batches[type][partIndex].setMatrixAt(instance, matrix);
    });
    index += 1;
  }
  batches.forEach((parts, type) => parts.forEach((mesh) => {
    mesh.count = counts[type];
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }));
  map.add(trees);
  const simpleTemplates = simpleModules.map((module) => Object.values(module)[0]());
  const simpleBatches = simpleTemplates.map((template) => template.children.map((part, partIndex) => {
    const mesh = new THREE.InstancedMesh(part.geometry, partIndex === 0 ? forestSharedTrunkMaterial : forestSharedCrownMaterial, 3000);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.frustumCulled = false;
    return mesh;
  }));
  const simpleTrees = new THREE.Group();
  simpleBatches.flat().forEach((batch) => simpleTrees.add(batch));
  const simplePolygons = forestZonePolygons["#509874"];
  const simpleBounds = forestZoneBounds["#509874"];
  const simpleCounts = [0, 0, 0];
  if (simplePolygons.length) {
    const polygonAreas = simplePolygons.map((polygon) => Math.abs(polygon.reduce((area, point, pointIndex) => {
      const next = polygon[(pointIndex + 1) % polygon.length];
      return area + point.x * next.y - next.x * point.y;
    }, 0)) * 0.5);
    const totalArea = polygonAreas.reduce((sum, area) => sum + area, 0);
    for (let index = 0; index < 3000; index += 1) {
      if (index > 0 && index % 250 === 0) await yieldToBrowser();
      let areaCursor = random() * totalArea;
      let polygonIndex = 0;
      while (polygonIndex < polygonAreas.length - 1 && areaCursor > polygonAreas[polygonIndex]) {
        areaCursor -= polygonAreas[polygonIndex];
        polygonIndex += 1;
      }
      const polygon = simplePolygons[polygonIndex];
      const box = simpleBounds[polygonIndex];
      let source = new THREE.Vector2(
        THREE.MathUtils.lerp(box.min.x, box.max.x, random()),
        THREE.MathUtils.lerp(box.min.y, box.max.y, random()),
      );
      if (!isInsidePolygon(source, polygon)) {
        const center = polygon.reduce((sum, point) => sum.add(point), new THREE.Vector2()).multiplyScalar(1 / polygon.length);
        source = center;
      }
      const point = worldPoint(source);
      const type = Math.floor(random() * simpleTemplates.length);
      const instance = simpleCounts[type]++;
      const scale = 0.55 + random() * 0.65;
      const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), random() * Math.PI * 2);
      simpleTemplates[type].children.forEach((part, partIndex) => {
        matrix.compose(new THREE.Vector3(point.x, baseY + part.position.y * scale, point.y), rotation, new THREE.Vector3(scale, scale, scale));
        simpleBatches[type][partIndex].setMatrixAt(instance, matrix);
      });
    }
    simpleBatches.forEach((parts, type) => parts.forEach((mesh) => {
      mesh.count = simpleCounts[type];
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }));
    map.add(simpleTrees);
  }
  const superTemplates = superModules.map((module) => Object.values(module)[0]());
  const superBatches = superTemplates.map((template) => template.children.map((part, partIndex) => {
    const mesh = new THREE.InstancedMesh(part.geometry, partIndex === 0 ? forestSharedTrunkMaterial : forestSharedCrownMaterial, 4500);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.frustumCulled = false;
    return mesh;
  }));
  const superTrees = new THREE.Group();
  superBatches.flat().forEach((batch) => superTrees.add(batch));
  const superPolygons = forestZonePolygons["#498F6C"];
  const superBounds = forestZoneBounds["#498F6C"];
  if (superPolygons.length) {
    const areas = superPolygons.map((polygon) => Math.abs(polygon.reduce((area, point, pointIndex) => {
      const next = polygon[(pointIndex + 1) % polygon.length];
      return area + point.x * next.y - next.x * point.y;
    }, 0)) * 0.5);
    const totalArea = areas.reduce((sum, area) => sum + area, 0);
    const superCounts = [0, 0, 0];
    for (let index = 0; index < 4500; index += 1) {
      if (index > 0 && index % 250 === 0) await yieldToBrowser();
      let cursor = random() * totalArea;
      let polygonIndex = 0;
      while (polygonIndex < areas.length - 1 && cursor > areas[polygonIndex]) {
        cursor -= areas[polygonIndex];
        polygonIndex += 1;
      }
      const polygon = superPolygons[polygonIndex];
      const box = superBounds[polygonIndex];
      const source = new THREE.Vector2(THREE.MathUtils.lerp(box.min.x, box.max.x, random()), THREE.MathUtils.lerp(box.min.y, box.max.y, random()));
      const point = worldPoint(isInsidePolygon(source, polygon) ? source : polygon[0]);
      const type = Math.floor(random() * superTemplates.length);
      const instance = superCounts[type]++;
      const scale = 0.55 + random() * 0.65;
      const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), random() * Math.PI * 2);
      superTemplates[type].children.forEach((part, partIndex) => {
        matrix.compose(new THREE.Vector3(point.x, baseY + part.position.y * scale, point.y), rotation, new THREE.Vector3(scale, scale, scale));
        superBatches[type][partIndex].setMatrixAt(instance, matrix);
      });
    }
    superBatches.forEach((parts, type) => parts.forEach((mesh) => { mesh.count = superCounts[type]; mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); }));
    map.add(superTrees);
  }
}

async function buildModel() {
  const paths = adaptSceneData(sceneData);
  const parsed = { paths };
  const carRoute = extractCarRoute(parsed);
  parsed.paths.filter((path) => fillOf(path) === "#FF8C8C").forEach(addConcreteGate);
  const plantingPaths = parsed.paths.filter((path) => fillOf(path) === "#B4ED92");
  const plantingMarkerPaths = parsed.paths.filter((path) => fillOf(path) === "#9A0062");
  parsed.paths.forEach((path) => {
    const queue = queueStrokeType(path);
    if (queue === "first") addQueueOutline(path, firstQueueOutline);
    if (queue === "second") addQueueOutline(path, secondQueueOutline);
    if (queue === "third") addQueueOutline(path, thirdQueueOutline);
  });
  parsed.paths.filter((path) => fillOf(path) === "#DB6A6A").forEach(addEntranceGroup);
  parsed.paths.filter((path) => fillOf(path) === "#B85555").forEach(addEntranceGate);
  addEntranceLogo(entranceLogoSvg);
  addFence(parsed.paths.filter((path) => String(path.userData?.style?.stroke || "").replace(/\s/g, "").toUpperCase() === "#055DC2"));
  addInnerFence(parsed.paths.filter((path) => String(path.userData?.style?.stroke || "").replace(/\s/g, "").toUpperCase() === "#FF6043"));
  const lightPolePaths = parsed.paths.filter((path) => fillOf(path) === "#A93030");
  const guidePaths = parsed.paths.filter((path) => {
    const style = path.userData?.style || {};
    const stroke = String(style.stroke || "").replace(/^#/, "").toUpperCase();
    const fill = String(style.fill || "").replace(/^#/, "").toUpperCase();
    return stroke === "04FE9A" || fill === "04FE9A";
  });
  for (let index = 0; index < parsed.paths.length; index += 1) {
    if (index > 0 && index % 20 === 0) await yieldToBrowser();
    const path = parsed.paths[index];
    const fill = fillOf(path);
    if (layers[fill]) addTerritory(path, layers[fill]);
  }
  registerForestZones(parsed.paths);
  const houseModule = await import("../models/house.js");
  createHouseModel = houseModule.createHouse;
  houseOffMaterial = houseModule.houseOffMaterial;
  houseOnMaterial = houseModule.houseOnMaterial;
  if (typeof createHouseModel !== "function") throw new Error("House model factory is unavailable");
  for (let index = 0; index < houseLocations.length; index += 1) {
    if (index > 0 && index % 10 === 0) await yieldToBrowser();
    addHouse(houseLocations[index]);
  }
  // Build lamp posts before the deferred forest generation so they are visible immediately.
  seedLightPoles(lightPolePaths, guidePaths);
  await seedPines();
  addPlantingPines(plantingPaths, plantingMarkerPaths);
  map.updateMatrixWorld(true);
  updateFirstQueuePointer();
  updateHouseShadows();
  updateHouseLights();
  updatePoleLights();
  seedCars(carRoute);
  seedFruitTrees();
  settlementBounds?.expandByScalar(6);
}

function setCamera(position) {
  camera.position.set(...position);
  controls.target.copy(settlementTarget);
  controls.update();
}

document.querySelector("#reset-camera").addEventListener("click", () => setCamera(DEFAULT_CAMERA_POSITION.toArray()));
const firstQueueButton = document.querySelector("#first-queue");
const firstQueueFlag = document.createElement("img");
firstQueueFlag.className = "first-queue-flag";
firstQueueFlag.src = firstQueueFlagUrl;
firstQueueFlag.alt = "";
document.querySelector(".viewport").appendChild(firstQueueFlag);
const firstQueueFlagBlur = document.createElement("div");
firstQueueFlagBlur.className = "first-queue-flag-blur";
document.querySelector(".viewport").appendChild(firstQueueFlagBlur);
const firstQueueFlagText = document.createElement("div");
firstQueueFlagText.className = "first-queue-flag-text";
firstQueueFlagText.innerHTML = "<strong>очередь строительства</strong><br>центральный въезд<br>17 домовладений<br>330 м.п. дорог<br>фруктовый сад";
document.querySelector(".viewport").appendChild(firstQueueFlagText);
const firstQueuePointerLine = document.createElement("span");
firstQueuePointerLine.className = "first-queue-pointer-line";
const firstQueuePointerDot = document.createElement("span");
firstQueuePointerDot.className = "first-queue-pointer-dot";
document.querySelector(".viewport").append(firstQueuePointerLine, firstQueuePointerDot);
const updateFirstQueuePointer = () => {
  const visible = firstQueueFlag.classList.contains("visible");
  firstQueuePointerLine.classList.toggle("visible", visible);
  firstQueuePointerDot.classList.toggle("visible", visible);
  firstQueueFlagBlur.classList.toggle("visible", visible);
  firstQueueFlagText.classList.toggle("visible", visible);
  if (!visible || !firstQueueOutline.children.length) return;
  const viewport = document.querySelector(".viewport").getBoundingClientRect();
  const canvas = renderer.domElement.getBoundingClientRect();
  const preferredFlagX = viewport.width * 0.78;
  let targetSegment = null;
  firstQueueOutline.traverse((object) => {
    const position = object.geometry?.attributes?.position;
    if (!position) return;
    for (let index = 0; index < position.count; index += 1) {
      if (index === position.count - 1) continue;
      const start = new THREE.Vector3().fromBufferAttribute(position, index).applyMatrix4(object.matrixWorld).project(camera);
      const end = new THREE.Vector3().fromBufferAttribute(position, index + 1).applyMatrix4(object.matrixWorld).project(camera);
      const midpointX = canvas.left - viewport.left + ((start.x + end.x) / 2 + 1) * canvas.width / 2;
      const midpointY = canvas.top - viewport.top + (1 - (start.y + end.y) / 2) * canvas.height / 2;
      if (midpointY < viewport.height * 0.32) continue;
      const score = Math.abs(midpointX - preferredFlagX);
      if (!targetSegment || score < targetSegment.score) targetSegment = { start, end, score };
    }
  });
  if (!targetSegment) return;
  const targetPoint = targetSegment.start.clone().lerp(targetSegment.end, 0.5);
  const targetX = canvas.left - viewport.left + (targetPoint.x + 1) * canvas.width / 2;
  const targetY = canvas.top - viewport.top + (1 - targetPoint.y) * canvas.height / 2;
  const preferredTargetX = targetX;
  const preferredFlagBottom = Math.min(targetY - 32, viewport.height * 0.32);
  firstQueueFlag.style.left = `${preferredTargetX}px`;
  firstQueueFlag.style.top = `${preferredFlagBottom}px`;
  const initialFlagBounds = firstQueueFlag.getBoundingClientRect();
  const clampedX = THREE.MathUtils.clamp(preferredTargetX, initialFlagBounds.width / 2, viewport.width - initialFlagBounds.width / 2);
  const clampedBottom = THREE.MathUtils.clamp(preferredFlagBottom, initialFlagBounds.height, viewport.height);
  firstQueueFlag.style.left = `${clampedX}px`;
  firstQueueFlag.style.top = `${clampedBottom}px`;
  const flagBounds = firstQueueFlag.getBoundingClientRect();
  const panelLeft = flagBounds.left - viewport.left + flagBounds.width / 2 - 30;
  const panelTop = Math.max(160, Math.min(targetY - 150, 20));
  firstQueueFlagText.style.left = `${panelLeft}px`;
  firstQueueFlagText.style.top = `${panelTop}px`;
  firstQueueFlagText.style.width = "235px";
  const textBounds = firstQueueFlagText.getBoundingClientRect();
  firstQueueFlag.style.left = `${panelLeft + 30}px`;
  firstQueueFlag.style.top = `${panelTop - 8}px`;
  firstQueueFlagBlur.style.left = `${textBounds.left - viewport.left}px`;
  firstQueueFlagBlur.style.top = `${textBounds.top - viewport.top}px`;
  firstQueueFlagBlur.style.width = `${textBounds.width}px`;
  firstQueueFlagBlur.style.height = `${textBounds.height}px`;
  const startX = targetX;
  const startY = textBounds.bottom - viewport.top;
  const dy = Math.max(0, targetY - startY);
  firstQueuePointerLine.style.left = `${startX}px`;
  firstQueuePointerLine.style.top = `${startY}px`;
  firstQueuePointerLine.style.width = `${dy}px`;
  firstQueuePointerLine.style.transform = "rotate(90deg)";
  firstQueuePointerDot.style.left = `${startX}px`;
  firstQueuePointerDot.style.top = `${startY + dy}px`;
};
[
  [firstQueueButton, firstQueueOutline],
  [document.querySelector("#second-queue"), secondQueueOutline],
  [document.querySelector("#third-queue"), thirdQueueOutline],
].forEach(([button, outline]) => {
  button.addEventListener("pointerenter", () => {
    outline.visible = true;
    button.classList.add("active");
    if (button === firstQueueButton) firstQueueFlag.classList.add("visible");
    updateFirstQueuePointer();
  });
  button.addEventListener("pointerleave", () => {
    outline.visible = false;
    button.classList.remove("active");
    if (button === firstQueueButton) firstQueueFlag.classList.remove("visible");
    updateFirstQueuePointer();
  });
});
const extraQueueFlags = [
  { button: document.querySelector("#second-queue"), outline: secondQueueOutline, digit: "2", text: "<strong>очередь строительства</strong><br>отдельный въезд<br>39 домовладений<br>590 м.п. дорог<br>детская площадка" },
  { button: document.querySelector("#third-queue"), outline: thirdQueueOutline, digit: "3", text: "<strong>очередь строительства</strong><br>отдельный въезд<br>31 домовладение<br>410 м.п. дорог<br>спортивная площадка" },
];
const queueFlagUrls = { 2: secondQueueFlagUrl, 3: thirdQueueFlagUrl };
const forestSharedTrunkMaterial = new THREE.MeshStandardMaterial({ color: 0x75583d, roughness: 0.9 });
const forestSharedCrownMaterial = new THREE.MeshStandardMaterial({ color: 0x347a46, roughness: 0.92 });
extraQueueFlags.forEach((item) => {
  item.flag = document.createElement("img"); item.flag.className = `queue-flag queue-flag-${item.digit}`; item.flag.src = queueFlagUrls[item.digit]; item.flag.alt = "";
  item.textNode = document.createElement("div"); item.textNode.className = "queue-flag-text"; item.textNode.innerHTML = item.text;
  item.line = document.createElement("span"); item.line.className = "queue-flag-line"; item.dot = document.createElement("span"); item.dot.className = "queue-flag-dot";
  document.querySelector(".viewport").append(item.flag, item.textNode, item.line, item.dot);
  item.button.addEventListener("pointerenter", () => [item.flag, item.textNode, item.line, item.dot].forEach((node) => node.classList.add("visible")));
  item.button.addEventListener("pointerleave", () => [item.flag, item.textNode, item.line, item.dot].forEach((node) => node.classList.remove("visible")));
});
const updateExtraQueueFlags = () => {
  const viewport = document.querySelector(".viewport").getBoundingClientRect();
  const canvas = renderer.domElement.getBoundingClientRect();
  extraQueueFlags.forEach((item) => {
    if (!item.flag.classList.contains("visible")) return;
    let targetSegment = null;
    const preferredX = canvas.left - viewport.left + canvas.width * 0.78;
    item.outline.traverse((object) => {
      const position = object.geometry?.attributes?.position;
      if (!position) return;
      for (let index = 0; index < position.count - 1; index += 1) {
        const start = new THREE.Vector3().fromBufferAttribute(position, index).applyMatrix4(object.matrixWorld).project(camera);
        const end = new THREE.Vector3().fromBufferAttribute(position, index + 1).applyMatrix4(object.matrixWorld).project(camera);
        const midpointX = canvas.left - viewport.left + ((start.x + end.x) / 2 + 1) * canvas.width / 2;
        const midpointY = canvas.top - viewport.top + (1 - (start.y + end.y) / 2) * canvas.height / 2;
        const score = Math.abs(midpointX - preferredX) + (midpointY < canvas.height * 0.25 ? 1000 : 0);
        if (!targetSegment || score < targetSegment.score) targetSegment = { start, end, score };
      }
    });
    if (!targetSegment) return;
    const targetPoint = targetSegment.start.clone().lerp(targetSegment.end, 0.5);
    const x = canvas.left - viewport.left + (targetPoint.x + 1) * canvas.width / 2; const y = canvas.top - viewport.top + (1 - targetPoint.y) * canvas.height / 2;
    // Keep the pointer 30px inside the panel, matching the first queue flag.
    const panelLeft = x - 30;
    const panelTop = canvas.top - viewport.top + Math.max(40, Math.min(y - 150, canvas.height * 0.32));
    item.flag.style.left = `${x}px`; item.flag.style.top = `${panelTop - 8}px`;
    const flagBounds = item.flag.getBoundingClientRect(); item.textNode.style.left = `${panelLeft}px`; item.textNode.style.top = `${panelTop}px`;
    const textBounds = item.textNode.getBoundingClientRect(); const startX = x; const startY = textBounds.bottom - viewport.top; const endY = Math.max(startY, y);
    item.line.style.left = `${startX}px`; item.line.style.top = `${startY}px`; item.line.style.width = `${endY - startY}px`; item.line.style.transform = "rotate(90deg)"; item.dot.style.left = `${startX}px`; item.dot.style.top = `${endY}px`;
  });
};
renderer.domElement.addEventListener("pointermove", (event) => {
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(interactiveMeshes, false)[0]?.object || null;
  if (hoveredPlot === hit) {
    if (hit?.userData.plotData) {
      plotLabel.style.left = `${event.clientX + 14}px`;
      plotLabel.style.top = `${event.clientY - 34}px`;
    }
    return;
  }
  if (hoveredPlot) {
    const highlight = hoveredPlot.userData.plotHighlight || hoveredPlot.userData.hoverHighlight;
    if (highlight) highlight.visible = false;
  }
  hoveredPlot = hit;
  if (hoveredPlot) {
    const highlight = hoveredPlot.userData.plotHighlight || hoveredPlot.userData.hoverHighlight;
    if (highlight) highlight.visible = true;
    if (hoveredPlot.userData.plotData) {
      const { house, area, price, status } = hoveredPlot.userData.plotData;
      plotLabel.innerHTML = `<div class="plot-tooltip-row"><span>Дом</span><strong>${house}</strong></div><div class="plot-tooltip-row"><span>Площадь</span><strong>${area} сот.</strong></div><div class="plot-tooltip-row"><span>Цена</span><strong>${price ? `${price} млн ₽` : "не указана"}</strong></div><div class="plot-tooltip-row"><span>Статус</span><strong>${status}</strong></div>`;
      plotLabel.style.left = `${event.clientX + 14}px`;
      plotLabel.style.top = `${event.clientY - 34}px`;
      plotLabel.classList.add("visible");
    } else {
      plotLabel.classList.remove("visible");
    }
  } else {
    plotLabel.classList.remove("visible");
  }
});

renderer.domElement.addEventListener("pointerleave", () => {
  if (hoveredPlot) {
    const highlight = hoveredPlot.userData.plotHighlight || hoveredPlot.userData.hoverHighlight;
    if (highlight) highlight.visible = false;
  }
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
  nightSky.position.copy(camera.position);
  map.updateMatrixWorld(true);
  updateFirstQueuePointer();
  updateExtraQueueFlags();
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
  updatePoleLabels();
  cloudGroup.children.forEach((cloud) => {
    cloud.position.x += cloud.userData.speed * 10;
    if (cloud.position.x > 210) cloud.position.x = -210;
  });
  cloudShadowGroup.children.forEach((shadow) => {
    updateCloudShadowPosition(shadow);
  });
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

buildModel().catch((error) => {
  console.error(error);
  console.error(error);
  host.dataset.sceneError = error?.stack || String(error);
});
animate();
