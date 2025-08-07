import { LocationStrategy } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, OnInit, signal } from '@angular/core';
import { controlsLookAt, fitToObject, fromGltf, rotateAround, updateSize } from '@core/3d';
import { LOGGER } from '@core/angular';
import { AmbientLight, AxesHelper, BoxGeometry, Camera, Mesh, MeshLambertMaterial, Object3D, PerspectiveCamera, PointLight, Scene, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

const MODEL_URL = 'assets/duck.glb';

@Component({
  selector: 'app-3d',
  imports: [],
  template: `
    <div class="absolute w-full top-0 flex flex-wrap gap-5 p-5 justify-between">
      <div class="flex gap-2 items-center">
        <button (click)="fit(); render()" class="btn btn-sm">fitToObject</button>
        <span class="note">GLTF format + DRACO compression</span>
      </div>
      <div class="flex gap-2">
        <button (click)="triggerKey('ArrowLeft')" title="rotate left" class="btn btn-sm">⇐</button>
        <button (click)="triggerKey('ArrowRight')" title="rotate right" class="btn btn-sm">⇒</button>
        <button (click)="triggerKey('ArrowUp')" title="rotate up" class="btn btn-sm">⇑</button>
        <button (click)="triggerKey('ArrowDown')" title="rotate down" class="btn btn-sm">⇓</button>
      </div>
    </div>
  `,
  styles: [
    `
      @reference "../../styles/utils.css";

      :host {
        position: relative;
        display: inline-block;
        overflow: hidden !important;
        user-select: none;

        &.loading {
          @apply progress-bar progress-unknown progress-bottom;
        }
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(dblclick)': 'onDblClick()',
    '(window:resize)': 'onWindowResize()',
    '(document:keydown)': 'onKeydown($event)',
    '[class.loading]': 'loading()'
  }
})
export class ThreeComponent implements OnInit {
  private readonly logger = inject(LOGGER);
  private readonly container = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly modelUrl = `${inject(LocationStrategy).getBaseHref()}${MODEL_URL}`;

  private readonly renderer = createRenderer(this.container);
  private readonly camera = new PerspectiveCamera().add(...createLights());
  private readonly controls = createControls(this.camera, this.renderer.domElement, () => this.render());
  private readonly scene = new Scene().add(this.camera, createAxes());

  private object?: Object3D;

  protected readonly loading = signal(true);

  async ngOnInit() {
    this.onWindowResize();

    this.object = await fromGltf(this.modelUrl, v => this.logger.debug(`3D: loaded ${(v * 100).toFixed()}%`));

    this.scene.add(this.object);

    this.fit();

    this.render();

    this.loading.set(false);
  }

  protected onWindowResize() {
    updateSize(this.container, this.camera, this.renderer);

    this.render();
  }

  protected onKeydown({ key }: KeyboardEvent) {
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

    function animate(this: ThreeComponent, { hAngle, vAngle }: { hAngle: number; vAngle: number }, callback: (v: { hAngle: number; vAngle: number }) => void) {
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

  protected onDblClick() {
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
  const renderer = new WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
    alpha: true
  });
  container.appendChild(renderer.domElement);
  return renderer;
}

function createAxes() {
  const axes = new AxesHelper(2);
  return axes;
}

function createLights() {
  return [new AmbientLight(0xffffff, 1), new PointLight(0xffffff, 0.5, 0, -1)];
}

function createControls(camera: Camera, container: HTMLElement, callback: () => void) {
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
  const geometry = new BoxGeometry(boxWidth, boxHeight, boxDepth);

  const material = new MeshLambertMaterial({ color: 0x7ffa96, opacity: 0.8, transparent: true });
  return new Mesh(geometry, material);
}

// #endregion
