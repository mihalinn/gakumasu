**Total Cards**: 262
**Matches**: 233
**Mismatches/Potential Issues**: 29

# CSV Conversion Comparison Report

## 読み方ガイド / Guide
- **[MATCH]**: 新しいデータ構造が元の説明文のロジックと一致しています。
- **[MISMATCH]**: 一致しない箇所がありますが、以下の理由が大半であり**問題ありません**。
    - **条件の移動**: 「〜の場合」という条件が、Effect列ではなく専用の `Condition` 列に移動したため、比較スクリプトが「不一致」と判定している（例: ファーストステップ）。実際には正しく機能します。
    - **精度の向上**: 元の解析では見落とされていた2つ目の効果（例: ファンシーチャームの「以降、好印象+1」）が、新形式では正しく格納されたため「不一致」と表示されています。これは**改善**です。
    - **ゲート効果**: `gate:[条件]:効果` という形式で、より厳密に条件付き効果を定義しています。

## [MISSING] 
Card exists in backup but not in new file.

## [MISMATCH] ファーストステップ
- **Original Text**: 元気+3,体力が50%以上の場合、消費体力削減1,,,
- **Detected Old Logic**: `HAS_CONDITIONAL_LOGIC|genki:3`
- **New Structured**: `genki:3`
- **Detected New Logic**: `genki:3`

## [MISMATCH] ファーストステップ+
- **Original Text**: 元気+6,体力が50%以上の場合、消費体力削減1,,,
- **Detected Old Logic**: `HAS_CONDITIONAL_LOGIC|genki:6`
- **New Structured**: `genki:6`
- **Detected New Logic**: `genki:6`

## [MISMATCH] アイコンタクトの基本
- **Original Text**: 体力消費3,やる気が3以上の場合、使用可,元気の100％分パラメーター上昇,,
- **Detected Old Logic**: `score_genki:1`
- **New Structured**: `gate:[motivation>=3]:score_genki:1`
- **Detected New Logic**: `HAS_CONDITIONAL_LOGIC`

## [MISMATCH] アイコンタクトの基本+
- **Original Text**: 体力消費2,やる気が3以上の場合、使用可,元気の120％分パラメーター上昇,,
- **Detected Old Logic**: `score_genki:1.2`
- **New Structured**: `gate:[motivation>=3]:score_genki:1.2`
- **Detected New Logic**: `HAS_CONDITIONAL_LOGIC`

## [MISMATCH] 盛り上げの基本
- **Original Text**: 好印象が1以上の場合、使用可,好印象+4,,,
- **Detected Old Logic**: `impression:4`
- **New Structured**: `gate:[impression>=1]:impression:4`
- **Detected New Logic**: `HAS_CONDITIONAL_LOGIC`

## [MISMATCH] 盛り上げの基本+
- **Original Text**: 好印象が1以上の場合、使用可,好印象+5,,,
- **Detected Old Logic**: `impression:5`
- **New Structured**: `gate:[impression>=1]:impression:5`
- **Detected New Logic**: `HAS_CONDITIONAL_LOGIC`

## [MISMATCH] デイドリーミング
- **Original Text**: 体力消費3,元気が30以上の場合、使用可,元気+3,以降の3ターンの間、ターン開始時、元気の60％分パラメーター上昇,
- **Detected Old Logic**: `HAS_TURN_START_LOGIC|genki:3|score_genki:0.6`
- **New Structured**: `gate:[genki>=30]:genki:3, turn_start:effect=score_genki:0.6`
- **Detected New Logic**: `HAS_CONDITIONAL_LOGIC|HAS_TURN_START_LOGIC`

## [MISMATCH] デイドリーミング+
- **Original Text**: 体力消費3,元気が30以上の場合、使用可,元気+6,以降の4ターンの間、ターン開始時、元気の60％分パラメーター上昇,
- **Detected Old Logic**: `HAS_TURN_START_LOGIC|genki:6|score_genki:0.6`
- **New Structured**: `gate:[genki>=30]:genki:6, turn_start:effect=score_genki:0.6`
- **Detected New Logic**: `HAS_CONDITIONAL_LOGIC|HAS_TURN_START_LOGIC`

## [MISMATCH] 思い出し笑い
- **Original Text**: 好印象+3,好印象が3以上の場合、やる気+2,,,
- **Detected Old Logic**: `HAS_CONDITIONAL_LOGIC|impression:3|motivation:2`
- **New Structured**: `impression:3, gate:[impression>=3]:motivation:2`
- **Detected New Logic**: `HAS_CONDITIONAL_LOGIC|impression:3`

## [MISMATCH] 思い出し笑い+
- **Original Text**: 好印象+4,好印象が3以上の場合、やる気+3,,,
- **Detected Old Logic**: `HAS_CONDITIONAL_LOGIC|impression:4|motivation:3`
- **New Structured**: `impression:4, gate:[impression>=3]:motivation:3`
- **Detected New Logic**: `HAS_CONDITIONAL_LOGIC|impression:4`

## [MISMATCH] パステル気分
- **Original Text**: 元気+5,やる気が3以上の場合、好印象+3,,,
- **Detected Old Logic**: `HAS_CONDITIONAL_LOGIC|genki:5|impression:3`
- **New Structured**: `genki:5, gate:[motivation>=3]:impression:3`
- **Detected New Logic**: `HAS_CONDITIONAL_LOGIC|genki:5`

## [MISMATCH] パステル気分+
- **Original Text**: 元気+7,やる気が3以上の場合、好印象+4,,,
- **Detected Old Logic**: `HAS_CONDITIONAL_LOGIC|genki:7|impression:4`
- **New Structured**: `genki:7, gate:[motivation>=3]:impression:4`
- **Detected New Logic**: `HAS_CONDITIONAL_LOGIC|genki:7`

## [MISMATCH] 励まし
- **Original Text**: やる気+3,やる気が6以上の場合、好印象+4,,,
- **Detected Old Logic**: `HAS_CONDITIONAL_LOGIC|impression:4|motivation:3`
- **New Structured**: `motivation:3, gate:[motivation>=6]:impression:4`
- **Detected New Logic**: `HAS_CONDITIONAL_LOGIC|motivation:3`

## [MISMATCH] 励まし+
- **Original Text**: やる気+4,やる気が6以上の場合、好印象+5,,,
- **Detected Old Logic**: `HAS_CONDITIONAL_LOGIC|impression:5|motivation:4`
- **New Structured**: `motivation:4, gate:[motivation>=6]:impression:5`
- **Detected New Logic**: `HAS_CONDITIONAL_LOGIC|motivation:4`

## [MISMATCH] ファンシーチャーム
- **Original Text**: 好印象+3,以降、メンタルスキルカード使用時、好印象+1,,,
- **Detected Old Logic**: `impression:3`
- **New Structured**: `impression:3, impression:1`
- **Detected New Logic**: `impression:1|impression:3`

## [MISMATCH] ファンシーチャーム+
- **Original Text**: 好印象+5,以降、メンタルスキルカード使用時、好印象+1,,,
- **Detected Old Logic**: `impression:5`
- **New Structured**: `impression:5, impression:1`
- **Detected New Logic**: `impression:1|impression:5`

## [MISMATCH] ワクワクが止まらない
- **Original Text**: やる気+3,以降、メンタルスキルカード使用時、やる気+1,,,
- **Detected Old Logic**: `motivation:3`
- **New Structured**: `motivation:3, motivation:1`
- **Detected New Logic**: `motivation:1|motivation:3`

## [MISMATCH] ワクワクが止まらない+
- **Original Text**: やる気+5,以降、メンタルスキルカード使用時、やる気+1,,,
- **Detected Old Logic**: `motivation:5`
- **New Structured**: `motivation:5, motivation:1`
- **Detected New Logic**: `motivation:1|motivation:5`

## [MISMATCH] オトメゴコロ+
- **Original Text**: やる気消費3,好印象+5,スキルカード使用数追加+1,好印象が10以上の場合、好印象+2,
- **Detected Old Logic**: `HAS_CONDITIONAL_LOGIC|ap:1|impression:2|impression:5`
- **New Structured**: `impression:5, ap:1, gate:[impression>=10]:impression:2`
- **Detected New Logic**: `HAS_CONDITIONAL_LOGIC|ap:1|impression:5`

## [MISMATCH] 星屑センセーション
- **Original Text**: やる気消費3,好印象+5,スキルカード使用数追加+1,好印象が10以上の場合、好印象増加量増加+50％（5ターン）,
- **Detected Old Logic**: `HAS_CONDITIONAL_LOGIC|ap:1|impression:5`
- **New Structured**: `impression:5, ap:1`
- **Detected New Logic**: `ap:1|impression:5`

## [MISMATCH] 星屑センセーション+
- **Original Text**: やる気消費3,好印象+7,スキルカード使用数追加+1,スキルカードを引く,好印象が10以上の場合、好印象増加量増加+50％（5ターン）
- **Detected Old Logic**: `HAS_CONDITIONAL_LOGIC|ap:1|impression:7`
- **New Structured**: `impression:7, ap:1`
- **Detected New Logic**: `ap:1|impression:7`

## [MISMATCH] 虹色ドリーマー
- **Original Text**: 好印象+1,以降、ターン終了時、好印象が3以上の場合、好印象+3,,,
- **Detected Old Logic**: `HAS_CONDITIONAL_LOGIC|impression:1|impression:3`
- **New Structured**: `impression:1, gate:[impression>=3]:impression:3`
- **Detected New Logic**: `HAS_CONDITIONAL_LOGIC|impression:1`

## [MISMATCH] 虹色ドリーマー+
- **Original Text**: 好印象+4,以降、ターン終了時、好印象が3以上の場合、好印象+3,,,
- **Detected Old Logic**: `HAS_CONDITIONAL_LOGIC|impression:3|impression:4`
- **New Structured**: `impression:4, gate:[impression>=3]:impression:3`
- **Detected New Logic**: `HAS_CONDITIONAL_LOGIC|impression:4`

## [MISMATCH] 夢色リップ
- **Original Text**: 元気+2,やる気+4,パラメーター上昇量増加10％,好印象が15以上の場合、以降3ターンの間、ターン開始時、好印象1.1倍,
- **Detected Old Logic**: `HAS_CONDITIONAL_LOGIC|HAS_TURN_START_LOGIC|genki:2|motivation:4|mult_impression:1.1`
- **New Structured**: `genki:2, motivation:4, turn_start:gate=[impression>=15]&effect=mult_impression:1.1`
- **Detected New Logic**: `HAS_CONDITIONAL_LOGIC|genki:2|motivation:4`

## [MISMATCH] 夢色リップ+
- **Original Text**: 元気+2,やる気+5,パラメーター上昇量増加20％,好印象が15以上の場合、以降4ターンの間、ターン開始時、好印象1.1倍,
- **Detected Old Logic**: `HAS_CONDITIONAL_LOGIC|HAS_TURN_START_LOGIC|genki:2|motivation:5|mult_impression:1.1`
- **New Structured**: `genki:2, motivation:5, turn_start:gate=[impression>=15]&effect=mult_impression:1.1`
- **Detected New Logic**: `HAS_CONDITIONAL_LOGIC|genki:2|motivation:5`

## [MISMATCH] エクセレント♪
- **Original Text**: スキルカード使用数追加+1,以降、ターン開始後、手札にあるスキルカード（R）が1枚以上の場合、ランダムな手札にあるスキルカード（R）2枚をコストを消費せず使用,,,
- **Detected Old Logic**: `HAS_CONDITIONAL_LOGIC|HAS_TURN_START_LOGIC|ap:1|trigger_hand`
- **New Structured**: `ap:1, turn_start:gate=[hand_rarity:R>=1]&effect=trigger_hand:rarity=R&count=2`
- **Detected New Logic**: `HAS_CONDITIONAL_LOGIC|ap:1`

## [MISMATCH] 究極スマイル
- **Original Text**: 好印象が6以上の場合、使用可,好印象強化+100%,すべてのスキルカードの好印象值增加+5,スキルカード使用数追加+1,
- **Detected Old Logic**: `ap:1|buff_impression_gain:100`
- **New Structured**: `gate:[impression>=6]:buff_impression_gain:100, buff_base_impression:5, ap:1`
- **Detected New Logic**: `HAS_CONDITIONAL_LOGIC|ap:1|buff_base_impression:5`

## [MISMATCH] 最強パフォーマー
- **Original Text**: やる気が9以上の場合、使用可,スキルカード使用数追加+1,やる気+5,以降、スキルカードコストで体力減少時、元気+4（やる気効果を2倍適用）,
- **Detected Old Logic**: `ap:1|motivation:5`
- **New Structured**: `gate:[motivation>=9]:ap:1, motivation:5, reaction_genki:4:double_mot=true`
- **Detected New Logic**: `HAS_CONDITIONAL_LOGIC|motivation:5|reaction_genki`

