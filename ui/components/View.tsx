import React from "react";
import SVG from "react-inlinesvg";
import arrowLeftIcon from "@assets/ui/arrow_left.svg";
import { IconButton } from "@kit/IconButton";
import Text from "@kit/Text";
import { nano } from "../style";
import { useLocation } from "../context/Location";

const styles = nano.sheet({
  backButtonBar: {
    display: "flex",
    alignItems: "center",
    gap: "var(--spacing-2)",
    marginBottom: "var(--spacing-1)",
  },
  container: {
    padding: "var(--spacing-4)",
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
            <IconButton onClick={() => navigate("main")}>
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
