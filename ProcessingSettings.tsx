import { EFFECTS } from './settings';
import type { EffKey, Settings } from './types';
export default function ProcessingSettings({ s, setS }: { s: Settings; setS: (s: Settings) => void }) {
  const eff = (k: EffKey, p: Partial<{ on: boolean; v: number }>) => setS({ ...s, [k]: { ...s[k], ...p } });
  return (
    <div>
      {EFFECTS.map(e => (
        <div key={e.k} className="eff">
          <label className="row"><span>{e.label}{e.slider && s[e.k].on ? `: ${s[e.k].v}` : ''}</span>
            <input type="checkbox" checked={s[e.k].on} onChange={x => eff(e.k, { on: x.target.checked })} /></label>
          {e.slider && s[e.k].on && <input type="range" min={e.min} max={e.max} step={e.step} value={s[e.k].v} onChange={x => eff(e.k, { v: +x.target.value })} />}
        </div>
      ))}
      <label>Соотношение сторон (без обрезки, добавляются чёрные поля)
        <select value={s.ratio} onChange={e => setS({ ...s, ratio: e.target.value })}>
          <option value="orig">Оригинальное</option><option value="16:9">16:9</option><option value="9:16">9:16</option><option value="1:1">1:1</option><option value="4:5">4:5</option>
        </select></label>
      <label>Разрешение (длинная сторона)
        <select value={s.maxLong} onChange={e => setS({ ...s, maxLong: +e.target.value })}>
          <option value={0}>Как в оригинале</option><option value={1920}>1080p — 1920 px</option><option value={1280}>720p — 1280 px</option><option value={854}>480p — 854 px</option>
        </select></label>
      <label>Качество
        <select value={s.crf} onChange={e => setS({ ...s, crf: +e.target.value })}>
          <option value={20}>Высокое (большой файл)</option><option value={24}>Среднее</option><option value={28}>Компактное</option>
        </select></label>
      <label>Макс. размер одного файла, МБ
        <input type="number" min={10} max={1000} value={s.maxMB} onChange={e => setS({ ...s, maxMB: Math.max(10, +e.target.value || 300) })} /></label>
      <hr />
      <h3>Звук</h3>
      <label className="row"><span>Нормализация громкости</span><input type="checkbox" checked={s.normalizeAudio} onChange={e => setS({ ...s, normalizeAudio: e.target.checked })} /></label>
      <label className="row"><span>Изменение высоты тона</span><input type="checkbox" checked={s.pitchOn} onChange={e => setS({ ...s, pitchOn: e.target.checked })} /></label>
      {s.pitchOn && <label>Высота тона: {s.pitchSemitones > 0 ? '+' : ''}{s.pitchSemitones} полутонов
        <input type="range" min={-4} max={4} step={1} value={s.pitchSemitones} onChange={e => setS({ ...s, pitchSemitones: +e.target.value })} />
        <small className="muted">Прослушай результат: сильное изменение может ухудшить естественность речи.</small></label>}
      <hr />
      <h3>Метаданные</h3>
      <label className="row"><span>Удалить необязательные метаданные</span><input type="checkbox" checked={s.stripMetadata} onChange={e => setS({ ...s, stripMetadata: e.target.checked })} /></label>
      <label>Название внутри файла (необязательно)
        <input value={s.metadataTitle} maxLength={120} placeholder="Например, название проекта" onChange={e => setS({ ...s, metadataTitle: e.target.value })} /></label>
      <p className="muted">Метаданные описывают файл, но их изменение не делает видеоряд оригинальным. Приложение не подменяет модель устройства или происхождение записи.</p>
    </div>
  );
}
