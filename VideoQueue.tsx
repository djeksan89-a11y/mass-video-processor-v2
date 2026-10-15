import type { Item } from './types';
const L: Record<string, string> = { pending: 'ожидает', processing: 'обрабатывается', done: 'готово', error: 'ошибка', canceled: 'отменено' };
export const mb = (n: number) => (n / 1048576).toFixed(1) + ' МБ';
export const dur = (s: number) => (s ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '—');
export default function VideoQueue({ items, onRemove, onClear, running }: { items: Item[]; onRemove: (id: string) => void; onClear: () => void; running: boolean }) {
  if (!items.length) return <p className="muted">Очередь пуста</p>;
  return (
    <div>
      <div className="row"><b>Очередь: {items.length}</b><button className="btn sm" disabled={running} onClick={onClear}>Очистить</button></div>
      {items.map(i => (
        <div key={i.id} className={'card ' + i.status}>
          <div className="row"><span className="name">{i.file.name}</span>
            <button className="btn sm" disabled={running || i.status === "processing"} onClick={() => onRemove(i.id)}>✕</button></div>
          <div className="muted">{mb(i.file.size)} · {dur(i.dur)} · {i.w ? `${i.w}×${i.h}` : ''} · {L[i.status]}</div>
          {i.status === 'processing' && <div className="bar"><i style={{ width: `${Math.round(i.progress * 100)}%` }} /></div>}
          {i.error && <div className="err">{i.error}</div>}
        </div>
      ))}
    </div>
  );
}
