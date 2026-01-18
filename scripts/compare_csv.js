import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupPath = path.join(__dirname, '../学マス　シュミレーション - backup.csv');
const currentPath = path.join(__dirname, '../学マス　シュミレーション - カード説明.csv');
const reportPath = path.join(__dirname, '../comparison_report.md');

// --- Parsing Logic for OLD format (Japanese) ---
// This attempts to be as robust as the converter was.
function parseJapanese(desc) {
    let effects = [];
    let conditions = [];

    // Usage conditions roughly
    if (desc.includes('元気') && desc.includes('以上の場合、使用可')) conditions.push('genki cond');
    if (desc.includes('好印象') && desc.includes('以上の場合、使用可')) conditions.push('impression cond');
    if (desc.includes('やる気') && desc.includes('以上の場合、使用可')) conditions.push('motivation cond');

    // Split logic
    const parts = desc.split(/[,/]/).map(s => s.trim()).filter(s => s);

    parts.forEach(part => {
        let match;
        // Effect detection (Simplified strings for comparison)
        if (part.match(/(パラメータ|パラメーター)\+(\d+)/)) effects.push(`score:${RegExp.$2}`);
        else if (part.match(/元気\+(\d+)/)) { if (!part.includes('減少時')) effects.push(`genki:${RegExp.$1}`); }
        else if (part.match(/好印象\+(\d+)/)) { if (!part.includes('使用時')) effects.push(`impression:${RegExp.$1}`); }
        else if (part.match(/やる気\+(\d+)/)) { if (!part.includes('使用時')) effects.push(`motivation:${RegExp.$1}`); }
        else if (part.match(/元気の(\d+)％分パラメーター上昇/)) effects.push(`score_genki:${parseInt(RegExp.$1) / 100}`);
        else if (part.match(/好印象の(\d+)％分パラメーター上昇/)) effects.push(`score_impression:${parseInt(RegExp.$1) / 100}`);
        else if (part.match(/やる気の(\d+)％分パラメーター上昇/)) effects.push(`score_motivation:${parseInt(RegExp.$1) / 100}`);
        else if (part.match(/すべてのスキルカードの好印象値(増加|上昇)\+(\d+)/)) effects.push(`buff_base_impression:${RegExp.$2}`);
        else if (part.match(/好印象強化\+(\d+)%/)) effects.push(`buff_impression_gain:${RegExp.$1}`);
        else if (part.match(/消費体力減少(\d+)ターン/)) effects.push(`buff_cost_reduction:${RegExp.$1}`);
        else if (part.match(/元気増加無効(\d+)ターン/)) effects.push(`block_genki:${RegExp.$1}`);
        else if (part.match(/スキルカード使用数追加\+(\d+)/)) effects.push(`ap:${RegExp.$1}`);
        else if (part.match(/スキルカードを(\d+)枚引く/)) effects.push(`draw:${RegExp.$1}`);
        else if (part.includes('手札をすべて入れ替える')) effects.push(`swap_hand`);
        else if (part.includes('レッスン開始時手札に入る')) effects.push(`start_hand`);
        else if (part.includes('体力減少時') && part.includes('元気+')) effects.push(`reaction_genki`);
        else if (part.match(/好印象(\d+(\.\d+)?)倍/)) effects.push(`mult_impression:${RegExp.$1}`);
        else if (part.match(/ランダムな手札にあるスキルカード.*(\d+)枚をコストを消費せず使用/)) effects.push(`trigger_hand`);
        else if (part.match(/以降、メンタルスキルカード使用時、好印象\+(\d+)/)) effects.push(`trigger_use:impression:${RegExp.$1}`);
        else if (part.match(/以降、メンタルスキルカード使用時、やる気\+(\d+)/)) effects.push(`trigger_use:motivation:${RegExp.$1}`);
        else if (part.match(/ターン追加\+(\d+)/)) effects.push(`add_turn:${RegExp.$1}`);
        else if (part.match(/消費体力増加(\d+)ターン/)) effects.push(`debuff_cost_up:${RegExp.$1}`);
        else if (part.includes('手札をすべてレッスン中強化')) effects.push(`upgrade_hand`);

        // Complex Logic check (just flags)
        if (part.includes('ターン開始後') || part.includes('ターン開始時')) {
            effects.push('HAS_TURN_START_LOGIC');
        }
        if (part.includes('場合') && !part.includes('使用可')) {
            effects.push('HAS_CONDITIONAL_LOGIC');
        }
    });

    // Sort for comparison
    return effects.sort().join('|');
}

// --- Parsing Logic for NEW format (Structured) ---
function parseStructured(cols) {
    // Cols: 7, 8, 9, 10 are effects
    const effs = [cols[7], cols[8], cols[9], cols[10]].filter(s => s && s.trim());
    let normalized = [];

    effs.forEach(e => {
        // e is like "genki:3" or "turn_start:gate=[...]:effect=..."
        // Normalize to look like the Japanese parser output
        let simple = '';
        if (e.startsWith('score:')) simple = e.replace('score:', 'score:');
        else if (e.startsWith('genki:')) simple = e.replace('genki:', 'genki:');
        else if (e.startsWith('impression:')) simple = e.replace('impression:', 'impression:');
        else if (e.startsWith('motivation:')) simple = e.replace('motivation:', 'motivation:');
        else if (e.startsWith('score_genki:')) simple = e.replace('score_genki:', 'score_genki:');
        else if (e.startsWith('score_impression:')) simple = e.replace('score_scale_impression:', 'score_impression:').replace('score_impression:', 'score_impression:');
        else if (e.startsWith('score_motivation:')) simple = e.replace('score_scale_motivation:', 'score_motivation:').replace('score_motivation:', 'score_motivation:');
        else if (e.startsWith('buff_base_impression:')) simple = `buff_base_impression:${e.split(':')[1]}`;
        else if (e.startsWith('buff_impression_gain:')) simple = `buff_impression_gain:${e.split(':')[1]}`;
        else if (e.startsWith('buff_cost_reduction:')) simple = `buff_cost_reduction:${e.match(/duration=(\d+)/)[1]}`;
        else if (e.startsWith('block_genki:')) simple = `block_genki:${e.match(/duration=(\d+)/)[1]}`;
        else if (e.startsWith('ap:')) simple = `ap:${e.split(':')[1]}`;
        else if (e.startsWith('draw:')) simple = `draw:${e.split(':')[1]}`;
        else if (e === 'swap_hand') simple = 'swap_hand';
        else if (e === 'flag:start_hand') simple = 'start_hand';
        else if (e.startsWith('reaction_genki:')) simple = 'reaction_genki';
        else if (e.startsWith('mult_impression:')) simple = `mult_impression:${e.split(':')[1]}`;
        else if (e.startsWith('trigger_hand:')) simple = 'trigger_hand';
        else if (e.startsWith('trigger_use:')) {
            if (e.includes('impression')) simple = `trigger_use:impression:${e.match(/impression:(\d+)/)[1]}`;
            if (e.includes('motivation')) simple = `trigger_use:motivation:${e.match(/motivation:(\d+)/)[1]}`;
        }
        else if (e.startsWith('add_turn:')) simple = `add_turn:${e.split(':')[1]}`;
        else if (e.startsWith('debuff_cost_up:')) simple = `debuff_cost_up:${e.match(/duration=(\d+)/)[1]}`;
        else if (e === 'upgrade_hand') simple = 'upgrade_hand';

        // Check for complex logic
        if (e.startsWith('turn_start:')) {
            simple = 'HAS_TURN_START_LOGIC';
            // Extract sub effect?
            const sub = e.match(/effect=(.*)/)[1];
            // Add sub effect to comparison too?
            // For now just flag existence.
            // Actually, "Daydreaming" had "turn_start:effect=score_genki:0.6" -> "score_genki:0.6"
            // But the Japanese parser flagged 'HAS_TURN_START_LOGIC'.
        }
        if (e.startsWith('gate:') || e.includes('gate=')) {
            simple = 'HAS_CONDITIONAL_LOGIC';
        }

        if (simple) normalized.push(simple);

        // Handling internal logic strings generally.
        // If it didn't match specific cases above, check prefixes again or raw
        if (!simple && e.includes(':')) {
            // Fallback
            // normalized.push(e);
        }
    });

    return normalized.sort().join('|');
}

try {
    const backupContent = fs.readFileSync(backupPath, 'utf8');
    const currentContent = fs.readFileSync(currentPath, 'utf8');

    const backupLines = backupContent.split(/\r?\n/).filter(l => l.trim());
    const currentLines = currentContent.split(/\r?\n/).filter(l => l.trim());

    // Map by Name
    const backupMap = new Map();
    backupLines.forEach((line, idx) => {
        if (idx === 0) return; // headers might differ
        const cols = line.split(',');
        const name = cols[0];
        // In backup, desc starts at col 5 usually
        // But backup might have been my FIRST backup, which was unstructured?
        // Wait, "backup.csv" was created from "学マス　シュミレーション - カード説明.csv" BEFORE strict conversion.
        // So yes, it has unstructured desc at col 5+.
        const desc = cols.slice(5, cols.length - 2).join(',');
        backupMap.set(name, { line, desc });
    });

    const currentMap = new Map();
    currentLines.forEach((line, idx) => {
        if (idx === 0) return;
        const cols = line.split(',');
        const name = cols[0];
        currentMap.set(name, { line, cols });
    });

    let output = '# CSV Conversion Comparison Report\n\n';

    let okCount = 0;
    let failCount = 0;

    for (const [name, bData] of backupMap) {
        if (!currentMap.has(name)) {
            output += `## [MISSING] ${name}\nCard exists in backup but not in new file.\n\n`;
            failCount++;
            continue;
        }

        const cData = currentMap.get(name);

        const oldLogic = parseJapanese(bData.desc);
        const newLogic = parseStructured(cData.cols);

        // Compare
        if (oldLogic === newLogic) {
            okCount++;
            // output += `- [OK] ${name}\n`;
        } else {
            failCount++;
            output += `## [MISMATCH] ${name}\n`;
            output += `- **Original Text**: ${bData.desc}\n`;
            output += `- **Detected Old Logic**: \`${oldLogic}\`\n`;
            output += `- **New Structured**: \`${cData.cols.slice(7, 11).filter(s => s).join(', ')}\`\n`;
            output += `- **Detected New Logic**: \`${newLogic}\`\n\n`;
        }
    }

    output = `**Total Cards**: ${backupMap.size}\n**Matches**: ${okCount}\n**Mismatches/Potential Issues**: ${failCount}\n\n` + output;

    fs.writeFileSync(reportPath, output, 'utf8');
    console.log('Comparison report generated.');

} catch (err) {
    console.error(err);
}
