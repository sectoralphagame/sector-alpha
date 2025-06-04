import type { Camera, Mat4 } from "ogl";
import { Euler, Vec3, Vec2 } from "ogl";
import { storageHook } from "@core/hooks";
import type { GameSettings } from "@core/settings";
import { MouseButton, Orbit, STATE } from "./Orbit";

const tempVec3 = new Vec3();
const dPos = 360;
const keymap = {
  KeyW: { x: 0, y: dPos },
  ArrowUp: { x: 0, y: dPos },
  KeyS: { x: 0, y: -dPos },
  ArrowDown: { x: 0, y: -dPos },
  KeyA: { x: dPos, y: 0 },
  ArrowLeft: { x: dPos, y: 0 },
  KeyD: { x: -dPos, y: 0 },
  ArrowRight: { x: -dPos, y: 0 },
};

interface TransitionPoint {
  position: Vec3;
  rotation: Euler;
}

interface CameraTransition {
  from: TransitionPoint;
  to: TransitionPoint;
  duration: number;
  elapsed: number;
  active: boolean;
  onEnd?: () => void;
}

export class MapControl extends Orbit {
  camera: Camera;
  keysPressed = new Set<string>();

  dragPrev: Vec2 | null = null;
  mouse: Vec2 = new Vec2();
  cursorMoved = false;
  mouseButtons = {
    ORBIT: MouseButton.Right,
    ZOOM: null,
    PAN: MouseButton.Middle,
  };

  onPointerUp:
    | ((_position: Vec2, _button: MouseButton, _isTarget: boolean) => void)
    | null = null;
  onPointerDown:
    | ((_position: Vec2, _button: MouseButton, _isTarget: boolean) => void)
    | null = null;
  onKeyDown: ((_event: KeyboardEvent) => void) | null = null;
  onRightClick: ((_event: MouseEvent) => void) | null = null;
  // eslint-disable-next-line class-methods-use-this
  isFocused: () => boolean = () => true;
  transition: CameraTransition = {
    from: {
      position: new Vec3(),
      rotation: new Euler(),
    },
    to: {
      position: new Vec3(),
      rotation: new Euler(),
    },
    duration: 0,
    elapsed: 0,
    active: false,
  };

  constructor(camera: Camera, element: HTMLElement) {
    super(camera, element);

    this.minDistance = 0.1;
    this.maxDistance = 80;

    this.updateSettings();
    storageHook.subscribe("MapControl", (key) => {
      if (key === "gameSettings") {
        this.updateSettings();
      }
    });

    document.addEventListener("pointerup", (event) => {
      this.onPointerUp?.(
        this.mouse,
        event.button,
        event.target === this.element
      );
    });

    document.body.addEventListener("keydown", (event) => {
      if (event.target !== document.body) return;
      if (event.code in keymap) {
        event.stopPropagation();
      }
      this.onKeyDown?.(event);
      this.keysPressed.add(event.code);
    });
    document.body.addEventListener("keyup", (event) => {
      this.keysPressed.delete(event.code);
    });
    document.addEventListener("mousemove", this.onMouseMovePersistent);
  }

  updateSettings() {
    const settings = JSON.parse(
      localStorage.getItem("gameSettings")!
    ) as GameSettings;

    if (settings?.camera?.pan) {
      this.panSpeed = Number(settings.camera.pan);
    }

    if (settings?.camera?.zoom) {
      this.zoomSpeed = Number(settings.camera.zoom);
    }
  }

  lookAt(position: Vec3) {
    this.target.copy(position);
  }

  transitionTo(
    target: TransitionPoint,
    duration: number,
    onTransitionEnd?: () => void
  ) {
    this.transition.from.position.copy(this.target);
    this.transition.from.rotation.copy(this.camera.rotation);
    this.transition.to.position.copy(target.position);
    this.transition.to.rotation.copy(target.rotation);
    this.transition.duration = duration;
    this.transition.elapsed = 0;
    this.transition.active = true;
    this.transition.onEnd = onTransitionEnd;
  }

  override panUp = (distance: number, m: Mat4) => {
    const i = 0;
    tempVec3.set(m[i], m[i + 1], m[i + 2]);
    tempVec3.cross(this.camera.up);
    tempVec3.multiply(-distance);
    this.panDelta.add(tempVec3);
  };

  override onMouseDown = (e: MouseEvent) => {
    if (this.keysPressed.has("ShiftLeft") && e.button === MouseButton.Left) {
      this.setState(STATE.ROTATE);
      this.rotateStart.set(e.clientX, e.clientY);

      if (this.state !== STATE.NONE) {
        const onMouseMove = this.onMouseMove.bind(this);
        const onMouseUp = this.onMouseUp.bind(this);
        window.addEventListener("mousemove", onMouseMove, false);
        window.addEventListener("mouseup", onMouseUp, false);
        this.cleanupListeners = () => {
          window.removeEventListener("mousemove", onMouseMove, false);
          window.removeEventListener("mouseup", onMouseUp, false);
        };
      }
    } else {
      this.onPointerDown?.(this.mouse, e.button, e.target === this.element);
      super.onMouseDown(e);
    }
  };

  override onMouseUp(e: MouseEvent) {
    if (!this.moved && e.button === MouseButton.Right) this.onRightClick?.(e);
    super.onMouseUp(e);
  }

  updateTransition(delta: number) {
    this.transition.elapsed += delta;

    const t = Math.min(this.transition.elapsed / this.transition.duration, 1);

    this.target
      .copy(this.transition.from.position)
      .lerp(this.transition.to.position, t);

    if (t >= 1) {
      this.transition.active = false;
      this.transition.onEnd?.();
    }
  }

  override update = (delta: number) => {
    super.update(delta);

    const near = this.getNear();
    if (this.camera.near !== near) {
      this.camera.perspective({ near });
    }

    if (!this.isFocused()) {
      return;
    }

    if (this.transition.active) {
      this.updateTransition(delta);
      return;
    }

    this.keysPressed.forEach((key) => {
      const action = keymap[key];
      if (!action) return;

      if (action.x || action.y) {
        this.pan(
          action.x * delta * this.panSpeed,
          action.y * delta * this.panSpeed
        );
      }
    });
  };

  getNear() {
    const distanceToFocus = this.camera.position.distance(this.target);
    return Math.min(distanceToFocus * 0.1, 0.1);
  }

  onMouseMovePersistent = (e: MouseEvent) => {
    this.cursorMoved = false;
    const bb = this.element.getBoundingClientRect();
    const x = e.clientX - bb.left;
    const y = e.clientY - bb.top;

    if (x !== this.mouse.x || y !== this.mouse.y) {
      this.cursorMoved = true;
      this.mouse.set(x, y);
    }
  };
}
