"use client";

import { useEffect, useState } from "react";
import { greetingForHour } from "@/domain/greeting";

export function TimeAwareGreeting({ name }: { name: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const update = () => setNow(new Date());
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return <span suppressHydrationWarning className="tracking-[0.015em]">{greetingForHour(now.getHours())}, {name}.</span>;
}
