import * as THREE from "three";

export function createFruitTree3() {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.19, 1.05, 7), new THREE.MeshStandardMaterial({ color: 0xa26138, roughness: 0.9 }));
  trunk.position.y = 0.525;
  const crownMaterial = new THREE.MeshStandardMaterial({ color: 0x8fbe4c, roughness: 0.85 });
  const fruitMaterial = new THREE.MeshStandardMaterial({ color: 0xd83d3d, roughness: 0.7 });
  [[-0.38, 1.25, 0], [0.34, 1.35, 0.08], [0, 1.7, -0.05]].forEach(([x, y, z], index) => {
    const crown = new THREE.Mesh(new THREE.SphereGeometry(index === 2 ? 0.5 : 0.42, 7, 5), crownMaterial);
    crown.position.set(x, y, z);
    tree.add(crown);
  });
  [[-0.38, 1.25, 0.32], [0.34, 1.42, 0.2], [0, 1.78, -0.3]].forEach(([x, y, z]) => {
    const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.09, 7, 5), fruitMaterial);
    fruit.position.set(x, y, z);
    tree.add(fruit);
  });
  tree.add(trunk);
  return tree;
}
