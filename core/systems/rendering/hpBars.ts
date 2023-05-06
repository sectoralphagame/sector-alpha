import type { RequireComponent } from "@core/tsHelpers";
import { Graphics } from "pixi.js";

export function drawHpBars(entity: RequireComponent<"render">) {
  if (entity.cp.hitpoints) {
    if (!entity.cp.hitpoints.g) {
      entity.cp.hitpoints.g = {} as any;
    }
    if (!entity.cp.hitpoints.g.hp) {
      entity.cp.hitpoints.g.hp = new Graphics();
      entity.cp.render.sprite.addChild(entity.cp.hitpoints.g.hp);
    }

    if (entity.cp.hitpoints.shield && !entity.cp.hitpoints.g.shield) {
      entity.cp.hitpoints.g.shield = new Graphics();
      entity.cp.render.sprite.addChild(entity.cp.hitpoints.g.shield);
    }

    entity.cp.hitpoints.g.hp.rotation = -entity.cp.render.sprite.rotation;
    if (entity.cp.hitpoints.shield) {
      entity.cp.hitpoints.g.shield.rotation = -entity.cp.render.sprite.rotation;
    }

    if (entity.cp.hitpoints.hit !== false) {
      entity.cp.hitpoints.hit = false;

      const hp = entity.cp.hitpoints.hp.value / entity.cp.hitpoints.hp.max;

      if (hp >= 1) {
        entity.cp.hitpoints.g.hp.visible = false;
      } else {
        entity.cp.hitpoints.g.hp.visible = true;
        entity.cp.hitpoints.g.hp.clear();
        entity.cp.hitpoints.g.hp
          .beginFill(0x00ff00)
          .drawRect(-25, -30, hp * 50, 9);
      }

      if (entity.cp.hitpoints.shield) {
        const shield =
          entity.cp.hitpoints.shield.value / entity.cp.hitpoints.shield.max;

        if (shield >= 1) {
          entity.cp.hitpoints.g.shield.visible = false;
        } else {
          entity.cp.hitpoints.g.shield.visible = true;
          entity.cp.hitpoints.g.shield.clear();
          entity.cp.hitpoints.g.shield
            .beginFill(0x0000ff)
            .drawRect(-25, -42, shield * 50, 9);
        }
      }
    }
  }
}
