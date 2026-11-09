import { describe, expect, it } from "vitest";
import { formatWeatherTime, uvIndexLabel, weatherCodeInfo, windDirectionLabel } from "@/domain/weather";
import { mapOpenMeteoForecast, type OpenMeteoPayload } from "@/integrations/open-meteo";

describe("weather presentation", () => {
  it("maps WMO codes to readable conditions", () => {
    expect(weatherCodeInfo(0)).toEqual({ label: "Clear sky", icon: "clear" });
    expect(weatherCodeInfo(63)).toEqual({ label: "Rain", icon: "rain" });
    expect(weatherCodeInfo(95)).toEqual({ label: "Thunderstorms", icon: "storm" });
  });

  it("formats Georgetown-local provider times without shifting time zones", () => {
    expect(formatWeatherTime("2026-11-09T00:00")).toBe("12:00 AM");
    expect(formatWeatherTime("2026-11-09T15:30")).toBe("3:30 PM");
  });

  it("labels wind direction and UV risk", () => {
    expect(windDirectionLabel(290)).toBe("W");
    expect(uvIndexLabel(2.9)).toBe("Low");
    expect(uvIndexLabel(6)).toBe("High");
  });

  it("maps the provider response into 12 hourly and seven daily previews", () => {
    const hours = Array.from({ length: 14 }, (_, index) => `2026-11-09T${String(index).padStart(2, "0")}:00`);
    const days = Array.from({ length: 7 }, (_, index) => `2026-11-${String(index + 9).padStart(2, "0")}`);
    const hourlyValues = Array.from({ length: 14 }, (_, index) => 50 + index);
    const dailyValues = Array.from({ length: 7 }, (_, index) => 60 + index);
    const payload: OpenMeteoPayload = {
      latitude: 38.9,
      longitude: -77.06,
      timezone: "America/New_York",
      current: { time: "2026-11-09T02:30", temperature_2m: 52, apparent_temperature: 48, relative_humidity_2m: 55, precipitation: 0, weather_code: 0, cloud_cover: 10, surface_pressure: 1012, wind_speed_10m: 7, wind_direction_10m: 290, wind_gusts_10m: 12 },
      hourly: { time: hours, temperature_2m: hourlyValues, apparent_temperature: hourlyValues, precipitation_probability: hourlyValues.map(() => 10), weather_code: hourlyValues.map(() => 0), uv_index: hourlyValues.map(() => 2), wind_speed_10m: hourlyValues.map(() => 7), relative_humidity_2m: hourlyValues.map(() => 55) },
      daily: { time: days, weather_code: dailyValues.map(() => 1), temperature_2m_max: dailyValues, temperature_2m_min: dailyValues.map((value) => value - 15), apparent_temperature_max: dailyValues, apparent_temperature_min: dailyValues.map((value) => value - 18), precipitation_probability_max: dailyValues.map(() => 20), uv_index_max: dailyValues.map(() => 4), sunrise: days.map((day) => `${day}T06:45`), sunset: days.map((day) => `${day}T17:00`), wind_speed_10m_max: dailyValues.map(() => 12) },
    };
    const forecast = mapOpenMeteoForecast(payload);
    expect(forecast.hourly).toHaveLength(12);
    expect(forecast.hourly[0].time).toBe("2026-11-09T02:00");
    expect(forecast.daily).toHaveLength(7);
    expect(forecast.current.uvIndex).toBe(2);
  });
});
