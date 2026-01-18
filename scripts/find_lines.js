import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const csvPath = path.join(__dirname, '../学マス　シュミレーション - カード説明.csv');

const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((line, idx) => {
    if (line.includes('エクセレント') || line.includes('究極スマイル') || line.includes('最強パフォーマー')) {
        console.log(`Line ${idx + 1}: ${line}`);
    }
});
