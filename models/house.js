import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const houseMaterial = new THREE.MeshStandardMaterial({
  color: 0xf8f8f2,
  roughness: 0.78,
  emissive: 0xffb56b,
  emissiveIntensity: 0,
  side: THREE.DoubleSide,
});

const bodyGeometry = new THREE.BoxGeometry(1, 0.65, 1).toNonIndexed();
bodyGeometry.deleteAttribute("uv");
bodyGeometry.translate(0, 0.325, 0);
let roofGeometry = new THREE.BufferGeometry();
roofGeometry.setAttribute("position", new THREE.Float32BufferAttribute([
  -0.5, 0.65, -0.5, 0.5, 0.65, -0.5, 0.5, 0.65, 0.5, -0.5, 0.65, 0.5,
  -0.5, 1.05, 0, 0.5, 1.05, 0,
], 3));
roofGeometry.setIndex([
  0, 5, 1, 0, 4, 5,
  3, 2, 5, 3, 5, 4,
  0, 3, 4,
  1, 5, 2,
]);
roofGeometry = roofGeometry.toNonIndexed();
roofGeometry.computeVertexNormals();

const houseGeometry = mergeGeometries([bodyGeometry, roofGeometry], false);
if (!houseGeometry) throw new Error("Unable to merge house geometry");
houseGeometry.computeBoundingBox();
houseGeometry.computeBoundingSphere();
bodyGeometry.dispose();
roofGeometry.dispose();

export function createHouse(width, depth) {
  const mesh = new THREE.Mesh(houseGeometry, houseMaterial);
  mesh.scale.set(width, 1, depth);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
