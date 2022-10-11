import clsx from "clsx";
import React from "react";
import { nano, theme } from "../../style";
import { RenderingSystem } from "../../systems/rendering";
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
});

const GameView: React.FC = () => {
  const { isCollapsed } = useLayout();
  const [sim] = useSim();
  const system = React.useRef<RenderingSystem>();

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

  return (
    <div
      className={clsx(styles.root, {
        [styles.collapsed]: isCollapsed,
      })}
    >
      <Panel />
      {/* This div is managed by react so each render would override
      any changes made by pixi, like cursor property. That's why rendering
      system creates own canvas here */}
      <div id="canvasRoot" />
    </div>
  );
};

export const Game: React.FC = () => (
  <LayoutProvider>
    <GameView />
  </LayoutProvider>
);
