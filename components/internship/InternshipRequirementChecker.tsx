"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { OTHER_UNIVERSITY_VALUE } from "@/lib/internship/constants";
import type { InternshipUniversity } from "@/lib/internship/types";

export default function InternshipRequirementChecker({
  universities,
}: {
  universities: InternshipUniversity[];
}) {
  const [universityId, setUniversityId] = useState("");
  const [otherName, setOtherName] = useState("");
  const [program, setProgram] = useState("");
  const isOther = universityId === OTHER_UNIVERSITY_VALUE;
  const selected = useMemo(
    () => universities.find((row) => row.id === universityId) || null,
    [universities, universityId],
  );
  const verified =
    selected?.academicCreditStatus === "confirmed" ||
    selected?.status === "requirements_identified" ||
    selected?.status === "internship_eligible" ||
    selected?.status === "academic_credit_confirmed" ||
    selected?.status === "active_partner";

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold">
        University
        <select
          name="universityId"
          required
          value={universityId}
          onChange={(event) => setUniversityId(event.target.value)}
          className="mt-1 min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
        >
          <option value="">Select university</option>
          {universities.map((university) => (
            <option key={university.id} value={university.id}>
              {university.displayName}
            </option>
          ))}
          <option value={OTHER_UNIVERSITY_VALUE}>Other — type a university</option>
        </select>
      </label>
      {isOther ? (
        <label className="block text-sm font-semibold">
          Other university
          <input
            name="otherUniversityName"
            required
            value={otherName}
            onChange={(event) => setOtherName(event.target.value)}
            placeholder="Type the intern’s college or university"
            className="mt-1 min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
          />
        </label>
      ) : null}
      <input
        name="academicProgram"
        value={program}
        onChange={(event) => setProgram(event.target.value)}
        placeholder="Major / program"
        className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
      />
      {isOther ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          This school will be saved as a Student Institution. Requirements stay
          unverified until researched. It is not a University Partner.
        </p>
      ) : selected && !verified ? (
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
