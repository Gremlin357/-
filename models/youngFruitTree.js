import * as THREE from "three";

export function createYoungFruitTree(variant = 1) {
  const tree = new THREE.Group();
  const scale = variant === 2 ? 0.9 : variant === 3 ? 1.05 : 1;
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5738, roughness: 0.92 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: variant === 2 ? 0x6ca342 : variant === 3 ? 0x5f9d3b : 0x77ae45, roughness: 0.86 });
  const fruitMaterial = new THREE.MeshStandardMaterial({ color: 0xd83d3d, roughness: 0.72 });
  const trunkHeight = 0.72 * scale;
  const crownRadius = (variant === 2 ? 0.25 : variant === 3 ? 0.31 : 0.28) * scale * 1.75;
  const crownHeight = crownRadius * 1.8;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * scale, 0.065 * scale, trunkHeight, 6), trunkMaterial);
  trunk.position.y = trunkHeight / 2;
  tree.add(trunk);

  const crownGeometry = variant === 2
    ? new THREE.CylinderGeometry(crownRadius * 0.88, crownRadius * 0.88, crownHeight, 10, 1)
    : new THREE.CylinderGeometry(crownRadius * 0.55, crownRadius, crownHeight, 10, 1);
  const crown = new THREE.Mesh(crownGeometry, leafMaterial);
  crown.position.y = trunkHeight + crownHeight / 2;
  tree.add(crown);

  const fruits = variant === 3 ? 4 : 3;
  for (let index = 0; index < fruits; index += 1) {
    const angle = (index / fruits) * Math.PI * 2 + variant * 0.35;
    const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.045 * scale, 7, 5), fruitMaterial);
    fruit.position.set(Math.cos(angle) * crownRadius * 0.72, crown.position.y + Math.sin(index * 1.7) * crownRadius * 0.28, Math.sin(angle) * crownRadius * 0.72);
    tree.add(fruit);
  }
  return tree;
}
