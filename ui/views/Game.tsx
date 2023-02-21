import React from "react";
import ClickAwayListener from "react-click-away-listener";
import { deepEqual } from "mathjs";
import { RenderingSystem } from "@core/systems/rendering";
import { worldToHecs } from "@core/components/hecsPosition";
import { Dropdown, DropdownOptions } from "@kit/Dropdown";
import type { Entity } from "@core/components/entity";
import { MapView } from "@ui/components/MapView";
import { useRerender } from "@ui/hooks/useRerender";
import type { Commodity } from "@core/economy/commodity";
import { addStorage } from "@core/components/storage";
import { changeBudgetMoney } from "@core/components/budget";
import styles from "./Game.scss";

import { Panel } from "../components/Panel";
import { useContextMenu, useSim } from "../atoms";
import { ContextMenu } from "../components/ContextMenu";
import { PlayerMoney } from "../components/PlayerMoney";

export const Game: React.FC = () => {
  const [sim] = useSim();
  const system = React.useRef<RenderingSystem>();
  const canvasRoot = React.useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useContextMenu();

  const selectedId = sim?.queries.settings.get()[0]!.cp.selectionManager.id;
  const [selectedEntity, setSelectedEntity] = React.useState<
    Entity | undefined
  >(selectedId ? sim?.get(selectedId) : undefined);

  React.useEffect(() => {
    if (!sim) return () => undefined;

    sim.start();
    system.current = new RenderingSystem(sim);
    sim.registerSystem(system.current);

    const unmount = () => {
      sim.unregisterSystem(system.current!);
    };

    sim.hooks.destroy.tap("Game", unmount);

    (window as any).cheats = {
      addCommodity: (commodity: Commodity, quantity: number, id?: number) => {
        const entity = id ? sim.getOrThrow(id) : (window.selected as Entity);
        if (entity) {
          addStorage(entity.cp.storage!, commodity, quantity);
        }
      },
      addMoney: (quantity: number, id?: number) => {
        const entity = id
          ? sim.getOrThrow(id)
          : (window.selected as Entity | undefined) ??
            sim.queries.player.get()[0]!;
        changeBudgetMoney(entity.cp.budget!, quantity);
      },
    };

    window.sim = sim;

    return unmount;
  }, [sim]);

  React.useEffect(() => {
    if (selectedEntity?.id !== selectedId) {
      setSelectedEntity(selectedId ? sim.get(selectedId) : undefined);
    }
  });

  // eslint-disable-next-line consistent-return
  React.useEffect(() => {
    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      const { x: worldX, y: worldY } = system.current!.viewport.toWorld(
        event.offsetX,
        event.offsetY
      );
      const worldPosition = [worldX / 10, worldY / 10];
      setMenu({
        active: true,
        position: [event.clientX, event.clientY],
        worldPosition,
        sector:
          sim.queries.sectors
            .get()
            .find((s) =>
              deepEqual(s.cp.hecsPosition.value, worldToHecs(worldPosition))
            ) ?? null,
      });
    };

    if (canvasRoot.current) {
      canvasRoot.current!.addEventListener("contextmenu", onContextMenu);

      return () => {
        canvasRoot.current?.removeEventListener("contextmenu", onContextMenu);
      };
    }
  }, [canvasRoot.current]);

  React.useEffect(() => {
    if (!menu.active) {
      sim.queries.settings.get()[0].cp.selectionManager.secondaryId = null;
    }
  }, [menu.active]);

  useRerender(250);

  return (
    <div>
      <Panel entity={selectedEntity} />
      {menu.active && !!menu.sector && (
        <ClickAwayListener
          mouseEvent="mousedown"
          onClickAway={() => setMenu({ ...menu, active: false })}
        >
          <div
            className={styles.menu}
            style={{ top: menu.position[1], left: menu.position[0] }}
          >
            <Dropdown onClick={() => setMenu({ ...menu, active: false })}>
              <DropdownOptions static>
                <ContextMenu />
              </DropdownOptions>
            </Dropdown>
          </div>
        </ClickAwayListener>
      )}
      {/* This div is managed by react so each render would override
      any changes made by pixi, like cursor property. That's why rendering
      system creates own canvas here */}
      <div className={styles.canvasRoot} ref={canvasRoot} id="canvasRoot">
        <PlayerMoney />
        <MapView />
      </div>
    </div>
  );
};
