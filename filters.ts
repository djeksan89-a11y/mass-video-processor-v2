import type { Settings } from './types';
const ev = (n: number) => Math.max(2, Math.round(n / 2) * 2);
const num = (n: number) => String(+n.toFixed(3));
/** Строит аргументы FFmpeg (между -i и выходным файлом). Ничего не вырезает по времени. */
export function buildArgs(w: number, h: number, s: Settings): string[] {
  const vf: string[] = [];
  const cw = ev(w), ch = ev(h);
  if (cw !== w || ch !== h) vf.push(`scale=${cw}:${ch}`);
  if (s.zoom.on && s.zoom.v !== 1) {
    const z = s.zoom.v;
    vf.push(z > 1 ? `crop=${ev(cw / z)}:${ev(ch / z)},scale=${cw}:${ch}`
      : `scale=${ev(cw * z)}:${ev(ch * z)},pad=${cw}:${ch}:(ow-iw)/2:(oh-ih)/2:black`);
  }
  const dx = s.shiftX.on ? Math.round(cw * s.shiftX.v / 100) : 0;
  const dy = s.shiftY.on ? Math.round(ch * s.shiftY.v / 100) : 0;
  if (dx || dy) vf.push(`pad=${cw * 2}:${ch * 2}:${cw / 2}:${ch / 2}:black,crop=${cw}:${ch}:${cw / 2 - dx}:${ch / 2 - dy}`);
  if (s.mirror.on) vf.push('hflip');
  let tw = cw, th = ch;
  const mx = Math.max(cw, ch);
  if (s.ratio === 'orig') {
    if (s.maxLong && s.maxLong < mx) { const k = s.maxLong / mx; tw = ev(cw * k); th = ev(ch * k); vf.push(`scale=${tw}:${th}`); }
  } else {
    const [a, b] = s.ratio.split(':').map(Number); const r = a / b; const L = ev(s.maxLong || mx);
    if (r >= 1) { tw = L; th = ev(L / r); } else { th = L; tw = ev(L * r); }
    vf.push(`scale=${tw}:${th}:force_original_aspect_ratio=decrease,pad=${tw}:${th}:(ow-iw)/2:(oh-ih)/2:black`);
  }
  if (s.saturation.on || s.brightness.on || s.contrast.on)
    vf.push(`eq=saturation=${num(s.saturation.on ? s.saturation.v : 1)}:brightness=${num(s.brightness.on ? s.brightness.v : 0)}:contrast=${num(s.contrast.on ? s.contrast.v : 1)}`);
  if (s.grain.on && s.grain.v > 0) vf.push(`noise=alls=${Math.round(s.grain.v)}:allf=t`);
  if (s.grid.on) vf.push(`drawgrid=width=${ev(tw / 3)}:height=${ev(th / 3)}:thickness=2:color=white@0.35`);
  if (s.frame.on) vf.push(`drawbox=x=0:y=0:width=${tw}:height=${th}:color=white:t=${Math.max(1, Math.round(Math.min(tw, th) * s.frame.v / 100))}`);
  const sp = s.speed.on ? s.speed.v : 1;
  if (sp !== 1) vf.push(`setpts=PTS/${num(sp)}`);
  const a = ['-map', '0:v:0', '-map', '0:a:0?', '-sn'];
  if (vf.length) a.push('-vf', vf.join(','));
  const af: string[] = [];
  if (s.pitchOn && s.pitchSemitones !== 0) {
    const factor = Math.pow(2, s.pitchSemitones / 12);
    af.push(`asetrate=${Math.round(44100 * factor)}`, 'aresample=44100', `atempo=${num(1 / factor)}`);
  }
  if (sp !== 1) af.push(`atempo=${num(sp)}`);
  if (s.normalizeAudio) af.push('loudnorm=I=-16:TP=-1.5:LRA=11');
  if (af.length) a.push('-af', af.join(','));
  if (s.stripMetadata) a.push('-map_metadata', '-1');
  if (s.metadataTitle.trim()) a.push('-metadata', `title=${s.metadataTitle.trim().replace(/[\\\"']/g, '')}`);
  a.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(s.crf), '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart');
  return a;
}
