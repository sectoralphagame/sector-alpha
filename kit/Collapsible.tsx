import { Disclosure } from "@headlessui/react";
import clsx from "clsx";
import React from "react";
import styles from "./Collapsible.scss";

interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  className,
  ...props
}) => (
  <Disclosure {...props} as="div" className={clsx(styles.root, className)} />
);

export const CollapsibleSummary: React.FC<
  React.HTMLAttributes<HTMLDivElement>
> = (props) => (
  <Disclosure.Button {...props} as="div" className={styles.header} />
);

export const CollapsibleContent: React.FC<
  React.HTMLAttributes<HTMLDivElement>
> = ({ className, ...props }) => (
  <Disclosure.Panel
    {...props}
    as="div"
    className={clsx(className, styles.body)}
  />
);
