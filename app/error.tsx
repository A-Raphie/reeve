"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="micro">something failed on our side</span>
      <h1 className="max-w-[680px] text-4xl font-bold tracking-tight text-balance">
        The desk could not load.
      </h1>
      <p className="caption max-w-[480px] text-pretty">
        A data source timed out or returned something unexpected. Nothing of yours is affected.
      </p>
      <button onClick={reset} className="btn btn-primary">
        Retry
      </button>
    </div>
  );
}
