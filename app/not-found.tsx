import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="micro">404 · no such page</span>
      <h1 className="max-w-[680px] text-4xl font-bold tracking-tight text-balance">
        This page is outside the writ.
      </h1>
      <p className="caption max-w-[480px] text-pretty">
        The address you followed does not exist. The desk, however, is right where you left it.
      </p>
      <Link href="/" className="btn btn-primary">
        Back to the desk
      </Link>
    </div>
  );
}
