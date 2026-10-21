# 全画面デザインの生成記録

imagegenの組み込みツールを使用し、静止PNGとして生成した。
CLIやアプリの実装は使用していない。
初稿から修正までの指示を順に残し、採用した画面は[全画面デザイン案](README.md)と `images/` の最終PNGで示す。
初稿の文末や表情は、後の修正指示で置き換えている。

## 参照画像

- [採用されたひよこキャスター案](../ui-caster-proposals/images/03-hiyoko.png)
- [既存ロゴ](../../public/assets/header-logo.webp)
- [今回の共通構図となるトップと最初の選択画面](images/01-start-who.png)

01は採用案と既存ロゴを参照し、02から10の初稿は01の生成画像と既存ロゴを参照した。
修正では各対象画像を編集し、05と06の構図統一には04と01、07の背景修正には07の初稿と01を参照した。
ロゴの新しい単体素材は作成していない。
画面案のロゴは生成画像内の表現であり、実装時には元の画像素材を直接配置する。

## 共通指定

各初稿は次の共通指定と、後述の個別指定を連結して生成した。

```text
Use case: ui-mockup. Create the next consistent high fidelity static UI design board for a Japanese mobile word game for a 5-year-old, titled exactly へんてこニュース. This is design only.
Input image 1 is the approved design style and chick character reference; preserve its warm bright lemon-yellow screen, very dark aubergine purple organic shapes, thick friendly Japanese typography, coral primary action and deep teal secondary action. The existing fluffy yellow chick newsreader has a red rounded brimmed hat with dark band, big eyes, orange cheeks/beak, black handheld microphone. Keep this identity and soft 3D texture, not a new cartoon mascot.
Input image 2 is the ACTUAL EXISTING APP LOGO: reuse its exact glossy rounded one-line Japanese lettering and color pattern: へ orange, ん blue, て lime, こ pink, ニュース chocolate brown, thin white halo. Integrate it cleanly on yellow with breathing room, 75% phone width on inner screens. Do not recolor it purple, do not replace it with plain text. It is the only multicolor decoration.
Composition: crisp landscape 1536x1024 white presentation board with TWO matching large portrait smartphone screens side by side, front-on, thin black device frames, full usable content inside safe bounds, no tilted perspective. Equal phone size with generous outside whitespace. Screen captions below/outside, small dark purple. Avoid unnecessary outer headings.
Aesthetic should be almost the same as the approved mockup, with a more compact header so content is comfortable. Choices are five large organic purple holes in 2/1/2 arrangement with cream white labels. No extra menus, scores, stickers, tabs, photos or proposed new features. Small discreet おとな button top right. All touch controls look large; exact Japanese readable.
Absolute constraint across result screens: do not write きみのニュース, きみの ニュース, 君のニュース or any substitute result title. Result sentence itself is the hero. All five result lines visible together from start, no progressive text reveal.
```

## 10 10-long-words

[最終画像](images/10-long-words.png)

### 初稿の個別指定

```text
THIS BOARD: long word layout adaptations, same identity as image1. Two phones.
LEFT caption "19 長い候補". Compact existing colorful logo. Even smaller waiting chick behind thin desk (closed beak) leaves useful reading room. Progress 2/5, prompt いつ？. For THIS long-word screen, adapt five choices to ONE COLUMN of five broad organic aubergine strips with cream thick Japanese labels, equal weight. This is intentional exception to 2/1/2, because long words need width. All five visible; use readable two-line wraps, not tiny text or truncation. Five exact labels: "ぎゅうにゅうをふきだしたあと" (wrap ぎゅうにゅうを / ふきだしたあと); "おにごっこでつかまったあと" (wrap おにごっこで / つかまったあと); "しゃっくりがとまらないとき" (wrap しゃっくりが / とまらないとき); "おしょうがつのあさ"; "きのうのよる".
RIGHT caption "20 長い完成ニュース". Compact logo and small closed-beak chick with mic and manuscript, thin desk. Absolutely no result title. Tall full-width organic aubergine result panel, cream readable Japanese, five logical segments separated with generous line gaps but each may wrap 2 lines. Exact full sentence segments: "バスのうんてんしゅさんが" / "ぎゅうにゅうをふきだしたあと" / "すべりだいのてっぺんで" / "きょうりゅうのたまごを" / "れいぞうこでひやした！". Show complete text without ellipsis. Let content use most of the screen. Under full result place coral きく and teal two-line つぎを / つくる, keep reachable; a subtle page scroll indicator at right communicates scrolling on smaller phones. No fixed overlay covering text, no shrinking to illegibility. The textual result uses plain past form as written; do not replace with speech polite form.
```

### レビュー後の最終修正

```text
Use case: text-localization. Edit ONLY the RIGHT phone's news text layout in this two-phone board. Preserve the LEFT long-candidate phone pixel-for-pixel in design: exact five rows, labels, progress, chick, logo, colors. Preserve RIGHT phone logo, compact chick, thin purple desk/nameplate, purple panel shape, bottom coral きく and teal つぎを/つくる, and captions.
On RIGHT make the long finished news readable with deliberate TWO-LINE wraps per segment. Put these TEN exact text lines in the purple panel in this order, grouped in FIVE pairs with slightly more vertical space between groups:
1 バスの
2 うんてんしゅさんが
3 ぎゅうにゅうを
4 ふきだしたあと
5 すべりだいの
6 てっぺんで
7 きょうりゅうの
8 たまごを
9 れいぞうこで
10 ひやしました！
Do not print the numbers. Thick friendly cream Japanese type, readable generous left/right padding, no single excessively wide line, no ellipsis or clipping. Use panel height efficiently with line spacing about 1.2, group spacing modest; all text and bottom controls remain visible. Final action must be polite past "ひやしました！", not ひやした！. No result heading anywhere, no other UI changes.
```

## 01 01-start-who

[最終画像](images/01-start-who.png)

### 初稿の個別指定

```text
THIS BOARD: 01 トップ / 02 だれが.
LEFT TOP SCREEN: Logo large near top, little おとな upper right. Big friendly chick standing behind the familiar simple thin purple desk, waving with one wing and holding black mic, red hat. In a comfortable large organic purple picturebook window (flat purple backdrop), chick centered, no extra cast. Beneath, friendly purple copy exactly "５つ えらぶと" on first line and "ニュースに なるよ" on second. One very large coral organic button labeled "はじめる" with simple play triangle. Bottom tiny text "おとが でるよ" and speaker icon. No scores/history.
RIGHT FIRST CHOICE SCREEN: Compact existing logo at top; small chick newsreader behind thin purple desk under it; keep chick modest so word choices dominate. Quiet neutral closed beak while waiting, no speech balloons. 5 progress dots with only first filled teal and "1/5". Large prompt exactly "だれが？". Five organic purple choice holes 2/1/2; labels top row "ねこ", "いぬ"; center "うさぎ"; bottom row "おばけ", "ロボット". Cream thick letters, enough space around each. No result heading.
Outside phone captions "01 トップ" and "02 だれが".
```

## 02 02-when-where

[最終画像](images/02-when-where.png)

### 初稿の個別指定

```text
THIS BOARD: next choice stages, identical layout to RIGHT phone of image1, compact newsreader same neutral closed beak and thin desk, 5 equal visual weight choices in 2/1/2 arrangement; adapt text with balanced 2-line wraps rather than tiny text.
LEFT: caption "03 いつ", progress 2/5 (first two teal dots), question "いつ？". Labels top left "きのうのよる" (wrap きのうの / よる), top right "100ねんまえ" (wrap allowed), center "11じ11ぷん", bottom left "おひるねのあと" (wrap おひるねの / あと), bottom right "うたったあと" (wrap allowed).
RIGHT: caption "04 どこで", progress 3/5 (three teal dots), question "どこで？". Five labels top left "こうえん", top right "うみ", center "おふろ", bottom left "きょうしつ" (wrap if needed), bottom right "つきのうえ" (wrap if needed). Labels on choice cards intentionally omit particle で; don't append. No extra random icons. Uniform candidate font per screen, use two lines for longer label.
```

## 03 03-what-action

[最終画像](images/03-what-action.png)

### 初稿の個別指定

```text
THIS BOARD: choice stages 4 and 5, identical layout to RIGHT phone of image1, compact chick newsreader, desk, progress, five equal-weight holes 2/1/2. Thick cream labels with comfortable wrap and generous hole width, keep all five.
LEFT: caption "05 なにを", progress 4/5 (four teal dots), question "なにを？". Top left "おにぎり", top right "アイス", center "えほん", bottom left "おちゃ", bottom right "バナナ". Choice labels intentionally omit を; don't append.
RIGHT: caption "06 どうした", progress 5/5 (five teal dots), question "どうした？". Top left "たべた", top right "おとした", center "かざった", bottom left "かぶった", bottom right "あつめた". These are plain past forms exactly, do not make them polite. Still only a waiting neutral closed-beak chick until actual reading. No confirmation button; tapping a choice advances.
```

## 04 04-preparing-reading

[最終画像](images/04-preparing-reading.png)

### 初稿の個別指定

```text
THIS BOARD: two finished-news states. Absolutely NO result title below desk. The full sentence is the large hero purple organic panel, immediately below compact chick and its thin desk. Exact full text on BOTH phones, FIVE logical lines, fully visible from start: "ねこが" / "きのうのよる" / "こうえんで" / "おにぎりを" / "たべた！". Use balanced big cream Japanese lettering with generous panel padding, no clipping. No progress dots on result.
LEFT: caption "07 音声の準備中". Chick holding black mic and small white manuscript, neutral closed beak. Small calm indicator "じゅんび中" next to chick, simple two stationary dots (not reading marks). Under full text, muted/disabled replay button "じゅんび中" and active deep teal button exactly two lines "つぎを" / "つくる". A quiet waiting state, no red speaking marks.
RIGHT: caption "08 読み上げ中". Same header/desk/result/button positions. Chick with open beak looking between reader and paper, lively but unobstructive. Small coral dot and "よんでいるよ" next to chick. Replay disabled with speaker icon, label "よんでいるよ" can wrap. Next-news deep teal button still active, exact two lines "つぎを" / "つくる". No extra heading, no speech balloon repeating the full text. All sentence visible.
```

### レビュー後の最終修正

```text
Use case: text-localization. Edit this two-phone UI board with ONE exact text correction on BOTH phone screens: the last line of the purple news result panel currently says "たべた！"; replace it with exactly "たべました！". Spell た・べ・ま・し・た・！. Keep the same friendly cream font and adjust ONLY the line width/spacing to fit comfortably within purple panel. Preserve every other word, logo, layout, phone frame, full five-line sentence, chick poses, closed beak during preparation, open beak during reading, status indications, flat thin purple desk/nameplates, disabled replay, teal next action, captions, exact colors and all elements. Do not add a result title. No other changes.
```

## 05 05-finished-error

[最終画像](images/05-finished-error.png)

### 初稿の個別指定

```text
THIS BOARD: result finished / result retryable voice error. Layout and sentence identical to result spec below. No result title. Compact logo+newsreader+thin desk at top. Large aubergine organic full-text panel with FIVE lines "ねこが" / "きのうのよる" / "こうえんで" / "おにぎりを" / "たべた！". All visible.
LEFT caption "09 読み終わり". Chick relaxed closed beak, holding mic and paper, no speaking indicator. Bottom coral active speaker button "きく" and deep teal active two-line button "つぎを" / "つくる". No achievement marks, rewards or extra status needed.
RIGHT caption "10 音声エラー". Chick calm closed beak. Same full sentence visible in a slightly shorter comfortably padded result panel. Beneath panel a compact cream notification with a small speaker icon and text exactly "こえが でなかったよ" and second smaller line "もじで あそべるよ". No alarming red giant error. Bottom coral retry button "きく" still available and deep teal next button "つぎを" / "つくる". App should still feel complete, no spinner or reading marks during error.
```

### 構図と表現の統一

```text
Use case: precise-object-edit. Edit image1, the TWO-PHONE result design board. Preserve EXACT existing logo appearance, fluffy chick identity/size, thin flat PURPLE desk line with little nameplate, yellow background, dark aubergine flat panel shapes, typography, matte flat button style, black device geometry, spacing and composition. Image2 is the same-series flat style reference only. Do not redraw as a wooden news desk, no glossy inflated buttons, no new chick model, no altered logo or おとな style.
Change ONLY the two result STATES:
LEFT: Caption "09 読み終わり". Remove the small じゅんび中 status and dots; chick calm closed beak with black mic and white manuscript, no radiating reading marks. Five-line text remains exactly "ねこが" / "きのうのよる" / "こうえんで" / "おにぎりを" / "たべた！". Change disabled replay to active MATTE CORAL "きく" button with speaker icon. Keep active matte deep teal "つぎを" / "つくる".
RIGHT: Caption "10 音声エラー". Chick closed beak, no speaking marks. Replace red dot / よんでいるよ status with small quiet cream notification NEXT TO chick: "こえが でなかったよ" / "もじで あそべるよ" using legible dark text, gently wrap as needed, no spinner. Same full text panel remains, no substitute heading, do not move full text into speech balloon. Change disabled replay to active MATTE CORAL "きく", deep teal next button stays active.
Absolute keep: NO きみのニュース heading, NO wooden desk, NO reading marks/open beak for done/error, NO 3D inflated UI buttons.
```

### レビュー後の最終修正

```text
Use case: text-localization. Make ONE exact correction to BOTH purple result panels in this two-phone UI board: replace final line "たべた！" with exactly "たべました！". Friendly cream lettering, fit within same panel with comfortable side margins. Preserve all other words, quiet closed-beak chick poses, error notice, exact logo and colors, flat thin purple desks/nameplates, matte coral きく and matte teal つぎを/つくる buttons, frame and captions. No added heading. No other change.
```

## 06 06-unavailable-offline

[最終画像](images/06-unavailable-offline.png)

### 初稿の個別指定

```text
THIS BOARD: voice unavailable / offline child game. Keep existing logo and warm yellow/purple/teal visual world and existing chick.
LEFT caption "11 音声が使えない端末". Result layout with compact closed-beak chick, mic and paper, thin desk. NO result title. Full five-line purple panel: "ねこが" / "きのうのよる" / "こうえんで" / "おにぎりを" / "たべた！". Compact cream message below "この きかいでは こえが でないよ" (two lines) plus small "もじで あそべるよ". Muted disabled speaker button "きく" with clearly disabled shape; active teal two-line next button "つぎを" / "つくる".
RIGHT caption "12 オフライン". Identical first-choice layout from image1 RIGHT phone: compact logo, chick at desk, five dots 1/5, question "だれが？", five purple holes labels "ねこ", "いぬ", "うさぎ", "おばけ", "ロボット". Add a slim cream notification just below the logo, with small disconnected-network icon, text "オフライン" then smaller "もじで あそべるよ・こえは でないことがあるよ" (wrap to fit; no promise of offline voice). Reduce decorative chick height enough so all choices and safe bottom fit. The notice isn't a blocking dialog; game choices still available.
```

### 構図と表現の統一

```text
Use case: compositing. Build next TWO-PHONE static state board by preserving image1 LEFT result screen style exactly for LEFT and image2 RIGHT choice screen exactly for RIGHT. Same black devices, same existing multicolor logo, compact identical fluffy red-hatted chick, FLAT thin PURPLE desk line/nameplate, same matte flat purple/teal/coral shapes, same yellow. NO wooden desk, no glossy inflated UI buttons, no new chick proportions, no changed header style.
LEFT caption "11 音声が使えない端末". Use image1 result left with full purple-panel sentence "ねこが" / "きのうのよる" / "こうえんで" / "おにぎりを" / "たべた！". No result title. Chick closed beak no speaking marks. Replace status near chick with quiet cream text notice "この きかいでは" / "こえが でないよ" and smaller "もじで あそべるよ", using small legible text beside chick, full sentence stays dominant. Disabled gray replay button "きく"; active matte teal next button "つぎを" / "つくる".
RIGHT caption "12 オフライン". Reproduce image2 RIGHT choice screen: five progress dots 1/5, large question だれが？, and FIVE equal large flat purple organic holes in EXACT 2 top / 1 center / 2 bottom layout, top ねこ and いぬ, center うさぎ, bottom おばけ and ロボット. Add slim nonblocking cream offline notice below the multicolor logo: small disconnected-network icon, "オフライン" and small second line "もじで あそべるよ・こえは でないことがあるよ". Reduce compact chick height a little to make room; keep thin purple desk and all FIVE holes arranged 2/1/2 visible, no 3/2 arrangement. No dark purple backing around question. All controls and margins inside device.
Both screens must match the reference flat picturebook design and exact header/chick identity. No result heading きみのニュース anywhere.
```

### レビュー後の最終修正

```text
Use case: precise-object-edit. Edit ONLY TWO details in this two-phone UI board.
1. LEFT phone purple news panel last line "たべた！" must become exactly "たべました！", friendly cream lettering with comfortable side margins.
2. RIGHT OFFLINE phone waiting chick must have a neutral CLOSED orange beak, no dark open mouth, no speaking marks. Preserve exact fluffy chick, red hat, black mic, size/pose.
Everything else unchanged: exact logo/colors/phoneframes, purple flat desk/nameplate, left unsupported notice and disabled replay, full five lines, right offline note, 1/5 progress, all five purple choice holes in exact 2/1/2 arrangement, all labels and captions. No new result title.
```

## 07 07-voice-settings

[最終画像](images/07-voice-settings.png)

### 初稿の個別指定

```text
THIS BOARD: adult voice settings, one normal browser setting / one expanded model setting. These are DIALOGS over dimmed warm yellow game screens, cream/off-white modal surfaces, aubergine text, cream form fields with dark purple outline and simple rounded rectangles, NOT word-choice holes. Maintain small existing colorful logo on underlying screen top and small chick partly visible behind dialog. Headings use friendly but legible smaller adult typography. Two equally sized phones.
LEFT caption "13 音声設定 ブラウザー". Cream dialog headed "音声設定" with close × top right. Label "読み上げ方式", select currently "ブラウザーの音声" and dropdown arrow. Help text "端末の音声で読み上げます。" Below clear text action "ブラウザーの既定設定に戻す" (wrap allowed), small "「設定を保存」で反映します。". Two footer buttons "キャンセル" (outlined) and "設定を保存" (deep teal). Small app-footer links "作者" and "プライバシー" under the dialog at phone bottom, dark readable text. No sliders, no speed/pitch/volume additions.
RIGHT caption "14 音声設定 モデル". Larger cream dialog same header/×. Label "読み上げ方式", selected "モデル音声（Supertonic）". Help "はじめは読み込みに時間がかかります。". Label "モデルのフォルダー", input exact "/supertonic/onnx". Label "声のJSONファイル", input exact "/supertonic/voice_styles/M1.json" with full value visible across 2 lines if necessary, no tiny clipped field. Small help "公開済みのパスまたはHTTP(S) URL". Text action "ブラウザーの既定設定に戻す", small "「設定を保存」で反映します。". Footer "キャンセル" outline and "設定を保存" teal. Small scroll hint inside dialog if content is long; footer reachable. App-footer links 作者 / プライバシー at phone bottom. Do not invent authentication or microphone recording.
```

### 構図と表現の統一

```text
Use case: precise-object-edit. Edit image1 TWO-PHONE ADULT SETTINGS board. Keep every cream dialog, its field text, exact paths, help, reset link, × close, キャンセル / 設定を保存 buttons, scrollbar and 作者/プライバシー links unchanged. Keep logo colors and black phone geometry. Change ONLY game content visible BEHIND dialogs to match image2 RIGHT actual first choice screen: same fluffy chick neutral CLOSED beak, no radiating marks, thin purple desk, same flat yellow/purple shapes. No giant chick; shrink to image2 compact size. Visible bottom choice labels behind LEFT dialog should be おばけ and ロボット, not たべもの/どうぶつ; no category-choice screen exists. Dim underlying yellow game area slightly so cream dialogs clearly have focus. Do not introduce any new UI. Captions stay 13 音声設定 ブラウザー / 14 音声設定 モデル. Plain flat picturebook UI controls, no wooden desk. Absolutely preserve dialog text and exact model paths from image1.
```

### レビュー後の最終修正

```text
Use case: precise-object-edit. Edit ONLY the two small waiting chicks visible BEHIND the cream settings dialogs in this two-phone UI board: make both orange beaks CLOSED and neutral, with no dark open mouth and no speaking marks. Keep identity, hats, eyes, mic, desk and size. Preserve ALL existing dialog text, fields, exact model paths, labels, scrollbar, footer links, buttons, existing logo/colors, background dimming, device frames and captions unchanged. The right chick should also be waiting quietly. No other change.
```

### 最終確認後の入口表示の統一

```text
Use case: precise-object-edit. Edit this two-phone adult-settings UI board with ONE tiny consistent styling correction ONLY. At the TOP RIGHT of BOTH phone screens, the small おとな entrance currently has a dark purple pill background and white letters. REMOVE each purple pill and replace it with the same plain DARK TEAL おとな text used on the other series screens, directly on the dimmed yellow background. Keep exact label おとな and its position/size, with no badge/background. Both entrance labels should also remain dimmed behind the modal overlay. Absolutely preserve everything else pixel-for-pixel in design: all cream dialogs, exact model and JSON paths, Japanese labels/help/buttons, ×, scrollbar, 作者/プライバシー links, fluffy chicks, thin purple desk, existing multicolor logos, yellow dimming, device frames and captions. No other change.
```

## 08 08-validation-selection

[最終画像](images/08-validation-selection.png)

### 初稿の個別指定

```text
THIS BOARD: 15 invalid adult settings / 16 choice pressed feedback.
LEFT phone: same cream 音声設定 dialog over dimmed yellow app as earlier spec, × close top right. Label 読み上げ方式 selected モデル音声（Supertonic）. Field モデルのフォルダー contains "/supertonic/onnx?x=1" with restrained coral outline, inline error "フォルダーに ? は使えません。". Field 声のJSONファイル contains "ftp://voice.json" and inline error "HTTP(S) のURLを指定してください。". Put error adjacent to each field and make values legible. Thin scroll indicator within dialog, lower help "「設定を保存」で反映します。" plus reset text "ブラウザーの既定設定に戻す". Footer buttons キャンセル outline and 設定を保存 teal reachable below fields, not pushed beyond screen. Do not add new settings. Caption "15 設定の入力エラー".
RIGHT phone: first-choice right layout of image1, existing colorful logo, compact closed-beak chick at desk, five dots 1/5, だれが？. Five holes 2/1/2 labeled ねこ / いぬ / うさぎ / おばけ / ロボット. The ねこ hole has a thick coral edge and small clear checkmark to show selection accepted, same size with slight tactile compression, label remains legible. Other four holes slightly muted, no extra confirm control. This is a brief transition snapshot before automatic next step, no repeated tapping. Caption "16 選択を受け付けた瞬間".
```

## 09 09-audio-check

[最終画像](images/09-audio-check.png)

### 初稿の個別指定

```text
THIS BOARD: separate DEVELOPER vocabulary audio check page, not a child game route or new child menu item. Two phones with restrained adult/diagnostic UI using the same yellow, cream, aubergine, coral, teal and small existing multicolor logo at top. Keep tiny おとな access. No giant word-choice holes, no extra mascot taking space. A small same chick mic icon okay. Section heading exactly "おんせい かくにん". Compact note "全364語を順番に読み上げます". Show current count, category, current word in cream status panel.
LEFT idle caption "17 開発用 音声確認 待機". Panel "0 / 364", category "だれが", current word "―". Main large teal action "さいしょから かいし". Second outline action "とまったところから さいかい" disabled at initial state. Coral "ていし" disabled. Below small heading "カテゴリから開始" and five equal rounded cream outlined buttons one column or two: "だれが から", "いつ から", "どこで から", "なにを から", "どうした から". All fit with scroll cue if needed. Footer links 作者 / プライバシー.
RIGHT active caption "18 開発用 音声確認 再生中". Identical hierarchy and controls. Panel "63 / 364", category "いつ", current word "11じ11ぷん", small active text "再生中". Only coral "ていし" action enabled; restart, resume and category-start buttons visibly muted/disabled. No invented progress errors. Footer links 作者 / プライバシー. Do not omit any of the 8 controls. Exact count is 364.
```

### レビュー後の最終修正

```text
Use case: precise-object-edit. Edit ONLY the small chick decoration at upper right of the LEFT phone (17 開発用 音声確認 待機) in this two-phone UI board: CLOSE its orange beak to a neutral waiting expression, and REMOVE all radiating yellow/orange speech marks around this LEFT chick. Preserve the exact fluffy identity, red hat, black mic and location. RIGHT phone is actually playing, so its chick stays open beak with marks. ALL other text, eight controls, disabled/enabled colors, 0/364 and 63/364 statuses, word 11じ11ぷん, logo, layout, frames, footer links, captions and colors must be unchanged. No other change.
```

## レビューで反映した点

画面構成の確認、絵本アートディレクション、静止画の確認、説明文の作成を別のサブエージェントへ分けた。
親エージェントが画像を見直し、完成文の丁寧形、待機と発声の区別、机とボタンの質感、設定の背面にある画面、長い本文の改行を修正した。
通常は2・1・2の穴を使い、最長クラスの候補だけは幅のある1列5段にする判断を残した。
この例外は候補数と一回の選択操作を維持し、文字の極端な縮小を避けるためのデザイン案である。
