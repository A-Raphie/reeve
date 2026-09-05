export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <div className="h-12 w-4/5 animate-pulse rounded-[var(--radius-input)] bg-[color:var(--border-default)]" />
          <div className="mt-4 h-4 w-3/5 animate-pulse rounded-[var(--radius-input)] bg-[color:var(--border-default)]" />
          <div className="mt-10 h-11 w-40 animate-pulse rounded-[var(--radius-input)] bg-[color:var(--border-default)]" />
        </div>
        <div className="card h-80 animate-pulse bg-[color:var(--bg-subtle)]" />
      </div>
    </div>
  );
}
