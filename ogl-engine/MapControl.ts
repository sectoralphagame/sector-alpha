import type { Camera, Mat4, Vec3 } from "ogl";
import { Vec2 } from "ogl";
import type { MouseButton } from "./Orbit";
import { Orbit, STATE, tempVec3 } from "./Orbit";

const dPos = 3;
const dScale = 0.2;
const dRotation = 200;
const keymap = {
  KeyW: { x: 0, y: dPos },
  ArrowUp: { x: 0, y: dPos },
  KeyS: { x: 0, y: -dPos },
  ArrowDown: { x: 0, y: -dPos },
  KeyA: { x: dPos, y: 0 },
  ArrowLeft: { x: dPos, y: 0 },
  KeyD: { x: -dPos, y: 0 },
  ArrowRight: { x: -dPos, y: 0 },
  KeyQ: { rotate: Math.PI / dRotation },
  KeyE: { rotate: -Math.PI / dRotation },
  KeyX: { scale: -dScale },
  Equal: { scale: -dScale },
  KeyZ: { scale: dScale },
  Minus: { scale: dScale },
};

export class MapControl extends Orbit {
  camera: Camera;
  keysPressed = new Set<string>();

  dragPrev: Vec2 | null = null;
  mouse: Vec2 = new Vec2();
  moved = false;

  onClick: ((_position: Vec2, _button: MouseButton) => void) | null = null;
  // eslint-disable-next-line class-methods-use-this
  isFocused: () => boolean = () => true;

  constructor(camera: Camera, element: HTMLElement) {
    super(camera, element);

    this.minDistance = 0.1;
    this.maxDistance = 80;

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
      if (event.target !== document.body) return;
      if (event.code in keymap) {
        event.stopPropagation();
      }
      this.keysPressed.add(event.code);
    });
    document.body.addEventListener("keyup", (event) => {
      this.keysPressed.delete(event.code);
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
    if (
      this.keysPressed.has("ShiftLeft") &&
      e.button === this.mouseButtons.PAN
    ) {
      this.setState(STATE.ROTATE);
      this.rotateStart.set(e.clientX, e.clientY);

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

    if (!this.isFocused()) {
      return;
    }

    this.keysPressed.forEach((key) => {
      const action = keymap[key];
      if (!action) return;

      if (action.x || action.y) {
        this.pan(action.x, action.y);
      }
    });
  };

  onMouseMovePersistent = (e: MouseEvent) => {
    this.moved = false;
    const x = e.clientX - this.element.offsetLeft;
    const y = e.clientY - this.element.offsetTop;

    if (x !== this.mouse.x || y !== this.mouse.y) {
      this.moved = true;
      this.mouse.set(x, y);
    }
  };
}
