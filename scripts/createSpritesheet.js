const Spritesmith = require("spritesmith");
const fs = require("fs");
const sharp = require("sharp");
const _ = require("lodash");

const size = 126;

Promise.all(
  fs
    .readdirSync("./assets/icons")
    .filter((fileName) => fileName.match(/\.svg$/))
    .map((fileName) => `./assets/icons/${fileName}`)
    .map((fileName) => {
      const newName = fileName.replace(".svg", ".png");
      sharp(fileName)
        .resize(size, size, {
          fit: "inside",
        })
        .toFile(newName);

      return newName;
    })
).then((files) => {
  Spritesmith.run({ src: files }, (err, result) => {
    if (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      process.exit(1);
    }

    const ws = fs.createWriteStream("./assets/icons/spritesheet.png");
    ws.write(result.image, "binary");

    fs.writeFileSync(
      "./assets/icons/spritesheet.json",
      JSON.stringify({
        frames: Object.entries(result.coordinates)
          .map(([src, { x, y, width, height }]) => [
            src,
            {
              frame: { x, y, w: width, h: height },
              src: src.replace(/(.*)\.png/, "$1.svg"),
            },
          ])
          .reduce(
            (acc, [src, coords]) => ({
              ...acc,
              [_.camelCase(src.replace(/\.\/assets\/icons\/(.+)\.png/, "$1"))]:
                coords,
            }),
            {}
          ),
        meta: {
          image: "assets/icons/spritesheet.png",
          format: "RGBA8888",
          size: { w: result.properties.width, h: result.properties.height },
          scale: "4",
        },
        properties: result.properties,
      })
    );

    const icons = Object.keys(result.coordinates).map((src) =>
      src.replace(/\.\/assets\/icons\/(.+)\.png/, "$1")
    );
    fs.writeFileSync(
      "./assets/icons/index.ts",
      `/* eslint-disable */\n/* prettier-ignore */\n\n${icons
        .map(
          (fileName) =>
            `import ${_.camelCase(
              fileName
            )} from "@assets/icons/${fileName}.svg";`
        )
        .join("\n")}\n\nexport default {${icons.map(_.camelCase).join(",")}};`
    );

    files.forEach((fileName) => fs.rmSync(fileName));
  });
});
