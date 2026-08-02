/**
 * Rogue admin tool-calling registry.
 *
 * Exposes read-only, paginated database query tools for the admin Rogue
 * agent loop. SERVER ONLY — do not import from client components.
 *
 * Re-exported from `admin-reporting.ts` so the reporting module remains
 * the documented registration surface.
 */

import { tool } from "ai";
import { z } from "zod";
import {
  compileAdminReportingSnapshot,
  fetchFinancialLedger,
  getGuruDetails,
  getPetParentDetails,
  listAmbassadors,
  listAuditLogs,
  listBookings,
  listGurus,
  listMessages,
  listPayouts,
  listPetParents,
  searchAdminDomain,
  type AdminReportModuleId,
  type ReportPeriod,
} from "@/lib/actions/admin-reporting";

const periodSchema = z
  .enum(["daily", "weekly", "monthly", "yearly"])
  .optional()
  .describe("Reporting window relative to now");

const pageSchema = z
  .number()
  .int()
  .min(1)
  .max(50)
  .optional()
  .describe("1-based page index (default 1)");

const pageSizeSchema = z
  .number()
  .int()
  .min(1)
  .max(25)
  .optional()
  .describe("Rows per page (default 10, max 25)");

export type AdminRogueToolOptions = {
  canAccessFinancials?: boolean;
  defaultPeriod?: ReportPeriod;
};

/**
 * Build the AI SDK tool map Rogue can call during a multi-step turn.
 * Finance tools soft-deny when `canAccessFinancials` is false.
 */
export function buildAdminRogueTools(opts: AdminRogueToolOptions = {}) {
  const canAccessFinancials = opts.canAccessFinancials !== false;
  const defaultPeriod = opts.defaultPeriod || "daily";

  return {
    compileAdminReport: tool({
      description:
        "Compile a defensive aggregate admin snapshot across SitGuru admin modules (operations, growth, financials, audit). Use for Daily Sync, Weekly Financials, Growth Analytics, System Audit chips, executive summaries, and any ask for cross-module KPIs. Prefer this before inventing numbers.",
      parameters: z.object({
        period: periodSchema,
        preset: z
          .string()
          .optional()
          .describe(
            "Optional chip preset: daily_sync | weekly_financials | growth_analytics | system_audit | full_scan",
          ),
        query: z
          .string()
          .optional()
          .describe("Free-text topic used to pick relevant modules"),
        modules: z
          .array(z.string())
          .optional()
          .describe(
            "Optional explicit module ids (e.g. bookings, gurus, financial_overview, payouts)",
          ),
      }),
      execute: async (params) => {
        try {
          const snapshot = await compileAdminReportingSnapshot({
            period: (params?.period as ReportPeriod | undefined) || defaultPeriod,
            preset: params?.preset || null,
            query: params?.query || "",
            modules: Array.isArray(params?.modules)
              ? (params.modules.filter(Boolean) as AdminReportModuleId[])
              : undefined,
          });
          return {
            ok: true,
            period: snapshot?.period ?? defaultPeriod,
            periodLabel: snapshot?.periodLabel ?? defaultPeriod,
            selectedModules: snapshot?.selectedModules ?? [],
            markdown: String(snapshot?.markdownContext || "").slice(0, 14000),
            moduleCount: snapshot?.modules?.length ?? 0,
          };
        } catch (error) {
          return {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to compile admin report",
          };
        }
      },
    }),

    listGurus: tool({
      description:
        "List live Guru (sitter/provider) records with optional text filter, status, city/state, and pagination. Use when the admin asks for Guru names, emails, bookable providers, or a Guru directory listing.",
      parameters: z.object({
        filter: z
          .string()
          .optional()
          .describe("Search name, email, city, or id fragment"),
        status: z
          .string()
          .optional()
          .describe("Status filter e.g. active, approved, pending, bookable"),
        city: z.string().optional(),
        state: z.string().optional(),
        page: pageSchema,
        pageSize: pageSizeSchema,
      }),
      execute: async (params) => {
        try {
          return await listGurus({
            filter: params?.filter,
            status: params?.status,
            city: params?.city,
            state: params?.state,
            page: params?.page,
            pageSize: params?.pageSize,
          });
        } catch (error) {
          return {
            ok: false,
            rows: [],
            page: 1,
            pageSize: 10,
            total: 0,
            hasMore: false,
            message:
              error instanceof Error ? error.message : "listGurus failed",
          };
        }
      },
    }),

    getGuruDetails: tool({
      description:
        "Fetch a single Guru by id, profile id, email, or name fragment for a deep drill-down.",
      parameters: z.object({
        id: z
          .string()
          .describe("Guru id, user id, profile id, email, or name fragment"),
      }),
      execute: async (params) => {
        try {
          return await getGuruDetails(String(params?.id || ""));
        } catch (error) {
          return {
            ok: false,
            row: null,
            message:
              error instanceof Error ? error.message : "getGuruDetails failed",
          };
        }
      },
    }),

    listPetParents: tool({
      description:
        "List Pet Parent / customer records with search + pagination. Use for parent directories, emails, and account lists.",
      parameters: z.object({
        filter: z
          .string()
          .optional()
          .describe("Search name, email, city, or id"),
        page: pageSchema,
        pageSize: pageSizeSchema,
      }),
      execute: async (params) => {
        try {
          return await listPetParents({
            filter: params?.filter,
            page: params?.page,
            pageSize: params?.pageSize,
          });
        } catch (error) {
          return {
            ok: false,
            rows: [],
            page: 1,
            pageSize: 10,
            total: 0,
            hasMore: false,
            message:
              error instanceof Error
                ? error.message
                : "listPetParents failed",
          };
        }
      },
    }),

    getPetParentDetails: tool({
      description:
        "Fetch a single Pet Parent by id, profile id, or email for drill-down details.",
      parameters: z.object({
        id: z.string().describe("Pet parent / profile / user id or email"),
      }),
      execute: async (params) => {
        try {
          return await getPetParentDetails(String(params?.id || ""));
        } catch (error) {
          return {
            ok: false,
            row: null,
            message:
              error instanceof Error
                ? error.message
                : "getPetParentDetails failed",
          };
        }
      },
    }),

    listBookings: tool({
      description:
        "List booking rows with optional status/text filter and period window. Use for booking queues, cancellations, and service drill-downs.",
      parameters: z.object({
        filter: z.string().optional(),
        status: z.string().optional(),
        period: periodSchema,
        page: pageSchema,
        pageSize: pageSizeSchema,
      }),
      execute: async (params) => {
        try {
          return await listBookings({
            filter: params?.filter,
            status: params?.status,
            period:
              (params?.period as ReportPeriod | undefined) || defaultPeriod,
            page: params?.page,
            pageSize: params?.pageSize,
          });
        } catch (error) {
          return {
            ok: false,
            rows: [],
            page: 1,
            pageSize: 10,
            total: 0,
            hasMore: false,
            message:
              error instanceof Error ? error.message : "listBookings failed",
          };
        }
      },
    }),

    listAmbassadors: tool({
      description:
        "List ambassador / referral partner records with search + pagination.",
      parameters: z.object({
        filter: z.string().optional(),
        status: z.string().optional(),
        page: pageSchema,
        pageSize: pageSizeSchema,
      }),
      execute: async (params) => {
        try {
          return await listAmbassadors({
            filter: params?.filter,
            status: params?.status,
            page: params?.page,
            pageSize: params?.pageSize,
          });
        } catch (error) {
          return {
            ok: false,
            rows: [],
            page: 1,
            pageSize: 10,
            total: 0,
            hasMore: false,
            message:
              error instanceof Error
                ? error.message
                : "listAmbassadors failed",
          };
        }
      },
    }),

    listPayouts: tool({
      description:
        "List guru/partner payout rows (pending, paid, scheduled) with pagination. Requires finance-capable admin context when gated.",
      parameters: z.object({
        status: z
          .string()
          .optional()
          .describe("pending | processing | paid | scheduled | etc."),
        period: periodSchema,
        page: pageSchema,
        pageSize: pageSizeSchema,
      }),
      execute: async (params) => {
        try {
          if (!canAccessFinancials) {
            return {
              ok: false,
              rows: [],
              page: 1,
              pageSize: 10,
              total: 0,
              hasMore: false,
              message: "Finance access required for payouts.",
            };
          }
          return await listPayouts({
            status: params?.status,
            period:
              (params?.period as ReportPeriod | undefined) || defaultPeriod,
            page: params?.page,
            pageSize: params?.pageSize,
          });
        } catch (error) {
          return {
            ok: false,
            rows: [],
            page: 1,
            pageSize: 10,
            total: 0,
            hasMore: false,
            message:
              error instanceof Error ? error.message : "listPayouts failed",
          };
        }
      },
    }),

    fetchFinancialLedger: tool({
      description:
        "Fetch paginated payment / ledger rows (prefers booking_payments) for a timeframe. Use for GMV drill-downs, Stripe volume lines, fee samples, and cash movement detail. Finance access required.",
      parameters: z.object({
        timeframe: periodSchema.describe(
          "daily | weekly | monthly | yearly window",
        ),
        status: z.string().optional(),
        page: pageSchema,
        pageSize: pageSizeSchema,
      }),
      execute: async (params) => {
        try {
          if (!canAccessFinancials) {
            return {
              ok: false,
              rows: [],
              page: 1,
              pageSize: 10,
              total: 0,
              hasMore: false,
              message: "Finance access required for ledger reads.",
            };
          }
          return await fetchFinancialLedger({
            timeframe:
              (params?.timeframe as ReportPeriod | undefined) || defaultPeriod,
            status: params?.status,
            page: params?.page,
            pageSize: params?.pageSize,
          });
        } catch (error) {
          return {
            ok: false,
            rows: [],
            page: 1,
            pageSize: 10,
            total: 0,
            hasMore: false,
            message:
              error instanceof Error
                ? error.message
                : "fetchFinancialLedger failed",
          };
        }
      },
    }),

    listAuditLogs: tool({
      description:
        "List recent admin / financial / analytics audit log rows with optional text filter and pagination.",
      parameters: z.object({
        filter: z.string().optional(),
        source: z
          .enum(["admin", "financial", "analytics", "all"])
          .optional()
          .describe("Which audit source to prefer"),
        page: pageSchema,
        pageSize: pageSizeSchema,
      }),
      execute: async (params) => {
        try {
          return await listAuditLogs({
            filter: params?.filter,
            source: params?.source || "all",
            canAccessFinancials,
            page: params?.page,
            pageSize: params?.pageSize,
          });
        } catch (error) {
          return {
            ok: false,
            rows: [],
            page: 1,
            pageSize: 10,
            total: 0,
            hasMore: false,
            message:
              error instanceof Error ? error.message : "listAuditLogs failed",
          };
        }
      },
    }),

    listMessages: tool({
      description:
        "Sample recent message / conversation activity with pagination for ops triage.",
      parameters: z.object({
        filter: z.string().optional(),
        period: periodSchema,
        page: pageSchema,
        pageSize: pageSizeSchema,
      }),
      execute: async (params) => {
        try {
          return await listMessages({
            filter: params?.filter,
            period:
              (params?.period as ReportPeriod | undefined) || defaultPeriod,
            page: params?.page,
            pageSize: params?.pageSize,
          });
        } catch (error) {
          return {
            ok: false,
            rows: [],
            page: 1,
            pageSize: 10,
            total: 0,
            hasMore: false,
            message:
              error instanceof Error ? error.message : "listMessages failed",
          };
        }
      },
    }),

    searchAdminDomain: tool({
      description:
        "Generic domain search across admin tables (gurus, pet_parents, bookings, ambassadors, payouts, payments, messages, audit). Use when the ask spans multiple tables or the domain is unclear.",
      parameters: z.object({
        domain: z
          .enum([
            "gurus",
            "pet_parents",
            "bookings",
            "ambassadors",
            "payouts",
            "payments",
            "messages",
            "audit",
          ])
          .describe("Admin domain to search"),
        filter: z.string().optional(),
        period: periodSchema,
        page: pageSchema,
        pageSize: pageSizeSchema,
      }),
      execute: async (params) => {
        try {
          return await searchAdminDomain({
            domain: params?.domain || "gurus",
            filter: params?.filter,
            period:
              (params?.period as ReportPeriod | undefined) || defaultPeriod,
            canAccessFinancials,
            page: params?.page,
            pageSize: params?.pageSize,
          });
        } catch (error) {
          return {
            ok: false,
            rows: [],
            page: 1,
            pageSize: 10,
            total: 0,
            hasMore: false,
            message:
              error instanceof Error
                ? error.message
                : "searchAdminDomain failed",
          };
        }
      },
    }),
  };
}

export type AdminRogueTools = ReturnType<typeof buildAdminRogueTools>;
