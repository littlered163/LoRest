/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const qr = require("qrcode-generator");
const sharp = require("sharp");

const url = "http://lorest.lialab.cn";
const outDir = path.join(process.cwd(), "public", "brand");
const svgPath = path.join(outDir, "lorest-site-qr.svg");
const pngPath = path.join(outDir, "lorest-site-qr.png");

const code = qr(0, "H");
code.addData(url);
code.make();

const moduleCount = code.getModuleCount();
const margin = 4;
const cell = 24;
const size = (moduleCount + margin * 2) * cell;

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-labelledby="title desc">
  <title id="title">LoRest site QR code</title>
  <desc id="desc">QR code for ${url}</desc>
  <rect width="100%" height="100%" fill="#FFFFFF"/>
`;

for (let row = 0; row < moduleCount; row += 1) {
  for (let col = 0; col < moduleCount; col += 1) {
    if (code.isDark(row, col)) {
      svg += `  <rect x="${(col + margin) * cell}" y="${(row + margin) * cell}" width="${cell}" height="${cell}" fill="#1F2922"/>\n`;
    }
  }
}

svg += "</svg>\n";

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(svgPath, svg, "utf8");

sharp(Buffer.from(svg))
  .resize(1024, 1024, { fit: "contain", background: "#FFFFFF" })
  .png()
  .toFile(pngPath)
  .then((info) => {
    console.log({ url, svg: svgPath, png: pngPath, ...info });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
