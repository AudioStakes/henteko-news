# 利用条件と出所

独自コードとそのドキュメントには[MIT License](../LICENSE)を適用します。
画像、フォント、音声モデル、第三者コードには、それぞれ以下の条件が適用されます。

## 画像素材

`src/assets/hiyoko*.webp` と `public/assets/caster-idle.png`、`public/assets/caster-reading.png` のひよこ画像は、プロジェクト作者がChatGPTで生成したものです。
キャスター2姿勢の生成指示は[プロトタイプの素材記録](ui-prototype/asset-prompts.md)に保存しています。
`src/assets/hiyoko*.webp`、`public/assets/*.webp`、`public/assets/*.png`、`public/icons/*` を含む画像素材は、独自コードのMIT Licenseの対象に含めません。
画像の掲載は、第三者の著作権などの権利が存在しないことを保証するものではありません。
画像を再利用する場合は、生成サービスの利用条件と用途に応じた権利を確認してください。

## フォント

`public/assets/rounded-black.ttf` は Rounded Mplus 1c Black です。
[Google Fontsの配布元](https://github.com/google/fonts/tree/main/ofl/mplusrounded1c)から取得した未改変のフォントで、著作権表示は `Copyright 2016 The Rounded M+ Project Authors.` です。
フォントにはSIL Open Font License 1.1を適用します。
同梱の[許諾文](../public/assets/rounded-black.LICENSE.txt)を、フォントと一緒に配布してください。

## Supertonicの実装

`src/utils/supertonic/helper.ts` は、[Supertonic Web実装](https://github.com/supertone-oss-archive/supertonic/blob/main/web/helper.js)のテンソル構造、推論、前処理を参考にしています。
参考にしたWeb実装のGit blobは `8e16388e7dcb77fc7df1e3ace71ac340699e3318` です。

上流のサンプルコードはMIT Licenseです。
著作権表示と許諾文を [LICENSES/Supertonic-MIT.txt](../LICENSES/Supertonic-MIT.txt) に保存しています。

## 音声モデル

モデルは [supertone-oss-archive/supertonic-3](https://huggingface.co/supertone-oss-archive/supertonic-3) のリビジョン `aafc6e32416a594460b32413efc49d7fe4ce6d46` を使います。
上流はモデルの条件を **OpenRAIL-M** と案内しています。
コードのMIT Licenseをモデルに適用しないでください。
モデルを取得して配布するときは配布元のLICENSEと利用制限を確認し、必要な表示を保持してください。

モデルとvoice styleはGitに同梱せず、`setup:speech` で公式アーカイブから取得します。
Supertonicの開発とサポートは2026年9月9日に終了しています。
将来の不具合や互換性の修正は、このプロジェクトで検証して判断する必要があります。

## npm依存関係

使用するパッケージの正確なバージョンは `package-lock.json` を参照してください。
ReactとReact DOMは19.3.1を使用し、MIT許諾文は [LICENSES/React-MIT.txt](../LICENSES/React-MIT.txt) に保存しています。
それぞれの配布物に含まれるLICENSEを保持します。

配布するONNX RuntimeのMIT許諾文は [LICENSES/ONNX-Runtime-MIT.txt](../LICENSES/ONNX-Runtime-MIT.txt) に保存し、ビルド時にランタイムと一緒にコピーします。
ONNX Runtime 1.30.0の [上流ThirdPartyNotices](https://github.com/microsoft/onnxruntime/blob/v1.30.0/ThirdPartyNotices.txt) は [LICENSES/ONNX-Runtime-ThirdPartyNotices.txt](../LICENSES/ONNX-Runtime-ThirdPartyNotices.txt) にそのまま保存しています。
これは上流全体の通知で、WebのWASM配布で使わない構成の記述も含みます。

`predev` / `prebuild` はこれらとSupertonicの実装の許諾文を `public/licenses/` へコピーします。
本番配布では `dist/licenses/` も保持してください。
Viteなどの開発用依存関係も別個の利用条件を持ちます。
