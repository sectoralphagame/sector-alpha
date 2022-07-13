import { nano, theme } from "../../style";

export const Collapsible = nano.jsx("details", {
  marginBottom: theme.spacing(1),
});

export const CollapsibleSummary = nano.jsx("summary", {
  marginBottom: "4px",
  cursor: "pointer",
});

export const CollapsibleContent = nano.jsx("div", {
  marginLeft: theme.spacing(3),
});
