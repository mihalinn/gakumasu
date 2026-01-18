import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const csvPath = path.join(__dirname, '../学マス　シュミレーション - カード説明.csv');

try {
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split(/\r?\n/);
    console.log('Total lines:', lines.length);
    const names = lines.map(l => l.split(',')[0].trim()).filter(Boolean);
    console.log('Sample names:', names.slice(0, 5));
    console.log('Includes エクセレント♪:', names.includes('エクセレント♪'));
    console.log('Includes 究極スマイル:', names.includes('究極スマイル'));
    console.log('Includes 最強パフォーマー:', names.includes('最強パフォーマー'));
} catch (err) {
    console.error(err);
}
