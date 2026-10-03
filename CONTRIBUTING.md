# 開発への参加

小さな不具合修正、語彙の追加、導入手順の改善を歓迎します。大きな機能追加や依存関係のメジャー更新は、実装前にIssueで目的と変更範囲を相談してください。利用・再配布条件は公開前の確定が必要です（[README](README.md#利用条件)）。

## 開発と確認

[READMEの導入手順](README.md#ローカルで動かす)に従って `npm ci` で依存関係を揃えます。通常の単体テストに音声モデルは不要です。

```sh
npm run lint
npm run typecheck
npm test
npm run test:scripts
npm run check:words
npm run build
npx playwright install chromium
npm run test:e2e
```

変更に関係する確認を行い、PRに実行コマンドと結果を書いてください。実モデルに触る変更では `setup:speech` と実音声テストも実行します。CIの音声ジョブは外部モデル配布元への接続を必要とします。

## 語彙の追加

`src/data/words/` の該当カテゴリに追加します。子どもが読める表記、ニュースとしての語尾、発音の聞きやすさを確認してください。動詞は `display`（選択時の表示）と `speech`（読み上げ・結果画面の丁寧形）を揃えます。

```sh
npm run sort:words
npm run check:words
```

`/words-audio-check` は各カテゴリの語彙を順番に読む開発用画面です。音声モデルを配置して確認してください。

## 不具合報告・PR

不具合報告には、OS・ブラウザ、再現手順、期待結果と実際の結果、利用したコミットを記載してください。APIキー、個人情報、他サービスの認証情報を貼らないでください。セキュリティ上の問題は [SECURITY.md](SECURITY.md) を確認してください。

PRは、具体的な問題、修正後の動作、検証結果を中心に書いてください。語彙・画像・モデルを追加する場合は出典と利用条件も示します。ダウンロードしたモデル、`public/onnxruntime/`、`dist/`、Playwrightの出力はコミットしません。
