import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, '../学マス　シュミレーション - カード説明.csv');
const logicJsonPath = path.join(__dirname, '../src/data/cards/free.json');

try {
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const backupPath = path.join(__dirname, '../学マス　シュミレーション - backup.csv');
    const backupContent = fs.readFileSync(backupPath, 'utf8');
    const descMap = new Map();
    backupContent.split('\n').forEach(line => {
        const cols = line.split(',');
        // Description was potentially spread across cols 5, 6, 7, 8...
        // Join them back with commas if they exist
        if (cols[0]) {
            const desc = [cols[5], cols[6], cols[7], cols[8]].filter(s => s && s.trim()).join('\n');
            descMap.set(cols[0], desc);
        }
    });

    const lines = csvContent.split(/\r?\n/);
    const logicCards = [];

    // Columns:
    // 0: Name, 1: Rarity, 2: Plan, 3: Type, 4: CostType, 5: CostValue, 6: Condition
    // 7: Effect1, 8: Effect2, 9: Effect3, 10: Effect4, 11: Limit, 12: Unique

    function parseEffectString(str) {
        if (!str) return null;

        // Format: type:key=val,key2=val2 OR type:val (if single value)
        const parts = str.split(':');
        const type = parts[0];
        const valStr = parts.slice(1).join(':'); // Re-join rest

        let effect = {};

        // Map simplified keys to internal JSON types
        switch (type) {
            case 'score': effect.type = 'score_fixed'; effect.value = parseInt(valStr); break;
            case 'genki': effect.type = 'buff_genki'; effect.value = parseInt(valStr); break;
            case 'impression': effect.type = 'buff_impression'; effect.value = parseInt(valStr); break;
            case 'motivation': effect.type = 'buff_motivation'; effect.value = parseInt(valStr); break;
            case 'score_genki': effect.type = 'score_scale_genki'; effect.ratio = parseFloat(valStr); break;
            case 'score_impression': effect.type = 'score_scale_impression'; effect.ratio = parseFloat(valStr); break;
            case 'score_motivation': effect.type = 'score_scale_motivation'; effect.ratio = parseFloat(valStr); break;
            case 'buff_base_impression': effect.type = 'buff_card_base_value'; effect.param = 'impression'; effect.value = parseInt(valStr); effect.duration = -1; break;
            case 'buff_impression_gain':
                effect.type = 'buff_impression_gain';
                effect.value = parseInt(valStr);
                const bigDur = valStr.match(/duration=(\d+)/);
                effect.duration = bigDur ? parseInt(bigDur[1]) : 1;
                break;
            case 'buff_score_bonus':
                effect.type = 'buff_score_bonus';
                effect.value = parseInt(valStr);
                const bsbDur = valStr.match(/duration=(\d+)/);
                effect.duration = bsbDur ? parseInt(bsbDur[1]) : -1;
                break;
            case 'buff_cost_reduction':
                effect.type = 'buff_cost_reduction';
                // parse duration=X
                const dMatch = valStr.match(/duration=(\d+)/);
                if (dMatch) effect.duration = parseInt(dMatch[1]);
                break;
            case 'block_genki':
                effect.type = 'buff_no_genki_gain';
                const bMatch = valStr.match(/duration=(\d+)/);
                if (bMatch) effect.duration = parseInt(bMatch[1]);
                break;
            case 'ap': effect.type = 'add_card_play_count'; effect.value = parseInt(valStr); break;
            case 'draw': effect.type = 'draw_card'; effect.value = parseInt(valStr); break;
            case 'swap_hand': effect.type = 'swap_hand'; break;
            case 'flag': return null; // handled elsewhere
            case 'reaction_genki':
                effect.type = 'buff_reaction_on_cost';
                effect.triggeredEffect = { type: 'buff_genki', value: parseInt(valStr) };
                break;
            case 'mult_impression':
                effect.type = 'multiply_impression';
                effect.value = parseFloat(valStr);
                const miDur = valStr.match(/duration=(\d+)/);
                if (miDur) effect.duration = parseInt(miDur[1]);
                break;
            case 'trigger_hand':
                effect.type = 'trigger_random_hand_card';
                // rar=R,count=2
                const rMatch = valStr.match(/rarity=([A-Z]+)/);
                const cMatch = valStr.match(/count=(\d+)/);
                if (rMatch) effect.targetRarity = rMatch[1];
                if (cMatch) effect.count = parseInt(cMatch[1]);
                effect.ignoreCost = true;
                break;
            case 'trigger_use':
                effect.type = 'buff_on_card_use';
                effect.duration = -1;
                // type=mental,effect=impression:1
                const tMatch = valStr.match(/type=([a-z]+)/);
                const eMatch = valStr.match(/effect=([a-z]+):(\d+)/);
                if (tMatch) effect.triggerCondition = { type: 'card_type_usage', cardType: tMatch[1] };
                if (eMatch) {
                    const eTypeMap = { 'impression': 'buff_impression', 'motivation': 'buff_motivation' };
                    effect.triggeredEffect = { type: eTypeMap[eMatch[1]], value: parseInt(eMatch[2]) };
                }
                break;
            case 'add_turn': effect.type = 'add_turn'; effect.value = parseInt(valStr); break;
            case 'debuff_cost_up':
                effect.type = 'debuff_cost_increase';
                const durMatch = valStr.match(/duration=(\d+)/);
                const valMatch = valStr.match(/value=(\d+)/);
                if (durMatch) effect.duration = parseInt(durMatch[1]);
                effect.value = valMatch ? parseInt(valMatch[1]) : 1;
                break;
            case 'upgrade_hand': effect.type = 'upgrade_hand'; break;
            case 'turn_start':
                effect.type = 'buff_turn_start';
                effect.duration = -1;
                // gate=[cond],effect=subStr changed to gate=[cond]&effect=subStr
                // Check if gate=[cond] exists
                if (valStr.includes('gate=[')) {
                    const gateContent = valStr.match(/gate=\[(.*?)\]/)[1];
                    const subEffMatch = valStr.match(/effect=(.*)/);
                    const subEffStr = subEffMatch ? subEffMatch[1] : '';
                    const conditions = parseConditionString(gateContent);
                    const subEff = parseEffectString(subEffStr);
                    effect.triggeredEffect = { type: 'condition_gate', condition: conditions, subEffects: [subEff] };
                } else {
                    const subEffMatch = valStr.match(/effect=(.*)/);
                    if (subEffMatch) {
                        effect.triggeredEffect = parseEffectString(subEffMatch[1]);
                    }
                }
                break;
            case 'gate':
                effect.type = 'condition_gate';
                const gContentMatch = valStr.match(/\[(.*?)\]/);
                const gContent = gContentMatch ? gContentMatch[1] : '';
                // ]:effect=... or ]:subStr...
                // The separator is : after ].
                const sEffStr = valStr.substring(valStr.indexOf(']:') + 2);
                effect.condition = parseConditionString(gContent);
                effect.subEffects = [parseEffectString(sEffStr)];
                break;
            default:
                console.warn(`Unknown effect type: ${type}`);
                return null;
        }

        if (valStr.includes('double_mot=true')) {
            if (effect.triggeredEffect) effect.triggeredEffect.doubleMotivation = true;
            else effect.doubleMotivation = true;
        }

        return effect;
    }

    function parseConditionString(str) {
        if (!str || str === 'none') return [];
        const conds = [];
        const parts = str.split('&');
        const typeMap = { 'genki': 'genki', 'impression': 'impression', 'motivation': 'motivation', 'hp': 'hp', 'turn': 'turn', 'hp_percent': 'hp_percent', 'trouble_count': 'trouble_card_count' };

        parts.forEach(p => {
            const match = p.match(/([a-z_]+)([><=]+)(\d+)(l?)/); // l for literal suffix? No.
            // hand_rarity:SSR>=1 is special
            if (p.startsWith('hand_rarity')) {
                const m = p.match(/hand_rarity:([A-Z]+)([><=]+)(\d+)/);
                if (m) conds.push({ type: 'hand_rarity_count', targetRarity: m[1], compare: m[2], value: parseInt(m[3]) });
            } else if (match) {
                const key = match[1];
                const op = match[2];
                const val = parseInt(match[3]);
                if (typeMap[key]) conds.push({ type: typeMap[key], compare: op, value: val });
            }
        });
        return conds;
    }

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        const cols = line.split(','); // safe since we reformatted
        if (cols.length < 13) continue;

        const name = cols[0];
        const rarity = cols[1] === 'レジェンド' ? 'Legend' : cols[1];
        const plan = cols[2];
        const type = cols[3];
        const costType = cols[4];
        const costValue = parseInt(cols[5]) || 0;
        const condStr = cols[6];
        const effstrs = [cols[7], cols[8], cols[9], cols[10]];
        const limitStr = cols[11];
        const uniqueStr = cols[12];

        if (plan.toLowerCase() !== 'flee') continue;

        const effects = effstrs.map(s => parseEffectString(s)).filter(e => e);
        // Cost metadata handling
        // If costType is hp/motivation/impression, DO NOT add consumption effect if engine handles it.
        // BUT engine currently only handles HP/Genki auto-pay if configured?
        // My engine update ADDED specific checks for Mot/Imp. It does NOT auto-deduct them?
        // Wait, playCardCore calls calculateActualCost.
        // And then checks resources.
        // It does NOT deduct Mot/Imp automatically unless logic says so.
        // Review engine.ts:
        // uses generic cost for Genki/HP.
        // Checks Mot/Imp sufficiency.
        // Does it DEDUCT?
        // NO. Engine checks `consume_motivation` EFFECT to deduct.
        // So we MUST add consumption effects for Mot/Imp.
        // But for HP/Genki, engine deducts via `actualCost`.
        // So:
        if (costType === 'motivation' && costValue > 0) effects.unshift({ type: 'consume_motivation', value: costValue });
        if (costType === 'impression' && costValue > 0) effects.unshift({ type: 'consume_impression', value: costValue });
        // HP is deducted by engine as Cost if `card.costType === 'hp'`.

        const card = {
            id: `free_${name}`, name, rarity, type: type.toLowerCase(), plan: 'free',
            cost: costValue,
            image: `free/${name.replace(/\+$/, '_plus')}.png`,
            effects,
            conditions: parseConditionString(condStr).length > 0 ? parseConditionString(condStr) : undefined,
            usageLimit: limitStr === 'once' ? 'once_per_lesson' : undefined,
        };
        if (uniqueStr && uniqueStr.includes('unique')) card.unique = true;

        // Restore description from backup
        if (descMap.has(name)) {
            card.effect = descMap.get(name);
        } else {
            card.effect = ''; // Fallback
        }
        card.startInHand = effstrs.some(s => s && s.includes('flag:start_hand')) || undefined;

        if (costType === 'hp') {
            card.costType = 'hp';
            card.consumeHp = costValue;
        }

        logicCards.push(card);
    }

    fs.writeFileSync(logicJsonPath, JSON.stringify(logicCards, null, 2), 'utf8');
    console.log(`Generated ${logicCards.length} cards in free.json`);

} catch (err) { console.error(err); process.exit(1); }
