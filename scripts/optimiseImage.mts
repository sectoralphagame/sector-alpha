import sharp from "sharp";
import yargs from "yargs";
import fs from "fs/promises";
import columnify from "columnify";
import progress from "cli-progress";

const argv = yargs(process.argv.slice(2))
  .options({
    files: {
      alias: "f",
      type: "array",
      demandOption: true,
      description: "Files to optimise",
    },
    format: {
      alias: "t",
      type: "string",
      choices: ["webp", "jpeg", "png"],
      description: "Output format",
    },
  })
  .parseSync();

function getOutputFile(file: string, format: string) {
  return `${file.replace(/\.[^/.]+$/, "")}.${format}`;
}

function asyncPoolQueue<T>(jobs: (() => Promise<T>)[], concurrency: number) {
  const results: T[] = [];
  let index = 0;
  let activeCount = 0;

  return new Promise<T[]>((resolve, reject) => {
    function next() {
      if (index >= jobs.length && activeCount === 0) {
        resolve(results);
        return;
      }

      while (activeCount < concurrency && index < jobs.length) {
        activeCount++;
        const job = jobs[index++];
        job()
          .then((result) => {
            results.push(result);
          })
          .catch(reject)
          .finally(() => {
            activeCount--;
            next();
          });
      }
    }

    next();
  });
}

const optimiseImage = async (file: string, format: string) => {
  const outputFile = getOutputFile(file, format);
  await sharp(file)
    .toFormat(
      {
        webp: sharp.format.webp,
        jpeg: sharp.format.jpeg,
        png: sharp.format.png,
      }[format]!,
      {
        lossless: true,
      }
    )
    .toFile(outputFile);
};
const optimiseImages = async (files: string[], format: string) => {
  let done = 0;
  const concurrency = 3;
  const bar = new progress.SingleBar({}, progress.Presets.rect);
  bar.start(files.length, done);
  await asyncPoolQueue(
    files.map((file) => async () => {
      await optimiseImage(file, format);
      done++;
      bar.update(done);
    }),
    concurrency
  );
  bar.stop();

  const report = await Promise.all(
    files.map(async (file) => {
      const original = await fs.stat(file);
      const optimised = await fs.stat(getOutputFile(file, format));

      return {
        file,
        difference: `${(original.size - optimised.size) / 1000} KB`,
        ratio: `-${(100 - (optimised.size / original.size) * 100).toFixed(2)}%`,
      };
    })
  );

  // eslint-disable-next-line no-console
  console.log(columnify(report));
};

const { files, format } = argv;
optimiseImages(
  files.filter((f) => f.toString().match(/\.(png|webp|jpg|jpeg)$/)) as string[],
  format ?? "webp"
).catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Error during optimisation", err);
});
