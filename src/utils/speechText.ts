import type { Selections } from '../types/game';

const ACTION_POLITE_MAP: Record<string, string> = {
  たべた: 'たべました',
  ふっとばした: 'ふっとばしました',
  かくした: 'かくしました',
  おどらせた: 'おどらせました',
  こちょこちょした: 'こちょこちょしました',
  ころがした: 'ころがしました',
  'ぎゅーした': 'ぎゅーしました',
  もってかえった: 'もってかえりました',
  'つんつんした': 'つんつんしました',
  'なでなでした': 'なでなでしました',
  'ぶんぶんふった': 'ぶんぶんふりました',
  'ぐるぐるまわした': 'ぐるぐるまわしました',
  すべらせた: 'すべらせました',
  ならべた: 'ならべました',
  つみあげた: 'つみあげました',
  ひっくりかえした: 'ひっくりかえしました',
  'おふろにいれた': 'おふろにいれました',
  'れいぞうこにしまった': 'れいぞうこにしまいました',
  'うちゅうにとばした': 'うちゅうにとばしました',
  'ロケットにのせた': 'ロケットにのせました',
  'まほうをかけた': 'まほうをかけました',
  'ちいさくした': 'ちいさくしました',
  'おおきくした': 'おおきくしました',
  'ピカピカにした': 'ピカピカにしました',
  'カチカチにした': 'カチカチにしました',
  にげられた: 'にげられました',
  おいかけた: 'おいかけました',
  'ニュースにした': 'ニュースにしました',
  うたわせた: 'うたわせました',
  'ラップさせた': 'ラップさせました',
  'ぜんりょくでまもった': 'ぜんりょくでまもりました',
  'そっとしまった': 'そっとしまいました',
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
