import { nano } from "../../style";

export const Collapsible = nano.jsx("details", {
  marginBottom: "8px",
  cursor: "pointer",
});

export const CollapsibleSummary = nano.jsx("summary", {
  marginBottom: "4px",
});

export const CollapsibleContent = nano.jsx("div", {
  marginLeft: "8px",
});
