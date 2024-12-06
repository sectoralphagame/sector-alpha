import type { Camera, Mat4, Vec3 } from "ogl";
import { Vec2 } from "ogl";
import { MOUSE_BUTTONS, Orbit, STATE, tempVec3 } from "./Orbit";

const dPos = 3;
const dScale = 0.2;
const dRotation = 200;
const keymap = {
  w: { x: 0, y: dPos },
  ArrowUp: { x: 0, y: dPos },
  s: { x: 0, y: -dPos },
  ArrowDown: { x: 0, y: -dPos },
  a: { x: dPos, y: 0 },
  ArrowLeft: { x: dPos, y: 0 },
  d: { x: -dPos, y: 0 },
  ArrowRight: { x: -dPos, y: 0 },
  q: { rotate: Math.PI / dRotation },
  e: { rotate: -Math.PI / dRotation },
  x: { scale: -dScale },
  "=": { scale: -dScale },
  z: { scale: dScale },
  "-": { scale: dScale },
};

const MouseButton = {
  Left: 0,
  Middle: 1,
  Right: 2,
};
// eslint-disable-next-line no-redeclare
type MouseButton = (typeof MouseButton)[keyof typeof MouseButton];

export class MapControl extends Orbit {
  camera: Camera;
  keysPressed = new Set<string>();

  dragPrev: Vec2 | null = null;
  mouse: Vec2 = new Vec2();

  onClick: ((_position: Vec2, _button: MouseButton) => void) | null = null;

  constructor(camera: Camera, element: HTMLElement) {
    super(camera, element);

    this.minDistance = 0.1;
    this.maxDistance = 100;

    this.element.addEventListener("pointerdown", (event) => {
      if (event.target !== this.element) return;
      if (this.onClick) {
        setTimeout(() => {
          if (!this.moved) {
            this.onClick!(this.mouse, event.button);
          }
        }, 100);
      }
    });

    document.body.addEventListener("keydown", (event) => {
      // if (
      //   event.target !== document.body ||
      //   Number(this.overlay?.children.length) > 0
      // )
      //   return;
      if (event.key in keymap) {
        event.stopPropagation();
      }
      this.keysPressed.add(event.key);
    });
    document.body.addEventListener("keyup", (event) => {
      this.keysPressed.delete(event.key);
    });
    this.element.addEventListener("mousemove", this.onMouseMovePersistent);
  }

  lookAt = (position: Vec3) => {
    tempVec3.copy(this.camera.position).sub(position);
    this.target.copy(position);
    this.camera.position.copy(position).add(tempVec3);
  };

  override panUp = (distance: number, m: Mat4) => {
    const i = 0;
    tempVec3.set(m[i], m[i + 1], m[i + 2]);
    tempVec3.cross(this.camera.up);
    tempVec3.multiply(-distance);
    this.panDelta.add(tempVec3);
  };

  override onMouseDown = (e: MouseEvent) => {
    if (this.keysPressed.has("Shift") && e.button === MOUSE_BUTTONS.ORBIT) {
      this.setState(STATE.PAN);
      this.panStart.set(e.clientX, e.clientY);

      if (this.state !== STATE.NONE) {
        window.addEventListener("mousemove", this.onMouseMove, false);
        window.addEventListener("mouseup", this.onMouseUp, false);
      }
    } else {
      super.onMouseDown(e);
    }
  };

  override update = () => {
    super.update();
    this.keysPressed.forEach((key) => {
      const action = keymap[key];
      if (!action) return;

      if (action.x || action.y) {
        this.pan(action.x, action.y);
      }
    });
  };

  onMouseMovePersistent = (e: MouseEvent) => {
    this.mouse.set(e.clientX, e.clientY);
  };
}
