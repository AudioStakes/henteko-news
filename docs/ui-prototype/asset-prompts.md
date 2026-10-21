# プロトタイプ用キャスターの生成指示

組み込み `imagegen` を使用し、透明背景で2姿勢を生成。元の素材は上書きしていません。
参照1は既存の [`hiyoko8.webp`](../../src/assets/hiyoko8.webp)、参照2は採用済みの[準備・読み上げ画面](../ui-full-design/images-orange/04-preparing-reading.png)です。

## 待機中

保存先: [`assets/caster-idle.png`](assets/caster-idle.png)

```text
Use case: identity-preserve. Asset type: transparent PNG character cutout for a phone UI.
Input image 1 is the identity EDIT TARGET: the existing yellow chick with red hat and black microphone. Input image 2 is a UI composition REFERENCE ONLY.
Create only the chick in the closed-beak waiting pose, isolated on genuine transparent background. Keep the original chick identity, soft 3D feather texture, yellow body, orange cheeks/beak, large black and white eyes, red hat with dark brown band, and black handheld microphone in its right wing (viewer left). Facing camera, friendly patient expression, BEAK CLOSED (small neutral smile), other wing resting gently near front lower edge. Chest-up crop with hat and microphone completely visible. Center on 1024 square with a little transparent margin around hat and wings and flat base at bottom. No desk, no logo, no UI, no background, no text, no paper, no floor, no cast shadow outside character. This is the waiting pose seen in reference image's left phone. Do not redesign the mascot.
```

## 原稿の読み上げ中

保存先: [`assets/caster-reading.png`](assets/caster-reading.png)

```text
Use case: identity-preserve. Asset type: transparent PNG character cutout for a phone UI.
Input image 1 is the identity EDIT TARGET: the existing yellow chick with red hat and black microphone. Input image 2 is a UI composition REFERENCE ONLY.
Create only the chick in the reading-aloud newscaster pose, isolated on genuine transparent background. Keep the original chick identity, soft 3D feather texture, yellow body, orange cheeks/beak, large black and white eyes, red hat with dark brown band, black handheld microphone in right wing (viewer left). Chest-up framing, facing camera with lively eyes, BEAK OPEN while reading, other wing (viewer right) holds one small plain ivory sheet of paper at chest level as in the right phone reference. Hat and microphone completely visible. Center on 1024 square with a little transparent margin around hat and wings and flat base at bottom. No desk, no logo, no UI, no background, no text, no floor, no floating marks, no cast shadow outside character. This is the speaking pose seen in reference image's right phone. Do not redesign the mascot.
```
