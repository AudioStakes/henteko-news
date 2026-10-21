# UIを変更するときの機能API

画面の作り直しでは、表示するデータを機能側から受け取り、ボタン操作を機能側のコマンドに渡します。
そのための**公開API**を [`src/application/index.ts`](../src/application/index.ts) にまとめています。
HTTPサーバーや通信エンドポイントは追加しておらず、APIはブラウザー内で呼び出すTypeScriptの関数とReact Hooksです。

## 入口と責務

| API                                              | 実行環境                    | 担当すること                                                                                     |
| ------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------ |
| `createGameSession()`                            | Reactに依存しないTypeScript | 選択肢の生成、選択の検証、ゲーム進行、完成したニュース、状態変更の通知                           |
| `useNewsApplication()`                           | React                       | ゲームの状態と操作に、音声準備、完成時の読み上げ、再読み上げ、接続状態、表示モードを組み合わせる |
| `SpeechSettingsProvider` / `useSpeechSettings()` | React                       | 音声設定の共有、入力の検証、ブラウザーへの保存                                                   |
| `useWordsAudioCheck()`                           | React                       | 全語彙の音声確認、カテゴリからの開始、停止と再開                                                 |
| `playChoiceSoundFromUserGesture()`               | ブラウザー                  | ユーザー操作に合わせたボタン効果音                                                               |

UIは公開APIの状態を読み、コマンドを呼び出します。
ニュースの生成、選択肢のシャッフル、設定の検証、音声キューの制御をコンポーネントに複製する必要はありません。
現在の接続例は [`src/App.tsx`](../src/App.tsx) です。
ESLintは、画面から内部の音声・設定・語彙実装への直接importと、機能側から画面へのimportを拒否します。

## Reactでゲームを表示する

`useNewsApplication()` は `{ state, commands }` を返します。
`state.game` に画面、現在のカテゴリ、進捗、選択肢、選択済みの言葉があり、`state.lines` に表示用のニュース本文があります。
`state.speech` には `error`、`isSupported`、`isSpeaking`、`phase`、`availability` があり、音声の状態を表示できます。
`availability` は `"ready"`、`"unsupported"`、`"speaking"`、`"error"` のいずれかです。
`phase` は公開型 `SpeechPhase` の `"idle"`、`"preparing"`、`"speaking"` です。
読み上げの受付後と分割音声の合成中は `"preparing"`、ブラウザーから実際の再生開始イベントが届くと `"speaking"`、終了・取消・失敗後は `"idle"` になります。
`isSpeaking` と `availability: "speaking"` は従来どおり準備中も含むため、再読み上げのボタンは準備中にも無効にします。
`debug-result` と `audio-check` のゲーム用 `phase` は `"idle"` です。

ゲームの画面は `state.game.screen.name` の `"start"`、`"select"`、`"result"` で判別します。
`currentStep` は0始まり、`totalSteps` はカテゴリ数、`currentCategory` は選択中のカテゴリ（選択画面以外では `null`）です。
`selections` はカテゴリごとの選択済みの言葉を保持し、各言葉の `display` が表示用、任意の `speech` が読み上げ用の表記です。

次の例は、`src/` 直下に画面を作る場合の最小限の接続です。
表示する言葉ではなく、受け取った `choice.id` を `select()` に渡します。

```tsx
import { SpeechSettingsProvider, useNewsApplication } from "./application";

export function RedesignedApp() {
  return (
    <SpeechSettingsProvider>
      <News />
    </SpeechSettingsProvider>
  );
}

function News() {
  const { state, commands } = useNewsApplication();
  if (state.mode !== "game") return null;

  return (
    <main>
      <button type="button" onClick={() => { commands.start(); }}>
        ニュースをはじめる
      </button>
      <h1>{state.game.currentCategory?.label ?? "へんてこニュース"}</h1>
      {state.game.choices.map((choice) => (
        <button
          key={choice.id}
          type="button"
          onClick={() => { commands.select(choice.id); }}
        >
          {choice.option.display}
        </button>
      ))}
      <p>{state.lines.join(" ")}</p>
      {state.game.screen.name === "result" && (
        <button
          type="button"
          disabled={!state.speech.isSupported || state.speech.isSpeaking}
          onClick={() => { commands.replay(); }}
        >
          もういちどよむ
        </button>
      )}
      <p role="status">{state.speech.error}</p>
    </main>
  );
}
```

コマンドの戻り値は、操作を受け付けたかを表します。
読み上げの成功は端末やブラウザーにも依存するため、`replay()` の `true` だけで音声出力の成功を判断せず、音声の状態も表示します。

| コマンド                             | 受け付ける条件と動作                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `commands.start(): boolean`          | 通常のゲームで開始または再開始する。前の音声を止め、音声を準備し、エラーと選択済みの言葉をリセットする |
| `commands.select(choiceId): boolean` | 現在提示しているIDだけを受け付け、次のカテゴリへ進む。最後の選択でニュースを一度読み上げる             |
| `commands.replay(): boolean`         | ゲームが完成し、音声が利用可能で、再生中でない場合に再読み上げする                                     |

不正なID、前のカテゴリのID、再開始前のID、同じ選択の連打は `false` になり、ゲームの状態を変更しません。
APIが返す選択肢や選択済みデータは読み取り専用です。
UIではコピーを書き換えて進行させず、コマンドを呼び出します。
ゲームと音声確認のコマンドは同じ参照を維持し、保存したハンドラーも最新の音声設定を使います。
画面を破棄した後のコマンドは、操作を受け付けません。

`state.mode` は通常の `"game"`、`?debugResult=1` による表示確認用の `"debug-result"`、`/words-audio-check` の `"audio-check"` です。
表示確認用のニュース本文は `state.lines` に反映されます。
`debug-result` と `audio-check` ではゲームの3コマンドをすべて拒否します。
音声確認画面の操作には、専用の `useWordsAudioCheck()` を使います。

## Reactを使わずにゲームを操作する

HTMLのボタンからゲームコアを呼び出す場合は、[`gameSession.ts`](../src/application/gameSession.ts) を直接使えます。
TypeScriptのエントリーポイントをViteなどでビルドし、HTMLに次の要素を用意します。

```html
<button id="start" type="button">ニュースをはじめる</button>
<div id="choices"></div>
<p id="news" aria-live="polite"></p>
```

```ts
import { createGameSession } from "./application/gameSession";

const game = createGameSession();
const startButton = document.querySelector("#start");
const choicesElement = document.querySelector("#choices");
const newsElement = document.querySelector("#news");
if (
  !(startButton instanceof HTMLButtonElement) ||
  !(choicesElement instanceof HTMLElement) ||
  !(newsElement instanceof HTMLElement)
) {
  throw new Error("ゲーム表示用のHTML要素がありません");
}

const render = () => {
  const snapshot = game.getSnapshot();
  choicesElement.replaceChildren(...snapshot.choices.map((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = choice.option.display;
    button.onclick = () => { game.select(choice.id); };
    return button;
  }));
  newsElement.textContent = snapshot.lines.join(" ");
};

const unsubscribe = game.subscribe(render);
startButton.onclick = () => { game.start(); };
render();

export function dispose() {
  unsubscribe();
}
```

`getSnapshot()` は操作が受け付けられるまで同じ状態を返し、読み取りでシャッフルしません。
`subscribe()` は変更後に呼ばれ、戻り値で購読を解除できます。
この例では、UIを破棄するときに `dispose()` を呼びます。
コアの `start()` は戻り値なし、`select(id)` は受け付けた場合に `true` を返します。

ゲームコアには音声再生、設定保存、接続状態の監視を含めていません。
これらは現在React向けのAPIから提供しているため、Reactを使わないUIで同じ音声機能を使う場合は、その接続部分を別途用意する必要があります。

## 音声設定と音声確認

`SpeechSettingsProvider` の内側で `useSpeechSettings()` を呼ぶと、`settings` と `saveSettings(next)` を取得できます。
保存にはフォームの値をそのまま渡し、戻り値に応じて画面を更新します。

| 保存結果                 | UIでの扱い                                                                                                            |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `{ ok: true, settings }` | 検証と正規化が済んだ設定が共有状態に反映される。フォームを閉じてよい                                                  |
| `{ ok: false, errors }`  | `errors.provider`、`errors.modelBasePath`、`errors.voiceStylePath` を表示する。以前の設定と保存済みの値は変更されない |

検証は読み上げ方式とモデルのパス形式を確認します。
モデルファイルの実在や再生の成功は保存結果では保証しません。
保存先の `localStorage` が利用できなくても、有効な設定は現在のマウント中に使えますが、再読み込み後の保持は保証しません。
`ok: true` は永続化の成功を表す結果ではありません。
設定を初期値に戻す場合も、`DEFAULT_SPEECH_SETTINGS` を `saveSettings()` に渡します。
設定と初期値も変更不能なので、編集用フォームではコピーを作り、変更を `saveSettings()` に渡します。

`useWordsAudioCheck()` も `{ state, commands }` を返します。
`state` には `queue`、`currentItem`、`currentIndex`、`isPlaying`、`error`、`categoryStarts` があり、語彙一覧と進捗を表示できます。
操作には `start()`、`resume()`、`stop()`、`startCategory(categoryKey)` を使います。
開始と再開のコマンドは、再生中や音声非対応などで開始できない場合に `false` を返します。
`stop()` は音声を停止し、次の `resume()` は停止した語から再開します。
設定変更や画面の破棄後に届いた古い音声コールバックは、次のキューを進めません。

## UIに残す処理

DOM、CSS、画面幅の計測、文字サイズの調整、フォーカス移動、ダイアログの開閉、選択時のアニメーションはUIの責務です。
選択後の演出でAPI呼び出しを遅らせても、ゲームコアの進行にタイマーは不要です。
遅延した操作が古いIDを渡した場合も、APIが拒否します。

ボタンの押下音は、[`components/useButtonSound.ts`](../src/components/useButtonSound.ts) がポインター操作とキーボード操作を扱い、公開APIの `playChoiceSoundFromUserGesture()` に接続します。
ブラウザーの自動再生制限に対応するため、効果音とゲームの操作はユーザーのイベントハンドラーから呼び出します。
新しいボタンもこの接続を再利用し、機能APIにDOMイベントを渡す必要はありません。

## テストと検証

| 対象               | 主な自動テスト                                                                         | 確認する契約                                                                         |
| ------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| ゲームコア         | `src/application/gameSession.test.ts`                                                  | 全カテゴリの進行、不正IDと古いIDの拒否、連打、再開始、状態の不変性、購読、シャッフル |
| ゲームと音声の接続 | `src/application/useNewsApplication.test.tsx`                                          | 完成時の読み上げ一回、再読み上げの条件、モード別の操作拒否、接続状態と後始末         |
| 設定               | `src/application/speechSettings.test.ts`、`src/context/SpeechSettingsContext.test.tsx` | 入力検証、正規化、共有、破損データ、保存拒否時の動作                                 |
| 音声確認           | `src/application/useWordsAudioCheck.test.ts`、`src/hooks/useSpeechQueue.test.ts`       | 開始、停止、再開、カテゴリ移動、連打拒否、設定変更と遅延コールバック                 |
| UIの接続           | `src/components/*.test.tsx`、`src/App.gameflow.test.tsx`                               | APIの状態表示、イベントの接続、エラー表示、アニメーション、フォーカス                |
| ブラウザー         | `tests/`                                                                               | ゲーム、設定、オフライン、画面サイズ、実ブラウザーの音声処理                         |

UIを作り直す間は、まず機能APIのテストを単独で実行できます。

```sh
npm test -- src/application src/context/SpeechSettingsContext.test.tsx src/hooks/useSpeechQueue.test.ts
```

提出前には全検証と、変更した画面に関係するE2Eを実行します。

```sh
npm run validate
npm run test:e2e -- tests/game.spec.ts tests/speech-settings.spec.ts tests/usability.spec.ts
```

ブラウザーの準備と実モデルによる音声確認の手順は、[開発と配布](DEVELOPMENT.md#検証コマンド)を参照してください。
APIのテストが通ることと、新しいUIでのレイアウトや実機音声が正しいことは、それぞれのテストで確認します。
