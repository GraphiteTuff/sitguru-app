type SupabaseCoordinationBannerProps = {
  children?: React.ReactNode;
  pagePath?: string;
  folderPath?: string;
  primaryTable?: string;
  operation?: string;
  dataSource?: string;
  selectQuery?: string;
  readFields?: string[];
  filters?: string[];
  searchFields?: string[];
  writeActions?: string[];
  exportRoutes?: string[];
  relatedPages?: string[];
  relatedTables?: string[];
  notes?: string[];
};

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-black text-[#17382B]">
      {children}
    </span>
  );
}

function Section({
  title,
  items,
  emptyText,
}: {
  title: string;
  items?: string[];
  emptyText: string;
}) {
  return (
    <div className="rounded-3xl border border-emerald-100 bg-[#FBFCF8] p-4">
      <p className="text-sm font-black text-emerald-900">{title}</p>

      {items && items.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <Tag key={item}>{item}</Tag>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          {emptyText}
        </p>
      )}
    </div>
  );
}

export default function SupabaseCoordinationBanner({
  children,
  pagePath,
  folderPath,
  primaryTable,
  operation,
  dataSource = "Supabase server client using createClient()",
  selectQuery,
  readFields = [],
  filters = [],
  searchFields = [],
  writeActions = [],
  exportRoutes = [],
  relatedPages = [],
  relatedTables = [],
  notes = [],
}: SupabaseCoordinationBannerProps) {
  const hasDetailedCoordination =
    pagePath ||
    folderPath ||
    primaryTable ||
    operation ||
    selectQuery ||
    readFields.length > 0 ||
    filters.length > 0 ||
    searchFields.length > 0 ||
    writeActions.length > 0 ||
    exportRoutes.length > 0 ||
    relatedPages.length > 0 ||
    relatedTables.length > 0 ||
    notes.length > 0;

  if (!hasDetailedCoordination) {
    return (
      <section className="rounded-[2rem] border border-emerald-100 bg-white px-5 py-5 text-sm font-semibold leading-7 text-slate-600 shadow-sm sm:px-6 lg:px-8">
        <span className="font-black text-emerald-800">
          Supabase coordination:
        </span>{" "}
        {children}
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">
            Backend Coordination
          </p>

          <h2 className="mt-2 text-2xl font-black leading-tight text-[#17382B] sm:text-3xl">
            Supabase Coordination
          </h2>

          <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-700">
            This section confirms the exact Supabase table, page file, folder,
            query fields, filters, export route, and actions coordinated by this
            specific admin screen.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
            Primary Table
          </p>

          <p className="mt-1 break-words text-lg font-black text-emerald-950">
            {primaryTable || "Not specified"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-emerald-100 bg-[#FBFCF8] p-4">
          <p className="text-sm font-black text-emerald-900">
            File / Folder Coordination
          </p>

          <div className="mt-3 grid gap-2">
            <div className="rounded-2xl border border-emerald-100 bg-white p-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Page File
              </p>
              <p className="mt-1 break-words text-sm font-black text-[#17382B]">
                {pagePath || "Not specified"}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white p-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Folder
              </p>
              <p className="mt-1 break-words text-sm font-black text-[#17382B]">
                {folderPath || "Not specified"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-black text-blue-900">
            Supabase Operation
          </p>

          <div className="mt-3 grid gap-2">
            <div className="rounded-2xl border border-blue-100 bg-white p-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Operation
              </p>
              <p className="mt-1 break-words text-sm font-black text-[#17382B]">
                {operation || "Not specified"}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-white p-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Data Source
              </p>
              <p className="mt-1 break-words text-sm font-black text-[#17382B]">
                {dataSource}
              </p>
            </div>
          </div>
        </div>
      </div>

      {selectQuery ? (
        <div className="mt-4 rounded-3xl border border-emerald-100 bg-[#FBFCF8] p-4">
          <p className="text-sm font-black text-emerald-900">
            Supabase Select Query
          </p>

          <p className="mt-3 break-words rounded-2xl border border-emerald-100 bg-white p-4 text-xs font-black leading-6 text-[#17382B]">
            {selectQuery}
          </p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Section
          title="Read Fields"
          items={readFields}
          emptyText="No read fields listed."
        />

        <Section
          title="Filters"
          items={filters}
          emptyText="No filters are wired on this page."
        />

        <Section
          title="Search Fields"
          items={searchFields}
          emptyText="No search fields are wired on this page."
        />

        <Section
          title="Write Actions"
          items={writeActions}
          emptyText="This page is read-only right now."
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Section
          title="Export Routes"
          items={exportRoutes}
          emptyText="No export route connected."
        />

        <Section
          title="Related Pages"
          items={relatedPages}
          emptyText="No related pages listed."
        />

        <Section
          title="Related Supabase Tables"
          items={relatedTables}
          emptyText="No related tables listed."
        />
      </div>

      {notes.length > 0 ? (
        <div className="mt-4 rounded-3xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-sm font-black text-amber-900">
            Coordination Notes
          </p>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {notes.map((note) => (
              <div
                key={note}
                className="rounded-2xl border border-amber-100 bg-white p-3 text-sm font-semibold leading-6 text-slate-700"
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}