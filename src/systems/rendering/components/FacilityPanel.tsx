import React from "react";
import SVG from "react-inlinesvg";
import { Facility } from "../../../archetypes/facility";
import { ship as asShip } from "../../../archetypes/ship";
import { Entity } from "../../../components/entity";
import locationIcon from "../../../../assets/ui/location.svg";
import { nano } from "../../../style";
import { IconButton } from "./IconButton";
import { Production } from "./Production";
import { Offers } from "./Offers";

const styles = nano.sheet({
  focus: {
    marginLeft: "24px",
  },
});

const FacilityPanel: React.FC = () => {
  const facility = window.selected as Facility;

  return (
    <div>
      <div>{facility.cp.name.value}</div>
      <div>
        Money: {facility.components.budget.getAvailableMoney().toFixed(0)}
      </div>
      <hr />
      <Offers entity={facility} />
      <hr />
      <Production entity={facility} />
      <hr />
      {(window.sim.entities as Entity[])
        .filter((e) => e?.cp.commander?.value === facility)
        .map(asShip)
        .map((ship, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={`${ship.cp.name.value}-${index}`}>
            {ship.cp.name.value}
            <IconButton
              className={styles.focus}
              onClick={() => {
                const { selectionManager } = (window.sim.entities as Entity[])
                  .find((e) => e.hasComponents(["selectionManager"]))!
                  .requireComponents(["selectionManager"]).cp;

                selectionManager.set(ship);
                selectionManager.focused = true;
              }}
            >
              <SVG src={locationIcon} />
            </IconButton>
          </div>
        ))}
      <hr />
      {facility.cp.storage.allocationManager.all().map((allocation) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={allocation.id}>
          Allocation #{allocation.id}: {allocation.type}
        </div>
      ))}
    </div>
  );
};

export default FacilityPanel;
