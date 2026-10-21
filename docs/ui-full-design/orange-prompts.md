# Aのオレンジ配色を全画面へ展開した画像生成記録

ユーザーが選んだ[A「はちみつオレンジ」](../ui-color-variations/images/a.png)を配色の参照にし、imagegenの組み込みツールで10枚の静止PNGを作成した。
[全画面デザイン案](README.md)の20状態を維持し、アプリの実装は行っていない。
最終画像は `images-orange/` に保存した。

01は採用されたAの画像を入力し、画像外の番号を01と02へ揃える編集を行った。
02から10は、対応する水色版を画像1の編集対象、採用されたAを画像2の配色参照とした。
[前の水色版](blue-version.md)と[濃紫版](purple-version.md)は残している。

## 01の指定

```text
Use case: text-localization. The supplied two-phone board is the exact A ORANGE palette selected by the user. Preserve EVERYTHING INSIDE BOTH PHONES exactly: selected yellow/apricot/orange/cocoa/brown palette, actual multicolor logo, fluffy chick poses/red hats/black mics, geometry/spacing, typography, all labels,5wordchoices2/1/2, progress1/5, desk/nameplates, buttons and icons. Change ONLY TWO OUTSIDE captions: LEFT "A トップ" becomes "01 トップ"; RIGHT "A だれが？" becomes "02 だれが？". Keep matching Cocoa-brown caption font/color/size. Do not recolor or redraw any inside UI, do not add anything. Output same1536x1024 board.
```

## 02から10の共通指定

各画像は次の共通指定と個別指定を連結して生成した。

```text
Use case: precise-object-edit. Asset: Japanese mobile word-game static design board, TWO matching portrait phones on white landscape1536x1024 board.
Input1 is EXACT EDIT TARGET with required layout/text/states. Input2 is the USER-SELECTED A ORANGE PALETTE reference. Transfer ONLY A's warm colors to Input1; preserve ALL geometry, layout/spacing, typography/size, exact labels/paths/numbers/captions, controls and enabled/disabled states, logo, fluffy chick identity/poses, red hat/black mic/white manuscript, thin flat desk and nameplate. No new UI, no new features, no wooden desk, no 3D inflated controls, no extra decoration.
EXACT A PALETTE:
Background YELLOW #FFEA66, same warm bright yellow as A.
All former SKYBLUE/TURQUOISE/PURPLE large fills (choice holes/result panels/top chick window/developer title banner): light APRICOT ORANGE #FFC88F, uniform flat light color. Preserve organic silhouettes and candidate positions.
ALL normal text/icons/title/question/choice labels/full news/status/help/progress/captions/おとな/links/footer: dark COCOA BROWN #5A2D16. NO white on light panels. All thin visible boundaries/progress rings/desk/nameplate/field outlines: warm BROWN #954315. About2 CSSpx edges for controls, no heavy dark masses.
PRIMARY enabled buttons はじめる/きく/設定を保存/activeていし/start-audio-check: sunny ORANGE #FFA35C, dark Cocoa text/icons, thin Brown edge.
SECONDARY active つぎを/つくる and キャンセル: warm CREAM #FFF4D8, dark Cocoa text/icons, clear Brown outline. Do not make next action disabled-looking.
Settings DIALOG / quiet notices: warm CREAM #FFF4D8; input/select interiors light IVORY #FFFBEF, dark Cocoa text and Brown outlines.
DISABLED buttons: warm GRAY-BEIGE #E8E1D4, muted BROWN #765D4D text/icons and subdued warm-gray edge. Keep all disabled controls disabled, retain state-specific labels. Inactive values should look distinct from active Cream secondary buttons.
Error text and invalid field edges: small dark RUST #9A3423, exact reasons kept close to fields, no new scary icons. Selected choice may use ORANGE #FFA35C and strong Brown check/edge (retain existing checkmark).
Every former blue/teal/mint/purple UI element must follow these warm roles, including おとな, status dots/marks, dialog×/arrows, reset links, scrollbars, 作者/プライバシー, captions. On-air dot/marks may use sunny orange. Keep all red hat / orange chick / black mic colors and ORIGINAL MULTICOLOR GLOSSY へんてこニュース logo EXACTLY unchanged; don't tint/replace logo or chick.
Preserve full Japanese text and all five choices or full result sentences. NO result heading きみのニュース or substitute title. Do not introduce a new prompt, word, tab, score, confirmation or hidden action.
SAME existing two-phone front-on presentation, only palette is changed to harmonize with A.
```

## 10 10-long-words

[最終画像](images-orange/10-long-words.png)

```text
THIS BOARD: LEFT19 longestwords: keepFIVEbroadone-columnorganicchoiceSTRIPS, exactlonglabels and progress2/5. This1columnlayout is intentional;do notswitch2/1/2. FillsAPRICOT/inkCOCOA/edgeBROWN. RIGHT20 longresult: retainTENexactlines withsamepairgroups: バスの / うんてんしゅさんが / ぎゅうにゅうを / ふきだしたあと / すべりだいの / てっぺんで / きょうりゅうの / たまごを / れいぞうこで / ひやしました！. Samefontsize/spacing, allvisible,noellipsis. Panel APRICOT, text COCOA. ActiveきくORANGE, nextつぎを/つくるCREAM with clearBROWNedges. Finalpoliteひやしました！preserved.Noresultheading.
```

## 01 01-start-who

[最終画像](images-orange/01-start-who.png)

## 02 02-when-where

[最終画像](images-orange/02-when-where.png)

```text
THIS BOARD: LEFT 03 いつ, stage2/5; RIGHT04 どこで, stage3/5. Preserve exact five original words on each and2/1/2arrangement. Both chicks waiting CLOSED beak. No button/extra navigation added; all text/holes warm A palette.
```

## 03 03-what-action

[最終画像](images-orange/03-what-action.png)

```text
THIS BOARD: LEFT05 なにを, stage4/5; RIGHT06 どうした, stage5/5. Preserve exact five original words/labels on each and2/1/2arrangement. Action choices keep plain past: たべた/おとした/かざった/かぶった/あつめた. Both chicks waiting CLOSED beak. Nothing added.
```

## 04 04-preparing-reading

[最終画像](images-orange/04-preparing-reading.png)

```text
THIS BOARD: LEFT07 preparation じゅんび中, CLOSED beak, no speech marks; RIGHT08 actualreading よんでいるよ, OPEN beak, manuscript and active on-air dot/marks. Full result on BOTH remains EXACTLY five logical lines: ねこが / きのうのよる / こうえんで / おにぎりを / たべました！. Polite final verb must remain. Full panel now APRICOT, ALL text Cocoa. Replay remains DISABLED warmGRAY-BEIGE on BOTH, retaining state label/icons; NEXT つぎを/つくる remains ENABLED CREAM with clear Brown outline. No result heading. Thin flat Brown desk/nameplate, samecompactchick.
```

## 05 05-finished-error

[最終画像](images-orange/05-finished-error.png)

```text
THIS BOARD: LEFT09 completed / RIGHT10 retryable voiceerror. Both chicks quiet CLOSED beaks, no speakingmarks. Full text on both remains ねこが / きのうのよる / こうえんで / おにぎりを / たべました！. Samefive-line apricot resultpanel. BOTH きく buttons ENABLED sunnyORANGE with Cocoa text/icons. BOTH つぎを/つくる buttons ENABLED CREAM with Cocoa text/Brown outline. Right exact quiet error notice remains こえがでなかったよ / もじであそべるよ, no spinner. Preserve all wording/layout, no new heading.
```

## 06 06-unavailable-offline

[最終画像](images-orange/06-unavailable-offline.png)

```text
THIS BOARD: LEFT11 voiceUNSUPPORTED result: fullfive-line sentence endingたべました！, calmclosedbeak, exact unsupportednotice, replayきく remains DISABLED warmGRAY-BEIGE, nextつぎを/つくる ENABLED CREAM. RIGHT12 OFFLINE choice: retain exact offline notice(no guaranteevoice), closedbeak, questionだれが？, progress1/5, allFIVEchoices2/1/2 and exactlabels. AllUIwarmbrown/apricot/cream; no oldblue iconremaining.
```

## 07 07-voice-settings

[最終画像](images-orange/07-voice-settings.png)

```text
THIS BOARD: TWO adult音声設定 dialogs: preserve every label/help/close×/select/scrollbar/resetlink/キャンセル/設定を保存, and exact paths /supertonic/onnx and /supertonic/voice_styles/M1.json. Dialog CREAM#FFF4D8; input/select IVORY#FFFBEF; normaltext/alllinks/arrows/close/footers COCOA, outlinesBROWN. Save ENABLED ORANGE#FFA35C, CANCEL CREAM (notorange) with clearbrownedge. Underlying actualgame retains closed-beakchicks/desk/wordholes, recolorholesapricot; subtle light-neutralmodalveil, no darkcast. Bothおとな entrances stay plainCocoa text,no pill. 作者/プライバシー retained. Do not truncate paths or add newsettings.
```

## 08 08-validation-selection

[最終画像](images-orange/08-validation-selection.png)

```text
THIS BOARD: LEFT15 invalidsettings: preserve exact values /supertonic/onnx?x=1 and ftp://voice.json, both fieldlabels and exactTWOerrorreasons, scrollindicator, resetlink, close, CANCEL and SAVE reachable. BOTHerrorTEXT and invalidfieldedges darkRUST#9A3423, notbrightred. DialogCREAM, fieldsIVORY, normaltextCOCOA. CANCEL MUST remain CREAM#FFF4D8 with Cocoa text/Brown edge; SAVE ORANGE#FFA35C, notmint/green. RIGHT16 pressed-choice: preserve allFIVE2/1/2/progress1/5/だれが？, useapricotfills; checkedねこhole has sunnyORANGEfill and strongerBROWNedge with clearCOCOAcheck, fourothers normalapricot/Brownedges. Do not remove check/addconfirm.
```

## 09 09-audio-check

[最終画像](images-orange/09-audio-check.png)

```text
THIS BOARD: Developer /words-audio-check only: LEFT17 IDLE0/364, RIGHT18 PLAYING63/364,currentword11じ11ぷん. Keep EIGHT operations start/resume/stop+5categorystarts. LEFTidle smallchick CLOSEDbeak/no speakingmarks; RIGHTplaying openbeak/marks. Mainbanner APRICOT/COCOA. Enabledstart onLEFT ORANGE; category-startbuttonsCREAM/BROWN. AllinitialdisabledcontrolsGRAY-BEIGE. RIGHT ONLY STOP is enabled ORANGE, theotherSEVENdisabled warmGRAY-BEIGE and mutedbrown. Allcaptions/footers/labelsCocoa,noremainingpurple/blue/teal/greenUI. Preserve count/word and all eight controls.
```

## 確認の範囲

別のサブエージェントが補助色の役割と全20状態の静止画を見直し、本文、候補、状態、設定項目、操作を確認した。
文字や輪郭は茶色に揃え、旧案の水色、ミント、濃紫の大きな面を残さない方針とした。
ロゴとひよこの色は配色変更の対象から外した。
指定色の計算では通常文字の背景、パネル、主操作、補助操作、入力欄との比は4.5:1以上となるが、生成PNGの全画素の適合を測定したものではない。
生成画像の色や文字には揺れがあるため、実装時には指定色と元のロゴ素材を直接使って再確認する。
音声連動、実機、子どもの操作や好みの確認は行っていない。
