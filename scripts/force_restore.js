import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupPath = path.join(__dirname, '../学マス　シュミレーション - backup.csv');
const currentPath = path.join(__dirname, '../学マス　シュミレーション - カード説明.csv');

try {
    fs.copyFileSync(backupPath, currentPath);
    console.log('Restored CSV from backup successfully.');

    // Verify content head
    const header = fs.readFileSync(currentPath, 'utf8').split('\n')[0];
    console.log('Header:', header);
} catch (err) {
    console.error('Failed to restore:', err);
    process.exit(1);
}
