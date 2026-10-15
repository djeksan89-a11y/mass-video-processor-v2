import { useState } from 'react';
import { load, save } from './settings';
import type { Settings } from './types';
export default function ProfileManager({ s, setS }: { s: Settings; setS: (s: Settings) => void }) {
  const [profiles, setProfiles] = useState<Record<string, Settings>>(() => load<Record<string, Settings>>('mvp.profiles', {}));
  const [name, setName] = useState('');
  const [sel, setSel] = useState('');
  const persist = (p: Record<string, Settings>) => { setProfiles(p); save('mvp.profiles', p); };
  const names = Object.keys(profiles);
  return (
    <div>
      <div className="row"><input placeholder="Имя профиля" value={name} onChange={e => setName(e.target.value)} />
        <button className="btn sm" disabled={!name.trim()} onClick={() => { persist({ ...profiles, [name.trim()]: s }); setSel(name.trim()); setName(''); }}>Сохранить</button></div>
      {names.length > 0 && (
        <div className="row">
          <select value={sel} onChange={e => setSel(e.target.value)}><option value="">— профиль —</option>{names.map(n => <option key={n}>{n}</option>)}</select>
          <button className="btn sm" disabled={!sel} onClick={() => setS({ ...s, ...profiles[sel] })}>Загрузить</button>
          <button className="btn sm" disabled={!sel} onClick={() => { const p = { ...profiles }; delete p[sel]; persist(p); setSel(''); }}>Удалить</button>
        </div>
      )}
    </div>
  );
}
