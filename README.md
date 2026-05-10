# へんてこニュース

5歳以上の子ども向けのおふざけ言葉ゲームです。

👉 https://henteko-news.netlify.app/

## どんなアプリ？

「だれが・いつ・どこで・なにを・どうした」を順番にタップすると、
最後にニュースとして読み上げられます。

## 技術構成

React, TypeScript, Vite, Plain CSS, Web Speech API

## ローカル起動

```bash
npm install
npm run dev
```

## オフライン確認（PWA）

1. `npm run build && npm run preview` を実行してアプリを開く。
2. 一度オンラインでトップ画面を表示する（Service Worker と静的アセットをキャッシュ）。
3. ブラウザ DevTools の Network を Offline にして再読み込みする。
4. アプリが起動し、オフライン通知が表示されることを確認する。
