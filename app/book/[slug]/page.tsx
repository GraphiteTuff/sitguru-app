import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import BookGuruClient from "./BookGuruClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type GuruCalendarRow = {
  guru_slug: string;
  guru_name: string;
  cal_username: string;
  cal_event_type_slug: string;
  active: boolean;
};

export default async function BookGuruPage({ params }: PageProps) {
  const { slug } = await params;

  const { data: guru } = await supabaseAdmin
    .from("guru_calendar_settings")
    .select("guru_slug,guru_name,cal_username,cal_event_type_slug,active")
    .eq("guru_slug", slug)
    .eq("active", true)
    .single<GuruCalendarRow>();

  if (!guru) {
    notFound();
  }

  return (
    <BookGuruClient
      guruSlug={guru.guru_slug}
      guruName={guru.guru_name}
      calUsername={guru.cal_username}
      calEventTypeSlug={guru.cal_event_type_slug}
    />
  );
}