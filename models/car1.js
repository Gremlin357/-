import * as THREE from "three";

export function createCar1() {
  return createCar(0xd56a32, 0x91a4bd);
}

function createCar(bodyColor, windowColor) {
  const car = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.82 });
  const windowMaterial = new THREE.MeshStandardMaterial({ color: windowColor, roughness: 0.55 });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x171b1c, roughness: 1 });
  const lightMaterial = new THREE.MeshStandardMaterial({ color: 0xf5d95c, roughness: 0.7 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.38, 2.15), bodyMaterial);
  body.position.y = 0.5;
  car.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.48, 1.05), bodyMaterial);
  cabin.position.set(0, 0.88, -0.15);
  car.add(cabin);
  const windows = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.28, 0.75), windowMaterial);
  windows.position.set(0, 1.02, -0.12);
  car.add(windows);
  [-0.56, 0.56].forEach((x) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 8), darkMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.3, 0.62);
    car.add(wheel);
    const rearWheel = wheel.clone();
    rearWheel.position.z = -0.62;
    car.add(rearWheel);
  });
  [-0.34, 0.34].forEach((x) => {
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.06), lightMaterial);
    light.position.set(x, 0.52, 1.09);
    car.add(light);
  });
  return car;
}
