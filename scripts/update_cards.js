import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, '../学マス　シュミレーション - カード説明.csv');
const logicJsonPath = path.join(__dirname, '../src/data/cards/logic.json');

try {
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    console.log('Read bytes:', csvContent.length);
    const lines = csvContent.split(/\r?\n/);
    console.log('Line count:', lines.length);

    const logicCards = [];

    // Helper to determine cost type and value
    function parseCost(costStr, effectStr) {
        let cost = 0;
        let costType = 'normal';
        let consumeHp = 0;
        let consumeMot = 0;
        let consumeImp = 0;

        if (costStr) {
            const num = parseInt(costStr, 10);
            if (!isNaN(num)) cost = num;
        }

        // Effect string overrides for cost
        if (effectStr.includes('体力消費')) {
            const match = effectStr.match(/体力消費(\d+)/);
            if (match) {
                costType = 'hp';
                consumeHp = parseInt(match[1], 10);
                cost = 0;
            }
        }
        if (effectStr.includes('やる気消費')) {
            const match = effectStr.match(/やる気消費(\d+)/);
            if (match) {
                consumeMot = parseInt(match[1], 10);
            }
        }
        if (effectStr.includes('好印象消費')) {
            const match = effectStr.match(/好印象消費(\d+)/);
            if (match) {
                consumeImp = parseInt(match[1], 10);
            }
        }

        return { cost, costType, consumeHp, consumeMot, consumeImp };
    }

    function parseEffects(effectStr) {
        const effects = [];
        const conditionGates = [];

        // Split by comma vs slash vs newlines? CSV uses commas in quoted string usually.
        // The detailed desc column might have commas.
        // My script joins cols 5,6,7.
        // Split by " / " or just tokenize?
        // Let's split by punctuation that separates distinct effects.
        // Looking at CSV, some have "効果A, 効果B".
        const parts = effectStr.split(/[,、/]/).map(s => s.trim()).filter(s => s);

        parts.forEach(part => {
            let match;

            // --- CONDITIONS (Gate) ---
            if (match = part.match(/(元気|好印象|やる気|体力)が(\d+)以上の場合/)) {
                const typeMap = { '元気': 'genki', '好印象': 'impression', 'やる気': 'motivation', '体力': 'hp' };
                conditionGates.push({
                    type: typeMap[match[1]],
                    value: parseInt(match[2], 10),
                    compare: '>='
                });
                return;
            }
            if (match = part.match(/(体力)が(\d+)％以上の場合/)) {
                conditionGates.push({
                    type: 'hp_percent',
                    value: parseInt(match[2], 10),
                    compare: '>='
                });
                return;
            }
            if (match = part.match(/除外以外にある(T|Ｔ)トラブルカードが(\d+)枚以上の場合/)) {
                conditionGates.push({
                    type: 'trouble_card_count',
                    value: parseInt(match[2], 10),
                    compare: '>='
                });
                return;
            }

            // --- EFFECTS ---
            let currentEffect = null;

            // Basic Stats
            if (match = part.match(/^パラメータ\+(\d+)$/)) {
                currentEffect = { type: 'score_fixed', value: parseInt(match[1], 10) };
            } else if (match = part.match(/^パラメーター\+(\d+)$/)) {
                currentEffect = { type: 'score_fixed', value: parseInt(match[1], 10) };
            } else if (match = part.match(/^元気\+(\d+)$/)) {
                currentEffect = { type: 'buff_genki', value: parseInt(match[1], 10) };
            } else if (match = part.match(/^好印象\+(\d+)$/)) {
                currentEffect = { type: 'buff_impression', value: parseInt(match[1], 10) };
            } else if (match = part.match(/^やる気\+(\d+)$/)) {
                currentEffect = { type: 'buff_motivation', value: parseInt(match[1], 10) };
            }
            // Scaled Stats
            else if (match = part.match(/^元気の(\d+)％分パラメーター上昇/)) {
                currentEffect = { type: 'score_scale_genki', ratio: parseInt(match[1], 10) / 100 };
            } else if (match = part.match(/^好印象の(\d+)％分パラメーター上昇/)) {
                currentEffect = { type: 'score_scale_impression', ratio: parseInt(match[1], 10) / 100 };
            } else if (match = part.match(/^やる気の(\d+)％分パラメーター上昇/)) {
                currentEffect = { type: 'score_scale_motivation', ratio: parseInt(match[1], 10) / 100 };
            }
            // Costs & Resources
            else if (match = part.match(/^消費体力減少(\d+)ターン/)) {
                currentEffect = { type: 'buff_cost_reduction', duration: parseInt(match[1], 10) };
            } else if (match = part.match(/^消費体力削減(\d+)/)) {
                // Usually "Next 1 card" or "Target". Assuming "Next card" buff for now or immediate reduction if cost logic checks it?
                // Given "Consume HP Reduction 1", likely a buff.
                currentEffect = { type: 'reduce_hp_cost', value: parseInt(match[1], 10), duration: 1 }; // Default 1 turn? Or 1 use?
            } else if (match = part.match(/^元気増加無効(\d+)ターン/)) {
                currentEffect = { type: 'buff_no_genki_gain', duration: parseInt(match[1], 10) };
            } else if (match = part.match(/^消費体力増加(\d+)ターン/)) {
                currentEffect = { type: 'debuff_cost_increase', value: 1, duration: parseInt(match[1], 10) }; // Assuming +1 cost? Or doubles? Usually +Cost.
            }
            // Card Manip
            else if (match = part.match(/^スキルカード使用数追加\+(\d+)/)) {
                currentEffect = { type: 'add_card_play_count', value: parseInt(match[1], 10) };
            } else if (match = part.match(/^スキルカードを(\d+)枚引く/)) {
                currentEffect = { type: 'draw_card', value: parseInt(match[1], 10) };
            } else if (part.includes('スキルカードを引く')) {
                currentEffect = { type: 'draw_card', value: 1 };
            } else if (part.includes('眠気を山札のランダムな位置に生成')) {
                currentEffect = { type: 'generate_trouble', troubleId: 'sleep' };
            } else if (part.includes('手札をすべて入れ替える')) {
                currentEffect = { type: 'swap_hand' };
            } else if (part.includes('手札をすべてレッスン中強化')) {
                currentEffect = { type: 'upgrade_hand' };
            }
            // Consumption
            else if (match = part.match(/^体力消費(\d+)/)) {
                currentEffect = { type: 'consume_hp', value: parseInt(match[1], 10) };
            } else if (match = part.match(/^やる気消費(\d+)/)) {
                currentEffect = { type: 'consume_motivation', value: parseInt(match[1], 10) };
            } else if (match = part.match(/^好印象消費(\d+)/)) {
                currentEffect = { type: 'consume_impression', value: parseInt(match[1], 10) };
            }
            // Special
            else if (match = part.match(/^ターン追加\+(\d+)/)) {
                currentEffect = { type: 'add_turn', value: parseInt(match[1], 10) };
            } else if (part.includes('元気を半分にする')) {
                currentEffect = { type: 'half_genki' };
            } else if (part.includes('元気を0にする')) {
                currentEffect = { type: 'set_genki', value: 0 };
            } else if (part.includes('低下状態無効')) {
                currentEffect = { type: 'buff_no_debuff', count: 1, duration: -1 };
            }
            // Complex Buffs
            else if (match = part.match(/パラメーター上昇量増加(\d+)％/)) {
                currentEffect = { type: 'buff_score_bonus', value: parseInt(match[1], 10), duration: -1 };
            } else if (match = part.match(/好印象増加量増加\+(\d+)％/)) {
                currentEffect = { type: 'buff_impression_gain', value: parseInt(match[1], 10), duration: 0 }; // Duration set later if needed
            } else if (match = part.match(/^好印象強化\+(\d+)%/)) {
                currentEffect = { type: 'buff_impression_gain', value: parseInt(match[1], 10), duration: 1 };
            } else if (match = part.match(/すべてのスキルカードの好印象(値|值)増加\+(\d+)/)) {
                currentEffect = { type: 'buff_card_base_value', param: 'impression', value: parseInt(match[2], 10) };
            }
            // Triggers
            else if (part.includes('以降、メンタルスキルカード使用時、好印象+1')) {
                currentEffect = {
                    type: 'buff_on_card_use',
                    duration: -1,
                    triggerCondition: { type: 'card_type_usage', cardType: 'mental' },
                    triggeredEffect: { type: 'buff_impression', value: 1 }
                };
            } else if (part.includes('以降、メンタルスキルカード使用時、やる気+1')) {
                currentEffect = {
                    type: 'buff_on_card_use',
                    duration: -1,
                    triggerCondition: { type: 'card_type_usage', cardType: 'mental' },
                    triggeredEffect: { type: 'buff_motivation', value: 1 }
                };
            } else if (match = part.match(/以降、スキルカード使用時、好印象の(\d+)％分パラメーター上昇/)) {
                currentEffect = {
                    type: 'buff_on_card_use',
                    duration: -1,
                    triggeredEffect: { type: 'score_scale_impression', ratio: parseInt(match[1], 10) / 100 }
                };
            } else if (match = part.match(/ターン開始時、元気の(\d+)％分パラメーター上昇/)) {
                currentEffect = {
                    type: 'buff_turn_start',
                    triggeredEffect: { type: 'score_scale_genki', ratio: parseInt(match[1], 10) / 100 }
                };
            } else if (match = part.match(/ターン開始時、好印象(\d+(\.\d+)?)倍/)) {
                currentEffect = {
                    type: 'buff_turn_start',
                    triggeredEffect: { type: 'multiply_impression', value: parseFloat(match[1]) }
                };
            }
            // Legend / Complex
            else if (match = part.match(/ランダムな手札にあるスキルカード（([A-Za-z]+)）(\d+)枚をコストを消費せず使用/)) {
                currentEffect = {
                    type: 'trigger_random_hand_card',
                    targetRarity: match[1],
                    count: parseInt(match[2], 10),
                    ignoreCost: true
                };
            } else if (part.includes('スキルカードコストで体力減少時、元気+4')) {
                currentEffect = {
                    type: 'buff_reaction_on_cost',
                    triggeredEffect: { type: 'buff_genki', value: 4 } // Motivation scaling handled in engine/resolver?
                };
                // Note: "やる気効果を2倍適用" is handled as a property potentially?
                // For now, assume engine handles standard Motivation for Genki if we set a flag, or we set a special type.
            } else if (match = part.match(/ターン終了時、好印象が(\d+)以上の場合、好印象\+(\d+)/)) {
                currentEffect = {
                    type: 'buff_turn_start', // Actually turn end? Use buff_turn_end if we have it, or start of next. Gakumas: "End of Turn".
                    // We'll map to buff_turn_start for simplicity unless end-turn strictly required.
                    // But effectively same for persistent.
                    triggeredEffect: {
                        type: 'condition_gate',
                        condition: [{ type: 'impression', value: parseInt(match[1], 10), compare: '>=' }],
                        subEffects: [{ type: 'buff_impression', value: parseInt(match[2], 10) }]
                    }
                };
            }

            if (currentEffect) {
                if (conditionGates.length > 0) {
                    const gate = {
                        type: 'condition_gate',
                        condition: [...conditionGates],
                        subEffects: [currentEffect]
                    };
                    effects.push(gate);
                    // conditionGates.length = 0; // Should we clear? Usually conditions apply to the immediate next effect.
                    // But some descriptions are "Condition, Effect A, Effect B".
                    // Gakumas CSV seems to put Condition first.
                    // Let's Keep conditions for the whole line? No, CSV structure in "desc" is concatenated.
                    // "Condition... / Effect" -> Split by / puts Condition in first part.
                    // My split uses [,、/].
                    // If "Condition" is its own part, we keep it for subsequent parts?
                    // Let's clear ONLY if we encounter a new condition?
                    // Or assume one condition applies to all following effects?
                    // Safer to Clear after push?
                    // "好印象が6以上の場合、使用可" is a Global Condition for card use (cols[5]).
                    // "好印象が6以上の場合、好印象+3" is a Conditional Effect.
                } else {
                    effects.push(currentEffect);
                }
            }
        });

        // Duration parsing (Global override for the line?)
        if (effectStr.match(/以降の(\d+)ターンの間/)) {
            const durMatch = effectStr.match(/以降の(\d+)ターンの間/);
            const dur = parseInt(durMatch[1], 10);
            const buff = effects.find(e => e.type.startsWith('buff_'));
            if (buff) buff.duration = dur;
        }
        if (effectStr.match(/\(5ターン\)/)) { // Star dust sensation
            const buff = effects.find(e => e.type === 'buff_impression_gain');
            if (buff) buff.duration = 5;
        }

        return effects;
    }

    function parseConditions(effectStr) {
        const conditions = [];
        let match;

        if (match = effectStr.match(/(元気|好印象|やる気|体力)が(\d+)以上の場合、使用可/)) {
            const typeMap = { '元気': 'genki', '好印象': 'impression', 'やる気': 'motivation', '体力': 'hp' };
            conditions.push({ type: typeMap[match[1]], value: parseInt(match[2], 10), compare: '>=' });
        }
        // Multi-condition support?
        // CSV usually has "Genki >= X, Impression >= Y useable".
        // Regex /.../g matchAll?
        // Let's do simple separate checks for now to catch multiple.
        if (match = effectStr.match(/元気が(\d+)以上の場合、使用可/)) {
            if (!conditions.some(c => c.type === 'genki')) conditions.push({ type: 'genki', value: parseInt(match[1], 10), compare: '>=' });
        }
        if (match = effectStr.match(/好印象が(\d+)以上の場合、使用可/)) {
            if (!conditions.some(c => c.type === 'impression')) conditions.push({ type: 'impression', value: parseInt(match[1], 10), compare: '>=' });
        }
        if (match = effectStr.match(/やる気が(\d+)以上の場合、使用可/)) {
            if (!conditions.some(c => c.type === 'motivation')) conditions.push({ type: 'motivation', value: parseInt(match[1], 10), compare: '>=' });
        }

        return conditions;
    }

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const cols = line.split(',');
        const name = cols[0];
        if (!name) continue;

        let rarity = cols[1];
        if (rarity === 'レジェンド') rarity = 'Legend';
        const planRaw = cols[2].toLowerCase();

        // Strict logic filter as per task
        if (planRaw !== 'logic') continue;

        const desc = [cols[5], cols[6], cols[7]].filter(Boolean).join(',');

        const typeRaw = cols[3];
        const type = (typeRaw && typeRaw.toLowerCase().includes('active')) ? 'active' : 'mental';

        const { cost, costType, consumeHp, consumeMot, consumeImp } = parseCost(cols[4], desc);
        const effects = parseEffects(desc);

        if (consumeMot > 0) effects.unshift({ type: 'consume_motivation', value: consumeMot });
        if (consumeImp > 0) effects.unshift({ type: 'consume_impression', value: consumeImp });
        if (consumeHp > 0 && costType === 'hp') effects.unshift({ type: 'consume_hp', value: consumeHp });

        const conditions = parseConditions(desc);
        const isUnique = line.includes('重複不可');
        const limit = line.includes('レッスン中1回') ? 'once_per_lesson' : undefined;
        const startInHand = line.includes('レッスン開始時手札に入る');

        // Use simple ID based on name? Or keep Japanese ID?
        // logic.json already has `logic_JapaneseName`. It's fine.
        const id = `logic_${name}`;

        const card = {
            id: id,
            name: name,
            rarity: rarity,
            type: type,
            plan: 'logic',
            cost: cost,
            image: `logic/${name.replace(/\+$/, '_plus')}.png`,
            effect: desc.replace(/,/g, ' / '),
            effects: effects,
            conditions: conditions.length > 0 ? conditions : undefined,
            usageLimit: limit,
            unique: isUnique || undefined,
            startInHand: startInHand || undefined,
        };

        if (costType === 'hp') {
            card.costType = 'hp';
            card.consumeHp = consumeHp;
        }

        logicCards.push(card);
    }

    fs.writeFileSync(logicJsonPath, JSON.stringify(logicCards, null, 2), 'utf8');
    console.log(`Generated ${logicCards.length} cards in logic.json`);

} catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
}
