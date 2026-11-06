import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IDLE_MS, useReadingTimer } from "./useReadingTimer";

/** A passage's box at `top` px from the top of the screen, as the timer finds it. */
function passageAt(index: number, top: number) {
  const box = document.createElement("div");
  box.dataset.passageIndex = String(index);
  box.getBoundingClientRect = () => ({ top }) as DOMRect;
  document.body.append(box);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
});

afterEach(() => {
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useReadingTimer", () => {
  it("adds each second to the passage at the reading line, from the draft's times", () => {
    passageAt(0, -500);
    passageAt(1, 100);
    passageAt(2, 2000);
    const { result } = renderHook(() => useReadingTimer(3, [10]));

    act(() => vi.advanceTimersByTime(3000));

    expect(result.current.times).toEqual([10, 3, 0]);
    expect(result.current.ref.current).toEqual([10, 3, 0]);
  });

  it("stops after a while with nothing done, and goes on once the reader scrolls", () => {
    passageAt(0, 0);
    const { result } = renderHook(() => useReadingTimer(1));

    act(() => vi.advanceTimersByTime(IDLE_MS + 60_000));
    const away = result.current.times[0]!;
    act(() => {
      window.dispatchEvent(new Event("scroll"));
      vi.advanceTimersByTime(5000);
    });

    // Counted up to the idle limit, not the minute after it, then the 5 seconds back.
    expect(away).toBe(IDLE_MS / 1000);
    expect(result.current.times[0]).toBe(IDLE_MS / 1000 + 5);
  });

  it("counts nothing while the page is hidden", () => {
    passageAt(0, 0);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    const { result } = renderHook(() => useReadingTimer(1));

    act(() => vi.advanceTimersByTime(3000));

    expect(result.current.times).toEqual([0]);
  });
});
