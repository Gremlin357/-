import { createCar1 } from "./car1.js";

export function createCar3() {
  const car = createCar1();
  car.traverse((object) => {
    if (object.isMesh && object.material.color) object.material = object.material.clone();
  });
  car.children[0].material.color.set(0x6a9b57);
  return car;
}
