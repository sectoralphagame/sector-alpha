import React, { createElement } from "react";
import { create, CssLikeObject, NanoRenderer } from "nano-css";
import { addon as addonSheet } from "nano-css/addon/sheet";
import { addon as addonRule } from "nano-css/addon/rule";
import { addon as addonNesting } from "nano-css/addon/nesting";
import { addon as addonJsx } from "nano-css/addon/jsx";
import { addon as addonCache } from "nano-css/addon/cache";

/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
export const nano = create({
  h: createElement,
}) as NanoRenderer &
  Required<Pick<NanoRenderer, "sheet">> & {
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
