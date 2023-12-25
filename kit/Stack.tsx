import clsx from "clsx";
import type { ReactNode } from "react";
import React from "react";
import styles from "./Stack.scss";

export interface StackProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
}

const Stack: React.FC<StackProps> = ({ children, ...props }) => (
  <div {...props} className={clsx(props.className, styles.root)}>
    {children}
  </div>
);

export default Stack;
