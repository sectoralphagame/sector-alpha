import React from "react";
import SVG from "react-inlinesvg";
import clsx from "clsx";
import { shipComponents } from "../../archetypes/ship";
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
import { nano } from "../../style";
import { ConfigDialog } from "./ConfigDialog";
import { Button } from "./Button";
import { useLayout } from "../context/Layout";
import { facilityComponents } from "../../archetypes/facility";
import EntityName from "./EntityName";

const styles = nano.sheet({
  iconBar: {
    display: "flex",
    gap: "8px",
    marginBottom: "24px",
  },
  iconBarCollapsed: {
    flexDirection: "column",
  },
  root: {
    borderRight: "1px solid #fff",
    padding: "24px",
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

  const entity = React.useRef<Entity | null>(null);
  entity.current = window.selected as Entity | null;

  React.useEffect(() => {
    if (entity.current && isCollapsed) {
      toggleCollapse();
    }
  }, [entity.current]);

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
        {!!entity.current && (
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
        {!isCollapsed && (
          <>
            <div className={styles.spacer} />
            <IconButton onClick={toggleCollapse}>
              <SVG src={arrowLeftIcon} />
            </IconButton>
          </>
        )}
      </div>
      {!isCollapsed && !!entity.current && (
        <>
          {entity.current.hasComponents(["name"]) && (
            <EntityName entity={entity.current.requireComponents(["name"])} />
          )}
          {entity.current.hasComponents(shipComponents) ? (
            <ShipPanel />
          ) : entity.current.hasComponents(facilityComponents) ? (
            <FacilityPanel />
          ) : null}
        </>
      )}
      <ConfigDialog open={openConfig} onClose={() => setOpenConfig(false)}>
        <Button>load</Button>
        <Button>save</Button>
      </ConfigDialog>
    </div>
  );
};
