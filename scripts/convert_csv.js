import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, '../学マス　シュミレーション - カード説明.csv');
const backupPath = path.join(__dirname, '../学マス　シュミレーション - backup.csv');
// Reuse logic from update_cards.js (manually copied/adapted for conversion context)

function parseCost(costStr, effectStr) {
    let cost = 0, costType = 'normal';
    let val = 0;
    if (costStr) {
        const num = parseInt(costStr, 10);
        if (!isNaN(num)) val = num;
    }
    if (effectStr.includes('体力消費')) {
        costType = 'hp';
        if (val === 0) {
            const match = effectStr.match(/体力消費(\d+)/);
            if (match) val = parseInt(match[1], 10);
        }
    } else if (effectStr.includes('やる気消費')) {
        costType = 'motivation';
        if (val === 0) {
            const match = effectStr.match(/やる気消費(\d+)/);
            if (match) val = parseInt(match[1], 10);
        }
    } else if (effectStr.includes('好印象消費')) {
        costType = 'impression';
        if (val === 0) {
            const match = effectStr.match(/好印象消費(\d+)/);
            if (match) val = parseInt(match[1], 10);
        }
    } else {
        costType = 'genki'; // Default
    }
    return { costType, costValue: val };
}

function parseEffects(effectStr) {
    let effects = [];
    let conditionGates = [];
    let pendingDuration = 0;
    const parts = effectStr.split(/[,/、]/).map(s => s.trim()).filter(s => s);

    parts.forEach(part => {
        let match;
        let currentEffect = null;
        let isTurnStart = false;

        if (part.includes('ターン開始後') || part.includes('ターン開始時')) {
            isTurnStart = true;
        }

        // Duration detection context
        if (match = part.match(/以降(\d+)ターンの間/)) {
            pendingDuration = parseInt(match[1]);
            return;
        }

        if (match = part.match(/手札にあるスキルカード（(SSR|SR|R|N)）が(\d+)枚以上の場合/)) {
            conditionGates.push(`hand_rarity:${match[1]}>=${match[2]}`);
            return;
        } else if (match = part.match(/(元気|好印象|やる気|体力)が(\d+)以上の場合/)) {
            const typeMap = { '元気': 'genki', '好印象': 'impression', 'やる気': 'motivation', '体力': 'hp' };
            conditionGates.push(`${typeMap[match[1]]}>=${match[2]}`);
            return;
        } else if (match = part.match(/(体力)が(\d+)％以上の場合/)) {
            conditionGates.push(`hp_percent>=${match[2]}`);
            return;
        } else if (match = part.match(/除外以外にある[TＴ]トラブルカードが(\d+)枚以上の場合/)) {
            conditionGates.push(`trouble_count>=${match[1]}`);
            return;
        } else if (match = part.match(/やる気が(\d+)以上の場合、使用可/)) {
            return;
        }

        // Effect Parsing
        if (match = part.match(/(パラメータ|パラメーター)\+(\d+)$/)) {
            currentEffect = `score:${match[2]}`;
        } else if (match = part.match(/元気\+(\d+)$/)) {
            currentEffect = `genki:${match[1]}`;
        } else if (match = part.match(/好印象\+(\d+)$/)) {
            currentEffect = `impression:${match[1]}`;
        } else if (match = part.match(/やる気\+(\d+)/)) {
            currentEffect = `motivation:${match[1]}`;
        } else if (match = part.match(/元気の(\d+)[%％]分(パラメータ|パラメーター)上昇/)) {
            currentEffect = `score_genki:${parseInt(match[1]) / 100}`;
        } else if (match = part.match(/好印象の(\d+)[%％]分(パラメータ|パラメーター)上昇/)) {
            currentEffect = `score_impression:${parseInt(match[1]) / 100}`;
        } else if (match = part.match(/やる気の(\d+)[%％]分(パラメータ|パラメーター)上昇/)) {
            currentEffect = `score_motivation:${parseInt(match[1]) / 100}`;
        } else if (match = part.match(/(すべてのスキルカード|全てのスキルカード)の好印象(値|值)(増加|增加|上昇)\+(\d+)/)) {
            currentEffect = `buff_base_impression:${match[4]}`;
        } else if (match = part.match(/好印象強化\+(\d+)[%％]/)) {
            currentEffect = `buff_impression_gain:${match[1]}`;
        } else if (part.includes('好印象増加量増加')) {
            const mVal = part.match(/([0-9０-９]+)[%％]/);
            const mDur = part.match(/([0-9０-９]+)ターン/);
            const toHalf = (s) => s.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
            if (mVal && mDur) {
                const val = parseInt(toHalf(mVal[1]));
                const dur = parseInt(toHalf(mDur[1]));
                currentEffect = `buff_impression_gain:${val}:duration=${dur}`;
            }
        } else if (match = part.match(/^消費体力減少(\d+)ターン/)) {
            currentEffect = `buff_cost_reduction:duration=${match[1]}`;
        } else if (match = part.match(/^元気増加無効(\d+)ターン/)) {
            currentEffect = `block_genki:duration=${match[1]}`;
        } else if (match = part.match(/パラメーター上昇量増加(\d+)％/)) {
            currentEffect = `buff_score_bonus:${match[1]}`;
        } else if (match = part.match(/^スキルカード使用数追加\+(\d+)/)) {
            currentEffect = `ap:${match[1]}`;
        } else if (match = part.match(/スキルカードを(\d+)枚引く/)) {
            currentEffect = `draw:${match[1]}`;
        } else if (part.includes('手札をすべて入れ替える')) {
            currentEffect = `swap_hand`;
        } else if (part.includes('レッスン開始時手札に入る')) {
            currentEffect = `flag:start_hand`;
        } else if (part.includes('体力減少時') && part.includes('元気+')) {
            const vMatch = part.match(/元気\+(\d+)/);
            currentEffect = `reaction_genki:${vMatch ? vMatch[1] : 4}`;
        } else if (match = part.match(/好印象(\d+(\.\d+)?)倍/)) {
            currentEffect = `mult_impression:${match[1]}`;
        } else if (match = part.match(/ランダムな手札にあるスキルカード（(SSR|SR|R)）(\d+)枚をコストを消費せず使用/)) {
            currentEffect = `trigger_hand:rarity=${match[1]}&count=${match[2]}`;
        } else if (match = part.match(/以降、メンタルスキルカード使用時、好印象\+(\d+)/)) {
            currentEffect = `trigger_use:type=mental&effect=impression:${match[1]}`;
        } else if (match = part.match(/以降、メンタルスキルカード使用時、やる気\+(\d+)/)) {
            currentEffect = `trigger_use:type=mental&effect=motivation:${match[1]}`;
        } else if (match = part.match(/^ターン追加\+(\d+)/)) {
            currentEffect = `add_turn:${match[1]}`;
        } else if (match = part.match(/^消費体力増加(\d+)ターン/)) {
            currentEffect = `debuff_cost_up:duration=${match[1]}&value=1`;
        } else if (part.includes('手札をすべてレッスン中強化')) {
            currentEffect = `upgrade_hand`;
        }

        // Handle "double motivation" flag
        if (currentEffect && part.includes('やる気効果を2倍適用')) {
            currentEffect += `:double_mot=true`;
        }

        if (currentEffect) {
            // Apply pending duration if applicable and not already explicitly set
            if (pendingDuration > 0 && !currentEffect.includes('duration=')) {
                currentEffect += `:duration=${pendingDuration}`;
                // We consume pendingDuration? Or does it apply to multiple?
                // Usually "For 3 turns, X and Y" -> applies to both.
                // But often it's "For 3 turns, Start of turn Z".
                // Let's NOT reset it immediately if we think it might apply to a block, 
                // but CSV structure implies sequential parts. 
                // For safety, let's keep it until explicitly reset or end of parts? 
                // Actually, "In the next 3 turns" usually applies to the immediate following complex effect.
                // Let's consume it to avoid leaking to unrelated effects.
                pendingDuration = 0;
            }

            // Handle Condition Gates from previous parts or Turn Start
            if (isTurnStart) {
                // Wrap in turn_start
                if (conditionGates.length > 0) {
                    currentEffect = `turn_start:gate=[${conditionGates.join('&')}]&effect=${currentEffect}`;
                } else {
                    currentEffect = `turn_start:effect=${currentEffect}`;
                }
                conditionGates = [];
            } else if (conditionGates.length > 0) {
                currentEffect = `gate:[${conditionGates.join('&')}]:${currentEffect}`;
                conditionGates = [];
            }
            effects.push(currentEffect);
        }
    });
    return effects;
}

function parseUsageConditions(desc) {
    const parts = desc.split(/[,/]/);
    let conditions = [];
    parts.forEach(part => {
        let match;
        if (match = part.match(/(元気|好印象|やる気|体力)が(\d+)以上の場合、使用可/)) {
            const typeMap = { '元気': 'genki', '好印象': 'impression', 'やる気': 'motivation', '体力': 'hp' };
            conditions.push(`${typeMap[match[1]]}>=${match[2]}`);
        }
    });
    return conditions.join(' & ');
}

try {
    const content = fs.readFileSync(backupPath, 'utf8');
    const lines = content.split(/\r?\n/).filter(l => l.trim());

    // Define New Header
    // Name, Rarity, Plan, Type, CostType, CostValue, Condition, Effect1, Effect2, Effect3, Effect4, Limit, Unique
    const newHeader = "Name,Rarity,Plan,Type,CostType,CostValue,Condition,Effect1,Effect2,Effect3,Effect4,Limit,Unique";
    let newCsvLines = [newHeader];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const cols = line.split(',');
        const name = cols[0];
        if (!name) continue;

        const rarity = cols[1];
        const plan = cols[2];
        const type = cols[3];
        const originalCost = cols[4];

        // Col 5+ includes description
        // Original has: Name, Rarity, Plan, Type, Cost, Desc1, Desc2, Desc3, Desc4, Desc5, Limit(10), Unique(11) -- approx
        // We need to robustly extract "Limit" and "Unique" which are usually at the end.
        // Actually the user format is:
        // Col 10: レッスン中1回
        // Col 11: 重複不可
        const limitStr = cols[cols.length - 2] || '';
        const uniqueStr = cols[cols.length - 1] || '';

        const descCols = cols.slice(5, cols.length - 2);
        const descText = descCols.join(',');

        const { costType, costValue } = parseCost(originalCost, descText);
        const effects = parseEffects(descText);
        const condition = parseUsageConditions(descText);

        const limit = (limitStr.includes('レッスン中1回') || descText.includes('レッスン中1回')) ? 'once' : '';
        const unique = (uniqueStr.includes('重複不可') || descText.includes('重複不可')) ? 'unique' : '';

        // Pad effects to 4 columns
        const e1 = effects[0] || '';
        const e2 = effects[1] || '';
        const e3 = effects[2] || '';
        const e4 = effects[3] || '';


        const newRow = [
            name, rarity, plan, type,
            costType, costValue,
            condition,
            e1, e2, e3, e4,
            limit, unique
        ].join(',');

        newCsvLines.push(newRow);
    }

    fs.writeFileSync(csvPath, newCsvLines.join('\n'), 'utf8');
    console.log("CSV structure converted successfully.");

} catch (err) {
    console.error(err);
    process.exit(1);
}
