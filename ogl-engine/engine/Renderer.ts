import type { Mesh, Transform } from "ogl";
import { Renderer as BaseRenderer, Vec3 } from "ogl";

const tempVec3 = new Vec3();

export const RenderLayer = {
  default: 0,
  ui: 1,
} as const;
// eslint-disable-next-line no-redeclare
export type RenderLayer = (typeof RenderLayer)[keyof typeof RenderLayer];

function isDrawableMesh(obj: Transform): obj is Mesh {
  return (obj as Mesh).draw !== undefined;
}

export class Renderer extends BaseRenderer {
  private currentLayer: RenderLayer = RenderLayer.default;

  setRenderLayer(layer: RenderLayer) {
    this.currentLayer = layer;
  }

  getRenderList({
    scene,
    camera,
    frustumCull,
    sort,
  }: Parameters<BaseRenderer["getRenderList"]>[0]) {
    let renderList: Mesh[] = [];

    if (camera && frustumCull) camera.updateFrustum();

    // Get visible
    scene.traverse((node) => {
      if (!node.visible) return true;
      if (!isDrawableMesh(node)) return undefined;

      if (frustumCull && node.frustumCulled && camera) {
        if (!camera.frustumIntersectsMesh(node)) return undefined;
      }

      if (
        (node as any).layer === this.currentLayer ||
        (this.currentLayer === RenderLayer.default &&
          (node as any).layer === undefined)
      ) {
        renderList.push(node);
      }

      return undefined;
    });

    if (sort) {
      const opaque: Mesh[] = [];
      const transparent: Mesh[] = []; // depthTest true
      const ui: Mesh[] = []; // depthTest false

      renderList.forEach((node) => {
        // Split into the 3 render groups
        if (!node.program.transparent) {
          opaque.push(node);
        } else if (node.program.depthTest) {
          transparent.push(node);
        } else {
          ui.push(node);
        }

        (node as any).zDepth = 0;

        // Only calculate z-depth if renderOrder unset and depthTest is true
        if (node.renderOrder !== 0 || !node.program.depthTest || !camera)
          return;

        // update z-depth
        node.worldMatrix.getTranslation(tempVec3);
        tempVec3.applyMatrix4(camera.projectionViewMatrix);
        (node as any).zDepth = tempVec3.z;
      });

      opaque.sort(this.sortOpaque);
      transparent.sort(this.sortTransparent);
      ui.sort(this.sortUI);

      renderList = opaque.concat(transparent, ui);
    }

    return renderList;
  }
}
