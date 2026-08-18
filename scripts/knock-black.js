const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function knockBlack(input, output) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r < 28 && g < 28 && b < 28) data[i + 3] = 0;
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(output);
}

async function main() {
  const root = path.join(__dirname, "..", "public", "landing");
  const mentors = ["freud", "rogers", "bandura", "skinner"];
  const balls = ["happy", "relax", "confuse", "confident"];
  for (const name of mentors) {
    const src = path.join(root, "mentors", `${name}.png`);
    const out = path.join(root, "mentors", `${name}-cut.png`);
    await knockBlack(src, out);
    console.log("mentor", name);
  }
  for (const name of balls) {
    const src = path.join(root, "balls", `${name}.png`);
    const out = path.join(root, "balls", `${name}-cut.png`);
    await knockBlack(src, out);
    console.log("ball", name);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
