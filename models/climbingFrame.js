import * as THREE from "three";

export function createClimbingFrame() {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x397d9f, roughness: 0.7 });
  [[-0.65, 0, 0], [0.65, 0, 0]].forEach(([x, y, z]) => { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8), metal); post.position.set(x, 0.7, z); group.add(post); });
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 8), metal); bar.rotation.z = Math.PI / 2; bar.position.y = 1.35; group.add(bar);
  return group;
}
