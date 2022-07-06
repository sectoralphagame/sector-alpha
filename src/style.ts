import React, { createElement } from "react";
import { create, CssLikeObject, NanoRenderer } from "nano-css";
import { addon as addonSheet } from "nano-css/addon/sheet";
import { addon as addonRule } from "nano-css/addon/rule";
import { addon as addonNesting } from "nano-css/addon/nesting";
import { addon as addonJsx } from "nano-css/addon/jsx";
import { addon as addonCache } from "nano-css/addon/cache";
import Color from "color";
import type { MineableCommodity } from "./economy/commodity";

/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
export const nano = create({
  h: createElement,
}) as NanoRenderer &
  Required<Pick<NanoRenderer, "sheet" | "rule">> & {
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

export const theme = {
  spacing: (n: number) => `${n * 8}px`,
  palette: {
    asteroids: {
      fuelium: "#ffab6b",
      goldOre: "#ffe46b",
      ice: "#e8ffff",
      ore: "#ff5c7a",
      silica: "#8f8f8f",
    } as Record<MineableCommodity, string>,
    default: "#FFFFFF",
    text: (v: 1 | 2 | 3 | 4 | 5) => Color.hsl(0, 0, 100 - (v - 1) * 20).hex(),
  },
};
