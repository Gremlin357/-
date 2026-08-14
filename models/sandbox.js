import * as THREE from "three";

export function createSandbox() {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0xb87545, roughness: 0.9 });
  const sand = new THREE.MeshStandardMaterial({ color: 0xe4c36a, roughness: 1 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.2), sand); base.position.y = 0.04; group.add(base);
  [[0, 0.12, -0.6], [0, 0.12, 0.6], [-0.8, 0.12, 0], [0.8, 0.12, 0]].forEach(([x, y, z]) => { const edge = new THREE.Mesh(new THREE.BoxGeometry(x === 0 ? 1.7 : 0.1, 0.22, z === 0 ? 1.3 : 0.1), wood); edge.position.set(x, y, z); group.add(edge); });
  return group;
}
