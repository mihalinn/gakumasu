import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, '../学マス　シュミレーション - カード説明.csv');
const logicJsonPath = path.join(__dirname, '../src/data/cards/free.json');

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

        // Split by comma or slash
        const parts = effectStr.split(/[,、/]/).map(s => s.trim()).filter(s => s);

        parts.forEach(part => {
            let match;

            // Conditions (Gate)
            if (match = part.match(/(元気|好印象|やる気|体力)が(\d+)以上の場合/)) {
                const typeMap = { '元気': 'genki', '好印象': 'impression', 'やる気': 'motivation', '体力': 'hp' };
                conditionGates.push({
                    type: typeMap[match[1]],
                    value: parseInt(match[2], 10),
                    compare: '>='
                });
                return;
            }

            let currentEffect = null;

            if (match = part.match(/^パラメータ\+(\d+)$/)) {
                currentEffect = { type: 'score_fixed', value: parseInt(match[1], 10) };
            } else if (match = part.match(/^パラメーター\+(\d+)$/)) { // Variation
                currentEffect = { type: 'score_fixed', value: parseInt(match[1], 10) };
            } else if (match = part.match(/^元気\+(\d+)$/)) {
                currentEffect = { type: 'buff_genki', value: parseInt(match[1], 10) };
            } else if (match = part.match(/^好印象\+(\d+)$/)) {
                currentEffect = { type: 'buff_impression', value: parseInt(match[1], 10) };
            } else if (match = part.match(/^やる気\+(\d+)$/)) {
                currentEffect = { type: 'buff_motivation', value: parseInt(match[1], 10) };
            } else if (match = part.match(/^元気の(\d+)％分パラメーター上昇/)) {
                currentEffect = { type: 'score_scale_genki', ratio: parseInt(match[1], 10) / 100 };
            } else if (match = part.match(/^好印象の(\d+)％分パラメーター上昇/)) {
                currentEffect = { type: 'score_scale_impression', ratio: parseInt(match[1], 10) / 100 };
            } else if (match = part.match(/^やる気の(\d+)％分パラメーター上昇/)) {
                currentEffect = { type: 'score_scale_motivation', ratio: parseInt(match[1], 10) / 100 };
            } else if (match = part.match(/^消費体力減少(\d+)ターン/)) {
                currentEffect = { type: 'buff_cost_reduction', duration: parseInt(match[1], 10) };
            } else if (match = part.match(/^消費体力削減(\d+)/)) {
                currentEffect = { type: 'reduce_hp_cost', value: parseInt(match[1], 10), duration: -1 };
            } else if (match = part.match(/^元気増加無効(\d+)ターン/)) {
                currentEffect = { type: 'buff_no_genki_gain', duration: parseInt(match[1], 10) };
            } else if (match = part.match(/^スキルカード使用数追加\+(\d+)/)) {
                currentEffect = { type: 'add_card_play_count', value: parseInt(match[1], 10) };
            } else if (match = part.match(/^スキルカード使用数\+(\d+)/)) {
                currentEffect = { type: 'add_card_play_count', value: parseInt(match[1], 10) };
            } else if (match = part.match(/^スキルカードを(\d+)枚引く/)) {
                currentEffect = { type: 'draw_card', value: parseInt(match[1], 10) };
            } else if (part.includes('スキルカードを引く')) {
                currentEffect = { type: 'draw_card', value: 1 };
            } else if (match = part.match(/^体力消費(\d+)/)) {
                currentEffect = { type: 'consume_hp', value: parseInt(match[1], 10) };
            } else if (match = part.match(/^やる気消費(\d+)/)) {
                currentEffect = { type: 'consume_motivation', value: parseInt(match[1], 10) };
            } else if (match = part.match(/^好印象消費(\d+)/)) {
                currentEffect = { type: 'consume_impression', value: parseInt(match[1], 10) };
            } else if (match = part.match(/^ターン追加\+(\d+)/)) {
                currentEffect = { type: 'add_turn', value: parseInt(match[1], 10) };
            } else if (part.includes('眠気を山札のランダムな位置に生成')) {
                currentEffect = { type: 'generate_trouble', troubleId: 'sleep' };
            } else if (part.includes('元気を半分にする')) {
                currentEffect = { type: 'half_genki' };
            } else if (part.includes('元気を0にする')) {
                currentEffect = { type: 'set_genki', value: 0 };
            } else if (part.includes('低下状態無効')) {
                currentEffect = { type: 'buff_no_debuff', count: 1, duration: -1 };
            } else if (part.includes('手札を力すべてレッスン中強化') || part.includes('手札をすべてレッスン中強化')) {
                currentEffect = { type: 'upgrade_hand' };
            } else if (part.includes('手札をすべて入れ替える')) {
                currentEffect = { type: 'swap_hand' };
            }

            if (currentEffect) {
                if (conditionGates.length > 0) {
                    const gate = {
                        type: 'condition_gate',
                        condition: [...conditionGates],
                        subEffects: [currentEffect]
                    };
                    effects.push(gate);
                    conditionGates.length = 0;
                } else {
                    effects.push(currentEffect);
                }
            }
        });

        if (effectStr.match(/以降の(\d+)ターンの間/)) {
            const durMatch = effectStr.match(/以降の(\d+)ターンの間/);
            const dur = parseInt(durMatch[1], 10);
            const buff = effects.find(e => e.type === 'buff_turn_start' || e.type === 'buff_on_card_use');
            if (buff) buff.duration = dur;
        }

        return effects;
    }

    function parseConditions(effectStr) {
        const conditions = [];
        if (effectStr.includes('やる気が3以上の場合、使用可')) conditions.push({ type: 'motivation', value: 3, compare: '>=' });
        if (effectStr.includes('好印象が1以上の場合、使用可')) conditions.push({ type: 'impression', value: 1, compare: '>=' });
        if (effectStr.includes('元気が30以上の場合、使用可')) conditions.push({ type: 'genki', value: 30, compare: '>=' });
        if (effectStr.includes('好印象が6以上の場合、使用可')) conditions.push({ type: 'impression', value: 6, compare: '>=' });
        if (effectStr.includes('やる気が9以上の場合、使用可')) conditions.push({ type: 'motivation', value: 9, compare: '>=' });
        return conditions;
    }

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const cols = line.split(',');
        const name = cols[0];
        if (!name) continue;

        const rarity = cols[1];
        const planRaw = cols[2].toLowerCase();

        // Flee (Free) filter
        if (planRaw !== 'flee') continue;

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

        const id = `free_${name}`;

        const card = {
            id: id,
            name: name,
            rarity: rarity,
            type: type,
            plan: 'free',
            cost: cost,
            image: `free/${name.replace(/\+$/, '_plus')}.png`,
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
    console.log(`Generated ${logicCards.length} cards in free.json`);

} catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
}
