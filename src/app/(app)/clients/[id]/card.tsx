export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value ?? "—"}</dd>
    </div>
  );
}

export function EmptyState({ text, actionLabel, actionHref }: { text: string; actionLabel?: string; actionHref?: string }) {
  return (
    <p className="text-sm text-slate-400">
      {text}
      {actionLabel && actionHref && (
        <>
          {" "}
          <a href={actionHref} className="text-orange-600 hover:text-orange-700">
            {actionLabel} →
          </a>
        </>
      )}
    </p>
  );
}
