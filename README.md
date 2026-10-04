# へんてこニュース

5歳以上の子ども向けのおふざけ言葉ゲームです。「だれが・いつ・どこで・なにを・どうした」を順番に選ぶと、へんてこなニュースが完成します。各ステップに5つの選択肢が出ます。

**[ブラウザで遊ぶ](https://henteko-news.netlify.app/)** · [開発への参加](CONTRIBUTING.md) · [公開準備のレビュー](docs/public-readiness-review.md)

標準ではブラウザーの Web Speech API でニュースを読み上げます。モデルのダウンロードやAPIキーは必要ありません。音声が使えないときも文字で遊べます。

## ローカルで動かす

Node.js **24.18.0（24系LTS）**と npm を使います。`.nvmrc` と `.tool-versions` でバージョンを揃え、`engine-strict` で非対応環境のインストールを拒否します。

```sh
git clone https://github.com/AudioStakes/henteko-news.git
cd henteko-news
npm ci
npm run dev
```

表示されたローカルURLを開きます。ブラウザーが読み上げに対応していれば、そのまま音声を使えます。日本語の声は端末・ブラウザーの設定に依存します。

## 音声方式を選ぶ

画面上の「音声設定」で読み上げ方式を選び、「設定を保存」を押します。設定はこのブラウザーに保存され、ニュースと `/words-audio-check` の両方に反映されます。方式やモデルを変更すると、再生中の音声は停止します。

- **ブラウザーの音声（Web Speech API）**: 初期設定。端末で利用できる日本語の声を使います。ブラウザーや声によってはネットワーク接続が必要です。
- **モデル音声（Supertonic）**: 対応するONNXモデルでブラウザー内に音声を生成します。モデルのフォルダーと声のJSONファイルを指定できます。

モデル方式に自動で切り替えることはありません。Web Speech APIが使えない場合は文字で遊ぶか、設定でモデル方式を選んでください。

## モデル音声を使う（任意）

```sh
npm run setup:speech
npm run check:speech-assets
npm run dev
```

`setup:speech` は、[Supertonic 3 のアーカイブ](https://github.com/supertone-oss-archive/supertonic)で案内されている固定リビジョン `aafc6e32416a594460b32413efc49d7fe4ce6d46` から、4つの ONNX モデル、設定、Unicodeインデックス、M1音声スタイルを取得します。大きなファイルをダウンロードするため、時間と空き容量が必要です。取得途中のファイルは最終ファイル名で保存しません。

配置先は次のとおりです。設定で「モデル音声（Supertonic）」を選び、標準のフォルダー `/supertonic/onnx` と声のJSONファイル `/supertonic/voice_styles/M1.json` を保存します。手動配置する場合も、互換性のあるモデル一式を揃えてください。

```text
public/supertonic/
  LICENSE
  onnx/
    tts.json
    unicode_indexer.json
    duration_predictor.onnx
    text_encoder.onnx
    vector_estimator.onnx
    vocoder.onnx
  voice_styles/
    M1.json
```

別の配置先を使う場合は、設定の「モデルのフォルダー」にONNXモデル4個と `tts.json`・`unicode_indexer.json` のあるディレクトリを指定し、「声のJSONファイル」に互換性のある音声スタイルを指定します。配布済みのパス（例: `/custom-model/onnx`）またはHTTP(S) URLを使えます。別ドメインでは配布元のCORS設定も必要です。端末のファイルを直接アップロードする機能や、Supertonic以外のモデル形式には対応していません。

モデルと生成したランタイムは Git の対象外です。モデル配布条件はコードのライセンスと別なので、[第三者素材・依存関係の案内](docs/THIRD_PARTY_NOTICES.md)を確認してください。Supertonic の開発・サポートは終了しており、このアプリで使う互換性と配布元は継続的な確認が必要です。

初回はモデルの読み込み・推論に時間がかかります。音声はブラウザ内で生成します。端末の性能、メモリ、ブラウザの自動再生制限によって音声が使えない場合は、文字で遊び、結果画面の「もういちどよむ」を試してください。

## 検証コマンド

| コマンド                       | 確認する内容                                                  |
| ------------------------------ | ------------------------------------------------------------- |
| `npm audit --audit-level=high` | 依存関係の既知の重大な脆弱性                                  |
| `npm run lint`                 | Biome、型情報を使うESLint、Hooks・テスト・Markdownの静的検証  |
| `npm run format:check`         | コードと文書の整形・import整理の確認（書き換えなし）          |
| `npm run format`               | Biomeでコード、PrettierでMarkdown/YAMLを整形                  |
| `npm run typecheck`            | アプリ・E2E・Nodeスクリプト・Service Workerの厳格な型チェック |
| `npm run check`                | lint・整形・型・単体テスト・スクリプト・語彙をまとめて検証    |
| `npm run validate`             | `check` と本番ビルドをまとめて検証                            |
| `npm test`                     | ゲーム・音声・レイアウト計算などの単体テスト                  |
| `npm run test:scripts`         | ビルド時のPWA生成・キャッシュ削除のテスト                     |
| `npm run check:words`          | 語彙の重複・並び順・読み上げ表記の確認                        |
| `npm run build`                | 本番ビルド（出力先 `dist/`）                                  |
| `npm run test:e2e`             | 本番ビルドのゲーム・オフライン・スマホ画面テスト              |

ブラウザテストは先に `npm run build` と `npx playwright install chromium` を実行します。LinuxでOS依存ライブラリも必要な場合は `npx playwright install --with-deps chromium` を使います。`test:layout` は画面サイズのテストだけを実行します。

品質ルールの分担、意図的な例外、修正手順は [品質基準](docs/agents/quality.md) にまとめています。`check` と `validate` はコードを書き換えません。

実モデルの音声テストはモデル配置・ビルド後、`RUN_SPEECH_SMOKE=1 npm run test:e2e -- tests/speech.spec.ts` で実行します（PowerShellでは先に `$env:RUN_SPEECH_SMOKE="1"` を設定）。このテストは設定でモデル方式を選んでから音声WAVを生成します。通常のテストはモデルをダウンロードせず実行できます。GitHub Actionsはリポジトリ設定で停止しており、ワークフローにもpush・PRの自動起動条件はありません。

## 配布・PWA

```sh
npm run build
npm run preview
```

静的ホスティングには **`dist/` 全体**を配布します。第三者のライセンス表示を入れた `dist/licenses/` も保持してください。モデル音声を使う配布では、ビルドの前に `setup:speech` を実行するか、設定で指定する配布先に対応モデルを配置します。Web Speech APIだけを使う場合、モデルは不要です。ONNX Runtimeのファイルは `predev` / `prebuild` が自動配置しますが、標準の読み上げ時にモデルを取得することはありません。ホストのビルド設定はビルドコマンド `npm run build`、公開ディレクトリ `dist` です。

現在は**ドメイン直下への配布**をサポートします。サブディレクトリへの配布には、画像・音声・Service Worker・manifestの絶対パス対応が必要です。独自ドメインやフォークでは `index.html` の canonical / OGP / JSON-LD、`public/robots.txt`、`public/sitemap.xml` にあるURLも更新してください。`/words-audio-check` を直接開けるよう、ホスト側で存在しない画面パスを `index.html` にフォールバックさせます。

PWAはHTTPSまたはlocalhostで動作します。開発サーバーでは登録せず、本番ビルドで登録します。ビルド結果に基づくキャッシュ版を自動生成し、初回訪問時にゲームのJS・CSS・画像をキャッシュします。Netlify向けの `public/_headers` も配布に含めます。他のホストでは同じヘッダーを設定し、特に `/sw.js` を長期間のimmutableキャッシュにしないでください。

オフライン確認は、本番プレビューを一度オンラインで開き、DevToolsで Service Worker が起動したことを確認してから Network を Offline にして再読み込みします。**オフラインで保証する対象は文字でのゲームです。大きい音声モデルとWASMランタイムはPWAの事前キャッシュ対象外**です。更新版は既存のタブ・インストールしたアプリを閉じて開き直すと反映されます。

## 構成と変更箇所

- `src/data/words/`: 言葉のリスト。追加後は `npm run sort:words`、`npm run check:words` を実行します。
- `src/hooks/`: ゲーム進行、読み上げ、効果音。
- `src/components/`: 開始、選択、結果、音声確認画面。
- `src/utils/supertonic/`: ONNX Runtimeによる音声生成。
- `src/styles/global.css`: 画面全体のスタイル。
- `scripts/`: モデル取得、ランタイム配置、PWA生成、語彙チェック。
- `tests/`: 本番ブラウザでのE2Eテスト。

React、TypeScript、Vite、CSS、Web Speech API、任意のSupertonic / ONNX Runtime Webを使用します。現状、分析用の関数はありますが外部送信先は接続していません。モデル方式では選んだ言葉をブラウザー内で処理します。Web Speech APIの音声処理先はブラウザーと選ばれた声に依存します。

## 利用条件

プロジェクト自身のライセンスと画像素材の再利用条件は現在未確定です。**公開前に権利者が利用・改変・再配布条件を決める必要があります**。第三者コード・モデルの条件は [THIRD_PARTY_NOTICES](docs/THIRD_PARTY_NOTICES.md)、公開前の残課題は [レビュー記録](docs/public-readiness-review.md)にまとめています。
