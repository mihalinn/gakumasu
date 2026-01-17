import type { GameState } from '../types/index';
import type { Effect, Condition } from './types';
import { LOGIC_CONSTANTS } from './constants';
import { drawCards } from './utils';

// --- ユーティリティ ---

function getScoreMultiplier(state: GameState): number {
    let multiplier = 1.0;
    if (state.buffs.some(b => b.type === 'buff_double_strike')) {
        multiplier *= LOGIC_CONSTANTS.MULTIPLIER.DOUBLE_STRIKE_SCORE;
    } else if (state.buffs.some(b => b.type === 'buff_perfect_condition')) {
        multiplier *= LOGIC_CONSTANTS.MULTIPLIER.PERFECT_CONDITION_SCORE;
    }
    return multiplier;
}

// --- 条件判定ロジック ---

function evaluateCondition(state: GameState, condition: Condition): boolean {
    let targetValue = 0;

    switch (condition.type) {
        case 'genki': targetValue = state.genki; break;
        case 'impression': targetValue = state.goodImpression; break;
        case 'motivation': targetValue = state.motivation; break;
        case 'concentration': targetValue = state.concentration; break;
        case 'hp': targetValue = state.hp; break;
        case 'turn': targetValue = state.turn; break;
        case 'buff': {
            // 指定された種類のバフの残り継続ターン（または回数）を合計して判定
            // durationが-1の場合は大きな数値として扱うか、または1以上なら存在すると判定
            const activeBuffs = state.buffs.filter(b => b.type === condition.buffType);
            if (activeBuffs.length === 0) targetValue = 0;
            else {
                // 基本的には「存在するかどうか」または「スタック数」だが、ここでは継続ターンの最大値とする
                targetValue = Math.max(...activeBuffs.map(b => b.duration === -1 ? 999 : b.duration));
            }
            break;
        }
        // case 'has_trouble': ignore for now
        default: return false;
    }

    const threshold = condition.value ?? 0;

    switch (condition.compare) {
        case '>=': return targetValue >= threshold;
        case '<=': return targetValue <= threshold;
        case '>': return targetValue > threshold;
        case '<': return targetValue < threshold;
        case '==': return targetValue === threshold;
        default: return targetValue >= threshold; // Default to >=
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
    // 条件チェック (Effect自体にconditionがある場合)
    if (effect.condition && !checkConditions(state, effect.condition)) {
        return { state, logs: [] }; // 条件不一致なので何もしない
    }

    let newState = { ...state };
    let logs: string[] = [];
    const value = effect.value ?? 0;
    const ratio = effect.ratio ?? 1.0;

    switch (effect.type) {
        case 'score_fixed': {
            const condMultiplier = getScoreMultiplier(newState);
            const focusMultiplier = effect.multiplier ?? 1.0;
            const focusBonus = Math.floor(newState.concentration * LOGIC_CONSTANTS.CONCENTRATION.SCORE_BONUS_PER_STACK * focusMultiplier);
            const amount = Math.floor((value + focusBonus) * condMultiplier);

            newState.score += amount;
            let msg = `パラメータ+${amount}`;
            if (condMultiplier > 1 || focusBonus > 0) {
                msg += ` (基礎${value}`;
                if (focusBonus > 0) msg += ` + 集中x${focusMultiplier}(${focusBonus})`;
                if (condMultiplier > 1) msg += `) x${condMultiplier}`;
                else msg += `)`;
            }
            logs.push(msg);
            break;
        }
        case 'score_scale_genki': {
            const multiplier = getScoreMultiplier(newState);
            const amount = Math.floor(newState.genki * ratio * multiplier);
            newState.score += amount;
            logs.push(`元気(${newState.genki})の${Math.round(ratio * 100)}%分パラメータ上昇: +${amount}${multiplier > 1 ? ` (x${multiplier})` : ''}`);
            break;
        }
        case 'score_scale_impression': {
            const multiplier = getScoreMultiplier(newState);
            const amount = Math.floor(newState.goodImpression * ratio * multiplier);
            newState.score += amount;
            logs.push(`好印象(${newState.goodImpression})の${Math.round(ratio * 100)}%分パラメータ上昇: +${amount}${multiplier > 1 ? ` (x${multiplier})` : ''}`);
            break;
        }
        case 'score_scale_motivation': {
            const multiplier = getScoreMultiplier(newState);
            const amount = Math.floor(newState.motivation * ratio * multiplier);
            newState.score += amount;
            logs.push(`やる気(${newState.motivation})の${Math.round(ratio * 100)}%分パラメータ上昇: +${amount}${multiplier > 1 ? ` (x${multiplier})` : ''}`);
            break;
        }
        case 'buff_genki': {
            // 元気増加無効バフのチェック
            if (newState.buffs.some(b => b.type === 'buff_no_genki_gain')) {
                logs.push(`元気増加無効により獲得失敗`);
                break;
            }
            // やる気によるボーナス計算 (定数管理)
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
            // 元気を無視して直接HPを減らす
            // TODO: HPが0になる場合の処理 (ゲームオーバー判定など) は別途state側で持つべきか
            newState.hp = Math.max(0, newState.hp - value);
            logs.push(`体力消費 ${value}`);
            break;
        }
        case 'draw_card': {
            const { deck, discard, hand } = drawCards(newState.deck, newState.discard, value);
            newState.deck = deck;
            newState.discard = discard;
            newState.hand = [...newState.hand, ...hand];
            logs.push(`スキルカードを${value}枚引く`);
            break;
        }
        case 'add_card_play_count': {
            // cardsPlayedを減らすことで上限を増やす
            newState.cardsPlayed = Math.max(0, newState.cardsPlayed - value);
            logs.push(`スキルカード使用数追加 +${value}`);
            break;
        }
        case 'swap_hand': {
            // 全ての手札を捨て札へ
            const currentHand = [...newState.hand];
            newState.discard = [...newState.discard, ...currentHand];
            // 同じ枚数（またはデフォルト3枚）引く。仕切り直しの仕様が「全て入れ替える」なので、元の枚数
            const { deck, discard, hand } = drawCards(newState.deck, newState.discard, currentHand.length);
            newState.deck = deck;
            newState.discard = discard;
            newState.hand = hand;
            logs.push(`手札をすべて入れ替える`);
            break;
        }
        case 'upgrade_hand': {
            // 手札のカードを「+」版にアップグレードするロジック
            // 本来はマスターデータが必要。ここでは暫定的にIDの末尾に「_plus」を付けて、deckデータから探し直すか
            // または Card 型に upgradedVersion?: Card を持たせる必要がある
            // 一旦ログのみにするが、ID置換の簡易実装を試みる
            newState.hand = newState.hand.map(card => {
                if (card.id.endsWith('_plus')) return card;
                // ここでは新しいカードを生成する術がないので（元のリストがない）、
                // 呼び出し元で全カードリストを持っておく必要がある。
                // 暫定: ログのみ
                return card;
            });
            logs.push(`手札をレッスン中強化 (簡易実装: ログのみ)`);
            break;
        }
        case 'condition_gate': {
            // ConditionGateは、Effect自体のcondition判定が通った場合にsubEffectsを実行する
            // resolveEffectの冒頭でconditionチェックしているので、ここに到達＝条件クリア
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
            newState.buffs = [...newState.buffs, {
                id: `${effect.type}_${Date.now()}`,
                type: effect.type,
                duration: effect.duration ?? 1,
                value: effect.value,
                ratio: effect.ratio,
                name: effect.type === 'buff_cost_reduction' ? '消費体力減少' :
                    effect.type === 'buff_no_genki_gain' ? '元気増加無効' :
                        effect.type === 'buff_perfect_condition' ? '好調' :
                            effect.type === 'buff_double_strike' ? '絶好調' :
                                effect.type === 'buff_double_cost' ? '消費体力倍増' : '低下状態無効'
            }];
            logs.push(`持続効果付与: ${effect.type} (${effect.duration}ターン)`);
            break;
        }

        // TODO: 他のEffectTypeも順次実装
    }

    return { state: newState, logs };
}

// 複数の効果を一括適用するヘルパー
export function applyCardEffects(initialState: GameState, effects: Effect[]): GameState {
    let currentState = { ...initialState };
    let allLogs: string[] = [];

    for (const effect of effects) {
        const result = resolveEffect(currentState, effect);
        currentState = result.state;
        allLogs = [...allLogs, ...result.logs];
    }

    // 最後にまとめてログを追加
    if (allLogs.length > 0) {
        currentState.logs = [...(currentState.logs || []), ...allLogs];
    }

    return currentState;
}
