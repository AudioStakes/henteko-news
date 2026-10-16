# 開発と配布

利用者向けの説明と公開アプリへのリンクは[README](../README.md)にあります。

## ローカルで動かす

Node.js **24.18.0（24系LTS）**とnpmを使います。
`.nvmrc` と `.tool-versions` でバージョンを揃え、`engine-strict` で非対応環境のインストールを拒否します。

```sh
git clone https://github.com/AudioStakes/henteko-news.git
cd henteko-news
npm ci
npm run dev
```

表示されたローカルURLを開きます。
ブラウザーが読み上げに対応していれば、そのまま音声を使えます。
日本語の声は端末やブラウザーの設定に依存します。

### TypeScriptの実行系

型チェックとビルドにはTypeScript 7の `tsc` を使います。
ESLintと語彙検証はTypeScript 6のコンパイラーAPIを使うため、[Microsoft公式の併用方法](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0)に従ってnpm aliasで分けています。
`@typescript/native` はTypeScript 7、`typescript` は公式互換パッケージ `@typescript/typescript6` を指します。
互換パッケージの実行コマンドは `tsc6` なので、`tsc` と競合しません。
バージョンは `package.json` とlockfileで固定し、どちらも `npm ci` で導入します。
互換API本体は間接依存の `@typescript/old`（TypeScript 6系）です。
依存を更新するときはこの間接依存のlockfile版も確認し、`npm run validate` でESLintと語彙検証の互換性を確かめます。

## 音声方式を選ぶ

画面上の「音声設定」で読み上げ方式を選び、「設定を保存」を押します。
設定はこのブラウザーに保存され、ニュースと `/words-audio-check` の両方に反映されます。
方式やモデルを変更すると、再生中の音声は停止します。

- **ブラウザーの音声（Web Speech API）**：初期設定です。端末で利用できる日本語の声を使います。ブラウザーや声によってはネットワーク接続が必要です。
- **モデル音声（Supertonic）**：対応するONNXモデルでブラウザー内に音声を生成します。モデルのフォルダーと声のJSONファイルを指定できます。

モデル方式に自動で切り替えることはありません。
Web Speech APIが使えない場合は文字で遊ぶか、設定でモデル方式を選んでください。

## モデル音声を使う（任意）

```sh
npm run setup:speech
npm run check:speech-assets
npm run dev
```

`setup:speech` は、[Supertonic 3のアーカイブ](https://github.com/supertone-oss-archive/supertonic)で案内されている固定リビジョン `aafc6e32416a594460b32413efc49d7fe4ce6d46` から、4つのONNXモデル、設定、Unicodeインデックス、M1音声スタイルを取得します。
大きなファイルをダウンロードするため、時間と空き容量が必要です。
取得途中のファイルは最終ファイル名で保存しません。

配置先は次のとおりです。
設定で「モデル音声（Supertonic）」を選び、標準のフォルダー `/supertonic/onnx` と声のJSONファイル `/supertonic/voice_styles/M1.json` を保存します。
手動配置する場合も、互換性のあるモデル一式を揃えてください。

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

別の配置先を使う場合は、設定の「モデルのフォルダー」にONNXモデル4個と `tts.json`、`unicode_indexer.json` のあるディレクトリを指定し、「声のJSONファイル」に互換性のある音声スタイルを指定します。
配布済みのパス（例：`/custom-model/onnx`）またはHTTP(S) URLを使えます。
別ドメインでは配布元のCORS設定も必要です。
端末のファイルを直接アップロードする機能や、Supertonic以外のモデル形式には対応していません。

モデルと生成したランタイムはGitの対象外です。
モデル配布条件はコードのライセンスと別なので、[利用条件と出所](THIRD_PARTY_NOTICES.md)を確認してください。
Supertonicの開発とサポートは終了しており、このアプリで使う互換性と配布元は継続的な確認が必要です。

初回はモデルの読み込みと推論に時間がかかります。
音声はブラウザー内で生成します。
端末の性能、メモリ、ブラウザーの自動再生制限によって音声が使えない場合は、文字で遊び、結果画面の「もういちどよむ」を試してください。

## 検証コマンド

| コマンド                       | 確認する内容                                                  |
| ------------------------------ | ------------------------------------------------------------- |
| `npm audit --audit-level=high` | 依存関係の既知の重大な脆弱性                                  |
| `npm run lint`                 | Biome、型情報を使うESLint、Hooks、テスト、Markdownの静的検証  |
| `npm run format:check`         | コードと文書の整形、import整理の確認（書き換えなし）          |
| `npm run format`               | Biomeでコード、PrettierでMarkdownとYAMLを整形                 |
| `npm run typecheck`            | アプリ、E2E、Nodeスクリプト、Service Workerの厳格な型チェック |
| `npm run check`                | lint、整形、型、単体テスト、スクリプト、語彙をまとめて検証    |
| `npm run validate`             | `check` と本番ビルドをまとめて検証                            |
| `npm test`                     | ゲーム、音声、レイアウト計算などの単体テスト                  |
| `npm run test:scripts`         | ビルド時のPWA生成、キャッシュ削除のテスト                     |
| `npm run check:words`          | 語彙の重複、並び順、読み上げ表記の確認                        |
| `npm run build`                | 本番ビルド（出力先 `dist/`）                                  |
| `npm run test:e2e`             | 本番ビルドのゲーム、オフライン、スマートフォン画面テスト      |

ブラウザーテストは先に `npm run build` と `npx playwright install chromium firefox webkit` を実行します。
LinuxでOS依存ライブラリも必要な場合は `npx playwright install --with-deps chromium firefox webkit` を使います。
`test:layout` は画面サイズのテストだけを実行します。
デスクトップの3エンジンに加え、Android、iPhone、iPad相当の画面設定でも検証します。
実行ポートは4175で、ほかのアプリのサーバーを再利用しません。

品質ルールの分担、意図的な例外、修正手順は[品質基準](agents/quality.md)にまとめています。
`check` と `validate` はコードを書き換えません。

実モデルの音声テストはモデル配置とビルドの後、次のコマンドで実行します。

```sh
RUN_SPEECH_SMOKE=1 npm run test:e2e -- tests/speech.spec.ts --project=chromium
```

PowerShellでは先に `$env:RUN_SPEECH_SMOKE="1"` を設定します。
このテストは設定でモデル方式を選んでから音声WAVを生成します。
通常のテストはモデルをダウンロードせず実行できます。
GitHub Actionsはリポジトリ設定で停止しており、ワークフローにもpushとPRの自動起動条件はありません。

## 配布とPWA

```sh
npm run build
npm run preview
```

静的ホスティングには **`dist/` 全体**を配布します。
第三者のライセンス表示を入れた `dist/licenses/` も保持してください。
モデル音声を使う配布では、ビルドの前に `setup:speech` を実行するか、設定で指定する配布先に対応モデルを配置します。
Web Speech APIだけを使う場合、モデルは不要です。
ONNX Runtimeのファイルは `predev` / `prebuild` が自動配置しますが、標準の読み上げ時にモデルを取得することはありません。

Netlifyのビルド設定は、ビルドコマンドを `npm run validate`、公開ディレクトリを `dist`、Node.jsを24.18.0にします。
既存の公開先は [henteko-news.netlify.app](https://henteko-news.netlify.app/) です。
現在はドメイン直下への配布をサポートします。
サブディレクトリへの配布には、画像、音声、Service Worker、manifestの絶対パス対応が必要です。
独自ドメインやフォークでは `index.html` のcanonical、OGP、JSON-LD、`public/robots.txt`、`public/sitemap.xml` にあるURLも更新してください。
`/words-audio-check` を直接開けるよう、ホスト側で存在しない画面パスを `index.html` にフォールバックさせます。

PWAはHTTPSまたはlocalhostで動作します。
開発サーバーでは登録せず、本番ビルドで登録します。
ビルド結果に基づくキャッシュ版を自動生成し、初回訪問時にゲームのJS、CSS、画像をキャッシュします。
Netlify向けの `public/_headers` も配布に含めます。
他のホストでは同じヘッダーを設定し、特に `/sw.js` を長期間のimmutableキャッシュにしないでください。

オフライン確認では、本番プレビューを一度オンラインで開き、DevToolsでService Workerが起動したことを確認してからNetworkをOfflineにして再読み込みします。
**オフラインで保証する対象は文字でのゲームです。**
大きい音声モデルとWASMランタイムはPWAの事前キャッシュ対象外です。
更新版は既存のタブやインストールしたアプリを閉じて開き直すと反映されます。

## アクセス解析

Cloudflare Web Analyticsの標準beaconで、本番の `henteko-news.netlify.app` だけを集計する構成です。
Reactの描画の外で一度だけ初期化し、hostnameが一致する場合だけCloudflare公式CDNのスクリプトを読み込みます。
ページのload完了後に読み込みを始め、既存のService Worker登録を外部CDNの通信待ちにしないようにしています。
初期化処理は [`src/utils/webAnalytics.ts`](../src/utils/webAnalytics.ts) の `initializeWebAnalytics` に分けています。
localhost、E2E用のローカル環境、Netlifyのプレビューでは外部スクリプトを読み込みません。
同じホスト名での再初期化でもスクリプトを重複して追加しない構成にします。

Cloudflareで本番ホストを登録して得る公開サイトtokenを使用します。
Cloudflareアカウントの認証に使うAPI tokenを設定するものではありません。
配信はNetlifyを継続し、CloudflareへのDNSやホスティングの移行は不要です。[公式導入手順](https://developers.cloudflare.com/web-analytics/get-started/)

計測対象は閲覧ページ、流入元、端末やブラウザー、表示速度などです。
既存の `setAnalyticsTransport` には接続せず、ゲームの開始、選択した言葉、完成したニュースなどの独自イベントは送信しません。
ゲーム内の画面切り替えではURLが変わらないため、各質問を個別のページ閲覧として扱いません。
利用者向けの説明は[アクセス解析について](PRIVACY.md)にまとめています。

Web Analyticsは無料で、外部ホストは10サイトまで、閲覧できる履歴は6か月です。
7日を過ぎたデータはサンプリングされます。[上限](https://developers.cloudflare.com/web-analytics/limits/)、[FAQ](https://developers.cloudflare.com/web-analytics/faq/)
広告ブロッカーやオフライン利用では欠測があるため、集計値を実利用者の完全な人数とは扱いません。
別の本番ホストへ移す場合は、Cloudflare側の登録とアプリ側のhostname条件、公開サイトtokenを揃えて更新します。

## 構成と変更箇所

- `src/data/words/`：言葉のリストです。追加後は `npm run sort:words`、`npm run check:words` を実行します。
- `src/hooks/`：ゲーム進行、読み上げ、効果音を扱います。
- `src/components/`：開始、選択、結果、音声確認画面を表示します。
- `src/utils/supertonic/`：ONNX Runtimeによる音声生成を扱います。
- `src/styles/global.css`：画面全体のスタイルです。
- `scripts/`：モデル取得、ランタイム配置、PWA生成、語彙チェックを扱います。
- `tests/`：本番ブラウザーでのE2Eテストです。

React、TypeScript、Vite、CSS、Web Speech API、任意のSupertonicとONNX Runtime Webを使用します。
独自イベント用の分析関数は未接続のままとし、アクセス解析は上記の標準beaconだけを使う構成です。
モデル方式では選んだ言葉をブラウザー内で処理します。
Web Speech APIの音声処理先はブラウザーと選ばれた声に依存します。
