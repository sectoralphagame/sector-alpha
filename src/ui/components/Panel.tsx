import React from "react";
import SVG from "react-inlinesvg";
import clsx from "clsx";
import { shipComponents, ship as asShip } from "../../archetypes/ship";
import { Entity } from "../../components/entity";
import FacilityPanel from "./FacilityPanel";
import ffIcon from "../../../assets/ui/ff.svg";
import pauseIcon from "../../../assets/ui/pause.svg";
import locationIcon from "../../../assets/ui/location.svg";
import configIcon from "../../../assets/ui/config.svg";
import arrowLeftIcon from "../../../assets/ui/arrow_left.svg";
import playIcon from "../../../assets/ui/play.svg";
import { IconButton } from "./IconButton";
import ShipPanel from "./ShipPanel";
import { nano, theme } from "../../style";
import { ConfigDialog } from "./ConfigDialog";
import { useLayout } from "../context/Layout";
import {
  facilityComponents,
  facility as asFacility,
} from "../../archetypes/facility";
import EntityName from "./EntityName";
import Resources from "./Resources";
import { sector, sectorComponents } from "../../archetypes/sector";
import SectorStats from "./SectorStats";

const styles = nano.sheet({
  iconBar: {
    display: "flex",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(3),
  },
  iconBarCollapsed: {
    flexDirection: "column",
  },
  root: {
    borderRight: `1px solid ${theme.palette.default}`,
    padding: theme.spacing(3),
  },
  scrollArea: {
    "&::-webkit-scrollbar": {
      display: "none",
    },
    overflowY: "scroll",
    height: `calc(100vh - 32px - ${theme.spacing(9)})`,
    paddingBottom: theme.spacing(3),
  },
  rotate: {
    transform: "rotate(180deg)",
  },
  spacer: {
    flex: 1,
  },
});

export const Panel: React.FC = () => {
  const { isCollapsed, toggleCollapse } = useLayout();
  const [openConfig, setOpenConfig] = React.useState(false);
  const [, setRender] = React.useState(false);
  const interval = React.useRef<number>();

  const [entity, setEntity] = React.useState<Entity | null>(
    window.selected as Entity | null
  );

  React.useEffect(() => {
    if (entity !== window.selected) {
      setEntity(window.selected as Entity | null);
    }
  });

  React.useEffect(() => {
    if (entity && isCollapsed) {
      toggleCollapse();
    }
  }, [entity]);

  React.useEffect(() => {
    if (!window.sim) return;
    if (openConfig) {
      window.sim.pause();
    } else {
      window.sim.start();
    }
  }, [openConfig]);

  React.useEffect(() => {
    interval.current = setInterval(
      () => setRender((v) => !v),
      250
    ) as unknown as number;

    return () => clearInterval(interval.current);
  }, []);

  return (
    <div className={styles.root} id="toolbar">
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
          <IconButton onClick={() => setOpenConfig(true)}>
            <SVG src={configIcon} />
          </IconButton>
        )}
        <IconButton onClick={window.sim?.pause}>
          <SVG src={pauseIcon} />
        </IconButton>
        <IconButton
          onClick={() => {
            window.sim.setSpeed(1);
            window.sim.start();
          }}
        >
          <SVG src={playIcon} />
        </IconButton>
        <IconButton
          onClick={() => {
            window.sim.setSpeed(10);
            window.sim.start();
          }}
        >
          <SVG src={ffIcon} />
        </IconButton>
        {!!entity && (
          <IconButton
            onClick={() => {
              window.sim.find((e) =>
                e.hasComponents(["selectionManager"])
              ).cp.selectionManager.focused = true;
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
          <IconButton onClick={() => setOpenConfig(true)}>
            <SVG src={configIcon} />
          </IconButton>
        )}
      </div>
      {!isCollapsed && !!entity && (
        <div className={styles.scrollArea}>
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
              <SectorStats entity={sector(entity)} />
            </>
          )}
        </div>
      )}
      <ConfigDialog open={openConfig} onClose={() => setOpenConfig(false)} />
    </div>
  );
};
