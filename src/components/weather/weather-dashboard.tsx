import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Eye,
  Leaf,
  MapPin,
  Navigation,
  Sunrise,
  Sunset,
  Sun,
  Umbrella,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { WeatherForecast, WeatherIconKind } from "@/domain/weather";
import { airQualityLabel, formatWeatherTime, uvIndexLabel, weatherCodeInfo, windDirectionLabel } from "@/domain/weather";

const weatherIcons: Record<WeatherIconKind, LucideIcon> = {
  clear: Sun,
  "partly-cloudy": CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

export function WeatherDashboard({ forecast }: { forecast: WeatherForecast }) {
  const condition = weatherCodeInfo(forecast.current.weatherCode);
  const CurrentIcon = weatherIcons[condition.icon];
  const today = forecast.daily[0];

  return <div className="space-y-5">
    <section className="relative overflow-hidden rounded-[1.35rem] border border-sky-700/50 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-800 p-6 text-white shadow-[var(--shadow)] sm:p-8">
      <div className="absolute -right-24 -top-24 size-72 rounded-full bg-white/10 blur-2xl" />
      <div className="relative grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-blue-50"><span className="inline-flex items-center gap-1.5"><MapPin size={15}/>{forecast.location}</span><span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-[.68rem] font-bold uppercase tracking-[.12em] text-emerald-100">Live · updated {formatWeatherTime(forecast.current.observedAt)}</span></div>
          <div className="mt-7 flex items-start gap-5"><p className="text-7xl font-light tracking-[-.09em] sm:text-8xl">{Math.round(forecast.current.temperature)}°</p><CurrentIcon className="mt-2 size-14 text-blue-50 sm:size-16" strokeWidth={1.2}/></div>
          <p className="mt-2 text-xl font-semibold">{condition.label}</p>
          <p className="mt-1 text-sm text-blue-100">Feels like {Math.round(forecast.current.feelsLike)}° · H {Math.round(today.high)}° · L {Math.round(today.low)}°</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <HeroMetric icon={Droplets} label="Humidity" value={`${forecast.current.humidity}%`}/>
          <HeroMetric icon={Sun} label="UV index" value={`${forecast.current.uvIndex.toFixed(1)} · ${uvIndexLabel(forecast.current.uvIndex)}`}/>
          <HeroMetric icon={Wind} label="Wind" value={`${Math.round(forecast.current.windSpeed)} mph ${windDirectionLabel(forecast.current.windDirection)}`}/>
          <HeroMetric icon={Umbrella} label="Rain today" value={`${today.precipitationChance}%`}/>
        </div>
      </div>
    </section>

    <section className="card p-5 sm:p-6">
      <div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Next 12 hours</p><h2 className="mt-1 text-xl font-bold tracking-[-.035em]">Throughout the day</h2></div><p className="hidden text-xs text-[var(--muted)] sm:block">Local time · Georgetown</p></div>
      <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12">{forecast.hourly.map((hour, index) => {
        const info = weatherCodeInfo(hour.weatherCode);
        const Icon = weatherIcons[info.icon];
        return <article key={hour.time} className="min-w-0 rounded-xl border bg-[var(--surface-subtle)] p-2.5 sm:p-3">
          <p className="truncate text-[.66rem] font-semibold text-[var(--muted)]">{index === 0 ? "Now" : formatWeatherTime(hour.time)}</p>
          <Icon className="my-2.5 text-sky-500" size={20}/>
          <p className="text-xl font-bold tracking-[-.04em]">{Math.round(hour.temperature)}°</p>
          <p className="mt-0.5 truncate text-[.62rem] text-[var(--muted)]">Feels {Math.round(hour.feelsLike)}°</p>
          <div className="mt-2 flex items-center justify-between gap-1 text-[.58rem] text-[var(--muted)]"><span className="flex items-center gap-0.5 text-blue-500"><Droplets size={9}/>{hour.precipitationChance}%</span><span>UV {hour.uvIndex.toFixed(1)}</span></div>
        </article>;
      })}</div>
    </section>

    <div className="grid gap-5 xl:grid-cols-[1fr_1.6fr]">
      <section className="card p-5 sm:p-6"><p className="eyebrow">Details</p><h2 className="mt-1 text-xl font-bold tracking-[-.035em]">Right now</h2><div className="mt-5 grid grid-cols-2 gap-3">
        <Detail icon={Wind} label="Wind gusts" value={`${Math.round(forecast.current.windGusts)} mph`}/>
        <Detail icon={Navigation} label="Direction" value={`${windDirectionLabel(forecast.current.windDirection)} · ${Math.round(forecast.current.windDirection)}°`}/>
        <Detail icon={Leaf} label="Air quality" value={forecast.airQuality ? `${Math.round(forecast.airQuality.usAqi)} · ${airQualityLabel(forecast.airQuality.usAqi)}` : "Unavailable"}/>
        <Detail icon={Eye} label="Cloud cover" value={`${forecast.current.cloudCover}%`}/>
        <Detail icon={Sunrise} label="Sunrise" value={formatWeatherTime(today.sunrise)}/>
        <Detail icon={Sunset} label="Sunset" value={formatWeatherTime(today.sunset)}/>
      </div></section>

      <section className="card p-5 sm:p-6"><p className="eyebrow">Seven-day outlook</p><h2 className="mt-1 text-xl font-bold tracking-[-.035em]">The week ahead</h2><div className="mt-4 divide-y">{forecast.daily.map((day, index) => {
        const info = weatherCodeInfo(day.weatherCode);
        const Icon = weatherIcons[info.icon];
        const date = new Date(`${day.date}T12:00:00`);
        return <article key={day.date} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[7rem_2rem_1fr_auto]">
          <div><p className="text-sm font-bold">{index === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "long" })}</p><p className="text-[.68rem] text-[var(--muted)]">{date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p></div>
          <Icon className="hidden text-sky-500 sm:block" size={21}/>
          <div className="min-w-0"><p className="truncate text-xs font-medium">{info.label}</p><p className="mt-1 flex items-center gap-3 text-[.68rem] text-[var(--muted)]"><span className="text-blue-500">Rain {day.precipitationChance}%</span><span>UV {day.uvIndex.toFixed(1)}</span><span className="hidden md:inline">Wind {Math.round(day.windSpeed)} mph</span></p></div>
          <p className="text-sm font-bold tabular-nums">{Math.round(day.high)}° <span className="font-medium text-[var(--muted)]">{Math.round(day.low)}°</span></p>
        </article>;
      })}</div></section>
    </div>

    <p className="text-center text-[.68rem] text-[var(--muted-2)]">Forecast refreshes every 15 minutes. Weather data by <a className="underline underline-offset-2 hover:text-[var(--foreground)]" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>.</p>
  </div>;
}

function HeroMetric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm"><Icon size={16} className="text-blue-100"/><p className="mt-3 text-[.62rem] font-bold uppercase tracking-wider text-blue-200">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>;
}

function Detail({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <div className="rounded-xl bg-[var(--surface-subtle)] p-3.5"><Icon size={16} className="text-sky-500"/><p className="mt-3 text-[.65rem] font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>;
}
