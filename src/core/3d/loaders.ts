import { Object3D } from 'three';
import { DRACOLoader, GLTFLoader } from 'three/examples/jsm/Addons.js';

/** loading from GLTF|GLB + Draco */
export function fromGltf(url: string, decoderPath = '', progress?: (v: number) => void) {
  const draco = new DRACOLoader().setDecoderPath(decoderPath);

  return new Promise<Object3D>((resolve, reject) =>
    new GLTFLoader().setDRACOLoader(draco).load(
      url,
      ({ scene }) => resolve(scene),
      p => progress?.(p.loaded / p.total),
      reject
    )
  );
}
