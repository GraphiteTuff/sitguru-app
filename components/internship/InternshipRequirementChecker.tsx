"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { InternshipUniversity } from "@/lib/internship/types";

export default function InternshipRequirementChecker({
  universities,
}: {
  universities: InternshipUniversity[];
}) {
  const [universityId, setUniversityId] = useState(universities[0]?.id || "");
  const [program, setProgram] = useState("");
  const selected = useMemo(
    () => universities.find((row) => row.id === universityId) || null,
    [universities, universityId],
  );
  const verified = selected?.academicCreditStatus === "confirmed" || selected?.status === "requirements_identified" || selected?.status === "internship_eligible" || selected?.status === "academic_credit_confirmed" || selected?.status === "active_partner";

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold">
        University
        <select
          name="universityId"
          value={universityId}
          onChange={(event) => setUniversityId(event.target.value)}
          className="mt-1 min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
        >
          {universities.map((university) => (
            <option key={university.id} value={university.id}>
              {university.displayName}
            </option>
          ))}
        </select>
      </label>
      <input
        name="academicProgram"
        value={program}
        onChange={(event) => setProgram(event.target.value)}
        placeholder="Major / program"
        className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
      />
      {selected && !verified ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          University requirements have not yet been verified.
          <Link
            href={`/admin/internship/universities/${selected.id}`}
            className="mt-2 block font-black underline"
          >
            Research Requirements
          </Link>
        </div>
      ) : selected ? (
        <p className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
          Known requirements for this institution will be copied onto the intern record
          if a matching verified program exists. Unverified fields stay blank.
        </p>
      ) : null}
    </div>
  );
}
