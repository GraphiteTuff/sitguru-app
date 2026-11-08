import { NextRequest, NextResponse } from "next/server";
import { deleteBrandAsset, resolveBrandActor, updateBrandAsset } from "@/lib/manager/brand-kit-store";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const actor = await resolveBrandActor();
  if (!actor) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const result = await updateBrandAsset({
    actor,
    id,
    title: body.title,
    description: body.description,
    category: body.category,
    tags: body.tags,
    approvalStatus: body.approvalStatus,
  });
  return NextResponse.json(result, { status: result.error ? 400 : 200 });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const actor = await resolveBrandActor();
  if (!actor) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await context.params;
  const result = await deleteBrandAsset({ actor, id });
  return NextResponse.json(result, { status: result.error ? 403 : 200 });
}
