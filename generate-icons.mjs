import sharp from "sharp";
import { readFileSync } from "fs";

// ใช้โลโก้ Bloom Bloom Paw Grooming
const inputFile = "./public/icon-original.jpg";

async function generateIcons() {
  try {
    // Read the original image
    const image = sharp(inputFile);

    // Generate 192x192 icon
    await image
      .resize(192, 192, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toFile("./public/icon-192.png");

    // Generate 512x512 icon
    await image
      .resize(512, 512, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toFile("./public/icon-512.png");
  } catch (error) {
    console.error("❌ Error generating icons:", error);
  }
}

generateIcons();
