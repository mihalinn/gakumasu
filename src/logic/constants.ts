// 数値管理用の定数ファイル
// バランス調整はここを変更するだけで反映されるようにする

export const LOGIC_CONSTANTS = {
    // 好印象
    IMPRESSION: {
        TURN_END_SCORE_PER_STACK: 1,      // ターン終了時、好印象1につきスコア+1
        TURN_START_DECAY: 1,              // ターン開始時、好印象-1
    },

    // やる気
    MOTIVATION: {
        GENKI_BONUS_PER_STACK: 1,         // やる気1につき、元気回復量+1
    },

    // 集中
    CONCENTRATION: {
        SCORE_BONUS_PER_STACK: 1,         // 集中1につき、アクティブスキルスコア+1 (仮)
    },

    // 補正
    MULTIPLIER: {
        PERFECT_CONDITION_SCORE: 1.5,      // 好調時のスコア倍率
        DOUBLE_STRIKE_SCORE: 2.0,         // 絶好調時のスコア倍率
    }
} as const;
