// Default location: Boca Raton, FL
const DEFAULT = { name: "Boca Raton", lat: 26.3683, lon: -80.1289 };

// WMO weather codes used by Open-Meteo
const CODES = {
  0: ["Clear", "☀️"], 1: ["Mostly Clear", "🌤️"], 2: ["Partly Cloudy", "⛅"], 3: ["Cloudy", "☁️"],
  45: ["Fog", "🌫️"], 48: ["Fog", "🌫️"],
  51: ["Drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Drizzle", "🌦️"],
  61: ["Rain", "🌧️"], 63: ["Rain", "🌧️"], 65: ["Heavy Rain", "🌧️"],
  71: ["Snow", "🌨️"], 73: ["Snow", "🌨️"], 75: ["Heavy Snow", "❄️"],
  80: ["Showers", "🌦️"], 81: ["Showers", "🌧️"], 82: ["Heavy Showers", "⛈️"],
  95: ["Thunderstorm", "⛈️"], 96: ["Thunderstorm", "⛈️"], 99: ["Thunderstorm", "⛈️"],
};
const describe = (code) => CODES[code] || ["Unknown", "🌡️"];

const $ = (id) => document.getElementById(id);

async function loadWeather({ name, lat, lon }) {
  $("error").textContent = "";
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
    "&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto";

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather request failed");
    const data = await res.json();
    const c = data.current;
    const d = data.daily;

    $("location").textContent = name;
    $("temp").textContent = `${Math.round(c.temperature_2m)}°`;
    $("condition").textContent = describe(c.weather_code)[0];
    $("hilo").textContent = `H:${Math.round(d.temperature_2m_max[0])}°  L:${Math.round(d.temperature_2m_min[0])}°`;
    $("feels").textContent = `${Math.round(c.apparent_temperature)}°`;
    $("humidity").textContent = `${c.relative_humidity_2m}%`;
    $("wind").textContent = `${Math.round(c.wind_speed_10m)} mph`;

    $("days").innerHTML = d.time
      .map((date, i) => {
        const day = i === 0 ? "Today" : new Date(date + "T12:00").toLocaleDateString("en-US", { weekday: "short" });
        return `<li>
          <span>${day}</span>
          <span class="icon">${describe(d.weather_code[i])[1]}</span>
          <span class="range">${Math.round(d.temperature_2m_max[i])}°<span class="low">${Math.round(d.temperature_2m_min[i])}°</span></span>
        </li>`;
      })
      .join("");
  } catch (err) {
    $("error").textContent = "Couldn't load weather. Please try again.";
  }
}

$("search").addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = $("city").value.trim();
  if (!query) return;

  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`
    );
    const data = await res.json();
    if (!data.results || !data.results.length) {
      $("error").textContent = `No results for "${query}".`;
      return;
    }
    const place = data.results[0];
    loadWeather({ name: place.name, lat: place.latitude, lon: place.longitude });
    $("city").value = "";
  } catch (err) {
    $("error").textContent = "Search failed. Please try again.";
  }
});

loadWeather(DEFAULT);

// Theme switcher: light, dark, or system (follows the OS setting)
function applyTheme(theme) {
  if (theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  document.querySelectorAll("#theme button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });
  try { localStorage.setItem("theme", theme); } catch (e) {}
}

document.querySelectorAll("#theme button").forEach((btn) => {
  btn.addEventListener("click", () => applyTheme(btn.dataset.theme));
});

let savedTheme = "system";
try { savedTheme = localStorage.getItem("theme") || "system"; } catch (e) {}
applyTheme(savedTheme);
