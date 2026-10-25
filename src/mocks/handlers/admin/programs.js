import { bylawCreditBreakdown, PROGRAM_DEGREE, trackExtras } from "../../data/admin/program-extras";
import { electivePools, planTemplates } from "../../data/admin/study-plans";
import { students } from "../../data/people";
import { bylaws, programs, tracks } from "../../data/reference";
import { mockError } from "../../errors";
import { requireRole } from "../../session";
import { findOr404, listResponse, nextId, now, requireFields } from "../../utils";

/**
 * Admin "Programs & tracks": program rows with their tracks nested, a flat track catalog,
 * writes for both, and the per-bylaw charter comparison.
 *
 * PROPOSAL for the backend team: these admin endpoints are not in docs/api-contract.md.
 * program/track columns follow database-design.md. Extras that are NOT schema columns
 * (see data/admin/program-extras.js): degree (bsc), track status (active | inactive | planned),
 * track description, and the per-bylaw credit breakdown (unverified placeholder).
 * Derived fields: bylaw_code, graduation_credits (from the bylaw), student_count,
 * plan_template_count, elective_pool_count, track_count, active_track_count.
 */

const TRACK_STATUSES = ["active", "inactive", "planned"];

const findBylaw = (id) => bylaws.find((bylaw) => bylaw.id === Number(id));
const normalizeCode = (code) => String(code ?? "").trim();

function validationError(message, fields) {
  return mockError(400, "VALIDATION_ERROR", message, { fields });
}

function toTrackRow(track) {
  const program = programs.find((item) => item.id === track.program_id);
  const bylaw = findBylaw(program.bylaw_id);
  const extras = trackExtras[track.id] ?? { status: "active", description: null };
  return {
    ...track,
    status: extras.status,
    description: extras.description,
    program_code: program.code,
    program_name: program.name,
    degree: PROGRAM_DEGREE[program.code] ?? null,
    bylaw_id: bylaw.id,
    bylaw_code: bylaw.code,
    graduation_credits: bylaw.graduation_credits,
    student_count: students.filter((student) => student.track_id === track.id).length,
    plan_template_count: planTemplates.filter((plan) => plan.track_id === track.id).length,
    elective_pool_count: electivePools.filter((pool) => pool.track_id === track.id).length,
  };
}

function toProgramRow(program) {
  const bylaw = findBylaw(program.bylaw_id);
  const own = tracks.filter((track) => track.program_id === program.id).map(toTrackRow);
  return {
    ...program,
    degree: PROGRAM_DEGREE[program.code] ?? null,
    bylaw_code: bylaw.code,
    graduation_credits: bylaw.graduation_credits,
    track_count: own.length,
    active_track_count: own.filter((track) => track.status === "active").length,
    student_count: students.filter((student) => student.program_id === program.id).length,
    // Students in the program with no track yet (e.g. first-year 2025 cohort).
    students_without_track: students.filter(
      (student) => student.program_id === program.id && student.track_id === null,
    ).length,
    tracks: own,
  };
}

function validateTrackExtras(body) {
  if (body.status !== undefined && !TRACK_STATUSES.includes(body.status)) {
    throw validationError("Unknown track status.", { status: "invalid" });
  }
}

export default [
  {
    method: "GET",
    path: "/admin/programs/summary",
    handler: () => {
      requireRole("admin");
      const trackRows = tracks.map(toTrackRow);
      return {
        programs: programs.length,
        // "Canonical degrees": old and 2025 CS are one degree under two charters.
        degree_programs: new Set(programs.map((program) => program.code)).size,
        tracks: {
          total: trackRows.length,
          active: trackRows.filter((track) => track.status === "active").length,
          planned: trackRows.filter((track) => track.status === "planned").length,
          inactive: trackRows.filter((track) => track.status === "inactive").length,
        },
        bylaws: bylaws.length,
        // "Charter architecture comparison": one entry per bylaw.
        charters: bylaws.map((bylaw) => {
          const breakdown = bylawCreditBreakdown[bylaw.id] ?? null;
          const programIds = programs
            .filter((program) => program.bylaw_id === bylaw.id)
            .map((program) => program.id);
          return {
            bylaw_id: bylaw.id,
            bylaw_code: bylaw.code,
            status: bylaw.status,
            effective_from_cohort: bylaw.effective_from_cohort,
            graduation_credits: bylaw.graduation_credits,
            phase_out_cohort: breakdown?.phase_out_cohort ?? null,
            program_codes: programs
              .filter((program) => program.bylaw_id === bylaw.id)
              .map((program) => program.code),
            track_codes: tracks
              .filter((track) => programIds.includes(track.program_id))
              .map((track) => track.code),
            credit_breakdown: breakdown
              ? {
                  verified: breakdown.verified,
                  source_reference: breakdown.source_reference,
                  categories: breakdown.categories,
                }
              : null,
          };
        }),
      };
    },
  },
  {
    method: "GET",
    path: "/admin/programs",
    handler: ({ query }) => {
      requireRole("admin");
      return listResponse(programs.map(toProgramRow), query, {
        searchFields: ["code", "name"],
        filters: ["bylaw_id", "degree"],
        defaultSort: "id",
      });
    },
  },
  {
    method: "GET",
    path: "/admin/programs/:id",
    handler: ({ params }) => {
      requireRole("admin");
      return toProgramRow(findOr404(programs, params.id, "Program"));
    },
  },
  {
    method: "POST",
    path: "/admin/programs",
    handler: ({ body = {} }) => {
      requireRole("admin");
      requireFields(body, ["bylaw_id", "code", "name", "source_reference"]);
      if (!findBylaw(body.bylaw_id))
        throw validationError("Unknown bylaw.", { bylaw_id: "invalid" });
      const code = normalizeCode(body.code).toUpperCase();
      if (!code) throw validationError("Code is required.", { code: "required" });
      if (programs.some((row) => row.bylaw_id === Number(body.bylaw_id) && row.code === code)) {
        throw mockError(
          409,
          "PROGRAM_CODE_TAKEN",
          "This bylaw already has a program with this code.",
          {
            fields: { code: "taken" },
          },
        );
      }
      const program = {
        id: nextId(programs),
        bylaw_id: Number(body.bylaw_id),
        code,
        name: String(body.name).trim(),
        source_reference: String(body.source_reference).trim(),
        created_at: now(),
        updated_at: now(),
      };
      programs.push(program);
      return toProgramRow(program);
    },
  },
  {
    method: "PATCH",
    path: "/admin/programs/:id",
    handler: ({ params, body = {} }) => {
      requireRole("admin");
      const program = findOr404(programs, params.id, "Program");
      if (body.bylaw_id !== undefined && Number(body.bylaw_id) !== program.bylaw_id) {
        throw mockError(409, "BYLAW_IMMUTABLE", "A program belongs to exactly one bylaw.", {
          fields: { bylaw_id: "immutable" },
        });
      }
      if (body.code !== undefined) {
        const code = normalizeCode(body.code).toUpperCase();
        if (!code) throw validationError("Code is required.", { code: "required" });
        const taken = programs.some(
          (row) => row.bylaw_id === program.bylaw_id && row.code === code && row.id !== program.id,
        );
        if (taken) {
          throw mockError(
            409,
            "PROGRAM_CODE_TAKEN",
            "This bylaw already has a program with this code.",
            {
              fields: { code: "taken" },
            },
          );
        }
        program.code = code;
      }
      if (body.name !== undefined) {
        if (!String(body.name).trim())
          throw validationError("Name is required.", { name: "required" });
        program.name = String(body.name).trim();
      }
      if (body.source_reference !== undefined)
        program.source_reference = String(body.source_reference).trim();
      program.updated_at = now();
      return toProgramRow(program);
    },
  },
  {
    method: "GET",
    path: "/admin/tracks",
    handler: ({ query }) => {
      requireRole("admin");
      return listResponse(tracks.map(toTrackRow), query, {
        searchFields: ["code", "name", "description", "program_name"],
        filters: ["bylaw_id", "program_id", "status"],
        defaultSort: "id",
      });
    },
  },
  {
    method: "POST",
    path: "/admin/programs/:id/tracks",
    handler: ({ params, body = {} }) => {
      requireRole("admin");
      const program = findOr404(programs, params.id, "Program");
      requireFields(body, ["code", "name", "source_reference"]);
      validateTrackExtras(body);
      const code = normalizeCode(body.code).toLowerCase();
      if (!code) throw validationError("Code is required.", { code: "required" });
      if (tracks.some((row) => row.program_id === program.id && row.code === code)) {
        throw mockError(
          409,
          "TRACK_CODE_TAKEN",
          "This program already has a track with this code.",
          {
            fields: { code: "taken" },
          },
        );
      }
      const track = {
        id: nextId(tracks),
        program_id: program.id,
        code,
        name: String(body.name).trim(),
        source_reference: String(body.source_reference).trim(),
        created_at: now(),
        updated_at: now(),
      };
      tracks.push(track);
      trackExtras[track.id] = {
        status: body.status ?? "planned",
        description: body.description?.trim() || null,
      };
      return toTrackRow(track);
    },
  },
  {
    method: "PATCH",
    path: "/admin/tracks/:id",
    handler: ({ params, body = {} }) => {
      requireRole("admin");
      const track = findOr404(tracks, params.id, "Track");
      if (body.program_id !== undefined && Number(body.program_id) !== track.program_id) {
        throw mockError(409, "PROGRAM_IMMUTABLE", "A track belongs to exactly one program.", {
          fields: { program_id: "immutable" },
        });
      }
      validateTrackExtras(body);
      if (body.code !== undefined) {
        const code = normalizeCode(body.code).toLowerCase();
        if (!code) throw validationError("Code is required.", { code: "required" });
        const taken = tracks.some(
          (row) => row.program_id === track.program_id && row.code === code && row.id !== track.id,
        );
        if (taken) {
          throw mockError(
            409,
            "TRACK_CODE_TAKEN",
            "This program already has a track with this code.",
            {
              fields: { code: "taken" },
            },
          );
        }
        track.code = code;
      }
      if (body.name !== undefined) {
        if (!String(body.name).trim())
          throw validationError("Name is required.", { name: "required" });
        track.name = String(body.name).trim();
      }
      if (body.source_reference !== undefined)
        track.source_reference = String(body.source_reference).trim();
      const extras = (trackExtras[track.id] ??= { status: "active", description: null });
      if (body.status !== undefined) extras.status = body.status;
      if (body.description !== undefined) extras.description = body.description?.trim() || null;
      track.updated_at = now();
      return toTrackRow(track);
    },
  },
];
