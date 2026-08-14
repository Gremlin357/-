import * as THREE from "three";

export function createSlide() {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x9a5a38, roughness: 0.9 });
  const yellow = new THREE.MeshStandardMaterial({ color: 0xf2c51d, roughness: 0.75 });
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.5, 0.14), wood);
  [[-0.55, -0.35], [0.55, -0.35], [-0.55, 0.35], [0.55, 0.35]].forEach(([x, z]) => { const item = post.clone(); item.position.set(x, 0.75, z); group.add(item); });
  const platform = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 0.72), wood); platform.position.set(0, 1.5, -0.15); group.add(platform);
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.1, 1.65), yellow); slide.position.set(0, 0.72, 0.78); slide.rotation.x = -0.42; group.add(slide);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 0.08), wood);
  [-0.4, 0.4].forEach((x) => { const item = rail.clone(); item.position.set(x, 0.8, -0.46); group.add(item); });
  const steps = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.65), wood); steps.position.set(0, 0.42, -0.65); group.add(steps);
  return group;
}
