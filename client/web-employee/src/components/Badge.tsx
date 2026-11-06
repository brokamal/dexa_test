type Tone = 'green' | 'amber' | 'slate' | 'rose' | 'brand';

const tones: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  rose: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/20',
};

export default function Badge({
  tone = 'slate',
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
