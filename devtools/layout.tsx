import { ArrowLeftIcon } from "@assets/ui/icons";
import { IconButton } from "@kit/IconButton";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import Text from "@kit/Text";
import styles from "./index.scss";

const titles = {
  "/dev/ships": "Ship Editor",
  "/dev/map": "Map",
  "/dev/facility-modules": "Facility Modules",
  "/dev/factions": "Factions",
  "/dev/sectors": "Sectors",
  "/dev/charts": "Charts",
  "/dev/facility-builder": "Facility Builder",
};

export const Layout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const location = useLocation();

  if (/\/dev\/?$/.test(location.pathname)) {
    return <main>{children}</main>;
  }

  return (
    <div>
      <header className={styles.header}>
        <Link to="/dev/">
          <IconButton>
            <ArrowLeftIcon />
          </IconButton>
        </Link>
        <Text className={styles.headerText} variant="h1">
          {titles[location.pathname] || "Dev Tools"}
        </Text>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
};
