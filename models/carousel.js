import * as THREE from "three";

export function createCarousel() {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x4a8fc1, roughness: 0.7 });
  const seat = new THREE.MeshStandardMaterial({ color: 0xe95b55, roughness: 0.8 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.1, 8), metal); pole.position.y = 0.55; group.add(pole);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.1, 10), metal); top.position.y = 1.08; group.add(top);
  for (let i = 0; i < 4; i += 1) { const a = i * Math.PI / 2; const item = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.18), seat); item.position.set(Math.cos(a) * 0.65, 0.45, Math.sin(a) * 0.65); group.add(item); }
  return group;
}
