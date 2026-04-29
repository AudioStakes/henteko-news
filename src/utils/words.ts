const PARTICLES = ['が', 'を', 'で'];

export function toCardWord(word: string) {
  const normalized = word.trim();

  for (const particle of PARTICLES) {
    if (normalized.endsWith(particle)) {
      return normalized.slice(0, -particle.length);
    }
  }

  return normalized;
}
