import * as THREE from "three";

export function createSimplePine2() {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.17, 1.25, 3), new THREE.MeshStandardMaterial({ color: 0x68472d, roughness: 1 }));
  trunk.position.y = 0.625;
  const lower = new THREE.Mesh(new THREE.ConeGeometry(0.86, 1.45, 4), new THREE.MeshStandardMaterial({ color: 0x377b43, roughness: 0.9 }));
  lower.position.y = 1.35;
  const upper = new THREE.Mesh(new THREE.ConeGeometry(0.58, 1.25, 4), new THREE.MeshStandardMaterial({ color: 0x4c9650, roughness: 0.9 }));
  upper.position.y = 2.25;
  tree.add(trunk, lower, upper);
  return tree;
}
