import express from "express";
import { writeFileSync, createWriteStream, unlinkSync } from "fs";
import bodyParser from "body-parser";
import { createCanvas, loadImage } from "canvas";
import sizeOf from "image-size";

const app = express();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.static("images"));

app.post("/stake", async (req, res) => {
  console.log(req.body);
  const imageData = req.body.imageData;
  const fileExtension = req.body.imageExtension;
  const userId = req.body.userId;
  const now = Date.now();

  writeFileSync(`./temp/${now}.${fileExtension}`, imageData, "base64");

  const dimensions = await sizeOf(`./temp/${now}.${fileExtension}`);
  const canvas = createCanvas(dimensions.width, dimensions.height);
  const ctx = canvas.getContext("2d");

  const image = await loadImage(`./temp/${now}.${fileExtension}`);
  ctx.drawImage(image, 0, 0);

  const watermark = await loadImage("./assets/watermark.png");
  const watermarkHeight = dimensions.height / 6;
  const watermarkWidth = dimensions.width;
  ctx.drawImage(
    watermark,
    0,
    dimensions.height - watermarkHeight,
    watermarkWidth,
    watermarkHeight
  );

  const out = createWriteStream(
    `./images/${now}-stakified-${userId}.${fileExtension}`
  );
  const stream = canvas.createJPEGStream();
  stream.pipe(out);
  res.json({ url: `https://stake.softmodded.com/${now}.${fileExtension}` });

  // delete temp file
  setTimeout(() => {
    unlinkSync(`./temp/${now}.${fileExtension}`);
  });

  setTimeout(() => {
    unlinkSync(`./images/${now}-stakified-${userId}.${fileExtension}`);
  }, 5000);
});

app.listen(3000, () => {
  console.log("staker running on port 3000");
});
