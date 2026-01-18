import fs from 'fs';
const updateCards = fs.readFileSync('scripts/update_cards.js', 'utf8');

// Extract parseEffects function body more carefully
const match = updateCards.match(/function parseEffects\(effectStr\) \{([\s\S]+?)\s{8}return effects;\s{4}\}/);
const functionBody = match[1];

// Mock basic necessities
const parseEffects = new Function('effectStr', `
    ${functionBody}
    return effects;
`);

const testDescs = [
    "スキルカード使用数追加+1,以降、ターン開始後、手札にあるスキルカード（R）が1枚以上の場合、ランダムな手札にあるスキルカード（R）2枚をコストを消費せず使用",
    "好印象強化+100%,すべてのスキルカードの好印象值増加+5,スキルカード使用数追加+1",
    "やる気が9以上の場合、使用可,スキルカード使用数追加+1,やる気+5,以降、スキルカードコストで体力減少時、元気+4（やる気効果を2倍適用）"
];

testDescs.forEach(d => {
    console.log('--- Testing:', d);
    try {
        console.log(JSON.stringify(parseEffects(d), null, 2));
    } catch (e) {
        console.error(e);
    }
});
