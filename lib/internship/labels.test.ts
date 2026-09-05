import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatCohortHeadline,
  formatInstitutionLine,
  formatProgramStatLine,
  institutionRelationshipHint,
  institutionRelationshipLabel,
  internshipProgramShortName,
} from "./labels";

describe("internship program naming", () => {
  it("uses Internship Program, not a university-branded title", () => {
    assert.equal(internshipProgramShortName(), "Internship Program");
    assert.equal(internshipProgramShortName().includes("PSU"), false);
    assert.equal(internshipProgramShortName().includes("Penn State"), false);
  });

  it("labels a school as a Student Institution until a SitGuru relationship exists", () => {
    assert.equal(institutionRelationshipLabel(false), "Student Institution");
    assert.equal(institutionRelationshipLabel(true), "University Partner");
    assert.match(institutionRelationshipHint(false), /not a SitGuru University Partner/i);
  });

  it("does not treat Penn State as the program root in roster copy", () => {
    assert.equal(
      formatInstitutionLine({
        universityName: "Penn State University",
        campusName: "Abington",
        displayName: "Penn State Abington",
      }),
      "Penn State Abington",
    );
    assert.equal(
      formatInstitutionLine({
        universityName: "Bucks County Community College",
      }),
      "Bucks County Community College",
    );
  });

  it("builds the cohort dashboard stat line from live counts", () => {
    assert.equal(formatCohortHeadline({ season: "spring", year: 2027 }), "Spring 2027");
    assert.equal(
      formatProgramStatLine({
        universities: 3,
        interns: 4,
        requiredHours: 540,
        projects: 4,
      }),
      "3 Universities • 4 Interns • 540 Required Hours • 4 Active Growth Projects",
    );
  });
});
