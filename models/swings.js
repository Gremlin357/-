import * as THREE from "three";

export function createSwings() {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x9a5a38, roughness: 0.9 });
  const seatMaterial = new THREE.MeshStandardMaterial({ color: 0xe94d73, roughness: 0.75 });
  [[-0.8, 0, 0], [0.8, 0, 0]].forEach(([x, y, z]) => { const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 0.12), wood); post.position.set(x, 0.9, z); group.add(post); });
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.12), wood); top.position.y = 1.8; group.add(top);
  [-0.35, 0.35].forEach((x) => { const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6), wood); chain.position.set(x, 1.3, 0); group.add(chain); const seat = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.24), seatMaterial); seat.position.set(x, 0.82, 0); group.add(seat); });
  return group;
}
