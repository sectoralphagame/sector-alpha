import React from "react";
import { nano, theme } from "../../style";

export const Table = nano.jsx("table", {
  "tbody tr:not(.no-border), thead tr:not(.no-border)": {
    borderBottom: `1px ${theme.palette.disabled} solid`,
  },
  "tbody td, thead th": {
    padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
  },
  "tbody tr:not(.no-border):last-child": {
    borderBottom: "none",
  },
  "tbody td": {
    padding: `${theme.spacing(0.75)} ${theme.spacing(1)}`,
  },
  "tbody input": {
    "&:focus": {
      background: "rgba(255,255,255,0.2)",
    },
    background: "rgba(255,255,255,0.1)",
    border: "none",
    borderRadius: "4px",
    color: theme.palette.default,
    fontSize: theme.typography.default,
    outline: 0,
    height: "32px",
    padding: "4px 8px",
    transition: "200ms",
    width: "100%",
  },
  borderCollapse: "collapse",
  tableLayout: "fixed",
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