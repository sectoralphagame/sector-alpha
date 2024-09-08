import React from "react";
import { Renderer, Camera, Transform, GLTFLoader } from "ogl";
import sCiv1 from "@assets/models/ships/sCiv_1.glb";
import { addGLTF } from "./gltf";

export const OGLModel: React.FC = () => {
  const [canvas, setCanvas] = React.useState<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (!canvas) return;

    const renderer = new Renderer({
      canvas: canvas!,
      dpr: 2,
    });
    const gl = renderer.gl;

    const camera = new Camera(gl);
    camera.position.x = 15;
    camera.position.z = 15;
    camera.lookAt([0, 0, 0]);

    function resize() {
      renderer.setSize(
        canvas!.parentElement!.clientWidth - 5,
        canvas!.parentElement!.clientHeight - 5
      );
      camera.perspective({
        aspect: gl.canvas.width / gl.canvas.height,
      });
    }
    canvas!.addEventListener("resize", resize, false);
    resize();

    const obs = new ResizeObserver(resize);
    obs.observe(canvas!);

    setTimeout(resize, 1000);

    const scene = new Transform();

    GLTFLoader.load(gl, sCiv1).then((model) => {
      addGLTF(gl, model, scene);

      function update(_t: number) {
        model.meshes[0].primitives[0].rotation.y -= 0.01;
        model.meshes[0].primitives[0].rotation.x += 0.007;

        requestAnimationFrame(update);
        renderer.render({ scene, camera });
      }
      requestAnimationFrame(update);
    });
  }, [canvas]);

  return <canvas ref={setCanvas} />;
};
