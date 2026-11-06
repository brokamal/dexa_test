import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  onChange: (file: File | null) => void;
  disabled?: boolean;
  hint?: string;
  fill?: boolean;
}

export default function PhotoPicker({ onChange, disabled, hint, fill = false }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    if (streaming && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [streaming]);

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      setStreaming(true);
    } catch {
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan pada browser.');
    }
  }

  function handleCapture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'selfie-absensi.jpg', { type: 'image/jpeg' });
      setPreview(dataUrl);
      onChange(file);
      stopCamera();
    }, 'image/jpeg', 0.9);
  }

  function reset() {
    setPreview(null);
    onChange(null);
  }

  const locked = !!disabled;
  const mediaSize = fill ? 'min-h-[280px] w-full flex-1' : 'aspect-[4/3] w-full';

  return (
    <div className={`space-y-2 ${fill ? 'flex h-full flex-col' : ''}`}>
      {preview ? (
        <div className={`relative overflow-hidden rounded-xl border-2 border-slate-200 ${mediaSize}`}>
          <img src={preview} alt="Foto bukti" className="h-full w-full object-cover" />
          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white">
            Foto siap dikirim
          </span>
        </div>
      ) : streaming ? (
        <div className={`relative overflow-hidden rounded-xl border-2 border-slate-300 bg-slate-900 ${mediaSize}`}>
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            className="h-full w-full -scale-x-100 object-cover"
          />
          <button
            type="button"
            onClick={handleCapture}
            disabled={locked}
            className="absolute inset-x-0 bottom-4 mx-auto flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-white/20 shadow-lg transition hover:scale-105 disabled:opacity-60"
          >
            <span className="h-10 w-10 rounded-full bg-white" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startCamera}
          disabled={locked}
          className={`flex ${mediaSize} flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-400/60 bg-slate-200/60 transition hover:border-slate-500 hover:bg-white/60 ${
            locked ? 'opacity-60' : ''
          }`}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-600">Buka kamera & ambil foto selfie</p>
          <p className="text-xs text-slate-400">{hint ?? 'Foto diambil langsung dari kamera'}</p>
        </button>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex items-center gap-3 text-xs font-medium">
        {preview && (
          <>
            <button type="button" className="text-brand-600 hover:underline" onClick={() => { reset(); startCamera(); }} disabled={locked}>
              Ambil ulang
            </button>
            <button type="button" className="text-rose-600 hover:underline" onClick={reset} disabled={locked}>
              Hapus foto
            </button>
          </>
        )}
        {streaming && (
          <button type="button" className="text-slate-500 hover:underline" onClick={stopCamera} disabled={locked}>
            Tutup kamera
          </button>
        )}
      </div>
    </div>
  );
}
