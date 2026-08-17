import { Component, ElementRef, inject, OnInit, signal } from '@angular/core';
import { controlsLookAt, fitToObject, fromGltf, rotateAround, updateSize } from '@core/3d';
import { LOGGER } from '@core/angular';
import { injectNonI18nBaseHref } from '@core/angular/i18n';
import { AmbientLight, AxesHelper, BoxGeometry, Camera, Mesh, MeshLambertMaterial, Object3D, PerspectiveCamera, PointLight, Scene, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

@Component({
  template: `
    <div class="absolute top-0 flex w-full flex-wrap gap-5 p-5">
      <div class="flex items-center gap-2">
        <button (click)="fit()" class="btn">fitToObject</button>
        <span class="text-xs">GLTF format + DRACO compression</span>
      </div>
      <div class="ml-auto flex gap-2">
        <button (pointerdown)="rotate('left')" title="rotate left" class="btn btn-icon">❮</button>
        <button (pointerdown)="rotate('right')" title="rotate right" class="btn btn-icon">❯</button>
        <button (pointerdown)="rotate('up')" title="rotate up" class="btn btn-icon"><span class="inline-block rotate-90">❮</span></button>
        <button (pointerdown)="rotate('down')" title="rotate down" class="btn btn-icon"><span class="inline-block -rotate-90">❮</span></button>
      </div>
    </div>
  `,
  styles: [
    `
      @reference "#main";

      :host {
        position: relative;
        display: inline-block;
        overflow: hidden !important;
        user-select: none;

        &.loading {
          @apply progress-bar progress-unknown progress-bottom;
        }
      }
    `
  ],
  host: {
    '(document:keydown.arrowLeft)': 'rotate("left")',
    '(document:keydown.arrowRight)': 'rotate("right")',
    '(document:keydown.arrowUp)': 'rotate("up")',
    '(document:keydown.arrowDown)': 'rotate("down")',
    '(dblclick)': 'fit()',
    '(resized)': 'resize()',
    '[class.loading]': 'loading()'
  }
})
export class ThreeComponent implements OnInit {
  private readonly logger = inject(LOGGER);
  private readonly container = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly modelPath = `${injectNonI18nBaseHref()}assets/duck.glb`;
  private readonly decoderPath = injectNonI18nBaseHref();

  private readonly renderer = createRenderer(this.container);
  private readonly camera = createCamera();
  private readonly scene = createScene(this.camera);
  private readonly controls = createControls(this.camera, this.renderer.domElement, () => this.render());

  private object?: Object3D;

  protected readonly loading = signal(true);

  ngOnInit() {
    this.load();
  }

  protected rotate(to: 'left' | 'right' | 'up' | 'down', step = 10) {
    const values = {
      left: { dh: step, dv: 0 },
      right: { dh: -step, dv: 0 },
      up: { dh: 0, dv: step },
      down: { dh: 0, dv: -step }
    }[to];

    this.animate(values, deltas => (rotateAround(this.camera, this.controls.target, deltas), this.render()));
  }

  protected resize() {
    updateSize(this.container, this.camera, this.renderer);

    this.render();
  }

  protected fit() {
    if (this.object) {
      const target = fitToObject(this.camera, this.object);

      controlsLookAt(this.controls, target, { min: 0.5, max: 2 });

      rotateAround(this.camera, this.controls.target, { dh: 30, dv: -30 });
    }

    this.render();
  }

  protected render() {
    this.renderer.render(this.scene, this.camera);
  }

  private async load() {
    try {
      this.object = await fromGltf(this.modelPath, this.decoderPath, v => this.logger.debug(`3D: loaded ${(v * 100).toFixed()}%`));

      this.scene.add(this.object);

      this.fit();
    } catch (e) {
      this.logger.warn('Failed to load them model', e);
    } finally {
      this.loading.set(false);
    }
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  private animate = useAnimate();
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

function createCamera() {
  return new PerspectiveCamera().add(...createLights());
}

function createScene(camera: Camera) {
  return new Scene().add(camera, createAxes());
}

function createControls(camera: Camera, container: HTMLElement, callback: () => void) {
  const controls = new OrbitControls(camera, container);
  controls.keyPanSpeed = 10;
  controls.zoomSpeed = 10;
  controls.addEventListener('change', callback);
  return controls;
}

function createLights() {
  return [new AmbientLight(0xffffff, 1), new PointLight(0xffffff, 0.5, 0, -1)];
}

function createAxes() {
  const axes = new AxesHelper(2);
  return axes;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createCube() {
  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new BoxGeometry(boxWidth, boxHeight, boxDepth);

  const material = new MeshLambertMaterial({ color: 0x7ffa96, opacity: 0.8, transparent: true });
  return new Mesh(geometry, material);
}

function useAnimate() {
  let handle = 0;

  return animate;

  function animate<T extends Record<string, number>>(values: T, callback: (values: T) => void) {
    cancelAnimationFrame(handle);

    const deltas = Object.entries(values).map(([k, v]) => [k, increment(v)] as [string, number]);

    callback(Object.fromEntries(deltas) as T);

    const next = deltas.map(([k, v]) => [k, values[k] - v] as [string, number]);

    handle = Math.abs(next.reduce((r, [, v]) => r + v, 0)) && requestAnimationFrame(() => animate(Object.fromEntries(next) as T, callback));
  }

  function increment(v: number) {
    return v / Math.abs(v || 1);
  }
}

// #endregion
