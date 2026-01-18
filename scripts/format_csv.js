import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, '../学マス　シュミレーション - カード説明.csv');

try {
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split(/\r?\n/);
    const newLines = [];

    // Header
    newLines.push(lines[0]);

    for (let i = 1; i < lines.length; i++) {
        let line = lines[i];
        if (!line.trim()) {
            newLines.push(line);
            continue;
        }

        // Simple split strictly implies checking structure.
        // Be careful with cards that might have commas in name? Unlikely based on file so far.
        // But description CERTAINLY has commas.
        // The structure is fixed first 5 columns.
        // col 0: Name
        // col 1: Rarity
        // col 2: Plan
        // col 3: Type
        // col 4: Cost
        const parts = line.split(',');

        // Safety check: ensure we have at least 5 cols
        if (parts.length < 5) {
            newLines.push(line);
            continue;
        }

        const currentCost = parts[4].trim();
        const descAll = parts.slice(5).join(',');

        let newCost = currentCost;

        // If cost is empty, try to find it in description
        if (currentCost === '') {
            let match = descAll.match(/体力消費(\d+)/);
            if (!match) match = descAll.match(/やる気消費(\d+)/);
            if (!match) match = descAll.match(/好印象消費(\d+)/);

            if (match) {
                newCost = match[1];
                console.log(`Updated cost for ${parts[0]}: ${newCost} (from ${match[0]})`);
            }
        }

        // Reconstruct line
        // We only modify parts[4]
        parts[4] = newCost;

        // We do strictly parts join, but wait. 
        // If line had trailing empty commas, split might strip them? 
        // 'a,b,c,,'.split(',') -> ['a','b','c','',''] (length 5). 
        // It preserves empty tokens.
        // So joining by ',' should be safe for this specific CSV format which seems manually managed.
        newLines.push(parts.join(','));
    }

    fs.writeFileSync(csvPath, newLines.join('\n'), 'utf8');
    console.log('CSV formatting complete.');

} catch (err) {
    console.error(err);
}
