export type EffectType =
    // スコア獲得系
    | 'score_fixed'             // パラメーター+X
    | 'score_scale_genki'       // 元気のX%分パラメーター上昇
    | 'score_scale_impression'  // 好印象のX%分パラメーター上昇
    | 'score_scale_motivation'  // やる気のX%分パラメーター上昇

    // バフ・ステータス変動系
    | 'buff_genki'              // 元気+X
    | 'buff_impression'         // 好印象+X
    | 'buff_motivation'         // やる気+X
    | 'buff_concentration'      // 集中+X
    | 'buff_perfect_condition'  // 好調+X (ターン数)
    | 'buff_double_strike'     // 絶好調+X (ターン数)
    | 'buff_double_cost'       // 消費体力増加 (持続)
    | 'buff_shield'             // シールド+X (将来用)
    | 'buff_cost_reduction'     // 消費体力減少 (持続)
    | 'buff_no_genki_gain'      // 元気増加無効 (持続)
    | 'buff_no_debuff'          // 低下状態無効

    // 特殊変動系
    | 'half_genki'              // 元気を半分にする (0.5倍)
    | 'set_genki'               // 元気をXにする (0含む)
    | 'consume_hp'              // 体力消費 (元気無視)
    | 'reduce_hp_cost'          // 消費体力削減 (固定値/倍率)

    // カード・ドロー系
    | 'draw_card'               // スキルカードを引く
    | 'upgrade_hand'            // 手札を強化
    | 'swap_hand'               // 手札交換
    | 'add_card_play_count'     // スキルカード使用数追加

    // ターン・フェーズ系
    | 'add_turn'                // ターン追加
    | 'end_lesson'              // レッスン終了 (トラブルなど)

    // 複合・条件系
    | 'condition_gate'          // 条件を満たせばsubEffects発動
    | 'delayed_effect';         // Xターン後に発動

export type ConditionType =
    | 'genki'           // 元気
    | 'impression'      // 好印象
    | 'motivation'      // やる気
    | 'concentration'   // 集中
    | 'hp'              // 体力
    | 'turn'            // 現在ターン
    | 'phase'           // フェーズ
    | 'buff'            // 特定のバフの状態
    | 'has_trouble';    // トラブルカード所持

export type CompareOp = '>=' | '<=' | '==' | '>' | '<';

export interface Condition {
    type: ConditionType;
    value?: number;
    compare?: CompareOp;
    target?: 'self' | 'game';
    buffType?: EffectType; // buff条件用
}

export interface Effect {
    type: EffectType;

    // 数値パラメータ
    value?: number;         // 固定値 (+9, +2 など)
    ratio?: number;         // 倍率 (元気の100%分なら 1.0)
    multiplier?: number;     // 特殊倍率 (集中1.5倍など)
    duration?: number;      // 持続ターン (バフなど)

    // ターゲット
    target?: 'self' | 'opponent';

    // 条件付き・複合用
    condition?: Condition[]; // 全て満たせば発動 (AND)
    subEffects?: Effect[];   // 条件や遅延で発動する中身
}

// バフ・持続効果の定義
export interface Buff {
    id: string;      // 識別用 (同じバフの重ね掛けなどで使用)
    type: EffectType;
    duration: number; // 残りターン。-1なら永続（レッスン中）。
    count?: number;   // 回数制バフの場合 (例: 低下状態無効 1回)
    value?: number;
    ratio?: number;
    name: string;     // 表示用名称
}

// 既存のCardインターフェースを拡張するための定義
export interface LogicCardData {
    id: string;
    name: string;
    effects: Effect[];
    conditions?: Condition[]; // カード使用自体の条件 (元気が1以上など)
    startInHand?: boolean;    // レッスン開始時に手札に入る
}
