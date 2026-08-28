import * as THREE from "three";

export function createSimplePine3() {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, 0.85, 3), new THREE.MeshStandardMaterial({ color: 0x825634, roughness: 1 }));
  trunk.position.y = 0.425;
  const lower = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.05, 3), new THREE.MeshStandardMaterial({ color: 0x66a84f, roughness: 0.9 }));
  lower.position.y = 0.95;
  const upper = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.85, 3), new THREE.MeshStandardMaterial({ color: 0x8bbd55, roughness: 0.9 }));
  upper.position.y = 1.55;
  tree.add(trunk, lower, upper);
  return tree;
}
