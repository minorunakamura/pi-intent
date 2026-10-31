# pi-intent

[Intent](https://github.com/ghaida/intent) の18 skills と6 agents を pi 用に移植した pi package です。UX の調査・戦略・設計・評価・実装への引き継ぎを扱います。元の設計手順、承認チェック、倫理指針、参照資料、wireframe viewer、deck builder は維持しています。

**専用 extension は不要です。** この package は設計知識と agent 定義を配布し、agent の実行は既存の [pi-subagents](https://github.com/nicobailon/pi-subagents) extension に任せます。独自の UI・コマンド・自動 orchestration が必要になった場合だけ、専用 extension を検討します。

## 導入

skills だけなら pi で使えます。6 agents を使う環境では、先に pi-subagents を導入してください。動作確認した組み合わせは pi `1.4.0` と pi-subagents `0.81.0` です。

```bash
pi install npm:pi-subagents@0.81.0
```

`npm:` は pi の package source 表記です。開発時の package manager は引き続き pnpm を使います。pi-subagents はこの package の dependencies に重複して同梱しません。

次に、このディレクトリの絶対パスを指定します。通常の個人用登録なら、pi を使う任意のディレクトリから次を実行します。

```bash
pi install /absolute/path/to/pi-intent
```

特定のプロジェクトだけで使う場合は、そのプロジェクトのルートで実行します。

```bash
pi install --local /absolute/path/to/pi-intent
```

ローカル package はコピーされず、このディレクトリから読み込まれます。移動・削除すると登録パスの修正が必要です。プロジェクト用の設定は pi の project trust を承認した場合だけ読み込まれます。

起動中の pi では `/reload` を実行してください。元の Intent skills を登録済みの場合は、先にそちらを無効化・削除してください。同名 skill が重複すると一方しか読み込まれません。元の README にある Claude Code の `/plugin` 操作は不要です。

## 使い方

```text
/skill:intent 新しいサービスの対象ユーザーと設計方針を整理したい
/skill:strategize この課題を解決するプロダクトが本当に必要か検討したい
/skill:journey 会員登録から初回利用までのフローを設計して
/skill:wireframe このフローをHTMLのwireframeにして
/skill:evaluate この画面のUXを評価して
/skill:specify 承認済みの設計資料を実装担当に引き継げる形にまとめて
```

skills の本文は upstream の英語を維持しています。会話や成果物の言語は pi 側の指示と依頼内容に従います。

| Skill | 用途 |
|---|---|
| `intent` | プロジェクトの文脈整理、UX 原則、倫理指針、skill の選択 |
| `strategize` | 課題設定、対象ユーザー、仮説、スコープ、競合分析 |
| `investigate` | インタビュー、調査計画、ユーザーテスト、調査結果の整理 |
| `storytelling` | 設計や調査を伝える narrative の構成 |
| `journey` | user flow、画面遷移、操作・分岐の設計 |
| `organize` | 情報構造、navigation、分類、ラベル |
| `wireframe` | 画面構造、idea board、interactive wireframe、prototype |
| `articulate` | UI 文言、エラー文、voice and tone |
| `blueprint` | service blueprint、システム・業務・依存関係 |
| `fortify` | 空・読込中・エラー・offline などの状態と回復設計 |
| `include` | accessibility、WCAG、keyboard、screen reader |
| `evaluate` | heuristic evaluation、UX の問題点と修正案 |
| `transpose` | mobile、web、TV など別 platform への適応 |
| `localize` | 文化・言語・市場への適応 |
| `measure` | 成功指標、計測、実験 |
| `philosopher` | 前提を問い直す探索・brainstorming |
| `specify` | 承認済みの設計資料と入口 README による handoff |
| `present` | 調査・設計成果の presentation、deck |

## pi 向けの変更

- skill の参照・呼び出しを `/skill:名前` に統一。
- pi が扱う frontmatter に整理し、元の version は `metadata.upstream-version` に保存。
- 全 skills に、関連 skill を `read` で読み込む方法、補助ファイルのパス基準、利用可能な tools を使うルールを追加。
- 補助ファイルは skill ディレクトリ基準、成果物はプロジェクトの作業ディレクトリまたは指定先に出力。インストール済みのテンプレートは変更しない。
- Figma／Pencil の固定 MCP tool 名を削除し、実際に接続された connector の tools と使用ガイドに従う形式へ変更。
- `present` の Python 実行パス、依存の導入確認、reveal.js の internet 要件を明示。
- `intent` の banner は明示的な `/skill:intent` 呼び出し時のみ。skill を読み込むための `read` は banner の前に許可。

skills 同士の切り替えは、同じ pi セッションで関連する `SKILL.md` を読み込んで行います。agent として独立した子セッションで実行したい場合は、次の6人を使います。

## Agents

`package.json` の `pi.subagents.agents` が `agents/` を公開します。名前は他の package と衝突しにくい `intent.*` に統一しています。

| 実行名 | 担当 | 主な skills |
|---|---|---|
| `intent.noor` | 入口、文脈整理、担当の提案、presentation | `intent`, `present`, `storytelling` |
| `intent.ember` | 戦略、課題設定、調査 | `strategize`, `investigate`, `storytelling` |
| `intent.wren` | experience、情報構造、wireframe、文言、platform・市場への適応 | `journey`, `organize`, `wireframe`, `articulate`, `blueprint`, `transpose`, `localize` |
| `intent.vigil` | 品質、edge cases、accessibility、計測 | `evaluate`, `fortify`, `include`, `measure` |
| `intent.rune` | 承認済み設計の handoff | `specify` |
| `intent.sage` | 前提を問い直す brainstorming | `philosopher` |

全員に共通の原則・文章・探索用 skills も関連付けています。`skillPath: ../skills` により、インストール先が変わっても同梱版を読み込みます。モデル名は固定せず、pi-subagents の環境設定／親のモデルに従います。Sage の元の `model: opus` 指定も取り除いています。project と operator の instructions は継承しますが、無関係な skills の catalog は継承しません。

### 呼び出し

pi に次のように依頼します。`/skill:intent` は通常の skill 呼び出しであり、Noor を自動起動するコマンドではありません。

```text
intent.noor を subagent として使い、このプロジェクトの設計前提を整理して。
未決事項と、次に必要な専門家の提案を親セッションへ返してください。
```

```text
intent.ember に、既存の調査資料をもとに課題と仮説を整理してもらって。
新たな外部調査はせず、不足する情報は質問として返してください。
```

```text
intent.vigil を subagent として使い、この wireframe を評価して。
```

`advertise: true` により、subagent tool が有効な親に6人の名前と説明が提示されます。導入確認は「利用可能な subagents を一覧表示して、intent.* の6人がいるか確認して」と依頼できます。

### Handoff と tools

**自動的に6人が連鎖する構成ではありません。** 各子は成果物のパス、未決の質問、次に推奨する担当を親へ返します。親が依頼範囲と承認状態を確認して、次の子を起動します。子から別の agent を起動する tools は与えていません。担当の切り替えと、Rune がまとめる設計成果物の handoff package は別のものです。

基本 tools は `read, write, edit, bash` だけなので、Web／Figma／Pencil 用 extension がない環境でも起動できます。外部アクセスが必要な仕事は、接続を追加するか、資料を渡して対象範囲を限定してください。全員が書き込みと shell 実行を行えるため、専用の sandbox ではありません。

追加 tools は利用環境の `~/.pi/agent/settings.json` または対象プロジェクトの `.pi/settings.json` の `subagents.agentOverrides` で設定します。例えば、ketch の search／scrape tools を導入済みなら次のように Ember に渡せます。

```json
{
  "subagents": {
    "agentOverrides": {
      "intent.ember": {
        "tools": ["read", "write", "edit", "bash", "ketch_search", "ketch_scrape"]
      }
    }
  }
}
```

agent の既定は `async: true` です。background child がその環境に登録された extension を読み込みます。tool 名の allowlist だけでは提供元は導入されないため、利用環境に provider extension を設定してください。foreground 実行へ変更する場合は、必要な child extension の明示設定も必要です。Figma／Pencil も connector の実際の tool 名・schema・使用ガイドに合わせて設定します。tool や承認がない場合は、作業できたふりをせず親へ返します。

## 別環境への導入（GitHub）

この移植版を自分の GitHub repository に保存し、別環境から pi package として導入します。以下は owner・repository を実際の値に置き換える形式例です。元の `ghaida/intent` ではなく、この移植版の URL を使います。

```text
pi install https://github.com/OWNER/pi-intent
```

同じ版を再現するには、push 済みの tag／commit を指定します。

```text
pi install git:github.com/OWNER/pi-intent@TAG
```

別環境にも上記の pi-subagents を導入し、pi を再起動または `/reload` してください。モデル・認証・Web／MCP 設定は各環境側に置きます。Python dependencies は PowerPoint 出力など必要な機能を使う環境で準備してください。この作業では repository の公開や push は行いません。

GitHub URL からの install 自体を検証するには、アクセス可能なリモートリポジトリが必要です。一方、インストール先とは別の作業ディレクトリから agents・skills・補助ファイルを参照できるかは、ローカル package 登録でも事前確認できます。

## 必要な環境と外部連携

基本は pi の `read`、`write`、`edit`、`bash` で使えます。利用時の追加 JavaScript dependencies はありません。開発用 dependencies は pnpm で管理します。

| 機能 | 条件・制約 |
|---|---|
| Web 調査 | pi に設定済みの search／fetch tools が必要。ketch などを利用できますが、必須依存にはしていません |
| HTML wireframe／diagram | CSS・JavaScript を同梱。生成物へ埋め込み、ブラウザで表示 |
| Figma／Figma Slides | 対象の編集機能と使用ガイドを持つ connector が別途必要 |
| Pencil | document・variables・design 操作を行える connector が別途必要 |
| PowerPoint／Google Slides | Python 3 と `python-pptx`。Google Slides は生成した `.pptx` を import |
| reveal.js deck | pinned CDN から reveal.js を読み込むため internet 接続が必要。完全 offline ではありません |

外部連携が使えない場合は、その旨を説明し、別形式へ変更してよいか確認します。依存や connector の自動インストールは行いません。承認が必要な工程は、skill を呼び出しただけでは承認済みになりません。

## 開発・検証

`../pi-skills/` と同様に mise で Node.js・pnpm・Python・uv・Ruff・ty のバージョンを固定します。mise を導入し、このプロジェクトの `mise.toml` を信頼・有効化した shell で実行してください。npm は使用しません。

```bash
mise install
pnpm install --frozen-lockfile
mise exec -- uv sync --locked --python python
pnpm check
```

JavaScript の開発用 dependencies は `pnpm-lock.yaml`、Python の `python-pptx`、開発用の pytest とそれらの dependencies は `uv.lock` で固定します。uv はこのプロジェクトの `.venv` に導入し、グローバルな Python 環境を変更しません。

| コマンド | 内容 |
|---|---|
| `pnpm lint` | oxlint の type-aware lint と Ruff の Python lint |
| `pnpm lint:fix` | oxlint と Ruff の安全な自動修正 |
| `pnpm typecheck` | uv の Python 環境で ty による型検査 |
| `pnpm format` | Biome と Ruff による整形 |
| `pnpm format:check` | 整形差分の確認 |
| `pnpm test` | Node.js の49テストと、pytest の deck builder 回帰テスト36件 |
| `pnpm check` | lint → 型検査 → format 確認 → テストを順に実行 |

Biome は JavaScript と JSON の format、oxlint は JavaScript とテストの lint を担当します。`oxlint-tsgo` という名前の公開パッケージではなく、typescript-go ベースの正式な連携パッケージ `oxlint-tsgolint` を使用し、`.oxlintrc.json` の `typeAware: true` で有効にしています。`tsconfig.json` と `@types/node` はその型情報の解決に使います。TypeScript compiler の全診断を実行する設定ではありません。

Python の lint・型検査・format の対象は `skills/present/references/build_deck.py` と `tests/present/` です。Markdown・HTML・CSS のテンプレートは今回の formatter 対象に含めません。lint 設定を通すためのルール一括無効化や、テストの除外はしていません。

Python の36ケースは upstream の `tests/present/test_build_deck.py` から移植し、タイトル・notes・alt text・chart・template・grid などの振る舞いを継続検証します。import path は pytest／ty の project 設定で解決し、テスト実行には `python -B` を使って同梱 scripts のディレクトリへ bytecode を生成しません。

構造テストでは18 skills と6 agents の frontmatter、command 参照、補助ファイル、役割別 skills、tool／model の可搬性、pi 実行ルール、platform 固有記述の残存を検査します。配布対象を別パスへ移し、相対参照が解決できることも確認します。モデル API や外部 connector は呼びません。これらのチェックは、実際の UX 成果物の品質、ブラウザ表示、外部 connector の動作を保証するものではありません。

## upstream への追従

原則として upstream のリリース単位で更新します。現在の取込元 version／commit は、下記の「出典・ライセンス」を参照してください。この package の version は upstream とは別に管理します。

1. **変更の意図を確認する。** Release notes を入口に、追加・修正された機能と利用方法の変更を把握します。Release notes だけで判断せず、前回の取込 commit と更新先 commit の実際の差分も確認します。リリース前の修正を先行して取り込む場合も、対象 commit と理由を記録します。
2. **取り込む範囲を選ぶ。** `skills/`、`agents/`、同梱の参照資料・scripts・CSS・JavaScript・テンプレート、関連する `tests/present/` を確認します。LICENSE の変更も確認します。Claude Code／Cursor／Copilot 向けの設定・生成物、公開サイト、upstream 固有の build／release 処理は原則対象外ですが、新しい共通機能が追加された場合は移行の要否を見直します。
3. **pi 固有の調整を維持する。** 前回の upstream、更新後の upstream、現在の pi 版を比較して、必要な変更を取り込みます。`/skill:名前`、`intent.*`、`skillPath`、インストール先基準のパス解決、環境側で選ぶ tools／model、依存導入・外部連携・承認の扱いを保持します。自動 merge や、ディレクトリ全体の無条件な上書きは行いません。
4. **重複した指示を確認する。** agent 本文と skill に同じ手順がある場合は、片方だけを更新しないよう確認します。実行手順は可能な限り対応する skill を参照し、別々の仕様へ分岐させません。
5. **検証する。** `pnpm check` を実行し、変更された script や出力形式は必要な動作確認も行います。agent 構成やパスに変更がある場合は、ローカル package 登録後、インストール先とは別の作業ディレクトリから参照できるか確認します。GitHub URL からの取得確認は、更新先をリモートへ反映した後に行います。
6. **取込元と変更内容を記録する。** 検証後に「出典・ライセンス」の upstream version／commit と、関連する skills の `metadata.upstream-version`、移植したテストの出典を更新します。取り込んだ変更と見送った変更・理由を commit／リリースの記録に残し、この package 自身の version として配布します。

## 出典・ライセンス

- Upstream: [ghaida/intent](https://github.com/ghaida/intent)
- Author: Ghaida Zahran
- Upstream plugin version: `1.7.3`
- 移植元 commit: [`7111cb85894feaeb7e98938b1ed34597d40e3b4c`](https://github.com/ghaida/intent/tree/7111cb85894feaeb7e98938b1ed34597d40e3b4c)
- License: [CC0 1.0 Universal](LICENSE)

この package は upstream の公式 pi 対応版ではありません。
