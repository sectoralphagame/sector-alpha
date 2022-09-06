import { nano, theme } from "../../style";

export const styles = nano.sheet({
  editorContainer: {
    overflowY: "scroll",
    padding: theme.spacing(1),
  },
  editor: {
    "& input": {
      width: "100%",
    },
    display: "grid",
    gridTemplateColumns: "200px 200px 240px 160px 100px 50px",
    gap: theme.spacing(2),
    marginLeft: 0,
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
});
