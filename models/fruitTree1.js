import * as THREE from "three";

export function createFruitTree1() {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.1, 7), new THREE.MeshStandardMaterial({ color: 0x9a5a32, roughness: 0.9 }));
  trunk.position.y = 0.55;
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), new THREE.MeshStandardMaterial({ color: 0x72ad45, roughness: 0.85 }));
  crown.scale.set(1, 0.82, 1);
  crown.position.y = 1.35;
  const fruitMaterial = new THREE.MeshStandardMaterial({ color: 0xd83d3d, roughness: 0.7 });
  [[-0.38, 1.38, 0.45], [0.42, 1.55, 0.18], [0.08, 1.08, -0.52]].forEach(([x, y, z]) => {
    const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.1, 7, 5), fruitMaterial);
    fruit.position.set(x, y, z);
    tree.add(fruit);
  });
  tree.add(trunk, crown);
  return tree;
}
