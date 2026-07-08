// scripts/upload-to-blob.js
import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function uploadToBlob() {
  try {
    // 1. Leer el JSON generado
    const jsonPath = path.join(__dirname, 'data', 'drive-tree.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const tree = JSON.parse(jsonContent);

    // 2. Subir a Vercel Blob
    const { url } = await put('drive-tree.json', JSON.stringify(tree), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
    });

    console.log(`✅ JSON subido a Vercel Blob: ${url}`);
    return url;
  } catch (error) {
    console.error('❌ Error subiendo a Blob:', error);
    process.exit(1);
  }
}

uploadToBlob();