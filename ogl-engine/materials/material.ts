import type { Engine } from "@ogl-engine/engine/engine";
import type { Engine2D } from "@ogl-engine/engine/engine2d";
import { entries, join, map, pipe } from "@fxts/core";
import type { Engine3D } from "@ogl-engine/engine/engine3d";
import type { Light } from "@ogl-engine/engine/Light";
import Color from "color";
import type { ProgramOptions, Mesh, Vec3, Vec4, Vec2, Mat4, Mat3 } from "ogl";
import { Texture, Program } from "ogl";
import type { BindingParams, FolderApi } from "tweakpane";
import { getPane } from "@ui/context/Pane";

export interface Uniform<
  T extends Vec2 | Vec3 | Vec4 | Texture | Mat3 | Mat4 | number
> {
  value: T;
  meta?: {
    pane?: BindingParams;
  };
}

export abstract class Material {
  engine: Engine3D;
  protected program: Program;
  protected uniforms: {
    ambient: Uniform<Vec3>;
    lights: Light["uniforms"][];
    uTime: Uniform<number>;
    tEnvMap: Uniform<Texture>;
    uCameraScale: Uniform<number>;
    invProjectionMatrix: Uniform<Mat4>;
    invViewMatrix: Uniform<Mat4>;
    invViewProjectionMatrix: Uniform<Mat4>;
  };

  constructor(engine: Engine3D) {
    this.engine = engine;
    this.uniforms = {
      ambient: engine.uniforms.env.ambient,
      lights: engine.uniforms.env.lights,
      uTime: engine.uniforms.uTime,
      tEnvMap: engine.uniforms.env.tEnvMap,
      uCameraScale: { value: Math.log2(engine.camera.far) },
      invProjectionMatrix: { value: engine.camera.invProjectionMatrix },
      invViewMatrix: { value: engine.camera.invViewMatrix },
      invViewProjectionMatrix: { value: engine.camera.invViewProjectionMatrix },
    };
  }

  apply(mesh: Mesh) {
    mesh.program = this.program;
  }

  createPaneSettings(folder?: FolderApi) {
    if (!folder) {
      folder = getPane().addOrReplaceFolder({ title: "Material" });
    }

    for (const uniform of Object.keys(this.uniforms)) {
      if (
        [
          "ambient",
          "lights",
          "uTime",
          "uCameraScale",
          "modelMatrix",
          "viewMatrix",
          "modelViewMatrix",
        ].includes(uniform)
      )
        continue;

      if (this.uniforms[uniform].value instanceof Texture) continue;

      if (uniform.match(/[cC]olor/)) {
        const color = Color.rgb(
          this.uniforms[uniform].value.toArray().map((v) => v * 255)
        ).hex();
        folder
          .addBinding({ color }, "color", {
            label: uniform,
            view: "color",
          })
          .on("change", ({ value }) => {
            Material.colorToVec3(value, this.uniforms[uniform]);
          });
      } else {
        folder.addBinding(this.uniforms[uniform], "value", {
          label: uniform,
          ...(this.uniforms[uniform].meta?.pane ?? {}),
        });
      }
    }
  }

  createProgram(
    vertex: string,
    fragment: string,
    defines: Record<string, string> = {},
    options: Partial<
      Omit<ProgramOptions, "vertex" | "fragment" | "uniforms">
    > = {}
  ) {
    this.program = new Program(this.engine.gl, {
      vertex: vertex.replace(
        /#pragma defines/g,
        pipe(
          defines,
          entries,
          map(([key, value]) => `#define ${key} ${value}`),
          join("\n")
        )
      ),
      fragment: fragment.replace(
        /#pragma defines/g,
        pipe(
          defines,
          entries,
          map(([key, value]) => `#define ${key} ${value}`),
          join("\n")
        )
      ),
      uniforms: this.uniforms,
      ...options,
    });
  }

  static colorToVec3(color: string, uniform: Uniform<Vec3>) {
    const c = Color(color).rgb().array();
    uniform.value.set(c[0], c[1], c[2]).divide(255);
  }

  static colorToVec4(color: string, uniform: Uniform<Vec4>) {
    const c = Color(color).rgb();
    uniform.value.set(
      c.red() / 255,
      c.green() / 255,
      c.blue() / 255,
      c.alpha()
    );
  }
}

export abstract class Material2D {
  engine: Engine2D;
  protected program: Program;
  protected uniforms: {} = {};

  constructor(engine: Engine2D) {
    this.engine = engine;
  }

  apply(mesh: Mesh) {
    mesh.program = this.program;
  }
}

export abstract class MaterialAny {
  engine: Engine;
  protected program: Program;
  protected uniforms: {};

  constructor(engine: Engine) {
    this.engine = engine;
    this.uniforms = {};
  }

  apply(mesh: Mesh) {
    mesh.program = this.program;
  }
}
