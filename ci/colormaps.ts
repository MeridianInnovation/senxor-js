import * as fs from "fs";
import * as path from "path";

interface ColormapSource {
  [name: string]: [number[], number[], number[]];
}

interface ColormapOutput {
  [name: string]: string;
}

const main = () => {
  let ciDir = new URL(import.meta.url).pathname;
  if (ciDir.startsWith("/")) {
    ciDir = ciDir.slice(1);
  }
  ciDir = path.dirname(ciDir);
  const sourceFile = path.join(ciDir, "cmaps.json");
  const outputFile = path.join(ciDir, "../packages/core/src/colormaps.json");

  const sourceData: ColormapSource = JSON.parse(
    fs.readFileSync(sourceFile, "utf-8")
  );

  const output: ColormapOutput = {};

  for (const [name, [rArray, gArray, bArray]] of Object.entries(sourceData)) {
    const flatArray = new Uint8Array(256 * 3);

    for (let i = 0; i < 256; i++) {
      flatArray[i * 3] = rArray[i];
      flatArray[i * 3 + 1] = gArray[i];
      flatArray[i * 3 + 2] = bArray[i];
    }

    const base64 = Buffer.from(flatArray).toString("base64");
    output[name] = base64;
  }

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
  console.log(`✓ Generated ${outputFile}`);
};

main();
