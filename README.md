# へんてこニュース

5歳以上の子ども向けのおふざけ言葉ゲームです。

👉 https://henteko-news.netlify.app/

## どんなアプリ？

「だれが・いつ・どこで・なにを・どうした」を順番にタップすると、
最後にニュースとして読み上げられます。

## 技術構成

React, TypeScript, Vite, Plain CSS, Supertonic (onnxruntime-web + fft.js)

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


## Supertonic アセット配置

1. [supertone-inc/supertonic](https://github.com/supertone-inc/supertonic) の案内に従い、Supertonic 3 の Web 用 assets を取得します。
2. ONNX モデルを `public/supertonic/onnx/` に配置します。
3. voice style JSON を `public/supertonic/voice_styles/` に配置します（デフォルトは `M1.json`）。
4. 大きいモデルは Git LFS が必要になる場合があります。

このリポジトリでは `useSpeech` が `/supertonic/onnx/` と `/supertonic/voice_styles/` から読み込みます。
