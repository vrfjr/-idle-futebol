/* Renders the SVG sources into the PNGs @capacitor/assets expects, then the
   generator produces every Android density + splash from them.
   Run: node assets/make-assets.js && npx capacitor-assets generate --android */
const sharp = require("sharp");
const path = require("path");

const A = __dirname;

async function png(src, out, size, background) {
  if(background) {
    // splash: solid-color canvas with the logo centered at ~40% width
    const logo = await sharp(path.join(A, "icon-foreground.svg")).resize(Math.round(size*0.4)).png().toBuffer();
    await sharp({create:{width:size, height:size, channels:4, background}})
      .composite([{input:logo, gravity:"center"}])
      .png().toFile(path.join(A, out));
    console.log("ok", out);
    return;
  }
  await sharp(path.join(A, src)).resize(size, size).png().toFile(path.join(A, out));
  console.log("ok", out);
}

(async () => {
  await png("icon.svg", "icon-only.png", 1024);
  await png("icon-foreground.svg", "icon-foreground.png", 1024);
  await png("icon-background.svg", "icon-background.png", 1024);
  await png(null, "splash.png", 2732, {r:7, g:13, b:26, alpha:1});
  await png(null, "splash-dark.png", 2732, {r:4, g:6, b:15, alpha:1});
  console.log("ok splash");
})().catch(e => { console.error(e); process.exit(1); });
