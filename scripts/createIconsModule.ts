import fs from "fs";
import camelCase from "lodash/camelCase";
import startCase from "lodash/startCase";

const icons = fs
  .readdirSync("./assets/ui/icons")
  .filter((fileName) => fileName.match(/\.svg$/));

const content = `/* @generated */
/* prettier-ignore */
/* eslint-disable */

import React from 'react'
import SVG, { Props } from 'react-inlinesvg'

${icons
  .map(
    (icon) =>
      `import ${icon.replace(".svg", "")} from '@assets/ui/icons/${icon}'`
  )
  .join("\n")}

${icons
  .map((icon) => {
    let name = startCase(camelCase(icon.replace(".svg", ""))).replace(/ /g, "");
    if (name.length === 2) {
      name = name.toUpperCase();
    }

    return `export const ${name}Icon:React.FC<Omit<Props, "src">> = (props) => <SVG {...props} src={${icon.replace(
      ".svg",
      ""
    )}} />`;
  })
  .join("\n")}
`;

fs.writeFileSync("./assets/ui/icons/index.tsx", content);
