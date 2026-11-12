import "server-only";

import { fromZonedTime } from "date-fns-tz";
import { listTasksForCurrentViewer } from "@/data/tasks";
import { MORNING_BRIEF_TIME_ZONE, type SourceSnapshot } from "@/domain/morning-brief";
import type { Task } from "@/domain/tasks";
import type { WeatherForecast } from "@/domain/weather";
import { getGeorgetownWeather } from "@/integrations/open-meteo";

export async function loadTaskSnapshot(): Promise<SourceSnapshot<Task[]>> {
  const attemptedAt = new Date().toISOString();
  try {
    return { status: "ready", data: await listTasksForCurrentViewer(), loadedAt: attemptedAt };
  } catch {
    return { status: "error", data: null, attemptedAt, message: "Tasks are temporarily unavailable." };
  }
}

export async function loadWeatherSnapshot(): Promise<SourceSnapshot<WeatherForecast>> {
  const attemptedAt = new Date().toISOString();
  try {
    const data = await getGeorgetownWeather();
    const observedAt = fromZonedTime(data.current.observedAt, MORNING_BRIEF_TIME_ZONE);
    if (Date.now() - observedAt.getTime() > 30 * 60 * 1000) return { status: "stale", data, loadedAt: attemptedAt, message: "Weather observation is more than 30 minutes old." };
    return { status: "ready", data, loadedAt: attemptedAt };
  } catch {
    return { status: "error", data: null, attemptedAt, message: "Live weather is temporarily unavailable." };
  }
}
