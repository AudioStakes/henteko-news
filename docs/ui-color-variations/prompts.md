# 配色比較の画像生成記録

imagegenの組み込みツールで、[水色版のトップと「だれが？」](../ui-full-design/images-bright/01-start-who.png)を編集対象にした。
6案とも同じ画像を入力し、配色と画像外の識別記号だけを変更するよう指定した。
最終PNGは `images/a.png` から `images/f.png` に保存した。
CLIやアプリの実装は使用していない。

## 共通指定

各画像は次の共通指定と個別指定を連結して生成した。

```text
Use case: precise-object-edit. Edit this exact TWO-PHONE mockup with PALETTE CHANGES ONLY. Produce a controlled color comparison for the same Japanese smartphone word game. Both devices, EXACT geometry, layouts, fonts, typography, words, logo, fluffy chick poses/identity, red hat, black mic, thin desk/nameplate positions, spacing, sizes, FIVE choice holes and 2/1/2 arrangement must remain identical to input. LEFT is TOP; RIGHT is だれが？. No other screens.
Keep the actual multicolor glossy へんてこニュース logo and fluffy yellow chick/RED HAT and black phone frames EXACTLY their original colors. Do not tint the logo or character. The palette only applies to UI surfaces/ink.
Use the specified palette roles exactly:
- Background: designated warm YELLOW, remains the main surrounding surface.
- Main panel: designated color on the LEFT chick's organic backdrop and ALL FIVE RIGHT choice holes. Uniform flat light fill, no dark center, no heavy shadows.
- Ink: designated DARK color for all text except logo, including prompts, choice words, start-button text/icon, おとな, progress text, speaker icon, nameplate and outside captions. NO white lettering on light surfaces.
- Edge: designated medium color, a clean thin outline about2 CSSpx around interactive choices and start button; same thin desk/nameplate strokes and progress dots/rings. Not thick piping.
- Start-button: designated fill, same organic はじめる button shape/size as source, designated dark Ink text/play triangle.
- Nameplate stays warm cream #FFFBEF with designated Ink.
Every choice within one variant is the SAME color, no rainbow choices. No new drawings/props/patterns, no new badges, no new character, no cosmetic changes to chick, no wood desk, no inflated 3D UI.
Preserve exact UI text: LEFT "５つ えらぶと" / "ニュースに なるよ", "はじめる", "おとが でるよ", おとな. RIGHT prompt "だれが？", progress1/5 (first of5dots filled), five labels ねこ / いぬ / うさぎ / おばけ / ロボット in exact2top/1center/2bottom. No added instructions or menus.
Output same landscape1536x1024 white presentation board, two large equal front-facing black smartphones. Only outer caption numbering changes to the requested variant letter. Do not add overall heading or extra phone screens.
```

## A はちみつオレンジ

[画像](images/a.png)

```text
VARIANT A: はちみつオレンジ. This name describes color only; do not illustrate it.
Background #FFEA66; main panel and all5choice fills #FFC88F; Ink #5A2D16; Edge #954315; start-button fill #FFA35C.
LEFT outside caption exactly "A トップ". RIGHT outside caption exactly "A だれが？".
Use these colors throughout both screens; replace previous blue UI ink and surfaces completely according to roles, keep original logo/chick colors unchanged.
```

## B わかばグリーン

[画像](images/b.png)

```text
VARIANT B: わかばグリーン. This name describes color only; do not illustrate it.
Background #FFF06A; main panel and all5choice fills #B9E280; Ink #23462D; Edge #416F39; start-button fill #A8D572.
LEFT outside caption exactly "B トップ". RIGHT outside caption exactly "B だれが？".
Use these colors throughout both screens; replace previous blue UI ink and surfaces completely according to roles, keep original logo/chick colors unchanged.
```

## C コーラルピンク

[画像](images/c.png)

```text
VARIANT C: コーラルピンク. This name describes color only; do not illustrate it.
Background #FFE978; main panel and all5choice fills #FFC2B9; Ink #663A3F; Edge #93464D; start-button fill #F4A6A0.
LEFT outside caption exactly "C トップ". RIGHT outside caption exactly "C だれが？".
Use these colors throughout both screens; replace previous blue UI ink and surfaces completely according to roles, keep original logo/chick colors unchanged.
```

## D ミントターコイズ

[画像](images/d.png)

```text
VARIANT D: ミントターコイズ. This name describes color only; do not illustrate it.
Background #FFF176; main panel and all5choice fills #9FE2CE; Ink #164E4B; Edge #246C62; start-button fill #78CFC0.
LEFT outside caption exactly "D トップ". RIGHT outside caption exactly "D だれが？".
Use these colors throughout both screens; replace previous blue UI ink and surfaces completely according to roles, keep original logo/chick colors unchanged.
```

## E やさしいライラック

[画像](images/e.png)

```text
VARIANT E: やさしいライラック. This name describes color only; do not illustrate it.
Background #FFEC82; main panel and all5choice fills #DFCEF4; Ink #51405F; Edge #735B89; start-button fill #CFB7E7.
LEFT outside caption exactly "E トップ". RIGHT outside caption exactly "E だれが？".
Use these colors throughout both screens; replace previous blue UI ink and surfaces completely according to roles, keep original logo/chick colors unchanged.
```

## F バターとミルク

[画像](images/f.png)

```text
VARIANT F: バターとミルク. This name describes color only; do not illustrate it.
Background #FFF3AD; main panel and all5choice fills #FFFBEA; Ink #6A4A27; Edge #8D652A; start-button fill #FFD572.
LEFT outside caption exactly "F トップ". RIGHT outside caption exactly "F だれが？".
Use these colors throughout both screens; replace previous blue UI ink and surfaces completely according to roles, keep original logo/chick colors unchanged.
```

## 確認の範囲

指定色は、背景、候補、開始ボタンと文字の比が4.5:1以上、輪郭との比が3:1以上になる組み合わせを選んだ。
生成PNGの色には揺れがあり、実際の全画素のコントラスト適合や、子どもの好みを検証したものではない。
静止画の構図、ロゴ、ひよこ、文字、選択肢の数と並びを確認し、実装や他の画面への展開は行っていない。
