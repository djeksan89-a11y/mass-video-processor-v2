import { useState } from 'react';
import { Zip, ZipPassThrough } from 'fflate';
import type { Item } from './types';
import { mb } from './VideoQueue';
const outName = (n: string) => n.replace(/\.[^.]+$/, '') + '_processed.mp4';
export function saveBlob(b: Blob, name: string) {
  const a = document.createElement('a'); const u = URL.createObjectURL(b);
  a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 60000);
}
export default function DownloadManager({ items }: { items: Item[] }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const ready = items.filter(i => i.status === 'done' && i.out);
  if (!ready.length) return <p className="muted">Готовых файлов пока нет</p>;
  async function zipAll() {
    setBusy(true); setErr('');
    try {
      const parts: BlobPart[] = [];
      let finish!: (b: Blob) => void; let fail!: (e: unknown) => void;
      const done = new Promise<Blob>((res, rej) => { finish = res; fail = rej; });
      const z = new Zip((e, chunk, final) => {
        if (e) { fail(e); return; }
        parts.push(chunk as unknown as BlobPart);
        if (final) finish(new Blob(parts, { type: 'application/zip' }));
      });
      const used = new Set<string>();
      for (const i of ready) {
        let n = outName(i.file.name); let k = 1;
        while (used.has(n)) n = outName(i.file.name).replace(/\.mp4$/, `_${k++}.mp4`);
        used.add(n);
        const f = new ZipPassThrough(n); z.add(f);
        f.push(new Uint8Array(await i.out!.arrayBuffer()), true);
      }
      z.end();
      saveBlob(await done, 'processed_videos.zip');
    } catch (e) { setErr('Не удалось собрать ZIP (не хватает памяти?). Скачайте файлы по одному. ' + String(e)); }
    setBusy(false);
  }
  return (
    <div>
      <button className="btn big primary" disabled={busy} onClick={zipAll}>{busy ? 'Собираю ZIP…' : `⬇ Скачать всё одним ZIP (${ready.length})`}</button>
      {err && <div className="err">{err}</div>}
      {ready.map(i => (
        <div key={i.id} className="card row"><span className="name">{outName(i.file.name)} · {mb(i.out!.size)}</span>
          <button className="btn sm" onClick={() => saveBlob(i.out!, outName(i.file.name))}>⬇</button></div>
      ))}
    </div>
  );
}
