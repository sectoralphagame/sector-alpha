import React from "react";
import { Production } from "./Production";
import { Offers } from "./Offers";
import { Docks } from "./Docks";
import { Subordinates } from "./Subordinates";
import { Facility } from "@core/archetypes/facility";
import { Allocations } from "./Allocations";
import ShipBuildingQueue from "./ShipBuildingQueue";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "./Tabs";
import { nano, theme } from "../style";
import Journal from "./Journal";

const tabClassName = nano.rule({
  display: "inline-block",
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(2),
});

const FacilityPanel: React.FC<{ entity: Facility }> = ({
  entity: facility,
}) => (
  <div>
    <TabGroup>
      <TabList className={tabClassName}>
        <Tab>General</Tab>
        <Tab>Journal</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <div>Money: {facility.components.budget.available.toFixed(0)}</div>
          <hr />
          <Offers entity={facility} />
          <hr />
          <Production entity={facility} />
          <hr />
          {facility.hasComponents(["shipyard"]) && (
            <>
              <ShipBuildingQueue
                entity={facility.requireComponents(["shipyard"])}
              />
              <hr />
            </>
          )}
          <Subordinates entity={facility} />
          <hr />
          <Allocations entity={facility} />
          <hr />
          <Docks entity={facility} />
        </TabPanel>
        <TabPanel>
          <Journal entity={facility} />
        </TabPanel>
      </TabPanels>
    </TabGroup>
  </div>
);

export default FacilityPanel;
