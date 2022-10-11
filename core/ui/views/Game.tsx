import React from "react";
import ClickAwayListener from "react-click-away-listener";
import { deepEqual } from "mathjs";
import { nano } from "../../style";
import { RenderingSystem } from "../../systems/rendering";

import { Panel } from "../components/Panel";
import { useContextMenu, useSim } from "../atoms";
import { ContextMenu } from "../components/ContextMenu";
import { Dropdown, DropdownOptions } from "../components/Dropdown";
import { PlayerMoney } from "../components/PlayerMoney";
import { worldToHecs } from "../../components/hecsPosition";

const styles = nano.sheet({
  menu: {
    position: "absolute",
    width: "200px",
  },
  canvasRoot: {
    position: "relative",
    height: "100vh",
    width: "100vw",
  },
});

export const Game: React.FC = () => {
  const [sim] = useSim();
  const system = React.useRef<RenderingSystem>();
  const canvasRoot = React.useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useContextMenu();

  React.useEffect(() => {
    if (!sim) return () => undefined;

    sim.start();
    system.current = new RenderingSystem(sim);
    sim.registerSystem(system.current);

    const unmount = () => {
      sim.unregisterSystem(system.current!);
      sim.events.removeListener("destroy", unmount);
    };

    sim.events.on("destroy", unmount);

    return unmount;
  }, [sim]);

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

  return (
    <div>
      <Panel />
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
      </div>
    </div>
  );
};
