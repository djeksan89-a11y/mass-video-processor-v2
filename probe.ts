/** Читает длительность и размер кадра средствами браузера. Если браузер не может — файл не принимается. */
export function probe(file: File): Promise<{ dur: number; w: number; h: number }> {
  return new Promise((res, rej) => {
    const v = document.createElement('video');
    const url = URL.createObjectURL(file);
    const done = () => { URL.revokeObjectURL(url); v.removeAttribute('src'); v.load(); };
    const t = setTimeout(() => { done(); rej(new Error('Таймаут чтения метаданных')); }, 15000);
    v.preload = 'metadata'; v.muted = true;
    v.onloadedmetadata = () => {
      clearTimeout(t);
      const r = { dur: v.duration, w: v.videoWidth, h: v.videoHeight };
      done();
      r.w && r.h ? res(r) : rej(new Error('Нет видеодорожки или кодек не поддерживается браузером'));
    };
    v.onerror = () => { clearTimeout(t); done(); rej(new Error('Браузер не смог прочитать файл (кодек не поддерживается)')); };
    v.src = url;
  });
}
