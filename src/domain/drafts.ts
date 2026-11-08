export type DraftStatus = "draft" | "publishing" | "published" | "discarded";

const transitions: Record<DraftStatus, DraftStatus[]> = {
  draft: ["publishing", "discarded"],
  publishing: ["draft", "published"],
  published: [],
  discarded: [],
};

export function canTransitionDraft(from: DraftStatus, to: DraftStatus) {
  return transitions[from].includes(to);
}

export function transitionDraft(from: DraftStatus, to: DraftStatus) {
  if (!canTransitionDraft(from, to)) {
    throw new Error(`Invalid draft transition: ${from} -> ${to}`);
  }
  return to;
}
