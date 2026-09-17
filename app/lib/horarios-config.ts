//Horarios

export const horariosConfig = {
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'cambiar123',
  ALLOWED_EXTENSIONS: ['xlsx', 'xls'],
  MAX_CONTENT_LENGTH: 10*1024*1024, // 10 MB
  BLOB_PATH: 'horarios/data.json'
}