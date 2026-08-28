import * as THREE from "three";

export function createSupersimplePine1() {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.1, 3), new THREE.MeshStandardMaterial({ color: 0x76502f, roughness: 1 }));
  trunk.position.y = 0.55;
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.72, 2.5, 3), new THREE.MeshStandardMaterial({ color: 0x4d914e, roughness: 0.9 }));
  crown.position.y = 1.8;
  tree.add(trunk, crown);
  return tree;
}
