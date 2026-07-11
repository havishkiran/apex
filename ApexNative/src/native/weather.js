// Open-Meteo — free, no API key required.
// Docs: https://open-meteo.com/en/docs

const WMO = {
  0: { label: 'Clear', icon: '☀️' },
  1: { label: 'Mostly clear', icon: '🌤' },
  2: { label: 'Partly cloudy', icon: '⛅️' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Fog', icon: '🌫' },
  48: { label: 'Rime fog', icon: '🌫' },
  51: { label: 'Light drizzle', icon: '🌦' },
  53: { label: 'Drizzle', icon: '🌦' },
  55: { label: 'Heavy drizzle', icon: '🌦' },
  61: { label: 'Light rain', icon: '🌧' },
  63: { label: 'Rain', icon: '🌧' },
  65: { label: 'Heavy rain', icon: '🌧' },
  66: { label: 'Freezing rain', icon: '🌧' },
  67: { label: 'Freezing rain', icon: '🌧' },
  71: { label: 'Light snow', icon: '🌨' },
  73: { label: 'Snow', icon: '🌨' },
  75: { label: 'Heavy snow', icon: '❄️' },
  77: { label: 'Snow grains', icon: '🌨' },
  80: { label: 'Showers', icon: '🌦' },
  81: { label: 'Showers', icon: '🌦' },
  82: { label: 'Heavy showers', icon: '⛈' },
  85: { label: 'Snow showers', icon: '🌨' },
  86: { label: 'Snow showers', icon: '🌨' },
  95: { label: 'Thunderstorm', icon: '⛈' },
  96: { label: 'Thunderstorm', icon: '⛈' },
  99: { label: 'Thunderstorm', icon: '⛈' },
};

function describe(code) {
  return WMO[code] || { label: 'Unknown', icon: '🌡' };
}

// Returns { tempC, code, label, icon, windKmh } or null on failure.
export async function fetchWeather(lat, lon) {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}` +
      `&longitude=${lon.toFixed(3)}&current=temperature_2m,weather_code,wind_speed_10m`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    const cur = json.current;
    if (!cur) return null;
    const { label, icon } = describe(cur.weather_code);
    return {
      tempC: Math.round(cur.temperature_2m),
      code: cur.weather_code,
      label,
      icon,
      windKmh: Math.round(cur.wind_speed_10m),
    };
  } catch {
    return null;
  }
}
