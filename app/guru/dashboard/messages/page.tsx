import Link from "next/link";

type SearchParams = Promise<{
  success?: string | string[];
  error?: string | string[];
  thread?: string | string[];
}>;

type PageProps = {
  searchParams?: SearchParams;
};

function getQueryValue(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function MessageBanner({
  success,
  error,
  thread,
}: {
  success?: string;
  error?: string;
  thread?: string;
}) {
  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
        Message action completed successfully.
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
        There was a problem loading messages: {error}
      </div>
    );
  }

  if (thread) {
    return (
      <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-300">
        Active thread: {thread}
      </div>
    );
  }

  return null;
}

function EmptyMessagesState() {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-300">
            Guru Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Messages</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            This page is now safe for Next.js prerendering and can be connected
            back to your real message data next.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/guru/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/gurus"
            className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            Browse Gurus
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
          <p className="text-sm text-slate-400">Unread</p>
          <p className="mt-2 text-2xl font-semibold text-white">0</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
          <p className="text-sm text-slate-400">Open threads</p>
          <p className="mt-2 text-2xl font-semibold text-white">0</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
          <p className="text-sm text-slate-400">Archived</p>
          <p className="mt-2 text-2xl font-semibold text-white">0</p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-6">
        <p className="text-sm font-medium text-white">No conversations yet</p>
        <p className="mt-2 text-sm text-slate-300">
          When customers start conversations, they will appear here.
        </p>
      </div>
    </div>
  );
}

export default async function GuruDashboardMessagesPage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const success = getQueryValue(resolvedSearchParams.success);
  const error = getQueryValue(resolvedSearchParams.error);
  const thread = getQueryValue(resolvedSearchParams.thread);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <MessageBanner success={success} error={error} thread={thread} />
        <EmptyMessagesState />
      </div>
    </main>
  );
}