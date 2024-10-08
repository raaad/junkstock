// eslint-disable-next-line @typescript-eslint/naming-convention
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { degToRad } from 'three/src/math/MathUtils.js';

/** Move the camera as close as possible to fit the object in the field of view
 * @param target Where the camera should look (center of the object by default)
 */
export function fitToObject(camera: THREE.PerspectiveCamera, object: THREE.Object3D, target?: THREE.Vector3, distanceFactor = 1) {
  const box = new THREE.Box3().setFromObject(object);
  const { radius } = box.getBoundingSphere(new THREE.Sphere());

  target ??= box.getCenter(new THREE.Vector3());

  const vFov = camera.getEffectiveFOV();
  const hFov = vFov * camera.aspect;
  const fov = Math.min(vFov, hFov);

  const distance = radius / Math.sin(degToRad(fov / 2));
  camera.position.copy(new THREE.Vector3(0, 0, distance * distanceFactor).add(target));

  camera.lookAt(target);

  // update near/far (or logarithmicDepthBuffer: true)
  const max = Math.max(...(Object.values(box.getSize(new THREE.Vector3())) as number[]));
  camera.near = max / 10;
  camera.far = max * 10;
  camera.updateProjectionMatrix();

  return target;
}

/** Rotate the camera around the target's orbit
 * @param hAngle - The number of degrees to increase the horizontal rotation angle
 * @param vAngle - The number of degrees to increase the vertical rotation angle
 */
export function rotateAround(camera: THREE.PerspectiveCamera, target: THREE.Vector3, { hAngle, vAngle }: { hAngle?: number; vAngle?: number }) {
  let position = camera.position.clone().sub(target);
  const spherical = new THREE.Spherical().setFromVector3(position);

  spherical.theta += degToRad(hAngle ?? 0);
  spherical.phi += degToRad(vAngle ?? 0);

  position = new THREE.Vector3().setFromSpherical(spherical).add(target);

  camera.position.copy(position);
  camera.lookAt(target);
}

export function controlsLookAt(controls: OrbitControls, target: THREE.Vector3, distanceFactor = { min: 1, max: 1 }) {
  const distance = controls.getDistance();
  controls.minDistance = distance * distanceFactor.min;
  controls.maxDistance = distance * distanceFactor.max;

  controls.target = target;
  controls.update();
}

/** Get the simplified centre of mass of the object */
export function getMassCenter(object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  return object.position.clone().setY(center.y).setX(center.x);
}

/** Get all intersecting objects by coordinates */
export function getIntersects(camera: THREE.PerspectiveCamera, scene: THREE.Scene, x: number, y: number) {
  const point = new THREE.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(point, camera);

  return raycaster.intersectObjects(scene.children, true).map(({ object }) => object);
}

/** Match the canvas size and aspect ratio of the camera to the size of the container element */
export function updateSize(container: HTMLElement, camera: THREE.PerspectiveCamera, renderer: THREE.Renderer) {
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = height ? width / height : 1;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height, true);
}
