import * as THREE from "three";

export function createFruitTree2() {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.25, 6), new THREE.MeshStandardMaterial({ color: 0x7f4b2d, roughness: 0.9 }));
  trunk.position.y = 0.625;
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.45, 7), new THREE.MeshStandardMaterial({ color: 0x87bd4d, roughness: 0.85 }));
  crown.position.y = 1.55;
  const fruitMaterial = new THREE.MeshStandardMaterial({ color: 0xd83d3d, roughness: 0.7 });
  [[-0.3, 1.35, 0.35], [0.32, 1.55, 0.18], [0.08, 1.78, -0.22]].forEach(([x, y, z]) => {
    const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.09, 7, 5), fruitMaterial);
    fruit.position.set(x, y, z);
    tree.add(fruit);
  });
  tree.add(trunk, crown);
  return tree;
}
