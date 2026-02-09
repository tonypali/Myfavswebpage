const modal = document.getElementById("setup-modal");
const setupForm = document.getElementById("setup-form");
const editButton = document.getElementById("edit-preferences");

const cityName = document.getElementById("city-name");
const teamName = document.getElementById("team-name");
const cityFact = document.getElementById("city-fact");
const teamFact = document.getElementById("team-fact");
const cityNews = document.getElementById("city-news");
const teamNews = document.getElementById("team-news");
const cityTime = document.getElementById("city-time");
const cityWeather = document.getElementById("city-weather");
const teamLastGame = document.getElementById("team-last-game");
const teamLeaguePosition = document.getElementById("team-league-position");

const storageKey = "cityTeamPreferences";

const defaultState = {
  city: "",
  team: "",
};

const teamColorMap = {
  "arsenal": { accent: "#EF0107", strong: "#9C0003", soft: "#FFE5E6" },
  "chelsea": { accent: "#034694", strong: "#022B5C", soft: "#E5F0FF" },
  "liverpool": { accent: "#C8102E", strong: "#8B0A1F", soft: "#FFE6EA" },
  "manchester city": { accent: "#6CABDD", strong: "#3E7CB1", soft: "#E4F2FD" },
  "manchester united": { accent: "#DA291C", strong: "#9C1510", soft: "#FFE5E3" },
  "tottenham": { accent: "#132257", strong: "#0B1433", soft: "#E6ECF7" },
  "real madrid": { accent: "#FEBE10", strong: "#B07E00", soft: "#FFF4D6" },
  "barcelona": { accent: "#A50044", strong: "#6E0030", soft: "#FFE6F0" },
  "bayern munich": { accent: "#DC052D", strong: "#9B031F", soft: "#FFE5EA" },
  "juventus": { accent: "#111111", strong: "#000000", soft: "#E5E7EB" },
  "inter": { accent: "#00529F", strong: "#003366", soft: "#E5F0FF" },
  "ac milan": { accent: "#FB090B", strong: "#9F0506", soft: "#FFE5E6" },
  "psg": { accent: "#004170", strong: "#002644", soft: "#E5F1FF" },
  "chicago bulls": { accent: "#CE1141", strong: "#7A0A26", soft: "#FFE5EC" },
  "los angeles lakers": { accent: "#552583", strong: "#2E1446", soft: "#EFE6F7" },
  "golden state warriors": { accent: "#1D428A", strong: "#102653", soft: "#E5F0FF" },
  "new york yankees": { accent: "#0C2340", strong: "#081627", soft: "#E6ECF5" },
  "boston red sox": { accent: "#BD3039", strong: "#861F27", soft: "#FFE5E8" },
};

const weatherCodeLabels = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Heavy showers",
  82: "Violent showers",
  95: "Thunderstorm",
};

const updatePill = (element, value) => {
  element.textContent = value || element.textContent;
};

const setThemeColors = (team) => {
  if (!team) {
    return;
  }
  const key = team.toLowerCase();
  const predefined = teamColorMap[key];
  let accent = predefined?.accent;
  let strong = predefined?.strong;
  let soft = predefined?.soft;

  if (!accent) {
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    accent = `hsl(${hue}, 68%, 45%)`;
    strong = `hsl(${hue}, 70%, 32%)`;
    soft = `hsl(${hue}, 80%, 92%)`;
  }

  document.documentElement.style.setProperty("--accent", accent);
  document.documentElement.style.setProperty("--accent-strong", strong);
  document.documentElement.style.setProperty("--accent-soft", soft);
  document.documentElement.style.setProperty("--accent-shadow", "rgba(15, 23, 42, 0.2)");
};

const setLoading = (element, message) => {
  element.textContent = message;
};

const showModal = () => {
  modal.classList.add("visible");
};

const hideModal = () => {
  modal.classList.remove("visible");
};

const loadPreferences = () => {
  const saved = localStorage.getItem(storageKey);
  if (!saved) {
    return { ...defaultState };
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      city: parsed.city || "",
      team: parsed.team || "",
    };
  } catch (error) {
    return { ...defaultState };
  }
};

const savePreferences = (preferences) => {
  localStorage.setItem(storageKey, JSON.stringify(preferences));
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const formatTime = (timeString, timeZone) => {
  const date = new Date(timeString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  });
};

const fetchWikipediaSummary = async (topic) => {
  if (!topic) {
    return "Add a topic to see a quick fact.";
  }

  const response = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      topic
    )}`
  );

  if (!response.ok) {
    return "We couldn't load a fact right now. Try again soon.";
  }

  const data = await response.json();
  return data.extract || "We couldn't find a summary for that topic.";
};

const fetchCityWeather = async (city) => {
  if (!city) {
    return {
      time: "Add a city to see the local time.",
      weather: "Add a city to see the current weather.",
    };
  }

  const geoResponse = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      city
    )}&count=1&language=en&format=json`
  );

  if (!geoResponse.ok) {
    return {
      time: "We couldn't load the local time right now.",
      weather: "We couldn't load the weather right now.",
    };
  }

  const geoData = await geoResponse.json();
  const location = geoData.results?.[0];
  if (!location) {
    return {
      time: "We couldn't find that city.",
      weather: "Weather is unavailable for this location.",
    };
  }

  const weatherResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code&timezone=auto`
  );
  if (!weatherResponse.ok) {
    return {
      time: "We couldn't load the local time right now.",
      weather: "We couldn't load the weather right now.",
    };
  }

  const weatherData = await weatherResponse.json();
  const timeLabel = formatTime(weatherData.current?.time, weatherData.timezone);
  const temp = weatherData.current?.temperature_2m;
  const code = weatherData.current?.weather_code;
  const condition = weatherCodeLabels[code] || "Current conditions";

  return {
    time: timeLabel ? `It's ${timeLabel}.` : "Local time is unavailable.",
    weather:
      typeof temp === "number"
        ? `${condition}, ${Math.round(temp)}°C right now.`
        : "Weather data is unavailable.",
  };
};

const fetchTeamStats = async (team) => {
  if (!team) {
    return {
      lastGame: "Add a team to see the latest score.",
      leaguePosition: "Add a team to see the standings.",
    };
  }

  const teamResponse = await fetch(
    `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(
      team
    )}`
  );

  if (!teamResponse.ok) {
    return {
      lastGame: "We couldn't load the last score right now.",
      leaguePosition: "We couldn't load the standings right now.",
    };
  }

  const teamData = await teamResponse.json();
  const teamInfo = teamData.teams?.[0];
  if (!teamInfo) {
    return {
      lastGame: "We couldn't find that team.",
      leaguePosition: "We couldn't find the team in league tables.",
    };
  }

  const teamId = teamInfo.idTeam;
  const leagueId = teamInfo.idLeague;
  const leagueName = teamInfo.strLeague || "the league";

  const seasonYear = new Date().getMonth() >= 7
    ? `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
    : `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`;

  const [lastEventResponse, tableResponse] = await Promise.all([
    fetch(
      `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId}`
    ),
    fetch(
      `https://www.thesportsdb.com/api/v1/json/3/lookuptable.php?l=${leagueId}&s=${seasonYear}`
    ),
  ]);

  let lastGame = "Last game data is unavailable.";
  if (lastEventResponse.ok) {
    const lastEventData = await lastEventResponse.json();
    const event = lastEventData.results?.[0];
    if (event) {
      const home = event.strHomeTeam;
      const away = event.strAwayTeam;
      const homeScore = event.intHomeScore;
      const awayScore = event.intAwayScore;
      const dateLabel = formatDate(event.dateEvent);
      const scoreLine =
        homeScore !== null && awayScore !== null
          ? `${home} ${homeScore} - ${awayScore} ${away}`
          : `${home} vs ${away}`;
      let outcome = "";
      if (homeScore !== null && awayScore !== null) {
        const isHome = home?.toLowerCase() === team.toLowerCase();
        const teamScore = isHome ? Number(homeScore) : Number(awayScore);
        const oppScore = isHome ? Number(awayScore) : Number(homeScore);
        if (!Number.isNaN(teamScore) && !Number.isNaN(oppScore)) {
          if (teamScore > oppScore) outcome = "Win";
          if (teamScore === oppScore) outcome = "Draw";
          if (teamScore < oppScore) outcome = "Loss";
        }
      }
      lastGame = `${scoreLine}${dateLabel ? ` • ${dateLabel}` : ""}${
        outcome ? ` (${outcome})` : ""
      }`;
    }
  }

  let leaguePosition = `Standings are unavailable for ${leagueName}.`;
  if (tableResponse.ok) {
    const tableData = await tableResponse.json();
    const tableEntry = tableData.table?.find(
      (entry) =>
        entry.teamid === teamId ||
        entry.name?.toLowerCase() === teamInfo.strTeam?.toLowerCase()
    );
    if (tableEntry?.intRank) {
      leaguePosition = `#${tableEntry.intRank} in ${leagueName}.`;
    }
  }

  return {
    lastGame,
    leaguePosition,
  };
};

const fetchNews = async (query) => {
  if (!query) {
    return [];
  }

  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
    query
  )}&hl=en-US&gl=US&ceid=US:en`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
    rssUrl
  )}`;

  const response = await fetch(proxyUrl);
  if (!response.ok) {
    return [];
  }

  const text = await response.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "text/xml");
  const items = Array.from(xml.querySelectorAll("item")).slice(0, 5);

  return items.map((item) => ({
    title: item.querySelector("title")?.textContent ?? "",
    link: item.querySelector("link")?.textContent ?? "",
    date: item.querySelector("pubDate")?.textContent ?? "",
    source: item.querySelector("source")?.textContent ?? "Google News",
  }));
};

const renderNews = (list, items, fallbackQuery) => {
  list.innerHTML = "";

  if (items.length === 0) {
    const fallback = document.createElement("li");
    const link = document.createElement("a");
    link.href = `https://news.google.com/search?q=${encodeURIComponent(
      fallbackQuery
    )}`;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "Browse the latest headlines";

    const note = document.createElement("span");
    note.textContent = "We couldn't load headlines. Open Google News instead.";

    fallback.append(link, note);
    list.appendChild(fallback);
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = item.link;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = item.title;

    const meta = document.createElement("span");
    const dateLabel = formatDate(item.date);
    meta.textContent = `${item.source}${dateLabel ? ` • ${dateLabel}` : ""}`;

    li.append(link, meta);
    list.appendChild(li);
  });
};

const refreshDashboard = async (preferences) => {
  updatePill(cityName, preferences.city || "City");
  updatePill(teamName, preferences.team || "Team");
  setThemeColors(preferences.team);

  setLoading(cityFact, "Loading city fact...");
  setLoading(teamFact, "Loading team fact...");
  setLoading(cityTime, "Loading local time...");
  setLoading(cityWeather, "Loading weather...");
  setLoading(teamLastGame, "Loading last game...");
  setLoading(teamLeaguePosition, "Loading league position...");
  cityNews.innerHTML = "<li>Loading city headlines...</li>";
  teamNews.innerHTML = "<li>Loading team headlines...</li>";

  const [
    citySummary,
    teamSummary,
    cityHeadlines,
    teamHeadlines,
    cityConditions,
    teamStats,
  ] =
    await Promise.all([
      fetchWikipediaSummary(preferences.city),
      fetchWikipediaSummary(preferences.team),
      fetchNews(preferences.city),
      fetchNews(preferences.team),
      fetchCityWeather(preferences.city),
      fetchTeamStats(preferences.team),
    ]);

  cityFact.textContent = citySummary;
  teamFact.textContent = teamSummary;
  cityTime.textContent = cityConditions.time;
  cityWeather.textContent = cityConditions.weather;
  teamLastGame.textContent = teamStats.lastGame;
  teamLeaguePosition.textContent = teamStats.leaguePosition;
  renderNews(cityNews, cityHeadlines, preferences.city);
  renderNews(teamNews, teamHeadlines, preferences.team);
};

const handleSetupSubmit = (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const preferences = {
    city: formData.get("city").toString().trim(),
    team: formData.get("team").toString().trim(),
  };

  if (!preferences.city || !preferences.team) {
    return;
  }

  savePreferences(preferences);
  hideModal();
  refreshDashboard(preferences);
};

setupForm.addEventListener("submit", handleSetupSubmit);
editButton.addEventListener("click", showModal);

const initialPreferences = loadPreferences();
if (!initialPreferences.city || !initialPreferences.team) {
  showModal();
}

refreshDashboard(initialPreferences);
