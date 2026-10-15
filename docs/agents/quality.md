# 品質基準

エージェントのモデルによる差を抑えるため、同じNode・固定した検証ツール・警告を許さないローカル検証を使います。ルールを緩める前に、型の絞り込み、Promiseの完了・失敗処理、テストの検証内容を修正します。

## 提出までの手順

1. `.nvmrc` または `.tool-versions` のNodeを使い、`npm ci` でlockfileどおりの依存を用意します。
2. `npm run format` で整形します。ESLintの自動修正は `npm run lint:fix`、残る指摘はコードで直します。
3. `npm run validate` が終了コード0になるまで修正します。lintの警告、整形差分、型エラー、テスト失敗を提出時に残しません。
4. ブラウザー動作・CSS・Service Worker・モデル推論を変更した場合は、ビルド後に関連するE2Eを実行し、PRに結果を書きます。モデルに触る変更では実モデルの音声テストも実行します。

`check` は検証用です。従来の `check --write` 相当は `format` に移しました。`validate` はソースを修正せず、ビルド用のGit対象外ファイルだけを生成します。GitHub Actionsは停止したままです。

## ツールの担当

| ツール                      | 担当                                                                  | 対象                                                   |
| --------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------ |
| Biome                       | コード整形、import整理、構文・安全性・アクセシビリティ                | JS/TS/JSX、CSS、HTML、JSON/JSONC、manifest             |
| ESLint + typescript-eslint  | 型依存の誤用、未処理Promise、unsafe値、条件式、網羅性                 | アプリ、設定、E2E、Nodeスクリプト、Service Worker      |
| React Hooks plugin          | Hooks、依存配列、render中のref利用、React Compilerの診断              | `src` のReactコード                                    |
| Vitest / Playwright plugins | focused/disabledテスト、assertion、await、厳密な比較                  | 各テストファイル                                       |
| Prettier                    | 文書・YAMLの整形                                                      | Markdown/YAMLだけ。コードフェンス内部の整形は無効      |
| markdownlint                | 見出し・コード言語・リンクなど文書構造                                | 所有するMarkdown                                       |
| TypeScript                  | strictに加え、配列添字、optional、index signature、return、unusedなど | ブラウザー、Node、Service Workerを別プロジェクトで検査 |

BiomeとPrettierは同じファイルを整形しません。ESLintは `strictTypeCheckedOnly` を使い、Biomeと重なる構文ルールを引き継ぎません。Hooksとテストの規則も担当pluginへ統一しています。Markdownlintは公式のPrettier互換設定を継承します。

添字の値やJSONを型アサーションで信頼せず、不変条件や外部データを実際に検証します。Nodeスクリプトのimportは `NodeNext` で検査します。エラー回避の `eslint-disable` や `@ts-ignore`・`@ts-nocheck`・`@ts-expect-error` は受け付けません。TS抑制コメントの検査はESLintへ統一します。VitestとPlaywrightのfocusはrunnerでも禁止し、Nodeテストのonly・skip・todoは、suiteやtest context・subtestも含めて検出します。

## 対象と例外

依存パッケージ、ビルド出力、ダウンロードしたモデル・ランタイム・ライセンスコピー、外部由来の `.agents` skillsは検証対象外です。所有する型宣言・スクリプト・E2Eは検証します。

- `useLiteralKeys` はindex signatureのドット記法を促すため無効にし、TypeScriptの添字記法を優先します。
- `noSecrets` は通常の日本語UIラベルも秘密として多数誤検知するため採用していません。危険なHTML・eval・script URLなど具体的なセキュリティ規則はエラーにします。履歴の秘密検査には既存の手動Gitleaksジョブを使います。
- 数値はテンプレート文字列に使用できます。数値・文字列を条件式で暗黙にbooleanとして使うことは検出します。
- 実モデルのE2EはPlaywright設定で `RUN_SPEECH_SMOKE=1` のときに検証対象へ追加します。全E2Eでテスト内のスキップを禁止し、環境変数で対象が切り替わることも回帰検証します。
- Markdownの行長・リスト・空白などの整形規則はPrettierへ委譲します。

## 依存を更新するとき

検証ツールとTypeScriptはexact versionで固定します。[typescript-eslintのstrict preset](https://typescript-eslint.io/users/configs/#strict-type-checked) はminorでも規則が変わるため、更新後に全検証を実行します。未安定のBiome nurseryを一括有効にはしません。

Markdown CLI配下の `js-yaml` は5.4.1、`smol-toml` は1.9.1、`katex` は0.18.2へ限定してoverrideしています。
それぞれの脆弱性に対する修正版です（[js-yaml](https://github.com/advisories/GHSA-r3ph-w7gj-g6xm)、[smol-toml](https://github.com/advisories/GHSA-r4xh-jqrq-34v2)、[KaTeX](https://github.com/advisories/GHSA-238p-pmpm-9mq7)）。
上流の依存指定が修正版を許容したら、該当するoverrideを外して `npm audit` と文書の検証を実行します。

Nodeの型定義は実行環境と同じ24系に揃えます。
Dependabotでは `@types/node` のmajor更新を除外し、Node本体の更新と合わせて判断します。

`scripts/quality-config.test.mjs` は代表的な不正コードを各ツールが拒否することと、整形対象・除外対象の分担を検証します。ルールや対象を変えたときもこの回帰検証を通します。
