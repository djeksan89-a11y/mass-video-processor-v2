import type { Item } from './types';
export default function ProgressPanel({ items, running, locked, onStart, onCancel }: { items: Item[]; running: boolean; locked: boolean; onStart: () => void; onCancel: () => void }) {
  const done = items.filter(i => i.status === 'done').length;
  const err = items.filter(i => i.status === 'error').length;
  const cur = items.find(i => i.status === 'processing');
  const total = items.length || 1;
  const pct = Math.round(((done + err + (cur ? cur.progress : 0)) / total) * 100);
  return (
    <div className="dock">
      <div className="bar"><i style={{ width: `${pct}%` }} /></div>
      <div className="muted">Готово {done}/{items.length}{err ? ` · ошибок ${err}` : ''}{cur ? ` · сейчас ${Math.round(cur.progress * 100)}%` : ''}</div>
      {running ? <button className="btn big danger" onClick={onCancel}>■ Отменить</button>
        : <button className="btn big primary" disabled={locked || !items.some(i => i.w > 0 && i.status !== 'done')} onClick={onStart}>▶ Запустить обработку</button>}
    </div>
  );
}
