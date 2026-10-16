# アクセス解析について

更新日：2026年10月16日。

アプリの利用状況と使いやすさを確認するため、本番サイト [henteko-news.netlify.app](https://henteko-news.netlify.app/) ではCloudflare Web Analyticsでアクセスを集計します。
開発環境とプレビューサイトは計測対象に含めません。

## Cloudflareへ送信する情報

閲覧したページ、流入元、端末やブラウザー、表示速度などの集計用データをCloudflareへ送信します。[公式の集計項目](https://developers.cloudflare.com/web-analytics/data-metrics/dimensions/)、[サービス説明](https://www.cloudflare.com/web-analytics/)
通信の際には送信先のネットワークでIPアドレスも処理されるため、外部へのデータ送信がないという意味ではありません。

Cloudflareのアクセス解析にはCookieや識別用のlocalStorageを使いません。[Cloudflareの説明](https://www.cloudflare.com/web-analytics/)
このアプリからCloudflareへ、選んだ言葉、完成したニュース、個人を識別するための独自IDは送りません。
画面録画や広告サービスとの連携も行いません。

なお、音声の設定は、この端末のブラウザー内のlocalStorageに保存します。
これはアクセス解析のための保存とは別のものです。

## 集計の範囲

広告ブロッカーや通信の遮断、オフラインでの利用によって、集計されない場合があります。
解析の通信が使えないときも、文字でゲームを遊べる構成にしています。
Cloudflareで閲覧できる履歴は6か月で、7日を過ぎたデータにはサンプリングがあります。[CloudflareのFAQ](https://developers.cloudflare.com/web-analytics/faq/)

提供元のデータの扱いは[Cloudflareのプライバシーポリシー](https://www.cloudflare.com/privacypolicy/)を確認してください。
