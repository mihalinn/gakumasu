
// Effect & Condition Types (from logic/types.ts)
export type EffectType =
    | 'score_fixed'
    | 'score_scale_genki'
    | 'score_scale_impression'
    | 'score_scale_motivation'
    | 'buff_genki'
    | 'buff_impression'
    | 'buff_motivation'
    | 'buff_concentration'
    | 'buff_perfect_condition'
    | 'buff_double_strike'
    | 'buff_double_cost'
    | 'buff_shield'
    | 'buff_cost_reduction'
    | 'buff_no_genki_gain'
    | 'buff_no_debuff'
    | 'half_genki'
    | 'set_genki'
    | 'consume_hp'
    | 'reduce_hp_cost'
    | 'draw_card'
    | 'upgrade_hand'
    | 'swap_hand'
    | 'add_card_play_count'
    | 'add_turn'
    | 'end_lesson'
    | 'condition_gate'
    | 'delayed_effect'
    // New types
    | 'generate_trouble'
    | 'buff_score_bonus'
    | 'buff_turn_start'
    | 'buff_on_card_use'
    | 'consume_motivation'
    | 'consume_impression'
    | 'buff_impression_gain'
    | 'buff_card_base_value'
    | 'trigger_random_hand_card'
    | 'buff_reaction_on_cost'
    | 'multiply_impression'
    | 'debuff_cost_increase';

export type ConditionType =
    | 'genki'
    | 'impression'
    | 'motivation'
    | 'concentration'
    | 'hp'
    | 'hp_ratio'
    | 'hp_percent'
    | 'turn'
    | 'phase'
    | 'buff'
    | 'has_trouble'
    | 'trouble_card_count'
    | 'card_type_usage';

export type CompareOp = '>=' | '<=' | '==' | '>' | '<';

export interface Condition {
    type: ConditionType;
    value?: number;
    compare?: CompareOp;
    target?: 'self' | 'game';
    buffType?: EffectType;
    cardType?: CardType; // type='card_type_usage'
    scope?: 'hand' | 'deck' | 'discard' | 'all'; // type='trouble_card_count'
}

export interface Effect {
    type: EffectType;
    value?: number;
    ratio?: number;
    multiplier?: number;
    duration?: number;
    count?: number;
    target?: 'self' | 'opponent';
    condition?: Condition[];
    subEffects?: Effect[];
    troubleId?: string; // generate_trouble
    triggeredEffect?: Effect; // buff_turn_start, buff_on_card_use
    triggerCondition?: Condition; // buff_on_card_use
    targetRarity?: string; // trigger_random_hand_card
    ignoreCost?: boolean; // trigger_random_hand_card
    param?: 'genki' | 'impression' | 'motivation'; // buff_card_base_value
}

export interface Buff {
    id: string;
    type: EffectType;
    duration: number;
    count?: number;
    value?: number;
    ratio?: number;
    name: string;
    isNew?: boolean;
    triggeredEffect?: Effect;
    triggerCondition?: Condition;
    param?: 'genki' | 'impression' | 'motivation';
}

// Card Types (from types/index.ts)
export type CardType = 'active' | 'mental' | 'trouble';
export type CardPlan =
    | 'logic' | 'sense' | 'anomaly' | 'free' | 'trouble'
    | 'unique_logic' | 'unique_sense' | 'unique_anomaly' | 'unique_free'
    | 'support_logic' | 'support_sense' | 'support_anomaly' | 'support_free'
    | 'basic_logic' | 'basic_sense' | 'basic_anomaly' | 'basic_free';

export interface Card {
    id: string;
    name: string;
    type: CardType;
    plan: CardPlan;
    rarity?: string;
    cost: number;
    effect: string; // Legacy description
    image?: string;
    effects?: Effect[];
    conditions?: Condition[];
    startInHand?: boolean;
    usageLimit?: 'once_per_lesson';
    unique?: boolean;
    costType?: 'normal' | 'hp';
}

export interface LogicCardData { // From logic/types.ts
    id: string;
    name: string;
    effects: Effect[];
    conditions?: Condition[];
    startInHand?: boolean;
}
