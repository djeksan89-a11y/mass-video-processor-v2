export default function FileUploader({ onFiles, disabled }: { onFiles: (f: File[]) => void; disabled: boolean }) {
  return (
    <label className={'btn big' + (disabled ? ' off' : '')}>
      ＋ Добавить видео (MP4 / MOV / WebM)
      <input type="file" multiple hidden disabled={disabled} accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
        onChange={e => { onFiles(Array.from(e.target.files || [])); e.target.value = ''; }} />
    </label>
  );
}
