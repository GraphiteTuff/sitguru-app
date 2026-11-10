"use server";

import type { CommunityActionState } from "./model";
import { communityActor, communityConfigured, communityWriteError } from "./service";
import { loadCommunityWorkspaceForActor, loadPublishedCommunityItems, reviewCommunitySubmissionForActor, saveCommunitySubmissionForActor } from "./operations";

export async function loadCommunityWorkspace(mode: "manager" | "intern" | "member" = "manager") {
  return loadCommunityWorkspaceForActor(mode, communityConfigured() ? await communityActor() : null);
}

export async function saveCommunitySubmission(_previous: CommunityActionState, form: FormData): Promise<CommunityActionState> {
  const error = communityWriteError();
  if (error) return { ok: false, error, message: "" };
  return saveCommunitySubmissionForActor(form, communityConfigured() ? await communityActor() : null);
}

export async function reviewCommunitySubmission(_previous: CommunityActionState, form: FormData): Promise<CommunityActionState> {
  const error = communityWriteError();
  if (error) return { ok: false, error, message: "" };
  return reviewCommunitySubmissionForActor(form, communityConfigured() ? await communityActor() : null);
}

export async function loadPublishedCommunity() {
  return loadPublishedCommunityItems();
}
