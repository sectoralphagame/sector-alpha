import React from "react";
import { IconButton } from "@kit/IconButton";
import Text from "@kit/Text";
import { ArrowLeftIcon } from "@assets/ui/icons";
import styles from "./View.scss";
import { useLocation } from "../context/Location";

export interface ViewProps {
  children: React.ReactNode;
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
              <ArrowLeftIcon />
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
