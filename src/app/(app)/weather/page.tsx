import { CloudOff } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { WeatherDashboard } from "@/components/weather/weather-dashboard";
import { getGeorgetownWeather } from "@/integrations/open-meteo";

export const metadata = { title: "Weather" };
export const revalidate = 900;

export default async function WeatherPage() {
  const forecast = await getGeorgetownWeather().catch(() => null);

  return <>
    <PageHeader eyebrow="Live conditions" title="Georgetown, D.C." description="Current conditions, the day ahead, and a seven-day outlook for Georgetown."/>
    {forecast ? <WeatherDashboard forecast={forecast}/> : <section className="card grid min-h-80 place-items-center p-8 text-center"><div><CloudOff className="mx-auto text-[var(--muted)]" size={34}/><h2 className="mt-4 text-lg font-bold">Live weather is temporarily unavailable</h2><p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">The weather provider did not respond. Jarvis will try again automatically; no stale forecast is being presented as live data.</p></div></section>}
  </>;
}
