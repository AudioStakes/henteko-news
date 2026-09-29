# 第三者コード・モデル・素材

この文書は第三者の条件を示します。プロジェクト自身のライセンスを確定するものではありません。

## Supertonicの実装

`src/utils/supertonic/helper.ts` は、[Supertonic Web実装](https://github.com/supertone-oss-archive/supertonic/blob/main/web/helper.js)のテンソル構造・推論・前処理を参考にしています。参考にしたWeb実装のGit blobは `8e16388e7dcb77fc7df1e3ace71ac340699e3318` です。

上流のサンプルコードはMIT Licenseです。著作権表示と許諾文を [LICENSES/Supertonic-MIT.txt](../LICENSES/Supertonic-MIT.txt) に保存しています。

## 音声モデル

モデルは [supertone-oss-archive/supertonic-3](https://huggingface.co/supertone-oss-archive/supertonic-3) のリビジョン `aafc6e32416a594460b32413efc49d7fe4ce6d46` を使います。上流はモデルの条件を **OpenRAIL-M** と案内しています。コードのMIT Licenseをモデルに適用しないでください。モデルを取得・配布するときは配布元のLICENSEと利用制限を確認し、必要な表示を保持してください。

モデルとvoice styleはGitに同梱せず、`setup:speech` で公式アーカイブから取得します。Supertonicの開発・サポートは2026年9月9日に終了しています。将来の不具合・互換性修正は、このプロジェクトで検証・判断する必要があります。

## npm依存関係

React / React DOM、ONNX Runtime Webなど、使用するパッケージのバージョンは `package-lock.json` を参照してください。それぞれの配布物に含まれるLICENSEを保持します。Viteなどの開発用依存関係も別個の利用条件を持ちます。

## 画像素材（確認待ち）

`src/assets/*.webp`、`public/assets/*`、`public/icons/*` はリポジトリに同梱されていますが、素材ごとの作成元と再利用条件を確認できる記録がありません。権利者が、作成者・生成/入手元・第三者による改変と再配布の条件を記録してから、公開ライセンスの対象を確定してください。

公開前の推奨は、独自コードにMITなどの明示的なライセンスを選び、画像とモデルの条件を分けて示すことです。画像も同じ許諾に含める場合は、権利を持つことを確認したうえで明記します。
