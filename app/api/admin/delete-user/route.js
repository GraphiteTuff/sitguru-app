import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPER_USER_EMAILS = new Set([
  "jason@sitguru.com",
  "nette@sitguru.com",
]);

const STORAGE_BUCKETS_TO_CLEAN = ["guru-photos"];

/**
 * These are account/profile/reminder tables that may contain rows tied
 * directly to an Auth user.
 *
 * Missing tables or columns are safely ignored so this route can work
 * across SitGuru environments without breaking.
 *
 * Financial records, completed bookings, messages, and payout history
 * are intentionally not mass-deleted here.
 */
const BEST_EFFORT_CLEANUP_RULES = [
  { table: "signup_reminder_jobs", column: "user_id", value: "userId" },
  { table: "signup_reminder_jobs", column: "email", value: "email" },
  { table: "signup_reminders", column: "user_id", value: "userId" },
  { table: "signup_reminders", column: "email", value: "email" },
  { table: "onboarding_reminders", column: "user_id", value: "userId" },
  { table: "onboarding_reminders", column: "email", value: "email" },
  { table: "notification_queue", column: "user_id", value: "userId" },
  { table: "notification_queue", column: "email", value: "email" },
  { table: "notifications", column: "user_id", value: "userId" },
  { table: "communications_queue", column: "user_id", value: "userId" },
  {
    table: "communications_queue",
    column: "recipient_email",
    value: "email",
  },
  { table: "communication_queue", column: "user_id", value: "userId" },
  {
    table: "communication_queue",
    column: "recipient_email",
    value: "email",
  },
  { table: "ambassador_profiles", column: "user_id", value: "userId" },
  { table: "ambassadors", column: "user_id", value: "userId" },
  { table: "customer_profiles", column: "user_id", value: "userId" },
  { table: "pet_parent_profiles", column: "user_id", value: "userId" },
  { table: "gurus", column: "user_id", value: "userId" },
  { table: "user_roles", column: "user_id", value: "userId" },

  // Keep profiles last because other SitGuru tables may reference it.
  { table: "profiles", column: "id", value: "userId" },
];

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function serializeError(error) {
  if (!error) {
    return null;
  }

  return {
    name: error.name ?? null,
    message: error.message ?? String(error),
    code: error.code ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
    status: error.status ?? error.statusCode ?? null,
  };
}

function secretsMatch(providedSecret, expectedSecret) {
  if (
    typeof providedSecret !== "string" ||
    typeof expectedSecret !== "string" ||
    !providedSecret ||
    !expectedSecret
  ) {
    return false;
  }

  const providedBuffer = Buffer.from(providedSecret);
  const expectedBuffer = Buffer.from(expectedSecret);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

function isMissingDatabaseObjectError(error) {
  const code = String(error?.code ?? "");
  const message = String(error?.message ?? "").toLowerCase();
  const details = String(error?.details ?? "").toLowerCase();

  return (
    code === "42P01" ||
    code === "42703" ||
    code === "PGRST204" ||
    code === "PGRST205" ||
    message.includes("could not find the table") ||
    message.includes("does not exist") ||
    message.includes("schema cache") ||
    details.includes("does not exist")
  );
}

function isMissingStorageBucketError(error) {
  const status = Number(error?.statusCode ?? error?.status ?? 0);
  const message = String(error?.message ?? "").toLowerCase();

  return (
    status === 404 ||
    message.includes("bucket not found") ||
    message.includes("not found")
  );
}

async function getAuthorizedRequester(request, adminSecret) {
  const configuredSecret = process.env.ADMIN_SECRET_KEY;

  if (secretsMatch(adminSecret, configuredSecret)) {
    return {
      authorized: true,
      method: "admin-secret",
      email: null,
    };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        authorized: false,
        method: "session",
        email: null,
        error: serializeError(error),
      };
    }

    const requesterEmail = normalizeEmail(user.email);

    return {
      authorized: SUPER_USER_EMAILS.has(requesterEmail),
      method: "session",
      email: requesterEmail,
      error: null,
    };
  } catch (error) {
    console.error("DELETE USER AUTHORIZATION ERROR:", error);

    return {
      authorized: false,
      method: "session",
      email: null,
      error: serializeError(error),
    };
  }
}

async function findAuthUserByEmail(email) {
  const perPage = 1000;
  const maximumPages = 50;

  for (let page = 1; page <= maximumPages; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(
        `Unable to search Supabase Auth users: ${error.message}`,
      );
    }

    const users = Array.isArray(data?.users) ? data.users : [];

    const matchingUser = users.find(
      (user) => normalizeEmail(user.email) === email,
    );

    if (matchingUser) {
      return matchingUser;
    }

    if (users.length < perPage) {
      break;
    }
  }

  return null;
}

async function collectStorageObjectPaths(bucketName, startingFolder) {
  const collectedPaths = [];
  const foldersToInspect = [startingFolder];
  const inspectedFolders = new Set();

  while (foldersToInspect.length > 0) {
    const currentFolder = foldersToInspect.shift();

    if (!currentFolder || inspectedFolders.has(currentFolder)) {
      continue;
    }

    inspectedFolders.add(currentFolder);

    let offset = 0;
    const limit = 1000;

    while (true) {
      const { data, error } = await supabaseAdmin.storage
        .from(bucketName)
        .list(currentFolder, {
          limit,
          offset,
          sortBy: {
            column: "name",
            order: "asc",
          },
        });

      if (error) {
        if (isMissingStorageBucketError(error)) {
          return {
            bucketMissing: true,
            paths: [],
          };
        }

        throw new Error(
          `Unable to list ${bucketName}/${currentFolder}: ${error.message}`,
        );
      }

      const entries = Array.isArray(data) ? data : [];

      for (const entry of entries) {
        const fullPath = `${currentFolder}/${entry.name}`;

        const appearsToBeFolder =
          entry.id == null &&
          entry.metadata == null &&
          entry.created_at == null &&
          entry.updated_at == null;

        if (appearsToBeFolder) {
          foldersToInspect.push(fullPath);
        } else {
          collectedPaths.push(fullPath);
        }
      }

      if (entries.length < limit) {
        break;
      }

      offset += limit;
    }
  }

  return {
    bucketMissing: false,
    paths: collectedPaths,
  };
}

async function deleteStorageObjectsForUser(userId) {
  const deletedObjects = [];
  const storageWarnings = [];

  for (const bucketName of STORAGE_BUCKETS_TO_CLEAN) {
    try {
      const result = await collectStorageObjectPaths(bucketName, userId);

      if (result.bucketMissing || result.paths.length === 0) {
        continue;
      }

      for (let index = 0; index < result.paths.length; index += 1000) {
        const pathBatch = result.paths.slice(index, index + 1000);

        const { data, error } = await supabaseAdmin.storage
          .from(bucketName)
          .remove(pathBatch);

        if (error) {
          throw new Error(
            `Storage deletion failed in ${bucketName}: ${error.message}`,
          );
        }

        const removedEntries = Array.isArray(data) ? data : [];

        deletedObjects.push(
          ...pathBatch.map((path) => ({
            bucket: bucketName,
            path,
            confirmedByStorageResponse:
              removedEntries.length > 0
                ? removedEntries.some(
                    (entry) =>
                      entry?.name === path ||
                      entry?.name === path.split("/").pop(),
                  )
                : null,
          })),
        );
      }

      const verification = await collectStorageObjectPaths(
        bucketName,
        userId,
      );

      if (!verification.bucketMissing && verification.paths.length > 0) {
        throw new Error(
          `Storage verification failed. ${verification.paths.length} object(s) still remain in ${bucketName}/${userId}.`,
        );
      }
    } catch (error) {
      storageWarnings.push({
        bucket: bucketName,
        error: serializeError(error),
      });
    }
  }

  return {
    deletedObjects,
    storageWarnings,
  };
}

async function runBestEffortDatabaseCleanup(userId, email) {
  const completed = [];
  const warnings = [];

  for (const rule of BEST_EFFORT_CLEANUP_RULES) {
    const comparisonValue =
      rule.value === "email" ? email : userId;

    try {
      const { error } = await supabaseAdmin
        .from(rule.table)
        .delete()
        .eq(rule.column, comparisonValue);

      if (error) {
        if (isMissingDatabaseObjectError(error)) {
          continue;
        }

        warnings.push({
          table: rule.table,
          column: rule.column,
          error: serializeError(error),
        });

        continue;
      }

      completed.push({
        table: rule.table,
        column: rule.column,
      });
    } catch (error) {
      warnings.push({
        table: rule.table,
        column: rule.column,
        error: serializeError(error),
      });
    }
  }

  return {
    completed,
    warnings,
  };
}

export async function DELETE(request) {
  let requestBody;

  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "A valid JSON request body is required.",
      },
      { status: 400 },
    );
  }

  const email = normalizeEmail(requestBody?.email);
  const adminSecret = requestBody?.adminSecret;

  const authorization = await getAuthorizedRequester(
    request,
    adminSecret,
  );

  if (!authorization.authorized) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized access.",
        requester: authorization.email,
        authorizationError: authorization.error,
      },
      { status: 401 },
    );
  }

  if (!email) {
    return NextResponse.json(
      {
        success: false,
        error: "Email parameter is required.",
      },
      { status: 400 },
    );
  }

  if (SUPER_USER_EMAILS.has(email)) {
    return NextResponse.json(
      {
        success: false,
        error: "SitGuru Super User accounts cannot be deleted here.",
      },
      { status: 403 },
    );
  }

  try {
    const authUser = await findAuthUserByEmail(email);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          error: `No Supabase Auth user was found for ${email}.`,
        },
        { status: 404 },
      );
    }

    const userId = authUser.id;

    console.info("SITGURU USER DELETION STARTED:", {
      targetUserId: userId,
      targetEmail: email,
      requestedBy: authorization.email ?? authorization.method,
    });

    const storageCleanup = await deleteStorageObjectsForUser(userId);

    if (storageCleanup.storageWarnings.length > 0) {
      console.error("SITGURU STORAGE CLEANUP FAILED:", {
        targetUserId: userId,
        targetEmail: email,
        warnings: storageCleanup.storageWarnings,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            "The account was not deleted because one or more owned Storage objects could not be removed.",
          stage: "storage-cleanup",
          target: {
            userId,
            email,
          },
          deletedStorageObjects:
            storageCleanup.deletedObjects,
          storageErrors:
            storageCleanup.storageWarnings,
        },
        { status: 409 },
      );
    }

    const databaseCleanup = await runBestEffortDatabaseCleanup(
      userId,
      email,
    );

    const { data: deletedAuthUser, error: authDeleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId, false);

    if (authDeleteError) {
      console.error("SITGURU AUTH USER DELETION FAILED:", {
        targetUserId: userId,
        targetEmail: email,
        error: serializeError(authDeleteError),
        databaseWarnings: databaseCleanup.warnings,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            "Storage was cleaned, but Supabase Auth could not delete the user. A remaining database relationship may still be blocking deletion.",
          stage: "auth-user-deletion",
          target: {
            userId,
            email,
          },
          authError: serializeError(authDeleteError),
          deletedStorageObjects:
            storageCleanup.deletedObjects,
          databaseCleanupCompleted:
            databaseCleanup.completed,
          databaseCleanupWarnings:
            databaseCleanup.warnings,
        },
        { status: 409 },
      );
    }

    console.info("SITGURU USER DELETION COMPLETED:", {
      targetUserId: userId,
      targetEmail: email,
      requestedBy: authorization.email ?? authorization.method,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${email} from SitGuru.`,
      deletedUser: {
        id: deletedAuthUser?.user?.id ?? userId,
        email,
      },
      deletedStorageObjects:
        storageCleanup.deletedObjects,
      databaseCleanupCompleted:
        databaseCleanup.completed,
      databaseCleanupWarnings:
        databaseCleanup.warnings,
    });
  } catch (error) {
    console.error("SITGURU DELETE USER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "The SitGuru user deletion process failed.",
        details: serializeError(error),
      },
      { status: 500 },
    );
  }
}