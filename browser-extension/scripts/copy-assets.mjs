import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const extensionDir = path.join(distDir, "extension");

async function copyIfExists(from, to) {
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);
}

async function main() {
  await fs.rm(extensionDir, { recursive: true, force: true });
  await fs.mkdir(extensionDir, { recursive: true });

  await copyIfExists(
    path.join(rootDir, "src/extension/manifest.json"),
    path.join(extensionDir, "manifest.json")
  );
  await copyIfExists(
    path.join(rootDir, "src/extension/popup.html"),
    path.join(extensionDir, "popup.html")
  );
  await copyIfExists(
    path.join(rootDir, "src/extension/popup.css"),
    path.join(extensionDir, "popup.css")
  );

  await fs.cp(path.join(distDir, "src"), path.join(extensionDir, "src"), { recursive: true });
}

await main();
