import type { OGLRenderingContext } from "ogl";
import {
  Camera,
  Mesh,
  Post,
  Renderer,
  RenderTarget,
  Texture,
  Transform,
  Vec2,
} from "ogl";
import React from "react";
import brightPassFragment from "./post/brightPass.frag.glsl";
import blurFragment from "./post/blur.frag.glsl";
import compositeFragment from "./post/composite.frag.glsl";
import { useFps } from "./useFps";

export type OGLCallback = (_opts: {
  gl: OGLRenderingContext;
  scene: Transform;
  camera: Camera;
  canvas: HTMLCanvasElement;
}) => void | Promise<void>;

function updateTimeUniform(mesh: Transform) {
  if (mesh instanceof Mesh && mesh.program.uniforms.uTime) {
    mesh.program.uniforms.uTime.value += 0.01;
  }
  for (const child of mesh.children) {
    updateTimeUniform(child);
  }
}

function initPost(
  postBloom: Post,
  postComposite: Post,
  bloomResolution: { value: Vec2 },
  compositeResolution: { value: Vec2 }
) {
  const gl = postBloom.gl;

  postBloom.addPass({
    fragment: brightPassFragment,
    uniforms: {
      uThreshold: { value: 0.9 },
      tEmissive: { value: new Texture(gl) },
    },
  });

  const horizontalPass = postBloom.addPass({
    fragment: blurFragment,
    uniforms: {
      uResolution: bloomResolution,
      uDirection: { value: new Vec2(1, 0) },
    },
  });
  const verticalPass = postBloom.addPass({
    fragment: blurFragment,
    uniforms: {
      uResolution: bloomResolution,
      uDirection: { value: new Vec2(0, 1) },
    },
  });
  for (let i = 0; i < 15; i++) {
    postBloom.passes.push(horizontalPass, verticalPass);
  }

  return postComposite.addPass({
    fragment: compositeFragment,
    uniforms: {
      uResolution: compositeResolution,
      tBloom: postBloom.uniform,
      uBloomStrength: { value: 2.6 },
    },
  });
}

function resize(
  canvas: HTMLCanvasElement,
  renderer: Renderer,
  camera: Camera,
  postComposite: Post,
  postBloom: Post,
  target: RenderTarget,
  resolution: { value: Vec2 },
  bloomResolution: { value: Vec2 }
) {
  const w = canvas!.parentElement!.clientWidth;
  const h = canvas!.parentElement!.clientHeight;

  const gl = renderer.gl;

  renderer.setSize(w, h);
  camera.perspective({
    aspect: gl.canvas.width / gl.canvas.height,
  });

  // Update post classes
  postComposite.resize();
  postBloom.resize();
  target.setSize(w * 2, h * 2);

  // Update uniforms
  resolution.value.set(w, h);
  bloomResolution.value.set(
    postBloom.resolutionWidth,
    postBloom.resolutionHeight
  );
}

export function useOgl(hooks: { onInit: OGLCallback; onUpdate: OGLCallback }) {
  const [canvas, setCanvas] = React.useState<HTMLCanvasElement | null>(null);
  const resizeObserver = React.useRef<ResizeObserver>();
  const frameIdRef = React.useRef(0);
  const { fps, tick, enabled: fpsCounterEnabled } = useFps();

  React.useEffect(() => {
    const cleanup = () => {
      resizeObserver.current?.disconnect();
      cancelAnimationFrame(frameIdRef.current);
    };
    if (!canvas) return cleanup;

    const renderer = new Renderer({
      canvas: canvas!,
      dpr: 2,
    });
    const gl = renderer.gl;
    const target = new RenderTarget(gl, {
      color: 2,
    });

    const camera = new Camera(gl);
    camera.position.x = 5;
    camera.position.y = 5;
    camera.position.z = 5;
    camera.lookAt([0, 0, 0]);

    // Create composite post at full resolution, and bloom at reduced resolution
    const postComposite = new Post(gl);
    // `targetOnly: true` prevents post from rendering to canvas
    const postBloom = new Post(gl, { dpr: 0.5, targetOnly: true });

    // Create uniforms for passes
    const resolution = { value: new Vec2() };
    const bloomResolution = { value: new Vec2() };

    const compositePass = initPost(
      postBloom,
      postComposite,
      bloomResolution,
      resolution
    );

    const onResize = () =>
      resize(
        canvas,
        renderer,
        camera,
        postComposite,
        postBloom,
        target,
        resolution,
        bloomResolution
      );
    resizeObserver.current = new ResizeObserver(onResize);
    resizeObserver.current.observe(canvas!.parentElement!);

    setTimeout(onResize, 1000);

    const scene = new Transform();

    function update() {
      tick();
      frameIdRef.current = requestAnimationFrame(update);

      hooks.onUpdate({ gl, scene, camera, canvas: canvas! });

      for (const mesh of scene.children) {
        updateTimeUniform(mesh);
      }
      for (const pass of postComposite.passes) {
        if (pass.uniforms.uTime !== undefined) {
          pass.uniforms.uTime.value += 0.01;
        }
      }

      try {
        // Disable compositePass pass, so this post will just render the scene for now
        compositePass.enabled = false;
        // `targetOnly` prevents post from rendering to the canvas
        postComposite.targetOnly = true;
        // This renders the scene to postComposite.uniform.value
        postComposite.render({ scene, camera, target });

        // This render the bloom effect's bright and blur passes to postBloom.fbo.read
        // Passing in a `texture` argument avoids the post initially rendering the scene
        for (const pass of postBloom.passes) {
          if (pass.uniforms.tEmissive !== undefined) {
            pass.uniforms.tEmissive.value = target.textures[1];
          }
        }
        postBloom.render({ texture: target.textures[0] });
        // Re-enable composite pass
        compositePass.enabled = true;
        // Allow post to render to canvas upon its last pass
        postComposite.targetOnly = false;

        // This renders to canvas, compositing the bloom pass on top
        // pass back in its previous render of the scene to avoid re-rendering
        postComposite.render({ texture: target.textures[0] });
      } catch (err) {
        cleanup();
        throw err;
      }
    }

    const ret = hooks.onInit({ gl, camera, scene, canvas });
    if (ret) {
      ret.then(() => {
        requestAnimationFrame(update);
      });
    } else {
      requestAnimationFrame(update);
    }

    return cleanup;
  }, [canvas, hooks.onInit, hooks.onUpdate]);

  return {
    setCanvas,
    fps,
    fpsCounterEnabled,
  };
}
