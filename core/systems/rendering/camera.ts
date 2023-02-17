import type { Camera } from "p5";
import type P5 from "p5";
import { limit } from "../../utils/limit";

export const zMin = 90;
export const zMax = 1200;

export class RenderCamera {
  x = 0;
  y = 0;
  z = 0;
  camera: Camera;
  p5: P5;

  w: number;
  h: number;
  scale: number;

  constructor(p5: P5) {
    this.p5 = p5;
    this.camera = p5.createCamera();
    this.move({ x: this.x, y: this.y, z: 1e4 });
  }

  updateViewport = () => {
    this.camera.lookAt(this.x, this.y, 0);
    this.camera.setPosition(this.x, this.y, this.z);
    this.w =
      2 *
      (this.camera as any).aspectRatio *
      this.z *
      Math.tan((this.camera as any).cameraFOV / 2);
    this.h = this.w / (this.camera as any).aspectRatio;
    this.scale = this.p5.width / this.w;
  };

  move = ({ x, y, z }: Partial<RenderCamera>) => {
    if (x) this.x -= x;
    if (y) this.y -= y;
    if (z) this.z = limit(z / 10 + this.z, zMin, zMax);
    this.updateViewport();
  };

  lookAt = (x: number, y: number): void => {
    this.x = x * 10;
    this.y = y * 10;
    this.updateViewport();
  };

  translateScreenToCanvas = (x: number, y: number): [number, number] => [
    x / this.scale - this.w / 2 + this.x,
    y / this.scale - this.h / 2 + this.y,
  ];

  translateCanvasToScreen = (x: number, y: number): [number, number] => [
    this.scale * (x + this.w / 2 - this.x),
    this.scale * (y + this.h / 2 - this.y),
  ];
}
