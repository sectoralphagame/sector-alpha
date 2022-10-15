import clsx from "clsx";
import React from "react";
import styles from "./Card.scss";

export const Card: React.FC<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
> = ({ className, ...props }) => (
  <div className={clsx(className, styles.root)} {...props} />
);

export const CardHeader: React.FC<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
> = ({ className, ...props }) => (
  <div className={clsx(className, styles.header)} {...props} />
);
