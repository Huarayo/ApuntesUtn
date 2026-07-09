import dotenv from 'dotenv';
import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 🔥 ESPECIFICAR LA RUTA CORRECTA
dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function uploadToBlob() {
  try {
    const jsonPath = path.join(__dirname, 'data', 'drive-tree-v3.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const tree = JSON.parse(jsonContent);

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      console.error('❌ Falta BLOB_READ_WRITE_TOKEN en .env.local');
      console.error('📁 Ruta buscada:', path.resolve('.env.local'));
      console.error('🔑 Token en process.env:', process.env.BLOB_READ_WRITE_TOKEN);
      process.exit(1);
    }

    console.log(`☁️ Subiendo ${tree.length} nodos a Vercel Blob...`);

    // ✅ CAMBIO: Subir a drive-tree-v3.json (el COMPLETO)
    const { url } = await put('drive-tree-v3.json', JSON.stringify(tree), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
      token: token,
      allowOverwrite: true,
    });

    console.log(`✅ JSON subido a: ${url}`);
    console.log(`📊 Nodos: ${tree.length}`);
    return url;
  } catch (error) {
    console.error('❌ Error subiendo a Blob:', error);
    process.exit(1);
  }
}

uploadToBlob();