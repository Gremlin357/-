import * as THREE from "three";

export function createSupersimplePine2() {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.17, 1.25, 3), new THREE.MeshStandardMaterial({ color: 0x68472d, roughness: 1 }));
  trunk.position.y = 0.625;
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.86, 2.25, 3), new THREE.MeshStandardMaterial({ color: 0x377b43, roughness: 0.9 }));
  crown.position.y = 1.55;
  tree.add(trunk, crown);
  return tree;
}
