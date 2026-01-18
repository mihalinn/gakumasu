import type { GameState } from '../types';
import type { Effect, Condition, EffectType, Card } from '../types';
import logicCards from '../data/cards/logic.json';
import freeCards from '../data/cards/free.json';

const allCardsMap = new Map<string, Card>();
[...logicCards, ...freeCards].forEach(c => allCardsMap.set(c.id, c as unknown as Card));
import { LOGIC_CONSTANTS } from './constants';
import { drawCards } from './utils';

// --- ユーティリティ ---

/**
 * 現在のゲーム状態に基づき、スコア計算時の倍率を計算します。
 * (例: 好調で1.5倍、絶好調で2.0倍など)
 * 
 * @param state ゲーム状態
 * @returns スコア倍率 (例: 1.5, 2.0)
 */
function getScoreMultiplier(state: GameState): number {
    let multiplier = 1.0;

    // 既存のバフ補正
    if (state.buffs.some(b => b.type === 'buff_double_strike')) {
        // 絶好調: スコア2倍
        multiplier *= LOGIC_CONSTANTS.MULTIPLIER.DOUBLE_STRIKE_SCORE;
    } else if (state.buffs.some(b => b.type === 'buff_perfect_condition')) {
        // 好調: スコア1.5倍
        multiplier *= LOGIC_CONSTANTS.MULTIPLIER.PERFECT_CONDITION_SCORE;
    }

    return multiplier;
}

/**
 * ターン属性（ボーカル、ダンス、ビジュアル）によるボーナスを計算します。
 * 現在のターン属性と一致するステータス値に応じて倍率が加算されます。
 * 式: 1.0 + (ステータス / 100)
 * 
 * @param state ゲーム状態
 */
function getTurnAttributeBonus(state: GameState): number {
    if (!state.currentTurnAttribute) return 1.0;

    let statValue = 0;
    switch (state.currentTurnAttribute) {
        case 'vocal': statValue = state.vocal; break;
        case 'dance': statValue = state.dance; break;
        case 'visual': statValue = state.visual; break;
    }

    // 例: ステータス500なら (1 + 500/100) = 6.0倍
    return 1.0 + (statValue / 100.0);
}

/**
 * 指定された効果タイプがデバフ（悪い効果）かどうかを判定します。
 * 「低下状態無効」などで無効化される対象を定義します。
 */
function isDebuff(effectType: EffectType): boolean {
    return [
        'buff_no_genki_gain',  // 元気増加無効
        'buff_double_cost',    // 消費体力倍増
        'debuff_cost_increase', // 消費体力増加
        'half_genki',          // 元気半減
        'set_genki',           // 元気0
    ].includes(effectType);
}

// --- 条件判定ロジック ---

/**
 * 単一の条件(Condition)が満たされているかを評価します。
 * カード使用条件や効果発動条件に使用されます。
 * 
 * @param state ゲーム状態
 * @param condition 評価する条件
 */
function evaluateCondition(state: GameState, condition: Condition): boolean {
    let targetValue = 0;

    // 比較対象の値を取得
    switch (condition.type) {
        case 'genki': targetValue = state.genki; break;
        case 'impression': targetValue = state.goodImpression; break;
        case 'motivation': targetValue = state.motivation; break;
        case 'concentration': targetValue = state.concentration; break;
        case 'hp': targetValue = state.hp; break;
        case 'hp_ratio': targetValue = state.hp / state.maxHp; break;
        case 'turn': targetValue = state.turn; break;
        case 'buff': {
            // 特定のバフを持っているか（持続ターン数で判定）
            const activeBuffs = state.buffs.filter(b => b.type === condition.buffType);
            if (activeBuffs.length === 0) targetValue = 0;
            else {
                // 最も長い残りターン数を採用（-1は永続扱い）
                targetValue = Math.max(...activeBuffs.map(b => b.duration === -1 ? 999 : b.duration));
            }
            break;
        }
        case 'trouble_card_count': {
            const checkList = [];
            // Scope: hand, deck, discard, or all (default: all NON-Exile? CSV says "除外以外")
            const scopes = condition.scope ? [condition.scope] : ['hand', 'deck', 'discard'];
            if (scopes.includes('all') || scopes.includes('hand')) checkList.push(...state.hand);
            if (scopes.includes('all') || scopes.includes('deck')) checkList.push(...state.deck);
            if (scopes.includes('all') || scopes.includes('discard')) checkList.push(...state.discard);
            // Count cards with type 'trouble'
            targetValue = checkList.filter(c => c.type === 'trouble').length;
            break;
        }
        case 'hp_percent':
            targetValue = (state.hp / state.maxHp) * 100;
            break;
        case 'card_type_usage': {
            targetValue = 0;
            break;
        }
        case 'hand_rarity_count': {
            const rarity = condition.targetRarity;
            targetValue = state.hand.filter(c => !rarity || c.rarity === rarity).length;
            break;
        }
        default: return false;
    }

    const threshold = condition.value ?? 0;

    // 条件式で比較
    switch (condition.compare) {
        case '>=': return targetValue >= threshold;
        case '<=': return targetValue <= threshold;
        case '>': return targetValue > threshold;
        case '<': return targetValue < threshold;
        case '==': return targetValue === threshold;
        default: return targetValue >= threshold; // デフォルトは >=
    }
}

/**
 * 複数の条件すべてを満たしているかを判定します(AND条件)。
 */
export function checkConditions(state: GameState, conditions?: Condition[]): boolean {
    if (!conditions || conditions.length === 0) return true; // 条件指定なしは常に許可
    return conditions.every(cond => evaluateCondition(state, cond));
}

// --- 効果適用ロジック ---

interface ResolutionResult {
    state: GameState;
    logs: string[];
}

/**
 * 単一の効果(Effect)をゲーム状態に適用します。
 * 
 * 1. 条件判定 (条件を満たさない場合は適用スキップ)
 * 2. デバフ無効化チェック (低下状態無効の効果があれば消費して無効化)
 * 3. 効果タイプ別の処理分岐
 * 
 * @param state 現在のゲーム状態
 * @param effect 適用する効果データ
 */
export function resolveEffect(state: GameState, effect: Effect): ResolutionResult {
    // 効果自体に条件がある場合の判定
    if (effect.condition && !checkConditions(state, effect.condition)) {
        return { state, logs: [] };
    }

    let newState = { ...state };
    let logs: string[] = [];

    // デバフ無効化(Block Debuff)のチェック
    if (isDebuff(effect.type)) {
        const nullifyBuffIndex = newState.buffs.findIndex(b => b.type === 'buff_no_debuff');
        if (nullifyBuffIndex >= 0) {
            // 無効化バフを消費してデバフを防ぐ
            newState.buffs = [...newState.buffs];
            const buff = { ...newState.buffs[nullifyBuffIndex] };

            let consumed = false;
            // 回数指定がある場合 (優先)
            if (typeof buff.count === 'number') {
                if (buff.count > 0) {
                    buff.count -= 1;
                    consumed = true;
                    if (buff.count <= 0) {
                        newState.buffs.splice(nullifyBuffIndex, 1);
                    } else {
                        newState.buffs[nullifyBuffIndex] = buff;
                    }
                }
            }
            // 回数指定がなく、期間(ターン数)で管理されている場合
            else if (buff.duration > 0) {
                if (buff.duration > 1) {
                    buff.duration -= 1;
                    newState.buffs[nullifyBuffIndex] = buff;
                } else {
                    newState.buffs.splice(nullifyBuffIndex, 1);
                }
                consumed = true;
            }
            // duration: -1 (永続) で回数指定もない場合は消費しない（無効化し放題）

            if (consumed) {
                return { state: newState, logs: [`低下状態無効により ${effect.type} を無効化`] };
            }
        }
    }

    const value = effect.value ?? 0;
    const ratio = effect.ratio ?? 1.0;

    // Base Value Buff Adjustment
    // If effect adds to base value (e.g. "所有スキルカードの好印象+5"), we check GameState for `buff_card_base_value`
    let adjustedValue = value;
    if (effect.type === 'buff_impression' || effect.type === 'buff_genki' || effect.type === 'buff_motivation') {
        const paramType = effect.type.replace('buff_', ''); // impression, genki, motivation
        const baseValueBuffs = newState.buffs.filter(b => b.type === 'buff_card_base_value' && b.param === paramType);
        const addedValue = baseValueBuffs.reduce((sum, b) => sum + (b.value ?? 0), 0);
        adjustedValue += addedValue;
    }

    const attributeBonus = getTurnAttributeBonus(newState);

    // 効果の種類に応じた処理
    switch (effect.type) {
        // --- スコア獲得系 ---
        case 'score_fixed': {
            // 固定値 + 集中ボーナス
            const condMultiplier = getScoreMultiplier(newState);
            const focusMultiplier = effect.multiplier ?? 1.0; // カード固有の集中倍率(ハイタッチなど2倍)
            const focusBonus = Math.floor(newState.concentration * LOGIC_CONSTANTS.CONCENTRATION.SCORE_BONUS_PER_STACK * focusMultiplier);

            // パラメータ上昇量増加バフの適用
            const scoreBonusBuffs = newState.buffs.filter(b => b.type === 'buff_score_bonus');
            const scoreBonus = scoreBonusBuffs.reduce((sum, b) => sum + (b.value ?? 0), 0);
            const scoreBonusMultiplier = 1.0 + (scoreBonus / 100.0);

            // 基礎点 + 集中ボーナス に対し、好調補正とターン属性補正、さらにパラメータ上昇量増加を乗算
            const amount = Math.floor((adjustedValue + focusBonus) * condMultiplier * attributeBonus * scoreBonusMultiplier);

            newState.score += amount;
            logs.push(`パラメータ+${amount}`);
            break;
        }
        case 'score_scale_genki': {
            // 元気のN%分スコア加算
            const condMultiplier = getScoreMultiplier(newState);

            // パラメータ上昇量増加バフ
            const scoreBonusBuffs = newState.buffs.filter(b => b.type === 'buff_score_bonus');
            const scoreBonus = scoreBonusBuffs.reduce((sum, b) => sum + (b.value ?? 0), 0);
            const scoreBonusMultiplier = 1.0 + (scoreBonus / 100.0);

            const amount = Math.floor(newState.genki * ratio * condMultiplier * attributeBonus * scoreBonusMultiplier);
            newState.score += amount;
            logs.push(`元気(${newState.genki})の${Math.round(ratio * 100)}%分パラメータ上昇: +${amount}`);
            break;
        }
        case 'score_scale_impression': {
            // 好印象のN%分スコア加算
            const condMultiplier = getScoreMultiplier(newState);

            const scoreBonusBuffs = newState.buffs.filter(b => b.type === 'buff_score_bonus');
            const scoreBonus = scoreBonusBuffs.reduce((sum, b) => sum + (b.value ?? 0), 0);
            const scoreBonusMultiplier = 1.0 + (scoreBonus / 100.0);

            const amount = Math.floor(newState.goodImpression * ratio * condMultiplier * attributeBonus * scoreBonusMultiplier);
            newState.score += amount;
            logs.push(`好印象(${newState.goodImpression})の${Math.round(ratio * 100)}%分パラメータ上昇: +${amount}`);
            break;
        }
        case 'score_scale_motivation': {
            // やる気のN%分スコア加算
            const condMultiplier = getScoreMultiplier(newState);

            const scoreBonusBuffs = newState.buffs.filter(b => b.type === 'buff_score_bonus');
            const scoreBonus = scoreBonusBuffs.reduce((sum, b) => sum + (b.value ?? 0), 0);
            const scoreBonusMultiplier = 1.0 + (scoreBonus / 100.0);

            const amount = Math.floor(newState.motivation * ratio * condMultiplier * attributeBonus * scoreBonusMultiplier);
            newState.score += amount;
            logs.push(`やる気(${newState.motivation})の${Math.round(ratio * 100)}%分パラメータ上昇: +${amount}`);
            break;
        }

        // --- ステータス変動系 ---
        case 'buff_genki': {
            if (newState.buffs.some(b => b.type === 'buff_no_genki_gain')) {
                logs.push(`元気増加無効により獲得失敗`);
                break;
            }
            // やる気による元気加算ボーナス
            // "やる気効果を2倍適用" の場合は倍率をかける
            const motivationMult = effect.doubleMotivation ? 2 : 1;
            const motivationBonus = newState.motivation * LOGIC_CONSTANTS.MOTIVATION.GENKI_BONUS_PER_STACK * motivationMult;
            const totalGain = adjustedValue + motivationBonus;
            newState.genki += totalGain;

            let msg = `元気+${value}`;
            if (motivationBonus > 0) msg += `(やる気補正+${motivationBonus}${motivationMult > 1 ? ' × 2' : ''})`;
            logs.push(msg);
            break;
        }
        case 'buff_impression': {
            // 好印象増加量増加バフ (buff_impression_gain) の適用
            const gainBuffs = newState.buffs.filter(b => b.type === 'buff_impression_gain');
            const totalGainBonus = gainBuffs.reduce((sum, b) => sum + (b.value ?? 0), 0); // %加算 (例: 50)
            const gainMultiplier = 1.0 + (totalGainBonus / 100.0);

            const increasedValue = Math.floor(adjustedValue * gainMultiplier);
            newState.goodImpression += increasedValue;
            logs.push(`好印象+${increasedValue}${gainMultiplier > 1 ? ` (補正+${Math.round((gainMultiplier - 1) * 100)}%)` : ''}`);
            break;
        }
        case 'buff_motivation': {
            newState.motivation += adjustedValue;
            logs.push(`やる気+${adjustedValue}`);
            break;
        }
        case 'buff_concentration': {
            newState.concentration += value;
            logs.push(`集中+${value}`);
            break;
        }
        case 'half_genki': {
            // 元気半減 (デバフ)
            const oldGenki = newState.genki;
            newState.genki = Math.floor(oldGenki * 0.5);
            logs.push(`元気を半分にする (${oldGenki} -> ${newState.genki})`);
            break;
        }
        case 'set_genki': {
            newState.genki = value;
            logs.push(`元気を${value}にする`);
            break;
        }
        case 'consume_hp': {
            // 体力消費 (デメリット効果)
            newState.hp = Math.max(0, newState.hp - value);
            logs.push(`体力消費 ${value}`);
            break;
        }
        case 'consume_motivation': {
            newState.motivation = Math.max(0, newState.motivation - value);
            logs.push(`やる気消費 ${value}`);
            break;
        }
        case 'consume_impression': {
            newState.goodImpression = Math.max(0, newState.goodImpression - value);
            logs.push(`好印象消費 ${value}`);
            break;
        }

        // --- ゲーム進行系 ---
        case 'draw_card': {
            const MAX_HAND = 5;
            const currentHandSize = newState.hand.length;
            const canDraw = Math.max(0, MAX_HAND - currentHandSize);
            const actualDraw = Math.min(value, canDraw);

            if (actualDraw > 0) {
                // ドロー実行
                const { deck, discard, hand } = drawCards(newState.deck, newState.discard, actualDraw, newState.hand);
                newState.deck = deck;
                newState.discard = discard;
                newState.hand = [...newState.hand, ...hand];
                logs.push(`スキルカードを${actualDraw}枚引く`);
            } else {
                logs.push(`手札がいっぱいのためドロー失敗`);
            }
            break;
        }
        case 'add_card_play_count': {
            newState.cardsPlayed = Math.max(0, newState.cardsPlayed - value);
            logs.push(`スキルカード使用数追加 +${value}`);
            break;
        }
        case 'add_turn': {
            // ターン追加: maxTurnsを増やす
            // ユーザー指定: "すべてのターンが終わったあとに追加する形"
            // "ターン属性は一番最後の属性と同じ"
            newState.maxTurns += value;
            logs.push(`ターン追加 +${value} (合計${newState.maxTurns}ターン)`);
            break;
        }
        case 'generate_trouble': {
            // トラブルカード生成: 山札のランダムな位置に追加
            if (effect.troubleId) {
                // 簡易カード生成
                const troubleCard = {
                    id: `${effect.troubleId}_${Date.now()}`,
                    // TODO: 正しいトラブルカード定義を取得する必要がある
                    name: '眠気', // 仮
                    type: 'mental', // 仮
                    cost: 0,
                    effect: '悪い効果',
                    // ... 
                } as any;

                const insertIdx = Math.floor(Math.random() * (newState.deck.length + 1));
                newState.deck = [
                    ...newState.deck.slice(0, insertIdx),
                    troubleCard,
                    ...newState.deck.slice(insertIdx)
                ];
                logs.push(`山札にトラブルカード(${effect.troubleId})を生成: 簡易実装(ID生成のみ)`);
            }
            break;
        }

        case 'trigger_random_hand_card': {
            // ランダムな手札を使用
            // targetRarityで絞り込み
            const candidates = newState.hand.filter(c =>
                !effect.targetRarity || (c.rarity === effect.targetRarity)
            );

            const count = effect.count ?? 1;
            const chosenCards = [];

            // ランダムに選出
            const remainingCandidates = [...candidates];
            for (let i = 0; i < count; i++) {
                if (remainingCandidates.length === 0) break;
                const idx = Math.floor(Math.random() * remainingCandidates.length);
                chosenCards.push(remainingCandidates[idx]);
                remainingCandidates.splice(idx, 1);
            }

            if (chosenCards.length > 0) {
                logs.push(`効果発動: 手札から${chosenCards.map(c => c.name).join(',')}を使用`);

                chosenCards.forEach(card => {
                    // 1. 手札から捨札へ移動
                    const handIdx = newState.hand.findIndex(c => c.id === card.id);
                    if (handIdx !== -1) {
                        const [played] = newState.hand.splice(handIdx, 1);
                        newState.discard.push(played);
                    }
                    // 2. 効果適用 (再帰)
                    if (card.effects) {
                        // Note: applyCardEffects calls resolveEffect which is this function.
                        // But we cannot call applyCardEffects directly if it's not exported or if circular.
                        // It IS exported below. But `resolveEffect` is calling `applyCardEffects`? 
                        // Check structure: resolveEffect is called BY applyCardEffects.
                        // So we need to call applyCardEffects recursively. 
                        // To do that safely, we assume applyCardEffects is available.
                        // However, "applyCardEffects" is defined AFTER resolveEffect. Function hoisting?
                        // TS handles hoisting for function declarations.
                        const resultState = applyCardEffects(newState, card.effects);
                        // resultState is GameState, so we update newState
                        // However, logs are embedded in resultState.logs.
                        // We need to extract them to the current 'logs' array so they are returned by resolveEffect properly?
                        // resolveEffect returns {state, logs}.
                        // If we just set newState = resultState, the logs in resultState.logs will be in the final state.
                        // But expected return of resolveEffect puts logs in the separate array.
                        // We should extract new logs. But resultState.logs contains ALL logs including previous ones?
                        // No, applyCardEffects takes `currentState` which has `logs`.
                        // It appends new logs to it.
                        // So resultState.logs = [oldLogs, ...newLogs].
                        // current `logs` array in resolveEffect is accumulating logs for THIS resolution step.
                        // newState.logs (from input) might be old.

                        // Let's rely on GameState accumulation.
                        newState = resultState;
                        // We don't need to push to `logs` if `newState.logs` already has them?
                        // Wait, resolveEffect constructs valid `logs` array related to THIS effect.
                        // The caller of resolveEffect (applyCardEffects) aggregates `result.logs`.
                        // If we modify newState.logs directly inside applyCardEffects, then we might duplicate triggers?

                        // Diffing logs is hard.
                        // Better: applyCardEffects appends to the state it gets.
                        // newState passed to it has whatever logs it has.
                        // after return, newState has more logs.
                        // We shouldn't need to manually verify logs if we just return newState.
                        // BUT resolveEffect returns `logs` specifically generated by THIS effect.
                        // If we don't capture them in `logs` array, the caller (applyCardEffects) won't see them in `result.logs`.
                        // Wait, `applyCardEffects` uses `allLogs = [...allLogs, ...result.logs]`.
                        // It also updates `currentState`. 
                        // If `currentState.logs` is ALREADY updated by `resolveEffect`, then `applyCardEffects` doing `currentState.logs = [...logs, ...allLogs]` might duplicate?

                        // Let's check applyCardEffects again.
                        // line 570: `currentState.logs = [...(currentState.logs || []), ...allLogs];`
                        // So it appends `allLogs` (collected from resolveEffect returns) to the state.
                        // It does NOT expect `resolveEffect` to modify `state.logs` in place.
                        // But `applyCardEffects` (recursive call) DOES modify state.logs in place (line 570).

                        // So:
                        // 1. `resolveEffect` calls `applyCardEffects`.
                        // 2. `applyCardEffects` updates `newState` WITH logs.
                        // 3. `newState` now has new logs.
                        // 4. `resolveEffect` continues.

                        // We need to avoid duplication.
                        // If `newState` already has the logs, we don't need to push to `logs` array of resolveEffect?
                        // But `applyCardEffects` (caller) will take `logs` from resolveEffect and APPEND it to `currentState.logs`.
                        // If `currentState` (== newState) already has them, we append twice.

                        // Solution:
                        // Since `applyCardEffects` returns a valid State with logs,
                        // And we are inside `resolveEffect` which is supposed to return logic-logs separately...
                        // We are mixing levels of abstraction.

                        // For `trigger_random_hand_card`, we are delegating to `applyCardEffects`.
                        // We should probably strip the "newly added logs" from resultState and return them.
                        // OR, since `newState` is replaced by `resultState`, it already has the logs.
                        // If we return `logs: []` from here, the caller `applyCardEffects` will append nothing.
                        // But `currentState` (in caller) becomes `result.state` (which is `newState/resultState`).
                        // So `currentState` will have the logs from the recursive call.
                        // AND `allLogs` will be empty.
                        // So line 570 `currentState.logs = current.logs + allLogs` -> `logs + []`.
                        // This seems correct! "New logs" are already in `resultState`.

                        // Only catch: `resolveEffect` signature returns logs.
                        // If we return empty logs for this effect, but the STATE has changed logs...
                        // `applyCardEffects` loop:
                        // 1. `resolveEffect`
                        // 2. `currentState = result.state` (Updates state to one with new logs)
                        // 3. `allLogs.push(result.logs)` (Empty)
                        // 4. End loop.
                        // 5. `currentState.logs = [...currentState.logs, ...allLogs]` -> `[...logs_inc_recursive, ...[]]`.
                        // This works!

                        // So: We just update newState. We DO NOT push to `logs`.
                        // However, verify if `applyCardEffects` adds logs to state incrementally or only at end.
                        // It updates state incrementally, but adds logs to state ONLY AT END.
                        // Wait.
                        // `applyCardEffects` calls `resolveEffect` in loop.
                        // `currentState` is updated.
                        // `allLogs` accumulates `result.logs`.
                        // At END, it pushes `allLogs` to `currentState.logs`.
                        // IF the recursive `applyCardEffects` ALSO did this...
                        // Then `resultState` (returned from recursive) has logs appended.
                        // So `currentState` (in outer) gets those logs.
                        // THEN `result.logs` (outer resolveEffect) is empty.
                        // Outer `applyCardEffects` appends empty.
                        // Net result: Logs are present once. Correct.

                        // What if `resolveEffect` returns logs?
                        // If `applyCardEffects` (recursive) worked, it appended logs to `newState`.
                        // Use `logs.push` mostly for user feedback of "Triggered Random Card".

                        // BUT `applyCardEffects` (recursive) adds logs to `state.logs`.
                        // It does NOT separate them.

                        newState = resultState;
                    }
                });
            } else {
                logs.push('対象カードがなく不発');
            }
            break;
        }

        case 'multiply_impression': {
            const oldImp = newState.goodImpression;
            const mult = effect.value ?? 1.0;
            newState.goodImpression = Math.floor(oldImp * mult);
            logs.push(`好印象${mult}倍 (${oldImp} -> ${newState.goodImpression})`);
            break;
        }

        case 'swap_hand': {
            // 手札交換
            const currentHand = [...newState.hand];
            newState.discard = [...newState.discard, ...currentHand];
            const { deck, discard, hand } = drawCards(newState.deck, newState.discard, currentHand.length, []);
            newState.deck = deck;
            newState.discard = discard;
            newState.hand = hand;
            logs.push(`手札をすべて入れ替える`);
            break;
        }

        case 'upgrade_hand': {
            newState.hand = newState.hand.map(card => {
                if (card.id.endsWith('+')) return card;

                // logic_Name -> logic_Name+
                // free_Name -> free_Name+
                // We assume the ID convention holds.
                const potentialId = card.id + '+';
                const upgradedCard = allCardsMap.get(potentialId);

                return upgradedCard ? { ...upgradedCard } : card;
            });
            logs.push(`手札をすべてレッスン中強化`);
            break;
        }

        case 'condition_gate': {
            if (effect.subEffects) {
                // Here we call resolveEffect recursively for subEffects.
                // Since this switch block defines behavior for a SINGLE effect, 
                // we iterate over subEffects and apply them.
                effect.subEffects.forEach(sub => {
                    // Recursive call
                    const result = resolveEffect(newState, sub);
                    newState = result.state;
                    logs.push(...result.logs);
                });
            }
            break;
        }

        // --- BUFF付与系 (一括処理) ---
        default: {
            if (effect.type.startsWith('buff_') || effect.type.startsWith('debuff_')) {
                // 特別な処理が必要なBuff以外はここで処理
                // (buff_no_genki_gainなどは上でcaseがあるべきだが、なければここで拾う)

                // 特定のBuff(元気増加無効)は持続延長したい場合がある
                const isStackableDuration = ['buff_no_genki_gain'].includes(effect.type);
                const existingBuffIndex = isStackableDuration
                    ? newState.buffs.findIndex(b => b.type === effect.type)
                    : -1;

                if (existingBuffIndex >= 0) {
                    newState.buffs = [...newState.buffs];
                    newState.buffs[existingBuffIndex] = {
                        ...newState.buffs[existingBuffIndex],
                        duration: newState.buffs[existingBuffIndex].duration + (effect.duration ?? 0)
                    };
                    logs.push(`${effect.type}を延長 (+${effect.duration}ターン)`);
                } else {
                    const buffId = `buff_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                    newState.buffs.push({
                        id: buffId,
                        type: effect.type,
                        value: effect.value,
                        ratio: effect.ratio,
                        duration: effect.duration ?? 3,
                        name: effect.type,
                        isNew: true,
                        triggeredEffect: effect.triggeredEffect,
                        triggerCondition: effect.triggerCondition,
                        param: effect.param,
                        doubleMotivation: effect.doubleMotivation
                    });
                    logs.push(`状態付与: ${effect.type}`);
                }
            }
            break;
        }
    }

    return { state: newState, logs };
}

/**
 * リストにある複数の効果を順番に適用します。
 */
export function applyCardEffects(initialState: GameState, effects: Effect[]): GameState {
    let currentState = { ...initialState };
    let allLogs: string[] = [];

    for (const effect of effects) {
        const result = resolveEffect(currentState, effect);
        currentState = result.state;
        allLogs = [...allLogs, ...result.logs];
    }

    if (allLogs.length > 0) {
        currentState.logs = [...(currentState.logs || []), ...allLogs];
    }

    return currentState;
}
