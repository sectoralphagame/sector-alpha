import { Disclosure } from "@headlessui/react";
import React from "react";
import styles from "./Collapsible.scss";

export const Collapsible: React.FC<React.HTMLAttributes<HTMLDivElement>> = (
  props
) => <Disclosure {...props} as="div" className={styles.root} />;

export const CollapsibleSummary: React.FC<
  React.HTMLAttributes<HTMLDivElement>
> = (props) => (
  <Disclosure.Button {...props} as="div" className={styles.header} />
);

export const CollapsibleContent: React.FC<
  React.HTMLAttributes<HTMLDivElement>
> = (props) => <Disclosure.Panel {...props} as="div" className={styles.body} />;
