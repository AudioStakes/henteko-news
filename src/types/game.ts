export type CategoryKey = "who" | "when" | "where" | "what" | "action";

export type WordOption = {
  display: string;
  speech?: string;
};

export type Category = {
  key: CategoryKey;
  label: string;
  words: Array<string | WordOption>;
};

export type Selections = Partial<Record<CategoryKey, WordOption>>;
