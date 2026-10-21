# オレンジ版 HTML プロトタイプ

[プロトタイプを開く](index.html)。採用済みの[全画面デザイン](../ui-full-design/README.md)を、操作しながら確認するためのサンプルです。
`main` の `130c8f5` を基準に作成した比較用サンプルです。
採用後の[アプリへの反映記録](../ui-implementation.md)は別にまとめ、実際のゲームはアプリのルートURLで操作できます。

## 起動

リポジトリのルートで実行します。

```sh
npm run dev -- --host 0.0.0.0
```

表示されたローカルURLに `/docs/ui-prototype/` を付けて開きます。
同じWi-Fiのスマホでは、Viteが表示するNetwork URLに同じパスを付けます。
`index.html` をブラウザーで直接開くこともできます。素材フォルダーと既存アセットの相対位置は保ってください。

## 試せる操作

「はじめる」から5種類の言葉を選び、完成したニュース、読み上げの状態、再度のニュース作りを試せます。
「おとな」で音声設定を開き、保存・キャンセル・入力エラーを確認できます。
画面の下にある「試作の表示確認」では、準備中・読み上げ中・エラー・音声非対応・オフライン・長い語・開発者用確認画面も表示できます。
この確認欄は、子ども向けのナビゲーションとは分けています。

音声処理、設定保存、開発者用の364語の連続再生は表示を確認するための模擬動作です。
Supertonicモデルの取得や音声合成、ブラウザーへの設定の永続化は接続していません。
実音声の聞こえ方や、子どもによる使いやすさの評価は別途必要です。

## 本実装へ移すとき

HTMLの表示は[application API](../application-api.md)に合わせた状態と操作を受け取ります。
単一HTMLのCSS・DOMを既存の `AppView` 以下へ移し、試作用モックを公開契約へ差し替える想定です。

| 試作の表示・操作   | 本実装の接続先                                            |
| ------------------ | --------------------------------------------------------- |
| トップ・選択・結果 | `state.game.screen.name`                                  |
| 質問・進捗・候補   | `currentCategory`、`currentStep`、`totalSteps`、`choices` |
| 完成文             | `state.lines`                                             |
| 開始・次のニュース | `commands.start()`                                        |
| 候補を選ぶ         | `commands.select(choice.id)`                              |
| もう一度聞く       | `commands.replay()`                                       |
| 音声の表示         | `state.speech`                                            |
| オフライン通知     | `state.isOffline`                                         |
| 設定               | `settings` の公開操作                                     |
| 開発者用確認       | `audioCheck` の公開操作                                   |

候補の生成、敬体変換、音声処理、入力検証、永続化を本番UIへコピーする想定ではありません。
モックは操作感と表示を確かめるための固定データです。
本実装は `state.speech.phase` で準備中と実際の読み上げ中を区別し、同じ表情切り替えを実音声イベントへ接続しています。
このHTML自体は比較用のモックとして残し、実際の操作はアプリのルートURLで確認できます。

試作は `docs/` 以下に置いているため、通常のViteビルドやPWAの配布対象に含まれません。
このフォルダーのHTMLは、本番のCSSやコンポーネントを参照しない独立サンプルとして残しています。

## 素材

既存のロゴとトップ用ひよこを相対参照しています。
待機・原稿を読むキャスターは、既存キャラクターを参照して組み込み `imagegen` で作成しました。
[生成指示](asset-prompts.md)に入力と保存先を記録しています。

太い丸文字は [Google Fonts公式](https://github.com/google/fonts/tree/main/ofl/mplusrounded1c)の M PLUS Rounded 1c Black を同梱しています。
フォント本体は未改変です。[SIL Open Font License](assets/OFL.txt)も同梱しています。
ダイアログには [標準の `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) を使います。

## 検証記録

ブラウザーでの検証結果と残る制約は [QA記録](qa/README.md)にまとめます。
