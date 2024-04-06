import React from "react";
import ClickAwayListener from "react-click-away-listener";
import { RenderingSystem } from "@core/systems/rendering";
import { Dropdown, DropdownOptions } from "@kit/Dropdown";
import type { Entity } from "@core/entity";
import { MapView } from "@ui/components/MapView";
import { useRerender } from "@ui/hooks/useRerender";
import { MapPanel } from "@ui/components/MapPanel";
import {
  MapPanelButton,
  MapPanelTabContent,
} from "@ui/components/MapPanel/MapPanelButton";
import { TradeFinder } from "@ui/components/TradeFinder";
import { Relations } from "@ui/components/Relations/Relations";
import { Overlay } from "@ui/components/Overlay/Overlay";
import { FleetOverlay } from "@ui/components/FleetOverlay/FleetOverlay";
import { MissionsOverlay } from "@ui/components/MissionsOverlay";
import { Notifications } from "@ui/components/Notifications";
import { SimControl } from "@ui/components/SimControl/SimControl";
import DevOverlay from "@ui/components/DevOverlay/DevOverlay";
import { useGameSettings } from "@ui/hooks/useGameSettings";
import { SelectedUnit } from "@ui/components/SelectedUnit";
import styles from "./Game.scss";

import { Panel } from "../components/Panel";
import type { GameOverlayProps } from "../atoms";
import {
  useContextMenu,
  useGameDialog,
  useGameOverlay,
  useNotifications,
  useSim,
} from "../atoms";
import { ContextMenu } from "../components/ContextMenu";
import { PlayerMoney } from "../components/PlayerMoney";

const overlayKeyCodes: Record<string, NonNullable<GameOverlayProps>> = {
  Backslash: "dev",
  KeyF: "fleet",
  KeyJ: "missions",
};

const Game: React.FC = () => {
  const [sim, setSim] = useSim();
  const system = React.useRef<RenderingSystem>();
  const canvasRoot = React.useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useContextMenu();
  const [dialog, setDialog] = useGameDialog();
  const [overlay, setOverlay] = useGameOverlay();
  const { addNotification } = useNotifications();
  const [gameSettings] = useGameSettings();
  const pressedKeys = React.useRef(new Set<string>());

  const selectedId = sim.queries.settings.get()[0]!.cp.selectionManager.id;
  const [selectedEntity, setSelectedEntity] = React.useState<
    Entity | undefined
  >(selectedId ? sim.get(selectedId) : undefined);
  const player = sim.queries.player.get()[0]!;

  React.useEffect(() => {
    if (!sim) return () => undefined;

    sim.start();

    system.current = new RenderingSystem([menu, setMenu]);
    system.current.apply(sim);

    const unmount = () => {
      setDialog(null);
      setSim(undefined!);
    };

    sim.hooks.removeEntity.subscribe("Game", (entity) => {
      if (entity.id === selectedId) {
        setSelectedEntity(undefined);
      }
    });
    sim.hooks.destroy.subscribe("Game", unmount);

    window.sim = sim;

    return unmount;
  }, [sim]);

  React.useEffect(() => {
    if (selectedEntity?.id !== selectedId) {
      setSelectedEntity(selectedId ? sim.get(selectedId) : undefined);
    }
  });

  React.useEffect(() => {
    if (!menu.active) {
      sim.queries.settings.get()[0].cp.selectionManager.secondaryId = null;
    }
  }, [menu.active]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      pressedKeys.current.add(event.code);

      if (event.code === "Escape") {
        if (overlay) {
          setOverlay(null);
        } else {
          setDialog(dialog ? null : { type: "config" });
        }
      }

      if (event.target instanceof HTMLInputElement) return;

      if (
        event.code in overlayKeyCodes &&
        (overlayKeyCodes[event.code] !== "dev" || gameSettings.dev)
      ) {
        setOverlay((prev) =>
          prev === overlayKeyCodes[event.code]
            ? null
            : overlayKeyCodes[event.code]
        );
      }
      if (event.code === "Space") {
        if (sim.speed === 0) sim.unpause();
        else sim.pause();
      }

      if (
        event.code.startsWith("Digit") &&
        pressedKeys.current.has("ShiftLeft")
      ) {
        if (event.code === "Digit1") sim.setSpeed(1);
        if (event.code === "Digit2") sim.setSpeed(5);
        if (event.code === "Digit3" && gameSettings.dev) sim.setSpeed(50);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      pressedKeys.current.delete(event.code);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setDialog, overlay, gameSettings.dev]);

  React.useEffect(() => {
    if (player.cp.missions.offer) {
      if (player.cp.missions.offer.immediate) {
        setDialog({ type: "missionOffer" });
      } else {
        addNotification({
          icon: "question",
          message: "New mission offer",
          type: "warning",
          onClick: () => setDialog({ type: "missionOffer" }),
        });
      }
    }
  }, [player.cp.missions.offer]);

  useRerender(200);

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div id="game-root" data-debug={window.dev}>
      {/* This div is managed by react so each render would override
      any changes made by pixi, like cursor property. That's why rendering
      system creates own canvas here */}
      <div className={styles.canvasRoot} ref={canvasRoot} id="canvasRoot">
        <PlayerMoney />
        <SimControl />
        <SelectedUnit />
        <MapPanel
          tabs={
            <>
              <MapPanelButton>Trade</MapPanelButton>
              <MapPanelButton>Legend</MapPanelButton>
              <MapPanelButton>Relations</MapPanelButton>
            </>
          }
        >
          <MapPanelTabContent>
            <TradeFinder />
          </MapPanelTabContent>
          <MapPanelTabContent>
            <MapView />
          </MapPanelTabContent>
          <MapPanelTabContent>
            <Relations />
          </MapPanelTabContent>
        </MapPanel>
      </div>
      <Panel entity={selectedEntity} />
      <Notifications />
      <Overlay
        active={overlay}
        open={!!overlay}
        onClose={() => setOverlay(null)}
      >
        <FleetOverlay />
        <MissionsOverlay />
        {gameSettings.dev && <DevOverlay />}
      </Overlay>
      {menu.active && (!!menu.sector || menu.overlay) && (
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
    </div>
  );
};

const GameWrapper: React.FC = () => {
  const [sim] = useSim();

  if (!sim) return null;

  return <Game />;
};

export { GameWrapper as Game };
