import { readdirSync, writeFileSync, readFileSync } from "fs";

const walk = (dir: string) => {
  readdirSync(dir).forEach((f) => {
    const path = `${dir}/${f}`;
    if (f === "node_modules" || f === ".git") return;
    if (f.endsWith(".scss")) {
      const file = readFileSync(path, "utf8");
      console.log("opening", path);
      let m = file.match(/([0-9.]+)px/);
      let newFile = file;
      while (m) {
        const size = Number(m[1]);
        newFile = newFile.replace(m[0], `usesize(${size / 10})`);
        m = newFile.match(/([0-9.]+)px/);
      }
      writeFileSync(path, newFile);
    } else if (!f.includes(".") && f !== "LICENSE") {
      walk(path);
    }
  });
};

walk(".");
