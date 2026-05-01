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
npm run format
npm run check
npm run typecheck
npm run check:words
```

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
- Service Worker の `VERSION` は `npm run build` 実行時に `package.json` の `version` と同期されます（`scripts/sync-sw-version.mjs`）。
- 頻繁に更新する画像は `hiyoko-v2.webp` のようにファイル名へバージョンを付ける運用がおすすめです。
- OGP画像（`ogp.png`）は将来追加予定です。現状は既存アイコンをOGPの参照先にしています。

## 注意事項

- ログインなし
- 広告なし
- 課金なし
- 個人情報の取得なし
- カメラ不使用
- マイク不使用
