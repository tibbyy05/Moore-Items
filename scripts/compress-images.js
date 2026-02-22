const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const CATEGORIES_DIR = path.join(__dirname, '..', 'public', 'images', 'categories');

async function getFiles(dirPath) {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(dirPath, entry.name))
    .filter((filePath) => /\.(png|jpe?g)$/i.test(filePath));
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

async function compressImage(filePath) {
  const beforeStat = await fs.promises.stat(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const isJpeg = ext === '.jpg' || ext === '.jpeg';
  const outputPath = isJpeg ? filePath : filePath.replace(/\.(png)$/i, '.jpg');
  const tempPath = isJpeg ? `${filePath}.tmp` : outputPath;

  await sharp(filePath)
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(tempPath);

  if (isJpeg) {
    await fs.promises.rename(tempPath, filePath);
  } else if (filePath !== outputPath) {
    await fs.promises.unlink(filePath);
  }

  const afterStat = await fs.promises.stat(outputPath);
  const relative = path.relative(process.cwd(), outputPath);
  console.log(
    `${relative}: ${formatBytes(beforeStat.size)} -> ${formatBytes(afterStat.size)}`
  );
}

async function run() {
  const files = await getFiles(CATEGORIES_DIR);
  if (files.length === 0) {
    console.log('No .jpg or .png files found in public/images/categories.');
    return;
  }

  for (const filePath of files) {
    try {
      await compressImage(filePath);
    } catch (error) {
      console.error(`Failed to compress ${filePath}:`, error);
    }
  }
}

run();
