import { nano, theme } from "../ui/style";

export const Card = nano.jsx("div", {
  border: `1px ${theme.palette.default} solid`,
  borderRadius: "8px",
  padding: theme.spacing(3),
});

export const CardHeader = nano.jsx("div", {
  fontSize: theme.typography.header2,
  fontWeight: "600",
  marginBottom: theme.spacing(3),
});
