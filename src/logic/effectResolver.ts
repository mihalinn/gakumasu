import type { GameState } from '../types/index';
import type { Effect, Condition, EffectType } from './types';
import { LOGIC_CONSTANTS } from './constants';
import { drawCards } from './utils';

// --- ユーティリティ ---

// --- ユーティリティ ---

function getScoreMultiplier(state: GameState): number {
    let multiplier = 1.0;

    // 既存のバフ補正
    if (state.buffs.some(b => b.type === 'buff_double_strike')) {
        multiplier *= LOGIC_CONSTANTS.MULTIPLIER.DOUBLE_STRIKE_SCORE;
    } else if (state.buffs.some(b => b.type === 'buff_perfect_condition')) {
        multiplier *= LOGIC_CONSTANTS.MULTIPLIER.PERFECT_CONDITION_SCORE;
    }

    return multiplier;
}

// ターン属性ボーナス (1 + 該当ステータス / 100)
function getTurnAttributeBonus(state: GameState): number {
    if (!state.currentTurnAttribute) return 1.0;

    let statValue = 0;
    switch (state.currentTurnAttribute) {
        case 'vocal': statValue = state.vocal; break;
        case 'dance': statValue = state.dance; break;
        case 'visual': statValue = state.visual; break;
    }

    // 例: ステータス500なら (1 + 500/100) = 6.0倍
    // 学マスの正確な式確認要だが、ユーザー指摘に基づきステータスを反映
    return 1.0 + (statValue / 100.0);
}

// デバフ判定
function isDebuff(effectType: EffectType): boolean {
    return [
        'buff_no_genki_gain',
        'buff_double_cost',
        'half_genki',
        // 'reduce_hp_cost' is usually positive
        // consume_hp is effect/cost, not status ailment usually?
        // But preventing 'consume_hp' might be desired? 
        // User said "Nullify Effect like No Genki Gain".
        // Usually refers to Buff/Status Ailments.
    ].includes(effectType);
}

// --- 条件判定ロジック --- (unchanged)

function evaluateCondition(state: GameState, condition: Condition): boolean {
    let targetValue = 0;

    switch (condition.type) {
        case 'genki': targetValue = state.genki; break;
        case 'impression': targetValue = state.goodImpression; break;
        case 'motivation': targetValue = state.motivation; break;
        case 'concentration': targetValue = state.concentration; break;
        case 'hp': targetValue = state.hp; break;
        case 'hp_ratio': targetValue = state.hp / state.maxHp; break;
        case 'turn': targetValue = state.turn; break;
        case 'buff': {
            const activeBuffs = state.buffs.filter(b => b.type === condition.buffType);
            if (activeBuffs.length === 0) targetValue = 0;
            else {
                targetValue = Math.max(...activeBuffs.map(b => b.duration === -1 ? 999 : b.duration));
            }
            break;
        }
        default: return false;
    }

    const threshold = condition.value ?? 0;

    switch (condition.compare) {
        case '>=': return targetValue >= threshold;
        case '<=': return targetValue <= threshold;
        case '>': return targetValue > threshold;
        case '<': return targetValue < threshold;
        case '==': return targetValue === threshold;
        default: return targetValue >= threshold;
    }
}

export function checkConditions(state: GameState, conditions?: Condition[]): boolean {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every(cond => evaluateCondition(state, cond));
}

// --- 効果適用ロジック ---

interface ResolutionResult {
    state: GameState;
    logs: string[];
}

export function resolveEffect(state: GameState, effect: Effect): ResolutionResult {
    if (effect.condition && !checkConditions(state, effect.condition)) {
        return { state, logs: [] };
    }

    let newState = { ...state };
    let logs: string[] = [];

    // デバフ無効化チェック
    if (isDebuff(effect.type)) {
        const nullifyBuffIndex = newState.buffs.findIndex(b => b.type === 'buff_no_debuff');
        if (nullifyBuffIndex >= 0) {
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
    const attributeBonus = getTurnAttributeBonus(newState);

    switch (effect.type) {
        case 'score_fixed': {
            const condMultiplier = getScoreMultiplier(newState);
            const focusMultiplier = effect.multiplier ?? 1.0;
            const focusBonus = Math.floor(newState.concentration * LOGIC_CONSTANTS.CONCENTRATION.SCORE_BONUS_PER_STACK * focusMultiplier);
            // 属性ボーナス適用
            const amount = Math.floor((value + focusBonus) * condMultiplier * attributeBonus);

            newState.score += amount;
            let msg = `パラメータ+${amount}`;
            // Detailed log logic...
            logs.push(msg);
            break;
        }
        case 'score_scale_genki': {
            const condMultiplier = getScoreMultiplier(newState);
            const amount = Math.floor(newState.genki * ratio * condMultiplier * attributeBonus);
            newState.score += amount;
            logs.push(`元気(${newState.genki})の${Math.round(ratio * 100)}%分パラメータ上昇: +${amount}`);
            break;
        }
        case 'score_scale_impression': {
            const condMultiplier = getScoreMultiplier(newState);
            const amount = Math.floor(newState.goodImpression * ratio * condMultiplier * attributeBonus);
            newState.score += amount;
            logs.push(`好印象(${newState.goodImpression})の${Math.round(ratio * 100)}%分パラメータ上昇: +${amount}`);
            break;
        }
        case 'score_scale_motivation': {
            const condMultiplier = getScoreMultiplier(newState);
            const amount = Math.floor(newState.motivation * ratio * condMultiplier * attributeBonus);
            newState.score += amount;
            logs.push(`やる気(${newState.motivation})の${Math.round(ratio * 100)}%分パラメータ上昇: +${amount}`);
            break;
        }
        case 'buff_genki': {
            if (newState.buffs.some(b => b.type === 'buff_no_genki_gain')) {
                logs.push(`元気増加無効により獲得失敗`);
                break;
            }
            const motivationBonus = newState.motivation * LOGIC_CONSTANTS.MOTIVATION.GENKI_BONUS_PER_STACK;
            const totalGain = value + motivationBonus;
            newState.genki += totalGain;

            let msg = `元気+${value}`;
            if (motivationBonus > 0) msg += `(やる気補正+${motivationBonus})`;
            logs.push(msg);
            break;
        }
        case 'buff_impression': {
            newState.goodImpression += value;
            logs.push(`好印象+${value}`);
            break;
        }
        case 'buff_motivation': {
            newState.motivation += value;
            logs.push(`やる気+${value}`);
            break;
        }
        case 'half_genki': {
            // Is this a debuff? Yes, caught by isDebuff if listed.
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
            // This is "Cost" or "Effect"?
            // If effect, it's direct damage.
            // Caught by debuff check? Probably NOT debuff, self-sacrifice.
            newState.hp = Math.max(0, newState.hp - value);
            logs.push(`体力消費 ${value}`);
            break;
        }
        case 'draw_card': {
            const MAX_HAND = 5;
            const currentHandSize = newState.hand.length;
            const canDraw = Math.max(0, MAX_HAND - currentHandSize);
            const actualDraw = Math.min(value, canDraw);

            if (actualDraw > 0) {
                // Pass newState.hand to check uniques
                const { deck, discard, hand } = drawCards(newState.deck, newState.discard, actualDraw, newState.hand);
                newState.deck = deck;
                newState.discard = discard;
                newState.hand = [...newState.hand, ...hand];
                logs.push(`スキルカードを${hand.length}枚引く`); // Actual drawn count (might be less if unique skipped)
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
        case 'swap_hand': {
            const currentHand = [...newState.hand];
            newState.discard = [...newState.discard, ...currentHand];
            // Unique check not needed for swap? Usually you draw a fresh hand.
            // Passing empty array as "currentHand" for Unique check? 
            // The hand is empty after discard.
            const { deck, discard, hand } = drawCards(newState.deck, newState.discard, currentHand.length, []);
            newState.deck = deck;
            newState.discard = discard;
            newState.hand = hand;
            logs.push(`手札をすべて入れ替える`);
            break;
        }
        case 'upgrade_hand': {
            newState.hand = newState.hand.map(card => {
                if (card.id.endsWith('_plus')) return card;
                return card;
            });
            logs.push(`手札をレッスン中強化 (簡易実装: ログのみ)`);
            break;
        }
        case 'condition_gate': {
            if (effect.subEffects) {
                effect.subEffects.forEach(sub => {
                    const result = resolveEffect(newState, sub);
                    newState = result.state;
                    logs = [...logs, ...result.logs];
                });
            }
            break;
        }
        case 'buff_concentration': {
            newState.concentration += value;
            logs.push(`集中+${value}`);
            break;
        }
        case 'buff_perfect_condition':
        case 'buff_double_strike':
        case 'buff_double_cost':
        case 'buff_cost_reduction':
        case 'buff_no_genki_gain':
        case 'buff_no_debuff': {
            // These are caught by isDebuff if negative.
            // If negative, and nullified, won't reach here.
            newState.buffs = [...newState.buffs, {
                id: `${effect.type}_${Date.now()}`,
                type: effect.type,
                duration: effect.duration ?? 1,
                count: effect.count, // Assign count
                value: effect.value,
                ratio: effect.ratio,
                name: effect.type === 'buff_cost_reduction' ? '消費体力減少' :
                    effect.type === 'buff_no_genki_gain' ? '元気増加無効' :
                        effect.type === 'buff_perfect_condition' ? '好調' :
                            effect.type === 'buff_double_strike' ? '絶好調' :
                                effect.type === 'buff_double_cost' ? '消費体力倍増' : '低下状態無効'
            }];
            logs.push(`持続効果付与: ${effect.type} (${effect.count ? (effect.count + '回') : (effect.duration + 'ターン')})`);
            break;
        }

        // TODO: 他のEffectTypeも順次実装
    }

    return { state: newState, logs };
}

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
