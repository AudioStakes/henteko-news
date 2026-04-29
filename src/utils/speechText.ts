import type { Selections } from '../types/game';

const ACTION_POLITE_MAP: Record<string, string> = {
  '3かいまわした': '3かいまわしました',
  'あたまにのせた': 'あたまにのせました',
  'うたわせた': 'うたわせました',
  'うちゅうにとばした': 'うちゅうにとばしました',
  'うらがえした': 'うらがえしました',
  'おいかけた': 'おいかけました',
  'おおきくしすぎた': 'おおきくしすぎました',
  'おおきくした': 'おおきくしました',
  'おおげさにもちあげた': 'おおげさにもちあげました',
  'おどらせた': 'おどらせました',
  'おふとんにいれた': 'おふとんにいれました',
  'おふろであらった': 'おふろであらいました',
  'おふろにいれた': 'おふろにいれました',
  'かいじゅうにプレゼントした': 'かいじゅうにプレゼントしました',
  'カチカチにした': 'カチカチにしました',
  'カレーまみれにした': 'カレーまみれにしました',
  'ぎゅーした': 'ぎゅーしました',
  'くすぐった': 'くすぐりました',
  'ぐにゃっとまげた': 'ぐにゃっとまげました',
  'ぐるぐるまわした': 'ぐるぐるまわしました',
  'こっそりかくした': 'こっそりかくしました',
  'ころがした': 'ころがしました',
  'さかさまにした': 'さかさまにしました',
  'しらんぷりした': 'しらんぷりしました',
  'すべらせた': 'すべらせました',
  'せんたくきでまわした': 'せんたくきでまわしました',
  'ぜんりょくでまもった': 'ぜんりょくでまもりました',
  'そうじきですいそうになった': 'そうじきですいそうになりました',
  'そっとしまった': 'そっとしまいました',
  'たべた': 'たべました',
  'ちいさくしすぎた': 'ちいさくしすぎました',
  'ちいさくした': 'ちいさくしました',
  'ちょっとだけなめた': 'ちょっとだけなめました',
  'つきにおくった': 'つきにおくりました',
  'つみあげた': 'つみあげました',
  'つんつんした': 'つんつんしました',
  'ドーンとならした': 'ドーンとならしました',
  'トイレにながしそうになった': 'トイレにながしそうになりました',
  'ドラゴンにみせた': 'ドラゴンにみせました',
  'ながくのばした': 'ながくのばしました',
  'なぜかほめた': 'なぜかほめました',
  'なでなでした': 'なでなでしました',
  'ならべた': 'ならべました',
  'にがした': 'にがしました',
  'ニュースにした': 'ニュースにしました',
  'はかせにしらべてもらった': 'はかせにしらべてもらいました',
  'ピカピカにした': 'ピカピカにしました',
  'ひっくりかえした': 'ひっくりかえしました',
  'ふっとばした': 'ふっとばしました',
  'ぶんぶんふった': 'ぶんぶんふりました',
  'ベタベタにした': 'ベタベタにしました',
  'ぺろっとした': 'ぺろっとしました',
  'ポヨンとはねさせた': 'ポヨンとはねさせました',
  'まちがえてかぶった': 'まちがえてかぶりました',
  'まちがえてはいた': 'まちがえてはきました',
  'もってかえった': 'もってかえりました',
  'れいぞうこでひやした': 'れいぞうこでひやしました',
  'ロケットにのせた': 'ロケットにのせました',
};

export function toPoliteAction(action?: string) {
  if (!action) return '';
  const normalized = action.replace(/[！!]/g, '').trim();
  if (!normalized) return '';
  if (normalized.endsWith('しました') || normalized.endsWith('ました')) return normalized;
  if (ACTION_POLITE_MAP[normalized]) return ACTION_POLITE_MAP[normalized];
  if (normalized.endsWith('した')) return `${normalized.slice(0, -2)}しました`;
  return normalized;
}

export function buildNewsLines(selections: Selections) {
  return [
    selections.who,
    selections.when,
    selections.where,
    selections.what,
    selections.action ? `${toPoliteAction(selections.action)}！` : undefined,
  ].filter((word): word is string => Boolean(word));
}

export function toSpeechText(selections: Selections) {
  const parts = [
    selections.who,
    selections.when,
    selections.where,
    selections.what,
    toPoliteAction(selections.action),
  ].filter((word): word is string => Boolean(word));

  return parts.length > 0 ? `ニュースです！${parts.join('、')}！` : 'ニュースです！';
}
