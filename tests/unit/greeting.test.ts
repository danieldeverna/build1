import { describe, expect, it } from "vitest";
import { greetingForHour } from "@/domain/greeting";

describe("greetingForHour", () => {
  it("uses a morning greeting before noon", () => {
    expect(greetingForHour(9)).toBe("Good morning");
  });

  it("uses an afternoon greeting from noon through 5:59 PM", () => {
    expect(greetingForHour(15)).toBe("Good afternoon");
  });

  it("uses an evening greeting from 6 PM", () => {
    expect(greetingForHour(18)).toBe("Good evening");
  });
});
