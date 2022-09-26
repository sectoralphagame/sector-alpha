import clsx from "clsx";
import React from "react";
import ClickAwayListener from "react-click-away-listener";
import { nano, theme } from "../../style";
import { RenderingSystem } from "../../systems/rendering";

import { Panel } from "../components/Panel";
import { LayoutProvider, useLayout } from "../context/Layout";
import { useSim } from "../atoms";
import { ContextMenu } from "../components/ContextMenu";
import { Dropdown, DropdownOptions } from "../components/Dropdown";

const styles = nano.sheet({
  root: {
    display: "grid",
    gridTemplateColumns: `${theme.isMobile ? 380 : 450}px 1fr`,
  },
  collapsed: {
    gridTemplateColumns: `calc(32px + ${theme.spacing(6)}) 1fr`,
  },
  menu: {
    position: "absolute",
    width: "200px",
  },
});

const defaultMenu = { active: false, position: [0, 0], worldPosition: [0, 0] };
export type Menu = typeof defaultMenu;

const GameView: React.FC = () => {
  const { isCollapsed } = useLayout();
  const [sim] = useSim();
  const system = React.useRef<RenderingSystem>();
  const canvasRoot = React.useRef<HTMLDivElement>(null);
  const [menu, setMenu] = React.useState(defaultMenu);

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
      setMenu({
        active: true,
        position: [event.clientX, event.clientY],
        worldPosition: [worldX / 10, worldY / 10],
      });
    };

    if (canvasRoot.current) {
      canvasRoot.current!.addEventListener("contextmenu", onContextMenu);

      return () => {
        canvasRoot.current?.removeEventListener("contextmenu", onContextMenu);
      };
    }
  }, [canvasRoot.current]);

  return (
    <div
      className={clsx(styles.root, {
        [styles.collapsed]: isCollapsed,
      })}
    >
      <Panel />
      {menu.active && (
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
                <ContextMenu menu={menu} />
              </DropdownOptions>
            </Dropdown>
          </div>
        </ClickAwayListener>
      )}
      {/* This div is managed by react so each render would override
      any changes made by pixi, like cursor property. That's why rendering
      system creates own canvas here */}
      <div ref={canvasRoot} id="canvasRoot" />
    </div>
  );
};

export const Game: React.FC = () => (
  <LayoutProvider>
    <GameView />
  </LayoutProvider>
);
