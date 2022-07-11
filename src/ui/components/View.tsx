import React from "react";
import SVG from "react-inlinesvg";
import { nano, theme } from "../../style";
import { Sim } from "../../sim";
import { Save } from "../../db";
import { useLocation } from "../context/Location";
import { IconButton } from "../components/IconButton";
import arrowLeftIcon from "../../../assets/ui/arrow_left.svg";
import { Saves } from "../components/Saves";
import Text from "./Text";

const styles = nano.sheet({
  backButton: {},
  backButtonBar: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
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
  title: {
    "&&": {
      margin: "0",
    },
    display: "inline-block",
  },
});

export interface ViewProps {
  showBack?: boolean;
  title: string;
}

export const View: React.FC<ViewProps> = ({
  children,
  title,
  showBack = true,
}) => {
  const navigate = useLocation();

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <div className={styles.backButtonBar}>
          {showBack && (
            <IconButton
              className={styles.backButton}
              onClick={() => navigate("main")}
            >
              <SVG src={arrowLeftIcon} />
            </IconButton>
          )}
          <Text className={styles.title} variant="h1">
            {title}
          </Text>
        </div>
        {children}
      </div>
    </div>
  );
};
View.displayName = "View";
