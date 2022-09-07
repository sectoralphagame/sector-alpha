import { nano, theme } from "../../style";

export const styles = nano.sheet({
  editorContainer: {
    overflowY: "scroll",
    padding: theme.spacing(1),
  },
  freightExpanded: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: theme.spacing(3),
    padding: `${theme.spacing(3)} 0`,
  },
  freightExpandedForm: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: theme.spacing(2),
  },
  root: {
    display: "grid",
    gridTemplateColumns: "1fr 120px",
    height: "100vh",
  },
  rootExpanded: {
    gridTemplateColumns: "1fr 350px",
  },
  viewer: {
    "json-viewer": {
      "--background-color": "transparent",
    },
    borderLeft: `1px solid ${theme.palette.default}`,
    padding: theme.spacing(1),
    overflowY: "scroll",
    fontFamily: "monospace",
    lineBreak: "anywhere",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
    padding: `${theme.spacing(1)} 0`,
  },
  toolbar: {
    display: "flex",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  hr: {
    marginBottom: theme.spacing(1),
  },
  rotate: {
    transform: "rotate(180deg)",
  },
  rowExpander: {
    transform: "rotate(-90deg)",
  },
  rowExpanderToggled: {
    transform: "rotate(90deg)",
  },
  textureLabel: {
    display: "flex",
    justifyContent: "space-between",
  },
  texturePreview: {
    height: "16px",
    width: "16px",
  },
});
