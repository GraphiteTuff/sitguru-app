// app/api/chat/ai-assist/route.ts
/**
 * SitGuru AI concierge — Claude (Anthropic) with optional SSE streaming.
 * Injects /help catalog into the system prompt and honors AI_ASSIST_ENABLED rooms.
 *
 * Cookie rule: `cookies()` is resolved at the absolute entry of POST, then the
 * store is passed into createClientFromCookieStore — never from inside streams.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createClientFromCookieStore,
} from "@/lib/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import {
  isSitGuruAiConfigured,
  completeSitGuruAiReply,
  streamSitGuruAiReply,
  getSitGuruAiModel,
} from "@/lib/messaging/ai-engine";
import {
  loadConversationAiState,
  maybeHandoffFromUserMessage,
  insertAiMessage,
  runAiAssistIfEnabled,
} from "@/lib/messaging/conversation-ai";
import { evaluateHandoffNeed } from "@/lib/messaging/handoff";
import { buildSitGuruAiSystemPrompt } from "@/lib/messaging/help-context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sseEncode(data: Record<string, unknown>) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

async function resolveUserFromBearer(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const bearer = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
  if (!bearer) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(bearer);
  if (error || !data.user) return null;
  return data.user;
}

async function assertConversationAccess(params: {
  conversationId: string;
  userId: string | null;
  allowPublic: boolean;
}) {
  const state = await loadConversationAiState(params.conversationId);
  if (!state) {
    return { ok: false as const, status: 404, error: "Conversation not found." };
  }
  if (!state.aiAssistEnabled) {
    return {
      ok: false as const,
      status: 409,
      error: "AI assist is disabled for this conversation (human takeover).",
      state,
    };
  }

  if (!params.userId) {
    if (params.allowPublic) return { ok: true as const, state };
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  const { data: participant } = await supabaseAdmin
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", params.conversationId)
    .eq("user_id", params.userId)
    .maybeSingle();

  const { data: conv } = await supabaseAdmin
    .from("conversations")
    .select("customer_id,guru_id,started_by_user_id")
    .eq("id", params.conversationId)
    .maybeSingle();

  const convRow = (conv || {}) as Record<string, unknown>;
  const isMember =
    Boolean(participant) ||
    [convRow.customer_id, convRow.guru_id, convRow.started_by_user_id]
      .map((v) => String(v || ""))
      .includes(params.userId);

  if (!isMember) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", params.userId)
      .maybeSingle();
    const role = String(
      (profile as { role?: string } | null)?.role || "",
    ).toLowerCase();
    if (role !== "admin") {
      return { ok: false as const, status: 403, error: "Forbidden" };
    }
  }

  return { ok: true as const, state };
}

export async function POST(req: NextRequest) {
  // Absolute entry gate — resolve cookies BEFORE any async branching / streams.
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch (cookieError) {
    // Outside Next request scope (e.g. tsx E2E importing the handler).
    console.warn(
      "[api/chat/ai-assist] cookies() unavailable in this context — Bearer/public fallback:",
      cookieError instanceof Error ? cookieError.message : cookieError,
    );
  }

  try {
    if (!isSitGuruAiConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          error: "SitGuru AI is not configured. Set ANTHROPIC_API_KEY.",
          model: getSitGuruAiModel(),
        },
        { status: 503 },
      );
    }

    let user: { id: string; email?: string | null } | null = null;

    if (cookieStore) {
      const supabase = createClientFromCookieStore(cookieStore);
      const {
        data: { user: cookieUser },
      } = await supabase.auth.getUser();
      user = cookieUser;
    }

    if (!user) {
      user = await resolveUserFromBearer(req);
    }

    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    const conversationId = safeString(body?.conversationId);
    const message = safeString(body?.message || body?.text || body?.content);
    const audienceHint = safeString(body?.audienceHint) || undefined;
    const persist = body?.persist !== false;
    // Accept both publicFunnel (product) and allowPublic (E2E / mobile aliases)
    const publicFunnel = Boolean(
      body?.publicFunnel || body?.allowPublic || body?.public,
    );
    const stream = Boolean(body?.stream);

    if (!user && !publicFunnel) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!message || message.length > 4000) {
      return NextResponse.json(
        {
          ok: false,
          error: "A message between 1 and 4000 characters is required.",
        },
        { status: 400 },
      );
    }

    // Early handoff parse (even before model call)
    const earlyHandoff = evaluateHandoffNeed(message);

    // Capture identity for stream closures — never re-read cookies inside start()
    const userId = user?.id || null;

    if (conversationId) {
      const access = await assertConversationAccess({
        conversationId,
        userId,
        allowPublic: publicFunnel,
      });

      if (!access.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: access.error,
            aiAssistEnabled: access.status === 409 ? false : undefined,
          },
          { status: access.status },
        );
      }

      const state = access.state;

      if (earlyHandoff.shouldHandoff) {
        const handoff = await maybeHandoffFromUserMessage({
          conversationId,
          messageText: message,
          bookingId: state.bookingId,
        });
        const notice =
          "Thanks for flagging this — I'm connecting you with a real SitGuru teammate now. They'll take it from here.";
        if (persist && userId) {
          await insertAiMessage({
            conversationId,
            recipientUserId: userId,
            text: notice,
          });
        }
        return NextResponse.json({
          ok: true,
          handedOff: handoff.handedOff,
          reply: notice,
          aiAssistEnabled: false,
          triggers: earlyHandoff.triggers,
        });
      }

      if (persist && userId && !stream) {
        const result = await runAiAssistIfEnabled({
          conversationId,
          userMessage: message,
          recipientUserId: userId,
          audienceHint,
        });

        return NextResponse.json({
          ok: true,
          ...result,
          aiAssistEnabled: !(result as { handedOff?: boolean }).handedOff,
          model: getSitGuruAiModel(),
        });
      }

      // Streaming path for conversation-scoped assist
      if (stream) {
        const encoder = new TextEncoder();
        const bookingId = state.bookingId;

        const readable = new ReadableStream({
          async start(controller) {
            const send = (payload: Record<string, unknown>) => {
              controller.enqueue(encoder.encode(sseEncode(payload)));
            };

            try {
              send({
                type: "meta",
                model: getSitGuruAiModel(),
                systemDigest: "SitGuru help catalog injected",
              });

              let full = "";
              for await (const event of streamSitGuruAiReply({
                userMessage: message,
                audienceHint:
                  audienceHint || "partner, lead, or onboarding inquiry",
                bookingId,
              })) {
                if (event.type === "delta") {
                  full += event.text;
                  send({ type: "delta", text: event.text });
                } else if (event.type === "done") {
                  full = event.text || full;
                  if (persist && userId) {
                    await insertAiMessage({
                      conversationId,
                      recipientUserId: userId,
                      text: full,
                    });
                  }
                  send({
                    type: "done",
                    text: full,
                    model: event.model,
                    persisted: Boolean(persist && userId),
                  });
                }
              }
            } catch (error) {
              send({
                type: "error",
                error:
                  error instanceof Error
                    ? error.message
                    : "Claude stream failed.",
              });
            } finally {
              controller.close();
            }
          },
        });

        return new Response(readable, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      }
    }

    // Stateless / public funnel — optional stream
    if (stream) {
      const encoder = new TextEncoder();
      const bookingIdForStream = safeString(body?.bookingId) || null;
      const readable = new ReadableStream({
        async start(controller) {
          const send = (payload: Record<string, unknown>) => {
            controller.enqueue(encoder.encode(sseEncode(payload)));
          };
          try {
            if (earlyHandoff.shouldHandoff) {
              send({
                type: "done",
                text: "I want to get you a real SitGuru teammate for this. Please share your name and the best phone or email — or open sitguru.com/contact.",
                handedOff: true,
                model: getSitGuruAiModel(),
              });
              controller.close();
              return;
            }

            send({
              type: "meta",
              model: getSitGuruAiModel(),
              promptBytes: buildSitGuruAiSystemPrompt({
                audienceHint: audienceHint || "public landing visitor",
              }).length,
            });

            for await (const event of streamSitGuruAiReply({
              userMessage: message,
              audienceHint: audienceHint || "public landing visitor",
              bookingId: bookingIdForStream,
            })) {
              if (event.type === "delta") {
                send({ type: "delta", text: event.text });
              } else {
                send({
                  type: "done",
                  text: event.text,
                  model: event.model,
                  aiAssistEnabled: true,
                });
              }
            }
          } catch (error) {
            send({
              type: "error",
              error:
                error instanceof Error ? error.message : "Claude stream failed.",
            });
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    const completion = await completeSitGuruAiReply({
      userMessage: message,
      audienceHint: audienceHint || "public landing visitor",
      bookingId: safeString(body?.bookingId) || null,
    });

    if (!completion.ok) {
      return NextResponse.json(
        { ok: false, error: completion.error },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      reply: completion.text,
      model: completion.model,
      aiAssistEnabled: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI assist failed.";
    console.error("[api/chat/ai-assist]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
