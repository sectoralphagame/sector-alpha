import React from "react";
import SVG from "react-inlinesvg";
import { nano, theme } from "../../style";
import { Sim } from "../../sim";
import { Save } from "../../db";
import { useLocation } from "../context/Location";
import { IconButton } from "../components/IconButton";
import arrowLeftIcon from "../../../assets/ui/arrow_left.svg";
import { Saves } from "../components/Saves";

const styles = nano.sheet({
  backButton: {
    marginBottom: theme.spacing(1),
  },
  container: {
    padding: theme.spacing(4),
    width: "420px",
  },
  root: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    height: "100%",
  },
});

export interface ViewProps {
  showBack?: boolean;
}

export const View: React.FC<ViewProps> = ({ children, showBack = true }) => {
  const navigate = useLocation();

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        {showBack && (
          <IconButton
            className={styles.backButton}
            onClick={() => navigate("main")}
          >
            <SVG src={arrowLeftIcon} />
          </IconButton>
        )}
        {children}
      </div>
    </div>
  );
};
View.displayName = "View";
