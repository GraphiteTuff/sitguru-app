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

type GuruRow = {
  id: string;
  user_id?: string | null;
  slug?: string | null;
  display_name?: string | null;
  full_name?: string | null;
};

export default async function BookGuruPage({ params }: PageProps) {
  const { slug } = await params;

  const { data: calendarGuru, error: calendarError } = await supabaseAdmin
    .from("guru_calendar_settings")
    .select("guru_slug,guru_name,cal_username,cal_event_type_slug,active")
    .eq("guru_slug", slug)
    .eq("active", true)
    .single<GuruCalendarRow>();

  if (calendarError || !calendarGuru) {
    console.error("Book Guru page could not find active calendar settings:", {
      slug,
      calendarError,
    });

    notFound();
  }

  const { data: guruProfile, error: guruError } = await supabaseAdmin
    .from("gurus")
    .select("id,user_id,slug,display_name,full_name")
    .eq("slug", slug)
    .single<GuruRow>();

  if (guruError || !guruProfile?.id) {
    console.error("Book Guru page could not find matching gurus.id:", {
      slug,
      guruError,
    });

    notFound();
  }

  return (
    <BookGuruClient
      guruId={guruProfile.id}
      guruSlug={calendarGuru.guru_slug}
      guruName={
        guruProfile.display_name ||
        guruProfile.full_name ||
        calendarGuru.guru_name
      }
      calUsername={calendarGuru.cal_username}
      calEventTypeSlug={calendarGuru.cal_event_type_slug}
    />
  );
}