import type { GameState, Card, Buff } from '../types';
import { applyCardEffects } from './effectResolver';
import { LOGIC_CONSTANTS } from './constants';
import { shuffle, drawCards } from './utils';

/**
 * ゲームの初期状態定数
 * 基本的なパラメータの初期値を定義します。
 */
export const INITIAL_STATE: GameState = {
    turn: 1,
    maxTurns: 12,
    phase: 'start',
    hp: 30,
    maxHp: 30,
    vocal: 0,
    dance: 0,
    visual: 0,
    shield: 0,
    genki: 0,
    goodImpression: 0,
    motivation: 0,
    concentration: 0,
    score: 0,
    deck: [],
    hand: [],
    discard: [],
    onHold: [],
    excluded: [],
    cardsPlayed: 0,
    pItems: [],
    pDrinks: [],
    buffs: [],
    logs: [],
};

/**
 * ゲームの初期化を行います。
 * 
 * 1. デッキの構築（初手確定カードとそれ以外を分離）
 * 2. 山札のシャッフル
 * 3. 初期手札のドロー（startInHandカード + 足りない分を山札から）
 * 4. 初期ステータスの設定
 * 
 * @param initialStatus キャラクターの初期ステータス（Pランク等による補正）
 * @param turnAttributes 各ターンのレッスン属性（Vocal, Dance, Visual）
 * @param targetDeck 使用するデッキデータ
 * @param initialPDrinks 持ち込みPドリンク
 */
export function initializeGame(
    initialStatus: { vocal: number; dance: number; visual: number; hp: number; maxHp: number } | undefined,
    turnAttributes: import('../types').LessonAttribute[] | undefined,
    targetDeck: Card[] | undefined,
    initialPDrinks: import('../types').PDrink[] | undefined
): GameState {
    // 初手に必ず来るカード(startInHand)と、それ以外(山札候補)を分ける
    const startHandCards = (targetDeck || []).filter(c => c.startInHand);
    const remainingDeckCards = (targetDeck || []).filter(c => !c.startInHand);

    // 山札候補をシャッフル
    const shuffledDeck = shuffle(remainingDeckCards);

    // 初期手札は基本3枚。startInHandで既に持っている分を差し引いてドロー数を決定
    const drawTarget = 3;
    const drawCount = Math.max(0, drawTarget - startHandCards.length);

    // カードを引く
    const { deck, hand: drawnHand, discard } = drawCards(shuffledDeck, [], drawCount);

    return {
        ...INITIAL_STATE,
        ...initialStatus,
        hp: initialStatus?.hp ?? INITIAL_STATE.hp,
        maxHp: initialStatus?.maxHp ?? INITIAL_STATE.maxHp,
        currentTurnAttribute: turnAttributes ? turnAttributes[0] : 'vocal',
        deck,
        // 手札 = 初手確定カード + ドローしたカード
        hand: [...startHandCards, ...drawnHand],
        discard,
        onHold: [],
        excluded: [],
        cardsPlayed: 0,
        pDrinks: initialPDrinks ? initialPDrinks.map(d => ({ drink: d, used: false })) : [],
        logs: ['ターン1 開始'],
    };
}

/**
 * カード使用時の実際のコスト（消費体力）を計算します。
 * バフによる消費削減などを適用します。
 * 
 * @param card 使用するカード
 * @param buffs 現在かかっているバフ一覧
 */
export function calculateActualCost(card: Card, buffs: Buff[]): number {
    // 固定値削減 (reduce_hp_cost)
    let reductionFlat = 0;
    buffs.forEach(b => {
        if (b.type === 'reduce_hp_cost') reductionFlat += (b.value ?? 0);
    });
    let actualCost = Math.max(0, card.cost - reductionFlat);

    // 割合削減 (buff_cost_reduction: 50%オフなど)
    const hasCostReductionBuff = buffs.some(b => b.type === 'buff_cost_reduction');
    // 消費倍増 (buff_double_cost: スタートダッシュなど)
    const hasDoubleCostBuff = buffs.some(b => b.type === 'buff_double_cost');

    // 消費体力増加 (debuff_cost_increase: +X)
    let increaseFlat = 0;
    buffs.forEach(b => {
        if (b.type === 'debuff_cost_increase') increaseFlat += (b.value ?? 0);
    });
    actualCost += increaseFlat;

    if (hasCostReductionBuff) actualCost = Math.floor(actualCost * 0.5);
    if (hasDoubleCostBuff) actualCost *= 2;

    return Math.max(0, actualCost);
}

/**
 * カードプレイのメインロジック
 * 
 * 1. 使用回数制限のチェック
 * 2. カードの特定
 * 3. コストの計算と支払（元気優先、足りなければ体力）
 * 4. カード効果の適用 (EffectResolver)
 * 5. 使用後のカード移動（捨札 or 除外）
 * 
 * @param prevState 現在のゲーム状態
 * @param cardId 使用するカードのID
 */
export function playCardCore(prevState: GameState, cardId: string): GameState {
    // 1ターン1枚制限（暫定）
    if (prevState.cardsPlayed >= 1) return prevState;

    // 手札からカードを探す
    const cardIndex = prevState.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return prevState;

    const newHand = [...prevState.hand];
    const [playedCard] = newHand.splice(cardIndex, 1);

    // コスト計算
    const actualCost = calculateActualCost(playedCard, prevState.buffs);

    // リソースチェック: 払えるか？ (体力0以上であること)
    // ※体力0でもコスト0なら使用可能
    const consumeMotEffect = playedCard.effects?.find(e => e.type === 'consume_motivation');
    if (consumeMotEffect && prevState.motivation < consumeMotEffect.value!) {
        return prevState; // Not enough motivation
    }
    const consumeImpEffect = playedCard.effects?.find(e => e.type === 'consume_impression');
    if (consumeImpEffect && prevState.goodImpression < consumeImpEffect.value!) {
        return prevState; // Not enough impression
    }

    // リソースチェック: 払えるか？ (体力0以上であること)
    if (prevState.hp + prevState.genki < actualCost) {
        return prevState;
    }

    // Reaction Trigger: On HP Cost Consumed (before payment? or after? logic says "体力減少時")
    // If it's "On Cost Payment", we trigger BEFORE or AFTER?
    // "スキルカードコストで体力減少時" -> When HP decreases due to cost.
    // So if actualCost > genki, we have HP consumption.
    const hpConsumption = Math.max(0, actualCost - prevState.genki);
    let reactionEffects: import('../types').Effect[] = [];

    if (hpConsumption > 0) {
        // Find reaction buffs
        const reactionBuffs = prevState.buffs.filter(b => b.type === 'buff_reaction_on_cost');
        // Collect effects (triggeredEffect)
        reactionBuffs.forEach(b => {
            if (b.triggeredEffect) {
                reactionEffects.push(b.triggeredEffect);
            }
        });
    }

    // リソース消費: 元気を優先して消費し、足りない分を体力から引く
    let remainingCost = actualCost;
    let newGenki = prevState.genki;
    let newHp = prevState.hp;

    if (newGenki >= remainingCost) {
        newGenki -= remainingCost;
        remainingCost = 0;
    } else {
        remainingCost -= newGenki;
        newGenki = 0;
        newHp -= remainingCost;
    }

    // 中間状態作成（コスト支払い済み、カード効果適用前）
    const midState: GameState = {
        ...prevState,
        hand: newHand,
        genki: newGenki,
        hp: newHp,
        cardsPlayed: prevState.cardsPlayed + 1,
    };

    // カード効果の適用
    let afterEffectState = midState;
    if (playedCard.effects) {
        // Apply card effects
        afterEffectState = applyCardEffects(midState, playedCard.effects);

        // Apply reaction effects if any (AFTER actual cost payment logic)
        // Let's assume for now I need to align it.
        // In `engine.ts` currently: `afterEffectState = applyCardEffects(midState, playedCard.effects);`
        // So `applyCardEffects` MUST return `GameState`.
        // I need to verify `effectResolver.ts` export return type.
        if (reactionEffects.length > 0) {
            // Re-apply reactions
            afterEffectState = applyCardEffects(afterEffectState, reactionEffects);
            afterEffectState.logs = [...(afterEffectState.logs || []), ...reactionEffects.map(e => `反応効果発動: ${e.type}`)];
        }
    } else {
        // 効果がない場合（通常ありえないが安全策）
        afterEffectState = {
            ...midState,
            logs: [...(midState.logs || []), `(No effects data for: ${playedCard.name})`]
        };
    }

    // 使用済みカードの行き先決定
    let newDiscard = [...afterEffectState.discard];
    let newExcluded = [...(prevState.excluded || [])];

    if (playedCard.usageLimit === 'once_per_lesson') {
        newExcluded.push(playedCard); // レッスン中1回のみ -> 除外
    } else {
        newDiscard.push(playedCard); // 通常 -> 捨札
    }

    return {
        ...afterEffectState,
        discard: newDiscard,
        excluded: newExcluded,
        logs: [
            ...(afterEffectState.logs || []),
            `カード使用: ${playedCard.name}${actualCost > 0 ? ` (消費: ${actualCost})` : ''} `
        ],
    };
}

/**
 * ターン終了処理
 * 
 * 1. ターン数の進行チェック
 * 2. スキップ回復処理（カード未使用時 +2）
 * 3. 手札の処理（全て捨札へ ※保留実装時はここが変わる）
 * 4. 次の手札をドロー（基本3枚、最大5枚）
 * 5. ターン終了時効果の適用（好印象によるスコア加算など）
 * 6. バフ経過時間の更新（Duration減少）
 * 
 * @param prevState 現在のゲーム状態
 * @param turnAttributes ターン属性配列
 */
export function endTurnCore(prevState: GameState, turnAttributes?: import('../types').LessonAttribute[]): GameState {
    if (prevState.turn >= prevState.maxTurns) return prevState;

    const nextTurn = prevState.turn + 1;
    let nextHp = prevState.hp;
    let skipLog = "";

    // カードを使用せずにターン終了した場合のみ、体力を小回復（スキップ扱い）
    if (prevState.cardsPlayed === 0) {
        nextHp = Math.min(prevState.maxHp, prevState.hp + 2);
        skipLog = " (スキップ回復 +2)";
    }

    // 現在の手札と捨札をまとめる（これを元に次のドローを行うかもしれない）
    // ※現在は手札を全て捨札に送ってからドロー判定
    const currentDiscard = [...prevState.discard, ...prevState.hand];
    const nextHand: Card[] = [];

    // ドロー枚数決定ロジック
    // 手札上限: 5枚
    // 基本ドロー: 3枚になるように引く (BASE_DRAW_TARGET)
    const MAX_HAND = 5;
    const BASE_DRAW_TARGET = 3;

    const currentHandSize = nextHand.length; // 現在は常に0（保留未実装のため）
    const drawCount = Math.max(0, BASE_DRAW_TARGET - currentHandSize);

    // 安全策: ドローしてもMAX_HANDを超えないようにする
    const safeDrawCount = Math.min(drawCount, MAX_HAND - currentHandSize);

    // カードを引く (山札がない場合は捨札をシャッフルして補充)
    const { deck: newDeck, hand: drawnHand, discard: newDiscard } = drawCards(prevState.deck, currentDiscard, safeDrawCount);

    // 好印象 (Good Impression) によるターン終了時スコア加算
    const goodImpressionScore = prevState.goodImpression * LOGIC_CONSTANTS.IMPRESSION.TURN_END_SCORE_PER_STACK;

    // バフの持続ターン更新
    const updatedBuffs = prevState.buffs
        .map(b => {
            if (b.duration === -1) return b; // 永続バフ

            // 重要: そのターンに付与されたバフ(isNew)は、付与ターン終了時には減らない
            if (b.isNew) {
                const { isNew, ...rest } = b;
                return { ...rest } as Buff; // isNewフラグだけ外す
            }
            return { ...b, duration: b.duration - 1 };
        })
        .filter(b => b.duration !== 0); // 持続0になったら消滅

    // 好印象値の自然減衰 (-1)
    const nextImpression = Math.max(0, prevState.goodImpression - 1);

    let newState: GameState = {
        ...prevState,
        score: prevState.score + goodImpressionScore,
        hp: nextHp,
        turn: nextTurn,
        phase: 'start',
        currentTurnAttribute: turnAttributes
            ? (turnAttributes[Math.min(nextTurn - 1, turnAttributes.length - 1)] ?? 'vocal')
            : 'vocal',
        deck: newDeck,
        hand: [...nextHand, ...drawnHand], // 手札を更新
        discard: newDiscard,
        buffs: updatedBuffs,
        goodImpression: nextImpression, // 減衰後の値をセット
        cardsPlayed: 0, // 使用数リセット
        logs: [
            ...prevState.logs,
            ...(goodImpressionScore > 0 ? [`好印象スコア: +${goodImpressionScore} `] : []),
            `ターン${nextTurn} 開始(好印象 - 1)${skipLog} `
        ],
    };

    // ターン開始時効果 (triggers at start of NEXT turn)
    const turnStartBuffs = newState.buffs.filter(b => b.type === 'buff_turn_start');
    if (turnStartBuffs.length > 0) {
        const triggers = turnStartBuffs.map(b => b.triggeredEffect).filter(e => e !== undefined) as import('../types').Effect[];
        if (triggers.length > 0) {
            const resultState = applyCardEffects(newState, triggers);
            // Result state has updated logs
            newState = resultState;
            newState.logs = [...resultState.logs, `ターン開始時効果発動 (${triggers.length}個)`];
        }
    }

    return newState;
}
