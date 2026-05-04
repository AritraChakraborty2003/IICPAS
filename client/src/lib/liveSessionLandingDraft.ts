export type LiveSessionLandingDraft = {
  editId?: string;
  tab?: string;
  form?: Record<string, any>;
  imagePreview?: string;
  uploadedImageName?: string;
  uploadedImageType?: string;
};

const DRAFT_PREFIX = "iicpa-live-session-landing-draft";

export const buildLiveSessionLandingDraftKey = (sessionId = "new") =>
  `${DRAFT_PREFIX}:${sessionId}`;

export const readLiveSessionLandingDraft = (
  draftKey: string
): LiveSessionLandingDraft | null => {
  if (typeof window === "undefined" || !draftKey) return null;

  try {
    const raw = window.sessionStorage.getItem(draftKey);
    if (!raw) return null;
    return JSON.parse(raw) as LiveSessionLandingDraft;
  } catch {
    return null;
  }
};

export const writeLiveSessionLandingDraft = (
  draftKey: string,
  draft: LiveSessionLandingDraft
) => {
  if (typeof window === "undefined" || !draftKey) return;
  window.sessionStorage.setItem(draftKey, JSON.stringify(draft));
};

export const clearLiveSessionLandingDraft = (draftKey: string) => {
  if (typeof window === "undefined" || !draftKey) return;
  window.sessionStorage.removeItem(draftKey);
};
