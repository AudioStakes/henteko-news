# Agent instructions

## Quality checks

コード・設定・テストを変更するときは、先に [品質基準](docs/agents/quality.md) を読んでください。提出前に `npm run validate` を実行し、変更した動作に関係するE2Eも確認してください。

## Releases

Netlifyの本番公開は、ユーザーがリリースを明示的に依頼したときだけ手動で行います。
自動ビルドは停止した状態を保ち、公開作業・Netlify設定変更の前に[手動リリース手順](docs/DEVELOPMENT.md)を確認してください。

## Agent skills

### Issue tracker

GitHub Issues で管理します。詳細は `docs/agents/issue-tracker.md` を参照。

### Triage labels

デフォルトの5ラベルを使用します。詳細は `docs/agents/triage-labels.md` を参照。

### Domain docs

single-context 構成として扱います。詳細は `docs/agents/domain.md` を参照。
