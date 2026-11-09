import type { WeatherForecast } from "@/domain/weather";

export const GEORGETOWN_WEATHER_LOCATION = {
  name: "Georgetown, D.C.",
  latitude: 38.9097,
  longitude: -77.0654,
  timezone: "America/New_York",
} as const;

export type OpenMeteoPayload = {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    cloud_cover: number;
    surface_pressure: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    weather_code: number[];
    uv_index: number[];
    wind_speed_10m: number[];
    relative_humidity_2m: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    precipitation_probability_max: number[];
    uv_index_max: number[];
    sunrise: string[];
    sunset: string[];
    wind_speed_10m_max: number[];
  };
};

export function mapOpenMeteoForecast(payload: OpenMeteoPayload): WeatherForecast {
  const currentHour = `${payload.current.time.slice(0, 13)}:00`;
  const currentHourIndex = Math.max(0, payload.hourly.time.findIndex((time) => time >= currentHour));
  const hourly = payload.hourly.time.slice(currentHourIndex, currentHourIndex + 12).map((time, offset) => {
    const index = currentHourIndex + offset;
    return {
      time,
      temperature: payload.hourly.temperature_2m[index],
      feelsLike: payload.hourly.apparent_temperature[index],
      precipitationChance: payload.hourly.precipitation_probability[index],
      weatherCode: payload.hourly.weather_code[index],
      uvIndex: payload.hourly.uv_index[index],
      windSpeed: payload.hourly.wind_speed_10m[index],
      humidity: payload.hourly.relative_humidity_2m[index],
    };
  });

  return {
    location: GEORGETOWN_WEATHER_LOCATION.name,
    latitude: payload.latitude,
    longitude: payload.longitude,
    timezone: payload.timezone,
    current: {
      observedAt: payload.current.time,
      temperature: payload.current.temperature_2m,
      feelsLike: payload.current.apparent_temperature,
      humidity: payload.current.relative_humidity_2m,
      precipitation: payload.current.precipitation,
      weatherCode: payload.current.weather_code,
      cloudCover: payload.current.cloud_cover,
      pressure: payload.current.surface_pressure,
      windSpeed: payload.current.wind_speed_10m,
      windDirection: payload.current.wind_direction_10m,
      windGusts: payload.current.wind_gusts_10m,
      uvIndex: payload.hourly.uv_index[currentHourIndex] ?? 0,
    },
    hourly,
    daily: payload.daily.time.slice(0, 7).map((date, index) => ({
      date,
      weatherCode: payload.daily.weather_code[index],
      high: payload.daily.temperature_2m_max[index],
      low: payload.daily.temperature_2m_min[index],
      feelsLikeHigh: payload.daily.apparent_temperature_max[index],
      feelsLikeLow: payload.daily.apparent_temperature_min[index],
      precipitationChance: payload.daily.precipitation_probability_max[index],
      uvIndex: payload.daily.uv_index_max[index],
      sunrise: payload.daily.sunrise[index],
      sunset: payload.daily.sunset[index],
      windSpeed: payload.daily.wind_speed_10m_max[index],
    })),
  };
}

export async function getGeorgetownWeather(): Promise<WeatherForecast> {
  const parameters = new URLSearchParams({
    latitude: String(GEORGETOWN_WEATHER_LOCATION.latitude),
    longitude: String(GEORGETOWN_WEATHER_LOCATION.longitude),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m",
    hourly: "temperature_2m,apparent_temperature,precipitation_probability,weather_code,uv_index,wind_speed_10m,relative_humidity_2m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,uv_index_max,sunrise,sunset,wind_speed_10m_max",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    precipitation_unit: "inch",
    timezone: GEORGETOWN_WEATHER_LOCATION.timezone,
    forecast_days: "7",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${parameters}`, {
    next: { revalidate: 900 },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Weather provider returned ${response.status}`);
  return mapOpenMeteoForecast(await response.json() as OpenMeteoPayload);
}
