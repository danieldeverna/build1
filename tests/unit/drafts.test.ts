import { describe, expect, it } from "vitest";
import { canTransitionDraft, transitionDraft } from "@/domain/drafts";

describe("draft transitions", () => {
  it("requires publishing before published", () => {
    expect(canTransitionDraft("draft", "published")).toBe(false);
    expect(transitionDraft("draft", "publishing")).toBe("publishing");
    expect(transitionDraft("publishing", "published")).toBe("published");
  });

  it("makes published drafts terminal", () => {
    expect(() => transitionDraft("published", "draft")).toThrow("Invalid draft transition");
  });

  it("supports discard and publishing rollback without reopening terminal drafts", () => {
    expect(transitionDraft("draft", "discarded")).toBe("discarded");
    expect(transitionDraft("publishing", "draft")).toBe("draft");
    expect(canTransitionDraft("discarded", "draft")).toBe(false);
  });
});
