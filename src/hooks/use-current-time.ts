"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export function useCurrentTime() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return now;
}

export function useInitialTimeScroll(containerRef: RefObject<HTMLElement | null>, offset: number, positionKey: string | null) {
  const positionedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!positionKey) {
      positionedKeyRef.current = null;
      return;
    }
    if (offset < 0 || !containerRef.current || positionedKeyRef.current === positionKey) return;
    const container = containerRef.current;
    const frame = window.requestAnimationFrame(() => {
      const target = offset - Math.round(container.clientHeight * 0.35);
      container.scrollTop = Math.min(Math.max(0, target), Math.max(0, container.scrollHeight - container.clientHeight));
      positionedKeyRef.current = positionKey;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [containerRef, offset, positionKey]);
}
