import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  beginSingleSubmission,
  endSingleSubmission,
  EXPERIENCE_YEARS_REQUIRED_MESSAGE,
  experienceYearsWrite,
  friendlyGuruProfileSaveError,
  nextGuruProfileDestination,
  parseExperienceYearsInput,
  resumeExperienceYearsInput,
} from "./experience-years";
import * as mobileExperience from "../../sitguru-mobile/src/lib/gurus/experience-years";

const modules = [
  { name: "web", api: {
    beginSingleSubmission,
    endSingleSubmission,
    experienceYearsWrite,
    friendlyGuruProfileSaveError,
    nextGuruProfileDestination,
    parseExperienceYearsInput,
    resumeExperienceYearsInput,
  } },
  { name: "mobile", api: mobileExperience },
];

for (const { name, api } of modules) {
  describe(`guru experience years (${name})`, () => {
    it("stores 0 years for a beginner", () => {
      const parsed = api.parseExperienceYearsInput("0");
      assert.equal(parsed.ok, true);
      if (!parsed.ok) return;
      assert.equal(parsed.years, 0);
      assert.deepEqual(api.experienceYearsWrite(parsed.years), {
        experience_years: 0,
        years_experience: 0,
      });
      assert.deepEqual(api.experienceYearsWrite(0), {
        experience_years: 0,
        years_experience: 0,
      });
    });

    it("stores a positive whole number for an experienced Guru", () => {
      const parsed = api.parseExperienceYearsInput(" 6 ");
      assert.equal(parsed.ok, true);
      if (!parsed.ok) return;
      assert.equal(parsed.years, 6);
      assert.equal(api.experienceYearsWrite("6").experience_years, 6);
    });

    it("rejects an unfilled required field instead of writing null", () => {
      for (const blank of ["", "   ", null, undefined]) {
        const parsed = api.parseExperienceYearsInput(blank);
        assert.equal(parsed.ok, false);
        if (parsed.ok) continue;
        assert.equal(parsed.message, EXPERIENCE_YEARS_REQUIRED_MESSAGE);
        assert.throws(() => api.experienceYearsWrite(blank), /just getting started/);
      }
    });

    it("rejects decimals, negatives, and non-numeric text", () => {
      for (const value of ["1.5", "-1", "3 years", "e", "80.0"]) {
        assert.equal(api.parseExperienceYearsInput(value).ok, false);
      }
    });

    it("resumes a partial application whose stored experience is 0", () => {
      const resumed = api.resumeExperienceYearsInput({
        experience_years: 0,
        years_experience: null,
      });
      assert.equal(resumed, "0");
      const columns = api.experienceYearsWrite(resumed);
      assert.equal(columns.experience_years, 0);
      assert.notEqual(columns.experience_years, null);
      assert.equal(columns.years_experience, 0);
    });

    it("resumes a saved positive value and keeps 0 distinct from blank", () => {
      assert.equal(
        api.resumeExperienceYearsInput({
          experience_years: 4,
          years_experience: null,
        }),
        "4",
      );
      assert.equal(
        api.resumeExperienceYearsInput({
          experience_years: null,
          years_experience: 2,
        }),
        "2",
      );
      assert.equal(api.resumeExperienceYearsInput(null), "");
    });

    it("does not let a truthiness check turn 0 into null", () => {
      const stored: number = 0;
      const legacy = stored ? Number(stored) : null;
      assert.equal(legacy, null);
      assert.equal(api.experienceYearsWrite(stored).experience_years, 0);
    });

    it("moves from Step 1 to Step 2 only after a confirmed save", () => {
      assert.deepEqual(
        api.nextGuruProfileDestination({
          saved: false,
          activeStep: "1",
          intent: "continue",
        }),
        { advance: false },
      );
      assert.deepEqual(
        api.nextGuruProfileDestination({
          saved: true,
          activeStep: "1",
          intent: "continue",
        }),
        { advance: true, href: "/guru/dashboard/profile?step=2" },
      );
      assert.deepEqual(
        api.nextGuruProfileDestination({
          saved: true,
          activeStep: "1",
          intent: "dashboard",
        }),
        { advance: true, href: "/guru/dashboard" },
      );
    });

    it("ignores a repeated submit while the first save is in flight", () => {
      const lock = { current: false };
      assert.equal(api.beginSingleSubmission(lock), true);
      assert.equal(api.beginSingleSubmission(lock), false);
      assert.equal(lock.current, true);
      api.endSingleSubmission(lock);
      assert.equal(api.beginSingleSubmission(lock), true);
    });

    it("hides the raw Postgres not-null error", () => {
      const message = api.friendlyGuruProfileSaveError(
        new Error(
          'null value in column "experience_years" of relation "gurus" violates not-null constraint',
        ),
      );
      assert.equal(message, EXPERIENCE_YEARS_REQUIRED_MESSAGE);
      assert.equal(message.includes("null value"), false);
      assert.equal(message.includes("gurus"), false);

      const other = api.friendlyGuruProfileSaveError(
        new Error('duplicate key value violates unique constraint "gurus_pkey"'),
      );
      assert.equal(other.includes("duplicate key"), false);
      assert.match(other, /couldn't save this step/i);
    });
  });
}
