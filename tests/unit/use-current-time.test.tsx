import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRef } from "react";
import { useInitialTimeScroll } from "@/hooks/use-current-time";

function ScrollHarness({ offset, positionKey }: { offset: number; positionKey: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  useInitialTimeScroll(ref, offset, positionKey);
  return <div ref={ref} data-testid="timeline" />;
}

describe("useInitialTimeScroll", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("positions a current timeline once and resets when the viewed period changes", () => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, get: () => 100 });
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", { configurable: true, get: () => 1_000 });

    const { getByTestId, rerender } = render(<ScrollHarness offset={500} positionKey="current-week" />);
    const timeline = getByTestId("timeline");
    expect(timeline.scrollTop).toBe(465);

    rerender(<ScrollHarness offset={700} positionKey="current-week" />);
    expect(timeline.scrollTop).toBe(465);

    rerender(<ScrollHarness offset={700} positionKey={null} />);
    expect(timeline.scrollTop).toBe(465);

    rerender(<ScrollHarness offset={700} positionKey="current-week-again" />);
    expect(timeline.scrollTop).toBe(665);
  });
});
