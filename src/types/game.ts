export type CategoryKey = 'who' | 'when' | 'where' | 'what' | 'action';

export type Category = {
  key: CategoryKey;
  label: string;
  words: string[];
};

export type Selections = Partial<Record<CategoryKey, string>>;

export type SoundSpeed = 'slow' | 'normal' | 'fast';
export type SoundPitch = 'low' | 'normal' | 'high';

export type SoundSettings = {
  enabled: boolean;
  speed: SoundSpeed;
  pitch: SoundPitch;
};
