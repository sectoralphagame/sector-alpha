import clsx from "clsx";
import React from "react";
import styles from "./Table.scss";

export interface TableProps
  extends React.DetailedHTMLProps<
    React.TableHTMLAttributes<HTMLTableElement>,
    HTMLTableElement
  > {}
export const Table: React.FC<TableProps> = ({ className, ...props }) => (
  <table className={clsx(className, styles.table)} {...props} />
);

export interface TableCellProps
  extends React.DetailedHTMLProps<
    React.TdHTMLAttributes<HTMLTableCellElement>,
    HTMLTableCellElement
  > {}
export const TableCell: React.FC<TableCellProps> = ({
  className,
  ...props
}) => <td className={clsx(className, styles.cell)} {...props} />;

export interface TableHeaderProps
  extends React.DetailedHTMLProps<
    React.ThHTMLAttributes<HTMLTableCellElement>,
    HTMLTableCellElement
  > {}
export const TableHeader: React.FC<TableHeaderProps> = ({
  className,
  ...props
}) => <th className={clsx(className, styles.header)} {...props} />;
