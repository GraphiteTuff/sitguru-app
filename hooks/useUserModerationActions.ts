"use client";

import { useCallback, useMemo, useOptimistic, useState, useTransition } from "react";
import { supabase } from "@/lib/supabase";
import {
  ADMIN_DEPARTMENT_ACTIONS,
  ADMIN_INTERNAL_MESSAGE_ACTION,
  MODERATION_PIPELINE_ACTIONS,
  asActionString,
  buildDepartmentComposeHref,
  buildFraudTrustHref,
  buildGuruApprovalsHref,
  buildInternalComposeHref,
  buildMessageCenterHref,
  buildModerationHref,
  normalizeDirectoryUser,
  type AdminDepartmentKey,
  type DirectoryUserContext,
} from "@/lib/admin/user-directory-actions";

export type UserModerationActionsOptions = {
  selectedUser?: DirectoryUserContext | null;
  onNavigating?: (href: string) => void;
};

export type TrustReviewMode = "open" | "flag_suspend";

export type ActionFeedbackStatus = "idle" | "pending" | "success" | "error";

export type ActionFeedback = {
  key: string | null;
  status: ActionFeedbackStatus;
  message: string | null;
};

const IDLE_FEEDBACK: ActionFeedback = {
  key: null,
  status: "idle",
  message: null,
};

async function getAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;
  if (!session?.access_token) {
    throw new Error("Please log in as an admin.");
  }

  return session.access_token;
}

function navigate(href: string, onNavigating?: (href: string) => void) {
  onNavigating?.(href);
  if (typeof window !== "undefined") {
    window.location.assign(href);
  }
}

/**
 * Unified Communication + Moderation handlers for Admin User Directory.
 * Clicks paint pending/success feedback immediately via useOptimistic.
 */
export function useUserModerationActions(
  options: UserModerationActionsOptions = {},
) {
  const selectedUser = useMemo(
    () => normalizeDirectoryUser(options.selectedUser),
    [
      options.selectedUser?.id,
      options.selectedUser?.email,
      options.selectedUser?.name,
      options.selectedUser?.role,
      options.selectedUser?.source,
    ],
  );

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<ActionFeedback>(IDLE_FEEDBACK);
  const [optimisticFeedback, setOptimisticFeedback] = useOptimistic(
    feedback,
    (_current, next: ActionFeedback) => next,
  );
  const [trustOverlayOpen, setTrustOverlayOpen] = useState(false);

  const pendingKey = optimisticFeedback.key;
  const busy =
    isPending ||
    optimisticFeedback.status === "pending" ||
    optimisticFeedback.status === "success";

  const runOptimistic = useCallback(
    (next: ActionFeedback, work: () => void | Promise<void>) => {
      startTransition(() => {
        setOptimisticFeedback(next);
        setFeedback(next);
        void Promise.resolve(work()).catch(() => {
          // work() handlers manage their own error UI / navigation
        });
      });
    },
    [setOptimisticFeedback],
  );

  const startConversation = useCallback(
    (params: {
      key: string;
      department?: AdminDepartmentKey | string | null;
      departmentLabel?: string | null;
      threadType?: string | null;
      fallbackHref: string;
      optimisticMessage: string;
    }) => {
      if (busy) return;

      runOptimistic(
        {
          key: params.key,
          status: "pending",
          message: params.optimisticMessage,
        },
        async () => {
          try {
            const token = await getAccessToken();
            const response = await fetch("/api/admin/messages/start", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                department: params.department || null,
                departmentLabel: params.departmentLabel || null,
                threadType: params.threadType || null,
                source: "admin_users_directory",
                user: selectedUser,
              }),
              cache: "no-store",
            });

            const payload = (await response.json().catch(() => null)) as {
              ok?: boolean;
              href?: string;
              error?: string;
              created?: boolean;
            } | null;

            if (!response.ok || !payload?.ok || !payload.href) {
              throw new Error(payload?.error || "Unable to start conversation.");
            }

            const success: ActionFeedback = {
              key: params.key,
              status: "success",
              message: payload.created
                ? "Conversation ready. Opening thread…"
                : "Thread found. Opening…",
            };
            setFeedback(success);
            navigate(payload.href, options.onNavigating);
          } catch (err) {
            const message =
              err instanceof Error
                ? err.message
                : "Unable to start conversation.";
            setFeedback({
              key: params.key,
              status: "success",
              message: `${message} Opening compose fallback…`,
            });
            navigate(params.fallbackHref, options.onNavigating);
          }
        },
      );
    },
    [busy, options.onNavigating, runOptimistic, selectedUser],
  );

  const startInternalMessage = useCallback(() => {
    startConversation({
      key: "internal",
      threadType: "internal",
      fallbackHref: buildInternalComposeHref(selectedUser),
      optimisticMessage: selectedUser
        ? `Opening internal thread for ${selectedUser.name || selectedUser.email || "user"}…`
        : "Opening internal staff thread…",
    });
  }, [selectedUser, startConversation]);

  const messageDepartment = useCallback(
    (department: AdminDepartmentKey | string) => {
      const key = asActionString(department) || "department";
      const meta = ADMIN_DEPARTMENT_ACTIONS.find((item) => item.key === key);
      const label = meta?.label || "Department";

      startConversation({
        key: `department:${key}`,
        department: key,
        departmentLabel: label,
        threadType: "internal_department",
        fallbackHref: buildDepartmentComposeHref({
          department: key,
          departmentLabel: label,
          user: selectedUser,
        }),
        optimisticMessage: selectedUser
          ? `Messaging ${label} about ${selectedUser.name || selectedUser.email || "user"}…`
          : `Opening ${label} thread…`,
      });
    },
    [selectedUser, startConversation],
  );

  const openGuruApprovals = useCallback(() => {
    if (busy) return;
    runOptimistic(
      {
        key: "guru_approvals",
        status: "pending",
        message: "Opening Guru approvals…",
      },
      () => {
        setFeedback({
          key: "guru_approvals",
          status: "success",
          message: "Opening Guru approvals…",
        });
        navigate(buildGuruApprovalsHref(selectedUser), options.onNavigating);
      },
    );
  }, [busy, options.onNavigating, runOptimistic, selectedUser]);

  const openMessageCenter = useCallback(() => {
    if (busy) return;
    runOptimistic(
      {
        key: "message_center",
        status: "pending",
        message: "Opening Message Center…",
      },
      () => {
        setFeedback({
          key: "message_center",
          status: "success",
          message: "Opening Message Center…",
        });
        navigate(buildMessageCenterHref(selectedUser), options.onNavigating);
      },
    );
  }, [busy, options.onNavigating, runOptimistic, selectedUser]);

  const openFraudTrustReview = useCallback(() => {
    if (busy) return;

    if (selectedUser?.id) {
      runOptimistic(
        {
          key: "fraud_trust_review",
          status: "pending",
          message: "Preparing secure trust review…",
        },
        () => {
          setTrustOverlayOpen(true);
          setFeedback({
            key: "fraud_trust_review",
            status: "success",
            message: "Trust review ready — choose an action.",
          });
        },
      );
      return;
    }

    runOptimistic(
      {
        key: "fraud_trust_review",
        status: "pending",
        message: "Opening Fraud Detection…",
      },
      () => {
        setFeedback({
          key: "fraud_trust_review",
          status: "success",
          message: "Opening Fraud Detection…",
        });
        navigate(buildFraudTrustHref(null), options.onNavigating);
      },
    );
  }, [busy, options.onNavigating, runOptimistic, selectedUser]);

  const closeTrustOverlay = useCallback(() => {
    setTrustOverlayOpen(false);
    setFeedback(IDLE_FEEDBACK);
  }, []);

  const confirmTrustReview = useCallback(
    (mode: TrustReviewMode, reason?: string) => {
      if (
        busy &&
        !pendingKey?.startsWith("trust:") &&
        pendingKey !== "fraud_trust_review"
      ) {
        return;
      }

      const key = `trust:${mode}`;

      runOptimistic(
        {
          key,
          status: "pending",
          message:
            mode === "flag_suspend"
              ? "Flagging account for trust review…"
              : "Opening secure moderation context…",
        },
        async () => {
          try {
            const token = await getAccessToken();
            const response = await fetch("/api/admin/users/trust-review", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: mode,
                reason:
                  asActionString(reason) ||
                  "Fraud / trust review from Admin User Directory.",
                user: selectedUser,
              }),
              cache: "no-store",
            });

            const payload = (await response.json().catch(() => null)) as {
              ok?: boolean;
              href?: string;
              moderationHref?: string;
              fraudHref?: string;
              error?: string;
              mutated?: boolean;
            } | null;

            if (!response.ok || !payload?.ok) {
              throw new Error(payload?.error || "Unable to open trust review.");
            }

            setTrustOverlayOpen(false);
            setFeedback({
              key,
              status: "success",
              message: payload.mutated
                ? "Account flagged. Opening moderation…"
                : "Opening moderation…",
            });

            navigate(
              payload.href ||
                payload.moderationHref ||
                buildModerationHref(selectedUser),
              options.onNavigating,
            );
          } catch (err) {
            const message =
              err instanceof Error
                ? err.message
                : "Unable to open trust review.";
            setFeedback({
              key,
              status: "error",
              message: `${message} Opening Fraud Detection…`,
            });
            setTrustOverlayOpen(false);
            navigate(buildFraudTrustHref(selectedUser), options.onNavigating);
          }
        },
      );
    },
    [
      busy,
      options.onNavigating,
      pendingKey,
      runOptimistic,
      selectedUser,
    ],
  );

  return {
    selectedUser,
    pendingKey,
    busy,
    feedback: optimisticFeedback,
    error:
      optimisticFeedback.status === "error" ? optimisticFeedback.message : null,
    lastMessage:
      optimisticFeedback.status === "pending" ||
      optimisticFeedback.status === "success"
        ? optimisticFeedback.message
        : null,
    trustOverlayOpen,
    departmentActions: ADMIN_DEPARTMENT_ACTIONS,
    internalAction: ADMIN_INTERNAL_MESSAGE_ACTION,
    moderationActions: MODERATION_PIPELINE_ACTIONS,
    startInternalMessage,
    messageDepartment,
    openGuruApprovals,
    openMessageCenter,
    openFraudTrustReview,
    closeTrustOverlay,
    confirmTrustReview,
    clearError: () => setFeedback(IDLE_FEEDBACK),
  };
}

export type UseUserModerationActionsResult = ReturnType<
  typeof useUserModerationActions
>;
