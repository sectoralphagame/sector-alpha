import React from "react";
import { nano, theme } from "../style";

export const Table = nano.jsx("table", {
  borderCollapse: "collapse",
  width: "100%",
});

export const TableCell: React.FC<
  React.DetailedHTMLProps<
    React.TdHTMLAttributes<HTMLTableCellElement>,
    HTMLTableCellElement
  >
> = nano.jsx("td", {
  padding: "4px 0",
}) as any;

export const TableHeader = nano.jsx("th", {
  fontSize: theme.typography.label,
  padding: "4px 0",
});
