import React, { createElement } from "react";
import { create, CssLikeObject, NanoRenderer } from "nano-css";
import { addon as addonSheet } from "nano-css/addon/sheet";
import { addon as addonRule } from "nano-css/addon/rule";
import { addon as addonNesting } from "nano-css/addon/nesting";
import { addon as addonJsx } from "nano-css/addon/jsx";
import { addon as addonCache } from "nano-css/addon/cache";
import { addon as addonGlobal } from "nano-css/addon/global";
import Color from "color";
import fromPairs from "lodash/fromPairs";
import isObject from "lodash/isObject";

import "./global.module.css";

/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
export const nano = create({
  h: createElement,
}) as NanoRenderer &
  Required<Pick<NanoRenderer, "sheet" | "rule" | "global">> & {
    jsx: <T extends keyof HTMLElementTagNameMap>(
      el: T,
      styles: CssLikeObject
    ) => React.FC<React.HTMLAttributes<T>>;
  };
/* eslint-enable no-unused-vars */
/* eslint-enable no-undef */

addonRule(nano);
addonSheet(nano);
addonNesting(nano);
addonCache(nano);
addonJsx(nano);
addonGlobal(nano);

const spacings = [0.25, 0.5, 0.75, 1, 2, 3, 4, 8] as const;
const texts = [1, 2, 3, 4, 5] as const;

export interface Theme {
  spacing: Record<typeof spacings[number], string>;
  palette: {
    background: string;
    default: string;
    text: Record<typeof texts[number], string>;
    disabled: string;
  };
  typography: {
    button: string;
    label: string;
    default: string;
    header: string;
    header2: string;
  };
}

export function createTheme(scale: number): Theme {
  const baseFontSize = 16 * scale;
  const baseSpacing = 8 * scale;

  return {
    spacing: fromPairs(
      spacings.map((n) => [n, `${n * baseSpacing}px`])
    ) as Record<typeof spacings[number], string>,
    palette: {
      background: "#000000",
      default: "#FFFFFF",
      text: fromPairs(
        texts.map((v) => [v, Color.hsl(0, 0, 100 - (v - 1) * 20).hex()])
      ) as Record<typeof texts[number], string>,
      disabled: Color.hsl(0, 0, 70).hex(),
    },
    typography: {
      button: `${baseFontSize * 0.875}px`,
      label: `${baseFontSize * 0.875}px`,
      default: `${baseFontSize}px`,
      header: `${Math.ceil(baseFontSize * 1.3 ** 2)}px`,
      header2: `${Math.ceil(baseFontSize * 1.3)}px`,
    },
  };
}

function getProperties(
  o: Object,
  prefix = ""
): Array<{ key: string; value: string }> {
  return Object.entries(o).flatMap(([k, v]) => {
    if (isObject(v)) {
      return getProperties(v, `${k}-`);
    }

    return { key: prefix + k, value: v };
  });
}

export const Styles: React.FC = ({ children }) => {
  const [scale] = React.useState(1);
  const theme = React.useMemo(() => createTheme(scale), [scale]);
  const cssVariables = React.useRef(
    document.querySelector("style[data-css-variables]")
  );

  React.useEffect(() => {
    if (!cssVariables.current) {
      const styleTag = document.createElement("style");
      styleTag.setAttribute("data-css-variable", "true");
      document.head.append(styleTag);
      cssVariables.current = styleTag;
    }

    cssVariables.current!.innerHTML = `:root { ${getProperties(theme)
      .map(({ key, value }) => `--${key.replace(/\./g, "-")}: ${value};`)
      .join(" ")} }`;
  }, [theme]);

  return children as any;
};
