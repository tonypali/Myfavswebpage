const modal = document.getElementById("setup-modal");
const setupForm = document.getElementById("setup-form");
const editButton = document.getElementById("edit-preferences");

const cityName = document.getElementById("city-name");
const teamName = document.getElementById("team-name");
const cityFact = document.getElementById("city-fact");
const teamFact = document.getElementById("team-fact");
const cityNews = document.getElementById("city-news");
const teamNews = document.getElementById("team-news");

const storageKey = "cityTeamPreferences";

const defaultState = {
  city: "",
  team: "",
};

const updatePill = (element, value) => {
  element.textContent = value || element.textContent;
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

  setLoading(cityFact, "Loading city fact...");
  setLoading(teamFact, "Loading team fact...");
  cityNews.innerHTML = "<li>Loading city headlines...</li>";
  teamNews.innerHTML = "<li>Loading team headlines...</li>";

  const [citySummary, teamSummary, cityHeadlines, teamHeadlines] =
    await Promise.all([
      fetchWikipediaSummary(preferences.city),
      fetchWikipediaSummary(preferences.team),
      fetchNews(preferences.city),
      fetchNews(preferences.team),
    ]);

  cityFact.textContent = citySummary;
  teamFact.textContent = teamSummary;
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
