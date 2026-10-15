import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

/** Интерфейс процессора: позже можно подставить серверную реализацию без правок UI. */
export interface VideoProcessor {
  run(file: File, args: string[], onProgress: (p: number) => void): Promise<Blob>;
  cancel(): void;
}

export const CANCELED = 'CANCELED';
// ВАЖНО: библиотека @ffmpeg/ffmpeg запускает ядро в module-worker, поэтому нужна ESM-сборка ядра (dist/esm), а не UMD.
const BASES = [
  'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm',
  'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm',
];
const TIMEOUT_MS = 20 * 60 * 1000;
let urls: { coreURL: string; wasmURL: string } | null = null;

async function loadUrls() {
  if (urls) return urls;
  let last: unknown;
  for (const b of BASES) {
    try {
      urls = {
        coreURL: await toBlobURL(`${b}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${b}/ffmpeg-core.wasm`, 'application/wasm'),
      };
      return urls;
    } catch (e) { last = e; }
  }
  throw new Error('Не удалось скачать ядро FFmpeg (проверьте интернет): ' + String((last as Error)?.message ?? last));
}

/**
 * FFmpeg WASM (однопоточное ядро, не требует COOP/COEP). Сам FFmpeg работает в Web Worker библиотеки.
 * На каждый файл создаётся НОВЫЙ экземпляр и затем полностью уничтожается (terminate):
 * это освобождает память WASM и виртуальную файловую систему со всеми временными файлами.
 */
export class FfmpegProcessor implements VideoProcessor {
  private ff: FFmpeg | null = null;
  private gen = 0; // номер текущего запуска; cancel() увеличивает его и тем самым «обесценивает» запуск
  private abort: (() => void) | null = null;

  private reset() {
    const ff = this.ff; this.ff = null;
    try { ff?.terminate(); } catch { /* ignore */ }
  }

  private async work(gen: number, file: File, args: string[], onP: (p: number) => void): Promise<Blob> {
    const core = await loadUrls();
    if (gen !== this.gen) throw new Error(CANCELED);
    const ff = new FFmpeg();
    // Регистрируем экземпляр ДО await ff.load(): иначе cancel() не сможет завершить worker,
    // если пользователь отменит обработку во время загрузки/инициализации ядра.
    this.ff = ff;
    ff.on('progress', ({ progress }) => { if (gen === this.gen) onP(Math.max(0, Math.min(1, progress))); });
    try {
      await ff.load(core);
    } catch (e) {
      if (this.ff === ff) this.ff = null;
      try { ff.terminate(); } catch { /* ignore */ }
      throw e;
    }
    if (gen !== this.gen) { if (this.ff === ff) this.ff = null; try { ff.terminate(); } catch { /* ignore */ } throw new Error(CANCELED); }

    const ext = (file.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
    const inName = `in.${ext}`;
    await ff.writeFile(inName, await fetchFile(file));
    const code = await ff.exec(['-i', inName, ...args, '-y', 'out.mp4'], TIMEOUT_MS);
    if (gen !== this.gen) throw new Error(CANCELED);
    if (code !== 0) throw new Error(`FFmpeg завершился с кодом ${code} (нехватка памяти, таймаут или неподдерживаемый кодек)`);
    const data = await ff.readFile('out.mp4');
    if (typeof data === 'string' || !data.byteLength) throw new Error('FFmpeg не создал выходной файл');
    return new Blob([data as unknown as BlobPart], { type: 'video/mp4' });
  }

  async run(file: File, args: string[], onProgress: (p: number) => void): Promise<Blob> {
    const gen = ++this.gen;
    let cancelNow!: (e: Error) => void;
    const canceled = new Promise<never>((_, rej) => { cancelNow = rej; });
    canceled.catch(() => {});
    this.abort = () => cancelNow(new Error(CANCELED));
    const job = this.work(gen, file, args, onProgress);
    job.catch(() => {}); // если отмена победила в гонке, поздняя ошибка job не должна стать unhandled
    try {
      // Гонка с отменой гарантирует, что отмена не «зависнет», даже если worker не успел ответить.
      return await Promise.race([job, canceled]);
    } catch (e) {
      if (gen !== this.gen) throw new Error(CANCELED);
      throw e;
    } finally {
      if (gen === this.gen) { this.abort = null; this.reset(); }
    }
  }

  cancel() {
    this.gen++;
    this.abort?.(); this.abort = null;
    this.reset();
  }
}
