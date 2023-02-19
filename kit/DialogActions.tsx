import React from "react";
import styles from "./Dialog.scss";

export type DialogActionsProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>;

export const DialogActions = React.forwardRef<
  HTMLDivElement,
  DialogActionsProps
>(({ children }, ref) => (
  <div ref={ref} className={styles.actions}>
    {children}
  </div>
));
DialogActions.displayName = "DialogActions";
