import * as THREE from "three";

export function createSupersimplePine3() {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, 0.85, 3), new THREE.MeshStandardMaterial({ color: 0x825634, roughness: 1 }));
  trunk.position.y = 0.425;
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.9, 3), new THREE.MeshStandardMaterial({ color: 0x66a84f, roughness: 0.9 }));
  crown.position.y = 1.35;
  tree.add(trunk, crown);
  return tree;
}
