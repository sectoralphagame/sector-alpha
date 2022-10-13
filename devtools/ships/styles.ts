import { nano } from "@ui/style";

export const styles = nano.sheet({
  editorContainer: {
    overflowY: "scroll",
    padding: "var(--spacing-1)",
  },
  freightExpanded: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "var(--spacing-3)",
    padding: `${"var(--spacing-3)"} 0`,
  },
  freightExpandedForm: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "var(--spacing-2)",
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
    borderLeft: "1px solid var(--palette-default)",
    padding: "var(--spacing-1)",
    overflowY: "scroll",
    fontFamily: "monospace",
    lineBreak: "anywhere",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--spacing-1)",
    padding: `${"var(--spacing-1)"} 0`,
  },
  toolbar: {
    display: "flex",
    gap: "var(--spacing-1)",
    marginBottom: "var(--spacing-1)",
  },
  hr: {
    marginBottom: "var(--spacing-1)",
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
  buildExpanded: {
    display: "grid",
    gridTemplateColumns: "200px 80px 32px",
    gap: "var(--spacing-1)",
    padding: `${"var(--spacing-3)"} 0`,
  },
});
