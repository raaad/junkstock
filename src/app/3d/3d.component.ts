import { LocationStrategy } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, OnInit } from '@angular/core';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { fromGltf } from '../../core/3d/loaders';
import { controlsLookAt, fitToObject, rotateAround, updateSize } from '../../core/3d/utils';

// eslint-disable-next-line @typescript-eslint/naming-convention
import * as THREE from 'three';

const MODEL_URL = 'duck/duck.gltf';

@Component({
  selector: 'app-3d',
  imports: [],
  template: `
    <div class="actions">
      <div>
        <button (click)="fit(); render()" class="btn btn-sm btn-outline">fitToObject</button>
        <span class="text-sm">GLTF format + DRACO compression</span>
      </div>
      <div class="arrows">
        <button (click)="triggerKey('ArrowLeft')" title="rotate left" class="btn btn-sm btn-outline">⇐</button>
        <button (click)="triggerKey('ArrowRight')" title="rotate right" class="btn btn-sm btn-outline">⇒</button>
        <button (click)="triggerKey('ArrowUp')" title="rotate up" class="btn btn-sm btn-outline">⇑</button>
        <button (click)="triggerKey('ArrowDown')" title="rotate down" class="btn btn-sm btn-outline">⇓</button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        position: relative;
        display: inline-block;
        overflow: hidden !important;
        user-select: none;
      }

      .actions {
        position: absolute;
        width: 100%;
        top: 0;
        padding: 1rem;
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        justify-content: space-between;
        box-sizing: border-box;
      }

      .actions > div {
        opacity: 0.5;
        display: flex;
        gap: 1rem;
        align-items: center;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThreeDComponent implements OnInit {
  private readonly container = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly modelUrl = inject(LocationStrategy).getBaseHref() + MODEL_URL;

  private readonly renderer = createRenderer(this.container);
  private readonly camera = new THREE.PerspectiveCamera().add(...createLights());
  private readonly controls = createControls(this.camera, this.renderer.domElement, () => this.render());
  private readonly scene = new THREE.Scene().add(this.camera, createAxes());

  private object?: THREE.Object3D;

  async ngOnInit() {
    this.onWindowResize();

    // eslint-disable-next-line no-console
    this.object = await fromGltf(this.modelUrl, v => console.log(`loading: ${(v * 100).toFixed()}%`)); // createCube()

    this.scene.add(this.object);

    this.fit();

    this.render();
  }

  @HostListener('window:resize')
  onWindowResize() {
    updateSize(this.container, this.camera, this.renderer);

    this.render();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown({ key }: KeyboardEvent) {
    const step = 10;
    let hAngle = 0;
    let vAngle = 0;

    switch (key) {
      case 'ArrowLeft':
        hAngle += step;
        break;
      case 'ArrowRight':
        hAngle -= step;
        break;
      case 'ArrowDown':
        vAngle += step;
        break;
      case 'ArrowUp':
        vAngle -= step;
        break;
    }

    animate.call(this, { hAngle, vAngle }, ({ hAngle, vAngle }) => {
      rotateAround(this.camera, this.controls.target, {
        hAngle,
        vAngle
      });

      this.render();
    });

    function animate(this: ThreeDComponent, { hAngle, vAngle }: { hAngle: number; vAngle: number }, callback: (v: { hAngle: number; vAngle: number }) => void) {
      this.frameHandle && cancelAnimationFrame(this.frameHandle);

      const h = increment(hAngle);
      const v = increment(vAngle);

      hAngle -= h;
      vAngle -= v;

      this.frameHandle = Math.abs(hAngle + vAngle) && requestAnimationFrame(animate.bind(this, { hAngle, vAngle }, callback));

      callback({ hAngle: h, vAngle: v });

      function increment(v: number) {
        return v / Math.abs(v || 1);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  private frameHandle = 0;

  protected triggerKey(key: 'ArrowLeft' | 'ArrowRight' | 'ArrowDown' | 'ArrowUp') {
    this.onKeydown(new KeyboardEvent('keydown', { key }));
  }

  @HostListener('dblclick')
  onDblClick() {
    this.fit();

    this.render();
  }

  protected fit() {
    if (this.object) {
      const target = fitToObject(this.camera, this.object);

      controlsLookAt(this.controls, target, { min: 0.5, max: 2 });

      rotateAround(this.camera, this.controls.target, {
        hAngle: 30,
        vAngle: -30
      });
    }
  }

  protected render() {
    this.renderer.render(this.scene, this.camera);
  }
}

// #region utils

function createRenderer(container: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
    alpha: true
  });
  container.appendChild(renderer.domElement);
  return renderer;
}

function createAxes() {
  const axes = new THREE.AxesHelper(2);
  return axes;
}

function createLights() {
  return [new THREE.AmbientLight(0xffffff, 1), new THREE.PointLight(0xffffff, 0.5, 0, -1)];
}

function createControls(camera: THREE.Camera, container: HTMLElement, callback: () => void) {
  const controls = new OrbitControls(camera, container);
  controls.keyPanSpeed = 10;
  controls.zoomSpeed = 10;
  controls.addEventListener('change', callback);
  return controls;
}

export function createCube() {
  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  const material = new THREE.MeshLambertMaterial({ color: 0x7ffa96, opacity: 0.8, transparent: true });
  return new THREE.Mesh(geometry, material);
}

// #endregion
