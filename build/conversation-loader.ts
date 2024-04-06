/* eslint-disable no-invalid-this */

import { load } from "js-yaml";
import type webpack from "webpack";
import fs from "fs";
import path from "path";
import AJV from "ajv";
import schema from "../core/world/data/missions/schema.json";

const validator = new AJV();

// eslint-disable-next-line func-names
const loader: webpack.LoaderDefinition = function (this, content) {
  const parsed = load(content, {
    json: true,
  });
  if (!validator.validate(schema, parsed)) {
    throw new Error(validator.errorsText());
  }

  const filename = `${this.resourcePath.split(".yml")[0]}.d.ts`;

  let fileContent = "";
  try {
    fileContent = fs.readFileSync(filename).toString();
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
  }

  const generatedContent = `/* @generated */
/* prettier-ignore */
/* eslint-disable */
declare module "*/${path.relative(
    path.join(process.cwd(), "core/world/data"),
    this.resourcePath
  )}" {
  import type { MissionConversation } from "@core/systems/mission/types";

  const content: MissionConversation;
  export default content;
}
`;

  if (fileContent !== generatedContent) {
    fs.writeFileSync(filename, generatedContent);
  }

  return `export default ${JSON.stringify(parsed)}`;
};

export default loader;
