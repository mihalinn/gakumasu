# カード機能リファレンス / Card Effect Reference

今後新しいカードを追加する際のリファレンスです。
CSVファイル (`学マス　シュミレーション - カード説明.csv`) の「Effect」列や「Condition」列に記述する文字列の形式を以下にまとめます。

## CSVの基本記述ルール
- 効果や条件は **`タイプ:値`** の形式で記述します。
- 複数のパラメータがある場合は `&` で繋ぐことがあります（例: `gate` など）。
- `parseEffectString` 関数によって、以下のCSV用略称が内部の正式な `EffectType` に変換されます。

---

## 主な効果一覧 (Effect List)

| CSV記述 (略称) | パラメータ例 | 意味 / 内部Type | 説明 |
| :--- | :--- | :--- | :--- |
| **genki** | `genki:5` | `buff_genki` | 元気を+5する |
| **impression** | `impression:3` | `buff_impression` | 好印象を+3する |
| **motivation** | `motivation:2` | `buff_motivation` | やる気を+2する |
| **score_genki** | `score_genki:1.2` | `score_scale_genki` | 元気の120%分のスコアを獲得する (1.0 = 100%) |
| **score_impression** | `score_impression:1` | `score_scale_impression` | 好印象の100%分のスコアを獲得する |
| **score_motivation** | `score_motivation:1.5` | `score_scale_motivation` | やる気の150%分のスコアを獲得する |
| **ap** | `ap:1` | `add_card_play_count` | カード使用回数を+1する |
| **draw** | `draw:2` | `draw_card` | カードを2枚引く |
| **swap_hand** | `swap_hand` | `swap_hand` | 手札を全て捨てて引き直す |
| **upgrade_hand** | `upgrade_hand` | `upgrade_hand` | 手札を強化(＋化)する |
| **buff_impression_gain** | `buff_impression_gain:50` | `buff_impression_gain` | 好印象の増加量を+50%する (※パーセント値) |
| **buff_base_impression** | `buff_base_impression:3` | `buff_card_base_value` | 全てのスキルカードの好印象値を+3する |
| **reaction_genki** | `reaction_genki:4` | `buff_reaction_on_cost` | 体力消費時に元気+4する |
| **debuff_cost_up** | `debuff_cost_up:duration=2&value=1` | `debuff_cost_increase` | 指定期間(2ターン)、消費体力を増やす |
| **mult_impression** | `mult_impression:1.1` | `multiply_impression` | 好印象を現在の1.1倍にする |
| **add_turn** | `add_turn:1` | `add_turn` | ターン数を1追加する |

### 条件付き効果 (Gates)
「〜の場合、〜する」という条件付き効果は `gate` を使って表現します。

`gate:[条件]:効果`

例: `gate:[motivation>=3]:genki:5`
（やる気が3以上の場合、元気+5）

---

## 条件一覧 (Conditions)

`gate` の中括弧 `[]` 内や、Condition列で使用します。
比較演算子 (`>=`, `<=`, `==`) と組み合わせて使います。

| 条件タイプ | 記述例 | 意味 |
| :--- | :--- | :--- |
| **genki** | `genki>=30` | 元気が30以上 |
| **impression** | `impression>=5` | 好印象が5以上 |
| **motivation** | `motivation>=3` | やる気が3以上 |
| **hp** | `hp>=10` | 体力が10以上 |
| **hp_percent** | `hp_percent>=50` | 体力が50%以上 |
| **trouble_count** | `trouble_count>=2` | トラブルカードが2枚以上 (除外除く) |
| **hand_rarity** | `hand_rarity:R>=1` | 手札にRカードが1枚以上 |

---

## 特殊な効果記述

### ターン開始時効果 (Turn Start)
`turn_start:gate=[条件]&effect=効果`

例: `turn_start:gate=[impression>=15]&effect=mult_impression:1.1`
(ターン開始時、好印象が15以上なら、好印象を1.1倍にする)

### カード使用時誘発 (On Use)
`trigger_use:type=mental&effect=impression:1`
(以降、メンタルカードを使用するたび、好印象+1)

---

## 開発向けメモ
これらの変換ロジックは `scripts/update_cards.js` 内の `parseEffectString` 関数で定義されています。新しい効果を追加したい場合は、まず `src/types/card.ts` に型定義を追加し、次に `scripts/update_cards.js` に変換ルールを追加してください。
