# へんてこニュース

へんてこニュースは、**5歳前後の子ども向けのおふざけ言葉ゲーム**です。  
「だれが・いつ・どこで・なにを・なにした」を順番にタップすると、最後にへんてこニュースが完成して読み上げられます。

## 公開URL

- https://henteko-news.netlify.app/

## アプリ概要

- すばやく単語を選んで、へんてこな5行ニュースを作って遊ぶアプリです。
- 一番の見どころは、結果画面での「ニュースです！」から始まる読み上げです。
- 単語カードはカテゴリごとにシャッフルされるため、繰り返し遊んでも位置を覚えにくくなっています。

## 技術構成

- Vite
- React
- TypeScript
- Plain CSS
- Web Speech API
- Service Worker + Cache Storage（本番のみ登録）

## ローカル起動

```bash
npm install
npm run dev
```

コード品質チェック:

```bash
npm run lint
npm run test
npm run format
npm run check
npm run typecheck
npm run check:words
```

CI でも `npm run test` を実行しています。レイアウト計算まわりを触ったときは、関連する `src/utils/*.test.ts` が通ることを確認してください。

ビルド確認:

```bash
npm run build
npm run preview
```

## Netlify デプロイ設定

Netlify の新規サイト作成時は、以下を指定してください。

- **Build command**: `npm run build`
- **Publish directory**: `dist`

## キャッシュ運用の注意

- Service Worker は same-origin のみを対象に、`/assets/` を cache-first、ナビゲーションを network-first で処理します。オフライン時は直近の `index.html` キャッシュにフォールバックします。
- 画像は `public/_headers` で `max-age=86400`（1日）を設定しています。
- Service Worker は `src/main.tsx` から `/sw.js?v=<package.json version>` で登録し、URL クエリのバージョンをキャッシュキーに使います。
- 頻繁に更新する画像は `hiyoko-v2.webp` のようにファイル名へバージョンを付ける運用がおすすめです。
- OGP画像（`ogp.png`）は将来追加予定です。現状は既存アイコンをOGPの参照先にしています。

## 開発者向け: 読み上げ確認

- `/words-audio-check` で全カテゴリ単語の読み上げを順次確認できます。

## 開発者向け: 単語データ更新ルール

- 単語は `src/data/words/` 配下のカテゴリ別ファイルに追加します。
- 追加後は `npm run sort:words` を実行します。
- 続けて `npm run check:words` を実行します。
- 単語配列は sort 済み・重複なしを維持してください。
- action は `display` と `speech` を両方指定してください。
- reaction は `src/data/words/reaction.ts` に追加してください。
