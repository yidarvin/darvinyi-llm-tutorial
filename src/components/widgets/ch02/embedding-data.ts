export type Category =
  | 'animal'
  | 'color'
  | 'country'
  | 'capital'
  | 'food'
  | 'profession'
  | 'verb'
  | 'adjective'
  | 'person';

export interface WordPoint {
  word: string;
  category: Category;
  x: number;
  y: number;
}

export interface AnalogyGroup {
  id: string;
  label: string;
  description: string;
  pairs: [string, string][];
}

export interface CategoryInfo {
  id: Category;
  label: string;
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'animal', label: 'animals', color: 'var(--cyan-400)' },
  { id: 'color', label: 'colors', color: 'var(--amber-500)' },
  { id: 'country', label: 'countries', color: 'var(--rose-500)' },
  { id: 'capital', label: 'capitals', color: 'var(--rose-500)' },
  { id: 'food', label: 'foods', color: 'var(--emerald-500)' },
  { id: 'profession', label: 'professions', color: 'var(--cyan-300)' },
  { id: 'verb', label: 'verbs', color: 'var(--text-secondary)' },
  { id: 'adjective', label: 'adjectives', color: 'var(--amber-500)' },
  { id: 'person', label: 'people', color: 'var(--cyan-500)' },
];

export const WORDS: WordPoint[] = [
  // Animals — top-left cluster
  { word: 'cat', category: 'animal', x: -7.0, y: 5.0 },
  { word: 'dog', category: 'animal', x: -6.0, y: 4.5 },
  { word: 'horse', category: 'animal', x: -5.0, y: 6.0 },
  { word: 'bird', category: 'animal', x: -7.5, y: 7.0 },
  { word: 'fish', category: 'animal', x: -6.5, y: 5.5 },
  { word: 'mouse', category: 'animal', x: -8.0, y: 4.0 },
  { word: 'lion', category: 'animal', x: -4.5, y: 5.5 },
  { word: 'tiger', category: 'animal', x: -4.0, y: 6.0 },

  // Colors — top-right cluster
  { word: 'red', category: 'color', x: 5.0, y: 6.5 },
  { word: 'blue', category: 'color', x: 6.0, y: 7.0 },
  { word: 'green', category: 'color', x: 6.5, y: 6.0 },
  { word: 'yellow', category: 'color', x: 5.5, y: 7.5 },
  { word: 'black', category: 'color', x: 7.0, y: 6.5 },
  { word: 'white', category: 'color', x: 7.5, y: 7.0 },
  { word: 'purple', category: 'color', x: 6.0, y: 5.5 },

  // Countries — bottom-left cluster
  { word: 'France', category: 'country', x: -7.0, y: -5.0 },
  { word: 'Japan', category: 'country', x: -5.0, y: -6.0 },
  { word: 'USA', category: 'country', x: -8.0, y: -5.5 },
  { word: 'UK', category: 'country', x: -6.0, y: -7.0 },

  // Capitals — offset from countries by (+0.5, +2)
  { word: 'Paris', category: 'capital', x: -6.5, y: -3.0 },
  { word: 'Tokyo', category: 'capital', x: -4.5, y: -4.0 },
  { word: 'NYC', category: 'capital', x: -7.5, y: -3.5 },
  { word: 'London', category: 'capital', x: -5.5, y: -5.0 },

  // People — gender-paired, bottom-right; vertical gender axis (0, -2)
  { word: 'king', category: 'person', x: 4.0, y: -2.0 },
  { word: 'queen', category: 'person', x: 4.0, y: -4.0 },
  { word: 'man', category: 'person', x: 5.0, y: -3.0 },
  { word: 'woman', category: 'person', x: 5.0, y: -5.0 },
  { word: 'boy', category: 'person', x: 6.0, y: -2.5 },
  { word: 'girl', category: 'person', x: 6.0, y: -4.5 },
  { word: 'prince', category: 'person', x: 3.0, y: -3.0 },
  { word: 'princess', category: 'person', x: 3.0, y: -5.0 },

  // Foods — center
  { word: 'pizza', category: 'food', x: 1.0, y: 1.0 },
  { word: 'sushi', category: 'food', x: 2.0, y: 0.5 },
  { word: 'burger', category: 'food', x: 1.5, y: 1.5 },
  { word: 'salad', category: 'food', x: 0.0, y: 0.0 },
  { word: 'pasta', category: 'food', x: 1.0, y: 2.0 },

  // Professions — right-middle
  { word: 'doctor', category: 'profession', x: 8.0, y: 2.0 },
  { word: 'lawyer', category: 'profession', x: 8.5, y: 1.0 },
  { word: 'teacher', category: 'profession', x: 7.5, y: 1.5 },
  { word: 'engineer', category: 'profession', x: 8.0, y: 0.5 },
  { word: 'artist', category: 'profession', x: 7.0, y: 2.5 },

  // Verbs — top-middle
  { word: 'run', category: 'verb', x: 0.0, y: 6.0 },
  { word: 'walk', category: 'verb', x: -0.5, y: 5.5 },
  { word: 'jump', category: 'verb', x: 0.5, y: 6.5 },
  { word: 'swim', category: 'verb', x: -1.0, y: 5.0 },
  { word: 'fly', category: 'verb', x: 1.0, y: 7.0 },

  // Adjectives — comparative pairs, far right; axis (+0.5, -1)
  { word: 'big', category: 'adjective', x: 9.0, y: -1.0 },
  { word: 'bigger', category: 'adjective', x: 9.5, y: -2.0 },
  { word: 'small', category: 'adjective', x: 8.5, y: -0.5 },
  { word: 'smaller', category: 'adjective', x: 9.0, y: -1.5 },
  { word: 'happy', category: 'adjective', x: 9.0, y: 4.0 },
  { word: 'happier', category: 'adjective', x: 9.5, y: 3.0 },
];

export const ANALOGIES: AnalogyGroup[] = [
  {
    id: 'gender',
    label: 'Gender pairs',
    description:
      'king → queen, man → woman, prince → princess, boy → girl (gender axis ≈ vertical down)',
    pairs: [
      ['king', 'queen'],
      ['man', 'woman'],
      ['prince', 'princess'],
      ['boy', 'girl'],
    ],
  },
  {
    id: 'capital',
    label: 'Country → capital',
    description:
      'France → Paris, Japan → Tokyo, USA → NYC, UK → London (capital axis ≈ up + slightly right)',
    pairs: [
      ['France', 'Paris'],
      ['Japan', 'Tokyo'],
      ['USA', 'NYC'],
      ['UK', 'London'],
    ],
  },
  {
    id: 'comparative',
    label: 'Comparative form',
    description:
      'big → bigger, small → smaller, happy → happier (comparative axis ≈ down + slightly right)',
    pairs: [
      ['big', 'bigger'],
      ['small', 'smaller'],
      ['happy', 'happier'],
    ],
  },
];

export const ANALOGY_COLORS: Record<string, string> = {
  gender: 'var(--cyan-400)',
  capital: 'var(--amber-500)',
  comparative: 'var(--rose-500)',
};

export function findWord(word: string): WordPoint | undefined {
  return WORDS.find(w => w.word === word);
}
