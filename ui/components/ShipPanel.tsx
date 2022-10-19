import React from "react";
import { Ship } from "@core/archetypes/ship";
import { commodities } from "@core/economy/commodity";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@kit/Tabs";
import { Docks } from "./Docks";
import AutoOrder from "./AutoOrder";
import { Commander } from "./Commander";
import Orders from "./Orders";
import Journal from "./Journal";
import styles from "./ShipPanel.scss";

const ShipPanel: React.FC<{ entity: Ship }> = ({ entity: ship }) => {
  const storedCommodities = Object.values(commodities).filter(
    (commodity) => ship.cp.storage.availableWares[commodity] > 0
  );
  const commander = ship.cp.commander?.id
    ? ship.sim.get(ship.cp.commander?.id)
    : null;

  return (
    <div>
      <TabGroup>
        <TabList className={styles.tab}>
          <Tab>General</Tab>
          <Tab>Journal</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {!!commander && (
              <Commander
                commander={commander}
                ship={ship.requireComponents(["commander"])}
              />
            )}
            <hr />
            {storedCommodities.length > 0
              ? storedCommodities
                  .map((commodity) => ({
                    commodity,
                    stored: ship.cp.storage.availableWares[commodity],
                  }))
                  .map((data) => (
                    <div
                      key={data.commodity}
                    >{`${data.commodity}: ${data.stored}`}</div>
                  ))
              : "Empty storage"}
            <hr />
            {ship.hasComponents(["autoOrder"]) && (
              <>
                <AutoOrder entity={ship.requireComponents(["autoOrder"])} />
                <hr />
              </>
            )}
            <Orders ship={ship} />
            <hr />
            {!!ship.cp.docks && (
              <Docks entity={ship.requireComponents(["docks"])} />
            )}
          </TabPanel>
          <TabPanel>
            <Journal entity={ship} />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
};

export default ShipPanel;
