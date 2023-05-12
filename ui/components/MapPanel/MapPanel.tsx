import { Tab } from "@headlessui/react";
import React from "react";
import styles from "./MapPanel.scss";

export interface MapPanelProps {
  children: React.ReactNode;
  initialExpanded?: boolean;
  tabs: React.ReactNode;
}

export const MapPanel: React.FC<MapPanelProps> = ({
  initialExpanded,
  tabs,
  children,
}) => {
  const [expanded, setExpanded] = React.useState(initialExpanded);

  return (
    <Tab.Group vertical>
      <div className={styles.root}>
        {expanded && (
          <Tab.Panels as="div" className={styles.content}>
            {children}
          </Tab.Panels>
        )}
        <Tab.List
          as="div"
          className={styles.tabs}
          onClick={(event: React.MouseEvent) =>
            setExpanded((prev) =>
              (event.target as Element).getAttribute("aria-selected") === "true"
                ? !prev
                : true
            )
          }
        >
          {tabs}
        </Tab.List>
      </div>
    </Tab.Group>
  );
};

MapPanel.displayName = "MapPanel";
