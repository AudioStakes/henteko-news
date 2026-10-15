# セキュリティ上の問題の報告

認証情報や悪用できる詳細を公開Issue・公開PRに記載しないでください。GitHubの **Security → Report a vulnerability** が表示される場合は、非公開報告を使ってください。

このリポジトリでは [脆弱性の非公開報告](https://github.com/AudioStakes/henteko-news/security/advisories/new) を有効にしています。
この機能を利用できない場合は、[作者のプロフィール](https://github.com/AudioStakes)にある連絡手段から非公開で連絡方法を確認し、詳細の公開を控えてください。

報告には影響するバージョン・ブラウザ、再現条件、影響範囲を含めてください。現在の対応対象は `main` の最新版です。対応期限の保証はしていません。

モデルとライブラリは公式配布元から取得し、依存関係は `package-lock.json` で固定します。`VITE_` で始まる環境変数はブラウザ向け成果物に埋め込まれるため、秘密情報を設定しないでください。履歴と依存関係の確認範囲は [公開版の検証記録](docs/release-verification.md)を参照してください。
