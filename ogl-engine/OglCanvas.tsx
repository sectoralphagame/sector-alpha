import React from "react";
import type { OGLRenderingContext } from "ogl";
import { Renderer, Camera, Transform } from "ogl";

export type OGLCallback = (_opts: {
  gl: OGLRenderingContext;
  scene: Transform;
  camera: Camera;
}) => void | Promise<void>;

export interface OglCanvasProps {
  onInit: OGLCallback;
  onUpdate: OGLCallback;
}

export const OglCanvas: React.FC<OglCanvasProps> = ({ onInit, onUpdate }) => {
  const [canvas, setCanvas] = React.useState<HTMLCanvasElement | null>(null);
  const resizeObserver = React.useRef<ResizeObserver>();

  React.useEffect(() => {
    const cleanup = () => {
      resizeObserver.current?.disconnect();
    };
    if (!canvas) return cleanup;

    const renderer = new Renderer({
      canvas: canvas!,
      dpr: 2,
    });
    const gl = renderer.gl;

    const camera = new Camera(gl);
    camera.position.x = 5;
    camera.position.y = 5;
    camera.position.z = 5;
    camera.lookAt([0, 0, 0]);

    function resize() {
      renderer.setSize(
        canvas!.parentElement!.clientWidth,
        canvas!.parentElement!.clientHeight
      );
      camera.perspective({
        aspect: gl.canvas.width / gl.canvas.height,
      });
    }
    resizeObserver.current = new ResizeObserver(resize);
    resizeObserver.current.observe(canvas!.parentElement!);

    setTimeout(resize, 1000);

    const scene = new Transform();

    function update() {
      requestAnimationFrame(update);

      onUpdate({ gl, scene, camera });

      renderer.render({ scene, camera });
    }

    const ret = onInit({ gl, camera, scene });
    if (ret) {
      ret.then(() => {
        requestAnimationFrame(update);
      });
    } else {
      requestAnimationFrame(update);
    }

    return cleanup;
  }, [canvas, onInit, onUpdate]);

  return <canvas ref={setCanvas} />;
};
