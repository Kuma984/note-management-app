require('dotenv').config();
const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');

async function setup() {
  if (process.env.NODE_ENV === 'production') throw new Error('Run reviewed migrations manually in production.');
  const name = process.env.DB_NAME || 'note_app_db';
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', multipleStatements: true,
  });
  try {
    const folder = path.resolve(__dirname, '../../../../database');
    const read = async file => (await fs.readFile(path.join(folder, file), 'utf8')).replaceAll('`note_app_db`', mysql.escapeId(name));
    await connection.query(await read('schema.sql'));
    const [columns] = await connection.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'notes' AND COLUMN_NAME IN ('version','content_version','client_id')", [name]);
    const [tables] = await connection.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'note_mutations'", [name]);
    if (!columns.length && !tables.length) await connection.query(await read('migrations/001_member2_notes.sql'));
    else if (columns.length !== 3 || tables.length !== 1) throw new Error('Migration bị áp dụng dở dang; hãy kiểm tra và phục hồi backup, không chạy chồng.');
    await connection.query("SET time_zone = '+00:00'");
    if (process.argv.includes('--seed')) await connection.query(await read('seed.sql'));
    console.log('Notes schema ready. Seed only runs when --seed is supplied.');
  } finally { await connection.end(); }
}

setup().catch(error => { console.error(error.message); process.exitCode = 1; });
