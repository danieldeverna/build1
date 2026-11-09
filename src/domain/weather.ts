export type WeatherIconKind = "clear" | "partly-cloudy" | "cloudy" | "fog" | "rain" | "snow" | "storm";

export type CurrentWeather = {
  observedAt: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  cloudCover: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  uvIndex: number;
};

export type HourlyWeather = {
  time: string;
  temperature: number;
  feelsLike: number;
  precipitationChance: number;
  weatherCode: number;
  uvIndex: number;
  windSpeed: number;
  humidity: number;
};

export type DailyWeather = {
  date: string;
  weatherCode: number;
  high: number;
  low: number;
  feelsLikeHigh: number;
  feelsLikeLow: number;
  precipitationChance: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  windSpeed: number;
};

export type WeatherForecast = {
  location: string;
  latitude: number;
  longitude: number;
  timezone: string;
  current: CurrentWeather;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
};

export function weatherCodeInfo(code: number): { label: string; icon: WeatherIconKind } {
  if (code === 0) return { label: "Clear sky", icon: "clear" };
  if (code <= 2) return { label: "Partly cloudy", icon: "partly-cloudy" };
  if (code === 3) return { label: "Overcast", icon: "cloudy" };
  if (code === 45 || code === 48) return { label: "Foggy", icon: "fog" };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: "Drizzle", icon: "rain" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: "Rain", icon: "rain" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "Snow", icon: "snow" };
  if (code >= 95) return { label: "Thunderstorms", icon: "storm" };
  return { label: "Mixed conditions", icon: "cloudy" };
}

export function windDirectionLabel(degrees: number) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(degrees / 45) % directions.length];
}

export function uvIndexLabel(value: number) {
  if (value < 3) return "Low";
  if (value < 6) return "Moderate";
  if (value < 8) return "High";
  if (value < 11) return "Very high";
  return "Extreme";
}

export function formatWeatherTime(localIso: string) {
  const hour = Number(localIso.slice(11, 13));
  const minutes = localIso.slice(14, 16);
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${hour >= 12 ? "PM" : "AM"}`;
}
