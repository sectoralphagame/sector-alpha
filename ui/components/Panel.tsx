import React from "react";
import SVG from "react-inlinesvg";
import clsx from "clsx";
import { shipComponents, ship as asShip } from "@core/archetypes/ship";
import { Entity } from "@core/components/entity";
import {
  facilityComponents,
  facility as asFacility,
} from "@core/archetypes/facility";
import { sector, sectorComponents } from "@core/archetypes/sector";
import ffIcon from "@assets/ui/ff.svg";
import pauseIcon from "@assets/ui/pause.svg";
import locationIcon from "@assets/ui/location.svg";
import configIcon from "@assets/ui/config.svg";
import arrowLeftIcon from "@assets/ui/arrow_left.svg";
import playIcon from "@assets/ui/play.svg";
import { IconButton } from "@kit/IconButton";
import FacilityPanel from "./FacilityPanel";
import ShipPanel from "./ShipPanel";
import { nano } from "../style";
import { ConfigDialog } from "./ConfigDialog";
import EntityName from "./EntityName";
import Resources from "./Resources";
import SectorResources from "./SectorStats";
import SectorPrices from "./SectorPrices";
import Inflation from "./InflationStats";
import { useGameDialog, useSim } from "../atoms";
import { PlayerShips } from "./PlayerShips";
import { useRerender } from "../hooks/useRerender";
import { PlayerFacilities } from "./PlayerFacilities";
import { TradeDialog } from "./TradeDialog";

const styles = nano.sheet({
  iconBar: {
    display: "flex",
    gap: "var(--spacing-1)",
    marginBottom: "var(--spacing-2)",
    paddingBottom: "var(--spacing-2)",
    borderBottom: "1px solid var(--palette-default)",
  },
  iconBarCollapsed: {
    flexDirection: "column",
    marginBottom: 0,
    padding: 0,
    borderBottom: "none",
  },
  root: {
    border: "1px solid var(--palette-default)",
    borderLeft: "none",
    borderTopRightRadius: "8px",
    borderBottomRightRadius: "8px",
    background: "var(--palette-background)",
    maxHeight: "calc(100vh - 128px)",
    padding: "var(--spacing-3)",
    position: "absolute",
    top: "64px",
    left: "0",
    width: "450px",
    zIndex: 1,
  },
  rootCollapsed: {
    width: "80px",
  },
  scrollArea: {
    "&::-webkit-scrollbar": {
      display: "none",
    },
    overflowY: "scroll",
    height: "calc(100vh - 234px)",
    paddingBottom: "var(--spacing-3)",
  },
  rotate: {
    transform: "rotate(180deg)",
  },
  spacer: {
    flex: 1,
  },
});

export const Panel: React.FC = () => {
  const [isCollapsed, setCollapsed] = React.useState(true);
  const [dialog, setDialog] = useGameDialog();
  const toggleCollapse = React.useCallback(() => setCollapsed((c) => !c), []);

  const [sim] = useSim();
  const selectedId = sim.queries.settings.get()[0]!.cp.selectionManager.id;

  const [entity, setEntity] = React.useState<Entity | undefined>(
    selectedId ? sim.get(selectedId) : undefined
  );

  const closeDialog = React.useCallback(() => setDialog(null), []);

  useRerender(250);

  React.useEffect(() => {
    if (entity?.id !== selectedId) {
      setEntity(selectedId ? sim.get(selectedId) : undefined);
    }
  });

  React.useEffect(() => {
    if (entity && isCollapsed) {
      toggleCollapse();
    }
  }, [entity]);

  React.useEffect(() => {
    if (!sim) return;
    if (dialog?.type === "config") {
      sim.stop();
    }
  }, [dialog]);

  if (!sim) return null;

  return (
    <div
      className={clsx(styles.root, {
        [styles.rootCollapsed]: isCollapsed,
      })}
      id="toolbar"
    >
      <div
        className={clsx(styles.iconBar, {
          [styles.iconBarCollapsed]: isCollapsed,
        })}
      >
        {isCollapsed ? (
          <IconButton className={styles.rotate} onClick={toggleCollapse}>
            <SVG src={arrowLeftIcon} />
          </IconButton>
        ) : (
          <IconButton onClick={() => setDialog({ type: "config" })}>
            <SVG src={configIcon} />
          </IconButton>
        )}
        <IconButton onClick={sim?.pause}>
          <SVG src={pauseIcon} />
        </IconButton>
        <IconButton
          onClick={() => {
            sim.setSpeed(1);
            sim.start();
          }}
        >
          <SVG src={playIcon} />
        </IconButton>
        <IconButton
          onClick={() => {
            sim.setSpeed(10);
            sim.start();
          }}
        >
          <SVG src={ffIcon} />
        </IconButton>
        {!!entity && (
          <IconButton
            onClick={() => {
              sim.find((e) =>
                e.hasComponents(["selectionManager"])
              )!.cp.selectionManager!.focused = true;
            }}
          >
            <SVG src={locationIcon} />
          </IconButton>
        )}
        {!isCollapsed ? (
          <>
            <div className={styles.spacer} />
            <IconButton onClick={toggleCollapse}>
              <SVG src={arrowLeftIcon} />
            </IconButton>
          </>
        ) : (
          <IconButton onClick={() => setDialog({ type: "config" })}>
            <SVG src={configIcon} />
          </IconButton>
        )}
      </div>
      {!isCollapsed && (
        <div className={styles.scrollArea}>
          {entity ? (
            <>
              {entity.hasComponents(["name"]) && (
                <EntityName entity={entity.requireComponents(["name"])} />
              )}
              {entity.hasComponents(shipComponents) ? (
                <ShipPanel entity={asShip(entity)} />
              ) : entity.hasComponents(facilityComponents) ? (
                <FacilityPanel entity={asFacility(entity)} />
              ) : null}
              {entity.hasComponents(sectorComponents) && (
                <>
                  <Resources entity={sector(entity)} />
                  <SectorResources entity={sector(entity)} />
                  <SectorPrices entity={sector(entity)} />
                </>
              )}
            </>
          ) : (
            <>
              <PlayerShips />
              <PlayerFacilities />
              {window.dev && (
                <>
                  <Inflation sim={sim} />
                  <hr />
                </>
              )}
            </>
          )}
        </div>
      )}
      <ConfigDialog
        open={dialog?.type === "config"}
        onClose={() => {
          closeDialog();
          sim.start();
        }}
      />
      <TradeDialog open={dialog?.type === "trade"} onClose={closeDialog} />
    </div>
  );
};
