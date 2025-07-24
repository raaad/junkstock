import { Object3D } from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** loading from GLTF|GLB + Draco */
export function fromGltf(url: string, progress?: (v: number) => void) {
  const draco = new DRACOLoader();

  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  return new Promise<Object3D>((resolve, reject) =>
    loader.load(
      url,
      ({ scene }) => resolve(scene),
      p => progress?.(p.loaded / p.total),
      reject
    )
  );
}
