import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, '../学マス　シュミレーション - カード説明.csv');

const cardsToAdd = [
    "エクセレント♪,レジェンド,logic,active,0,,,,ランダムな手札にあるスキルカード（SSR）1枚をコストを消費せず使用,,,,,,",
    "究極スマイル,レジェンド,logic,mental,0,,,,ターン開始時、好印象2.0倍,,,,,,",
    "最強パフォーマー,レジェンド,logic,mental,0,,,,すべてのスキルカードの好印象値増加+3,,,,,,",
];

try {
    const content = fs.readFileSync(csvPath, 'utf8');
    // Simplified check
    const existingNames = content.split('\n').map(l => l.split(',')[0].trim());
    const missingCards = cardsToAdd.filter(line => !existingNames.includes(line.split(',')[0]));

    if (missingCards.length > 0) {
        // Ensure ends with newline
        const suffix = (content.endsWith('\n') ? '' : '\n') + missingCards.join('\n') + '\n';
        fs.appendFileSync(csvPath, suffix, 'utf8');
        console.log(`Appended: ${missingCards.map(l => l.split(',')[0]).join(', ')}`);
    } else {
        console.log('Legend cards already present in CSV.');
    }
} catch (err) {
    console.error('Error in append_legend.js:', err);
}
