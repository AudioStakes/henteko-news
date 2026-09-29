# へんてこニュース

5歳以上の子ども向けのおふざけ言葉ゲームです。「だれが・いつ・どこで・なにを・どうした」を順番に選ぶと、へんてこなニュースが完成します。各ステップに5つの選択肢が出ます。

**[ブラウザで遊ぶ](https://henteko-news.netlify.app/)** · [開発への参加](CONTRIBUTING.md) · [公開準備のレビュー](docs/public-readiness-review.md)

音声モデルを配置するとニュースを読み上げます。音声が使えないときも文字で遊べます。サーバー、APIキー、利用者アカウントは必要ありません。

## ローカルで動かす

Node.js **22.13以上の22系、または24以上**と npm を使います。`.nvmrc` は22系です。

```sh
git clone https://github.com/AudioStakes/henteko-news.git
cd henteko-news
npm ci
npm run dev
```

表示されたローカルURLを開きます。この時点では文字で遊べます。音声に必要な ONNX Runtime のファイルは `predev` / `prebuild` が自動配置します。

## 読み上げを有効にする

```sh
npm run setup:speech
npm run check:speech-assets
npm run dev
```

`setup:speech` は、[Supertonic 3 のアーカイブ](https://github.com/supertone-oss-archive/supertonic)で案内されている固定リビジョン `aafc6e32416a594460b32413efc49d7fe4ce6d46` から、4つの ONNX モデル、設定、Unicodeインデックス、M1音声スタイルを取得します。大きなファイルをダウンロードするため、時間と空き容量が必要です。取得途中のファイルは最終ファイル名で保存しません。

配置先は次のとおりです。手動配置する場合も、同じリビジョンのファイルを揃えてください。

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

モデルと生成したランタイムは Git の対象外です。モデル配布条件はコードのライセンスと別なので、[第三者素材・依存関係の案内](docs/THIRD_PARTY_NOTICES.md)を確認してください。Supertonic の開発・サポートは終了しており、このアプリで使う互換性と配布元は継続的な確認が必要です。

初回はモデルの読み込み・推論に時間がかかります。音声はブラウザ内で生成します。端末の性能、メモリ、ブラウザの自動再生制限によって音声が使えない場合は、文字で遊び、結果画面の「もういちどよむ」を試してください。

## 検証コマンド

| コマンド | 確認する内容 |
| --- | --- |
| `npm audit --audit-level=high` | 依存関係の既知の重大な脆弱性 |
| `npm run lint` | Biomeによる静的解析・整形確認 |
| `npm run typecheck` | TypeScriptの型チェック |
| `npm test` | ゲーム・音声・レイアウト計算などの単体テスト |
| `npm run test:scripts` | ビルド時のPWA生成・キャッシュ削除のテスト |
| `npm run check:words` | 語彙の重複・並び順・読み上げ表記の確認 |
| `npm run build` | 本番ビルド（出力先 `dist/`） |
| `npm run test:e2e` | 本番ビルドのゲーム・オフライン・スマホ画面テスト |

ブラウザテストは先に `npm run build` と `npx playwright install chromium` を実行します。LinuxでOS依存ライブラリも必要な場合は `npx playwright install --with-deps chromium` を使います。`test:layout` は画面サイズのテストだけを実行します。

実モデルの音声テストはモデル配置・ビルド後、`RUN_SPEECH_SMOKE=1 npm run test:e2e -- tests/speech.spec.ts` で実行します（PowerShellでは先に `$env:RUN_SPEECH_SMOKE="1"` を設定）。通常のテストはモデルをダウンロードせず実行できます。CIの音声ジョブはモデルを取得し、実際に音声WAVを生成します。

## 配布・PWA

```sh
npm run build
npm run preview
```

静的ホスティングには **`dist/` 全体**を配布します。音声を使う配布では、ビルドの前に `setup:speech` を実行してください。ホストのビルド設定はビルドコマンド `npm run build`、公開ディレクトリ `dist` です。

現在は**ドメイン直下への配布**をサポートします。サブディレクトリへの配布には、画像・音声・Service Worker・manifestの絶対パス対応が必要です。独自ドメインやフォークでは `index.html` の canonical / OGP / JSON-LD、`public/robots.txt`、`public/sitemap.xml` にあるURLも更新してください。`/words-audio-check` を直接開けるよう、ホスト側で存在しない画面パスを `index.html` にフォールバックさせます。

PWAはHTTPSまたはlocalhostで動作します。開発サーバーでは登録せず、本番ビルドで登録します。ビルド結果に基づくキャッシュ版を自動生成し、初回訪問時にゲームのJS・CSS・画像をキャッシュします。Netlify向けの `public/_headers` も配布に含めます。他のホストでは同じヘッダーを設定し、特に `/sw.js` を長期間のimmutableキャッシュにしないでください。

オフライン確認は、本番プレビューを一度オンラインで開き、DevToolsで Service Worker が起動したことを確認してから Network を Offline にして再読み込みします。**オフラインで保証する対象は文字でのゲームです。大きい音声モデルはPWAの事前キャッシュ対象外**です。更新版は既存のタブ・インストールしたアプリを閉じて開き直すと反映されます。

## 構成と変更箇所

- `src/data/words/`: 言葉のリスト。追加後は `npm run sort:words`、`npm run check:words` を実行します。
- `src/hooks/`: ゲーム進行、読み上げ、効果音。
- `src/components/`: 開始、選択、結果、音声確認画面。
- `src/utils/supertonic/`: ONNX Runtimeによる音声生成。
- `src/styles/global.css`: 画面全体のスタイル。
- `scripts/`: モデル取得、ランタイム配置、PWA生成、語彙チェック。
- `tests/`: 本番ブラウザでのE2Eテスト。

React、TypeScript、Vite、CSS、Supertonic / ONNX Runtime Webを使用します。現状、分析用の関数はありますが外部送信先は接続していません。選んだ言葉はブラウザ内で処理します。

## 利用条件

プロジェクト自身のライセンスと画像素材の再利用条件は現在未確定です。**公開前に権利者が利用・改変・再配布条件を決める必要があります**。第三者コード・モデルの条件は [THIRD_PARTY_NOTICES](docs/THIRD_PARTY_NOTICES.md)、公開前の残課題は [レビュー記録](docs/public-readiness-review.md)にまとめています。
