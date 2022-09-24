import clsx from "clsx";
import React from "react";
import { nano, theme } from "../../style";
import { RenderingSystem } from "../../systems/rendering";
import {
  Dropdown,
  DropdownOption,
  DropdownOptions,
} from "../components/Dropdown";
import { Panel } from "../components/Panel";
import { LayoutProvider, useLayout } from "../context/Layout";
import { useSim } from "../atoms";

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

const GameView: React.FC = () => {
  const { isCollapsed } = useLayout();
  const [sim] = useSim();
  const system = React.useRef<RenderingSystem>();
  const canvasRoot = React.useRef<HTMLDivElement>(null);
  const [menu, setMenu] = React.useState({ active: false, position: [0, 0] });

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
      setMenu({
        active: true,
        position: [event.clientX, event.clientY],
      });
    };
    const onClick = (event: MouseEvent) => {
      event.preventDefault();
      setMenu((prevMenu) => ({
        ...prevMenu,
        active: false,
      }));
    };

    if (canvasRoot.current) {
      canvasRoot.current!.addEventListener("contextmenu", onContextMenu);
      canvasRoot.current!.addEventListener("click", onClick);

      return () => {
        canvasRoot.current?.removeEventListener("contextmenu", onContextMenu);
        canvasRoot.current?.removeEventListener("click", onClick);
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
        <div
          className={styles.menu}
          style={{ top: menu.position[1], left: menu.position[0] }}
        >
          <Dropdown>
            <DropdownOptions static>
              <DropdownOption onClick={() => undefined}>
                Zrób coś
              </DropdownOption>
            </DropdownOptions>
          </Dropdown>
        </div>
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
