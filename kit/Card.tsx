import { nano } from "../ui/style";

export const Card = nano.jsx("div", {
  border: "1px var(--palette-default) solid",
  borderRadius: "8px",
  padding: "var(--spacing-3)",
});

export const CardHeader = nano.jsx("div", {
  fontSize: "var(--typography-header2)",
  fontWeight: "600",
  marginBottom: "var(--spacing-3)",
});
