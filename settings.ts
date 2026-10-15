import type { EffKey, Settings } from './types';
export const EFFECTS: { k: EffKey; label: string; min: number; max: number; step: number; def: number; slider: boolean }[] = [
  { k: 'saturation', label: 'Насыщенность', min: 0, max: 2, step: 0.05, def: 1.2, slider: true },
  { k: 'brightness', label: 'Яркость', min: -0.3, max: 0.3, step: 0.01, def: 0.03, slider: true },
  { k: 'contrast', label: 'Контраст', min: 0.5, max: 1.5, step: 0.01, def: 1.05, slider: true },
  { k: 'zoom', label: 'Масштаб кадра', min: 0.7, max: 1.5, step: 0.01, def: 1.05, slider: true },
  { k: 'speed', label: 'Скорость', min: 0.5, max: 2, step: 0.05, def: 1.05, slider: true },
  { k: 'grain', label: 'Зерно', min: 1, max: 40, step: 1, def: 8, slider: true },
  { k: 'frame', label: 'Рамка (% толщины)', min: 0.5, max: 10, step: 0.5, def: 2, slider: true },
  { k: 'shiftX', label: 'Сдвиг по X (%)', min: -20, max: 20, step: 1, def: 3, slider: true },
  { k: 'shiftY', label: 'Сдвиг по Y (%)', min: -20, max: 20, step: 1, def: 0, slider: true },
  { k: 'grid', label: 'Сетка 3×3', min: 0, max: 0, step: 1, def: 0, slider: false },
  { k: 'mirror', label: 'Зеркальное отражение', min: 0, max: 0, step: 1, def: 0, slider: false },
];
export function defaultSettings(): Settings {
  const s: any = { crf: 24, maxLong: 0, ratio: 'orig', maxMB: 300, normalizeAudio: false, pitchOn: false, pitchSemitones: 1, stripMetadata: false, metadataTitle: '' };
  for (const e of EFFECTS) s[e.k] = { on: false, v: e.def };
  return s as Settings;
}
export function load<T>(key: string, fb: T): T {
  try { const r = localStorage.getItem(key); return r ? { ...fb, ...JSON.parse(r) } : fb; } catch { return fb; }
}
export function save(key: string, v: unknown) { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ } }

/** Merge persisted settings with current defaults so older saved versions gain new options. */
export function loadSettings(key: string): Settings {
  const defaults = defaultSettings();
  const saved = load<Partial<Settings>>(key, {});
  return { ...defaults, ...saved } as Settings;
}
