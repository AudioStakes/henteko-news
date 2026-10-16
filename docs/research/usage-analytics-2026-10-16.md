# 個人アプリのアクセス解析サービス調査

調査日：2026年10月16日（日本時間）。
4〜10サイトの個人アプリについて、アクセス数、流入元、端末を簡単に一覧で見る用途で比較しました。
料金はUSDの月払いで、記載した利用量のプランを比較しています。
年払いの割引料金とは異なります。

## この用途での選び方

計測対象の4〜10サイトは無料枠に収まるため、**Cloudflare Web Analytics** が第一候補です。[公式サービス説明](https://www.cloudflare.com/web-analytics/)、[サイト数の上限](https://developers.cloudflare.com/web-analytics/limits/)
NetlifyやGitHub Pagesを使い続けたまま計測でき、DNSの移行も必要ありません。[公式導入手順](https://developers.cloudflare.com/web-analytics/get-started/)
外部ホストのサイトは10件までで、流入元、端末、ブラウザーを確認でき、複数サイトの集計にも対応します。[上限](https://developers.cloudflare.com/web-analytics/limits/)、[集計項目](https://developers.cloudflare.com/web-analytics/data-metrics/dimensions/)
履歴は6か月ですが、7日を過ぎたデータはサンプリングされ、UTMによる施策別の分析や独自イベントは対象外です。[履歴と制約](https://developers.cloudflare.com/web-analytics/faq/)

有料で複数アプリの見やすい一覧と長期履歴を優先するなら **Fathom** が合います。
月$15で50サイトまで、全サイト合計で月10万PV相当の利用量を扱い、All sites画面で全体の合計とサイト別カードを確認できます。[公式料金](https://usefathom.com/pricing)、[All sites](https://usefathom.com/docs/features/all-sites)
流入元と端末の詳しい内訳は各サイトを開いて見ます。[ダッシュボード](https://usefathom.com/docs/start/dashboard)
履歴は契約中保持されます。[公式料金](https://usefathom.com/pricing)

まず無料のCloudflareを選び、半年を超える履歴やサイト別カードが必要なら月$15のFathomを有料の第一候補とする判断です。
Plausible Growthは3サイトまでなので今回の対象外で、4〜10サイトには月$19のBusinessが必要です。[公式料金](https://plausible.io/#pricing)
全サイトの詳細な合算レポートを重視する場合は、そのPlausible Businessも比較対象になります。[合算画面](https://plausible.io/docs/consolidated-views)
これらは今回の用途に対する選定判断です。

## 6サービスの比較

| サービス                 | 料金と主な上限                                                                                                    | 複数アプリを一か所で見る方法                                                                                                                                                                                                                | 履歴                                                                                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloudflare Web Analytics | 無料。外部ホスト10サイトまで                                                                                      | サイトを選んだ集計や横断集計が可能。[上限](https://developers.cloudflare.com/web-analytics/limits/)                                                                                                                                         | 6か月。7日後はサンプリングあり。[FAQ](https://developers.cloudflare.com/web-analytics/faq/)                                                                    |
| Fathom                   | $15/月、50サイト、合計10万PV相当/月                                                                               | All sitesに全体合計とサイト別カード。[一覧](https://usefathom.com/docs/features/all-sites)                                                                                                                                                  | 契約中は全履歴。[料金](https://usefathom.com/pricing)                                                                                                          |
| Plausible                | 月1万PV相当でStarter $9/1サイト、Growth $14/3サイト、Business $19/10サイト。[料金](https://plausible.io/#pricing) | Sites一覧は各サイトの訪問者数とグラフ。全サイトの詳細な合算画面はBusiness。[一覧](https://plausible.io/docs/landing-page)、[合算](https://plausible.io/docs/consolidated-views)                                                             | Starter/Growthは3年、Businessは5年。[料金](https://plausible.io/#pricing)                                                                                      |
| Umami Cloud              | 無料Hobbyは月10万events/1サイト。Proは$20/月、100万events/20サイト。[料金](https://umami.is/pricing)              | 複数サイトのウィジェットをBoardsに並べる。レイアウト設定が必要。[Boards](https://docs.umami.is/docs/using-boards)                                                                                                                           | Hobbyは6か月、Proは2年。[料金](https://umami.is/pricing)                                                                                                       |
| Google Analytics 4       | 標準版は無料。[製品説明](https://marketingplatform.google.com/about/analytics/)                                   | 別プロパティの正式な合算は360向け。標準版では別途Looker Studioなどでレポートを作る方法がある。[合算](https://support.google.com/analytics/answer/11526039)、[接続](https://cloud.google.com/looker/docs/studio/connect-to-google-analytics) | 探索用のユーザーとイベントデータは2か月または14か月。標準の集計済みレポートはこの設定の対象外。[保持設定](https://support.google.com/analytics/answer/7667196) |
| PostHog                  | 月100万eventsまで無料、超過の最初の単価は$0.00005/event。無料は1 project。[料金](https://posthog.com/pricing)     | 同一projectでhost別に絞るか、projectを切り替える。全サイト専用の標準一覧は今回の資料では未確認。[画面](https://posthog.com/docs/web-analytics/surfaces/web-app)、[Projects](https://posthog.com/docs/settings/projects)                     | 無料は1年、カード追加後は7年。[料金](https://posthog.com/pricing)                                                                                              |

PVとeventsは同じ課金単位ではありません。
FathomとPlausibleは独自イベントもPV枠に合算し、Umamiではイベントの属性やsession dataも利用量に含まれます。
PostHogのWeb AnalyticsとProduct Analyticsは同じイベント枠を使います。[Fathomの料金](https://usefathom.com/pricing)、[Plausibleの計算方法](https://plausible.io/docs/subscription-plans)、[Umamiの計算方法](https://docs.umami.is/docs/cloud/faq)、[PostHogのWeb Analytics料金](https://posthog.com/web-analytics/pricing)

GA4には流入元と端末の標準レポートがあり、PostHogはゲームの途中離脱などの行動分析まで進める場合に候補になります。[GA4の流入レポート](https://support.google.com/analytics/answer/12923437)、[端末レポート](https://support.google.com/analytics/answer/12980150)、[PostHogのファネル](https://posthog.com/docs/product-analytics/funnels)
無料GA4でも複数サイトを1つのプロパティに集めてhostname別に表示する設計は可能ですが、一覧レポートを整える必要があり、別プロパティの正式な合算とは区別します。[アカウント構成](https://support.google.com/analytics/answer/9679158)、[hostNameディメンション](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)
今回の簡単な一覧では、画面の理解や設定に必要な手間を考えて優先順位を下げています。

Umamiには無料の自己ホスト版もありますが、サーバー、DB、更新、バックアップを自分で管理します。[公式Cloudと自己ホスト版の違い](https://docs.umami.is/docs/cloud)
今回は管理の簡単さを優先するため、Cloud版を比較の中心としました。

Cloudflare、Fathom、Plausible、Umamiの通常集計はCookieを使いません。[Cloudflare](https://www.cloudflare.com/web-analytics/)、[Fathom](https://usefathom.com/data)、[Plausible](https://plausible.io/data-policy)、[Umami](https://docs.umami.is/docs)
GA4は通常first-party Cookieを使い、PostHogは通常永続識別子を使いますが、PostHogにはCookieを使わない設定もあります。[GA4](https://support.google.com/analytics/answer/11397207)、[PostHogの保存方式](https://posthog.com/docs/libraries/js/persistence)、[Cookieなしの設定](https://posthog.com/docs/privacy/data-collection)
Cookieなしでも解析データの送信はあり、同意が一律不要という意味にはならないため、この子ども向けアプリでは匿名の標準集計に絞り、録画は使わない設計を提案します。

## 配信先とGitHub Pagesの注意点

各サービスのブラウザー用タグをアプリのHTMLへ設置すれば、計測先とアプリのホストを分けられます。
GitHub PagesもHTMLとJavaScriptを配信するため、この方法を使えます。
これはホストの仕様と各社のタグ導入方法を組み合わせた判断です。[GitHub Pagesの仕様](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)、[GoogleのWeb計測](https://developers.google.com/analytics/devguides/collection/ga4/web)、[PlausibleのSPA対応](https://plausible.io/docs/spa-support)、[UmamiのReact/Vite向け手順](https://docs.umami.is/docs/guides/track-single-page-apps)、[FathomのSPA対応](https://usefathom.com/docs/integrations/spas)、[PostHogのJavaScript SDK](https://posthog.com/docs/libraries/js)

`user.github.io/app1/` と `user.github.io/app2/` は同じhostnameです。
Cloudflareはhostname単位で登録するため、アプリ別に見るにはPathで絞る構成になります。
Fathomは同じサイトの領域ごとに異なるSite IDを割り当てる方法を公式に案内しており、別カードで扱いたい場合の候補です。[Cloudflareの登録](https://developers.cloudflare.com/web-analytics/get-started/)、[Pathの集計](https://developers.cloudflare.com/web-analytics/data-metrics/dimensions/)、[Fathomの複数Site ID](https://usefathom.com/docs/script/multiple-site-ids-one-website)

オフラインでの利用や広告ブロッカーによる遮断は、通常のブラウザー計測では記録が欠ける要因です。
訪問者の数え方もサービスごとに異なり、複数アプリの合計が重複を除いた実人数を表すとは限りません。
たとえばCloudflareのVisitsは、外部サイトや直接リンクから始まった閲覧を表す指標です。[CloudflareのVisits定義](https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/)、[Plausibleのドメイン別訪問者の数え方](https://plausible.io/docs/subdomain-hostname-filter)

## github.comのリポジトリやプロフィールは別の計測

| 対象                     | できること                                                                                                                                                                                                                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub Pagesの公開アプリ | 自分のHTMLへ解析タグを設置できる。上記のサービスで継続計測する対象                                                                                                                                                                                                                                               |
| `github.com/OWNER/REPO`  | push権限者がInsightsのTrafficで直近14日の閲覧、ユニーク訪問者、clone、流入元、人気ページを確認できる。[公式Traffic](https://docs.github.com/en/repositories/viewing-activity-and-data-for-your-repository/viewing-traffic-to-a-repository)                                                                       |
| GitHubプロフィール       | 今回確認した公式資料に、プロフィールの公式閲覧数APIや訪問者一覧はない。プロフィールREADME用リポジトリのTrafficを、プロフィール自体の訪問数とは扱わない。[プロフィール資料](https://docs.github.com/en/account-and-profile/reference/profile-reference)、[Users API](https://docs.github.com/en/rest/users/users) |

GitHub.comのREADMEでは任意のJavaScriptが除去されるため、GA4などのタグを貼ってページ全体を計測する方法は使えません。[GitHubのHTML処理](https://github.com/github/markup#github-markup)
外部カウンター画像もキャッシュを経由する画像リクエストの計測で、プロフィールの正確な訪問者数とは扱えません。[画像の匿名化とキャッシュ](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-anonymized-urls)

複数リポジトリのTrafficを長期保存したい場合は、REST APIの結果を外部の定期処理などで保存し、別途まとめる方法があります。
APIが返すのも直近14日の集計で、閲覧したGitHubアカウントやIPの一覧ではありません。
14日分の合計を毎回足すと重複するため、日付ごとの値を更新して保存する設計が必要です。
採用担当者の誰が見たかや、リポジトリをまたぐ正確な実人数は、この集計から特定できません。[公式Traffic API](https://docs.github.com/en/rest/metrics/traffic)

アプリ側で分かる `github.com` からの流入は、GitHubからアプリへ移動した訪問です。
GitHubのページを見て移動しなかった人は、アプリ側の解析には含まれません。[流入元の定義](https://developers.google.com/analytics/devguides/collection/ga4/reference/config#page_referrer)

## 調査時点の状態と導入範囲

調査時点では、このアプリにはイベント送信を差し込む関数がありましたが、送信先は `null` のままでした。
`setAnalyticsTransport` の呼び出しはテスト内だけで、外部の解析サービスは未接続でした。
根拠は [`src/utils/analytics.ts`](../../src/utils/analytics.ts)、[テスト](../../src/utils/analytics.test.ts)、[開発ドキュメント](../DEVELOPMENT.md#構成と変更箇所)です。

新しい計測タグで集められるのは導入後のデータです。
導入前のアクセスをあとから再収集することはできません。
すでにGitHubにある直近14日のTrafficは別枠で、14日より古い未保存の履歴はTraffic APIから復元できません。[タグによる計測](https://developers.google.com/analytics/devguides/collection/ga4/web)、[Traffic APIの取得範囲](https://docs.github.com/en/rest/metrics/traffic)

まずは標準のアクセス数、流入元、端末の集計に絞れば十分です。
ゲーム内の独自イベントは今は不要で、将来、開始と完走を比較したくなった時に既存の `game_start` と追加候補の `game_complete` を検討できます。
回答内容、完成した文章、個人を識別するID、画面録画を初期導入の要件にはしない、という設計を提案します。

この調査では記録だけを作成しました。
計測タグの設置、アカウント作成、サービス設定、アプリの実装変更、PR作成は行っていません。

## 調査後の導入

調査後、Cloudflareに対象サイトを登録し、Cloudflare Web Analyticsの標準beaconを使う構成を追加しました。
対象は本番の `henteko-news.netlify.app` だけとし、開発環境やプレビューでは外部スクリプトを読み込まない構成です。
既存の独自イベント送信には接続せず、選んだ言葉や完成したニュースは送信しません。
集計を確認するときは、CloudflareのWeb Analyticsで `henteko-news.netlify.app` を選び、訪問数、ページビュー（PV）、流入元、端末を確認します。
設定方針は[開発ドキュメント](../DEVELOPMENT.md#アクセス解析)、利用者向けの説明は[アクセス解析について](../PRIVACY.md)を参照してください。
