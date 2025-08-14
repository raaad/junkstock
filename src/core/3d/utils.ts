import { Box3, Object3D, PerspectiveCamera, Raycaster, Scene, Sphere, Spherical, Vector2, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { degToRad } from 'three/src/math/MathUtils.js';

/** Move the camera as close as possible to fit the object in the field of view
 * @param target Where the camera should look (center of the object by default)
 */
export function fitToObject(camera: PerspectiveCamera, object: Object3D, target?: Vector3, distanceFactor = 1) {
  const box = new Box3().setFromObject(object);
  const { radius } = box.getBoundingSphere(new Sphere());

  target ??= box.getCenter(new Vector3());

  const vFov = camera.getEffectiveFOV();
  const hFov = vFov * camera.aspect;
  const fov = Math.min(vFov, hFov);

  const distance = radius / Math.sin(degToRad(fov / 2));
  camera.position.copy(new Vector3(0, 0, distance * distanceFactor).add(target));

  camera.lookAt(target);

  // update near/far (or logarithmicDepthBuffer: true)
  const max = Math.max(...(Object.values(box.getSize(new Vector3())) as number[]));
  camera.near = max / 10;
  camera.far = max * 10;
  camera.updateProjectionMatrix();

  return target;
}

/** Rotate the camera around the target's orbit
 * @param hAngle - The number of degrees to increase the horizontal rotation angle
 * @param vAngle - The number of degrees to increase the vertical rotation angle
 */
export function rotateAround(camera: PerspectiveCamera, target: Vector3, { hAngle, vAngle }: { hAngle?: number; vAngle?: number }) {
  let position = camera.position.clone().sub(target);
  const spherical = new Spherical().setFromVector3(position);

  spherical.theta += degToRad(hAngle ?? 0);
  spherical.phi += degToRad(vAngle ?? 0);

  position = new Vector3().setFromSpherical(spherical).add(target);

  camera.position.copy(position);
  camera.lookAt(target);
}

export function controlsLookAt(controls: OrbitControls, target: Vector3, distanceFactor = { min: 1, max: 1 }) {
  const distance = controls.getDistance();
  controls.minDistance = distance * distanceFactor.min;
  controls.maxDistance = distance * distanceFactor.max;

  controls.target = target;
  controls.update();
}

/** Get the simplified centre of mass of the object */
export function getMassCenter(object: Object3D) {
  const box = new Box3().setFromObject(object);
  const center = box.getCenter(new Vector3());
  return object.position.clone().setY(center.y).setX(center.x);
}

/** Get all intersecting objects by coordinates */
export function getIntersects(camera: PerspectiveCamera, scene: Scene, x: number, y: number, win = window) {
  const point = new Vector2((x / win.innerWidth) * 2 - 1, -(y / win.innerHeight) * 2 + 1);

  const raycaster = new Raycaster();
  raycaster.setFromCamera(point, camera);

  return raycaster.intersectObjects(scene.children, true).map(({ object }) => object);
}

/** Match the canvas size and aspect ratio of the camera to the size of the container element */
export function updateSize(container: HTMLElement, camera: PerspectiveCamera, renderer: WebGLRenderer) {
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = height ? width / height : 1;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height, true);
}
