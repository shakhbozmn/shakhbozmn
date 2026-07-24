const THEMES = {
  light: {
    bg: "#f6f8fa",
    border: "#d0d7de",
    fg: "#0b1220",
    dim: "#57606a",
    accent: "#0969da",
  },
  dark: {
    bg: "#0d1117",
    border: "#30363d",
    fg: "#ffffff",
    dim: "#8b949e",
    accent: "#58a6ff",
  },
};

const TIME_ZONE = "Asia/Tashkent";
const WIDTH = 440;
const HEIGHT = 100;

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function partsFor(date) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .formatToParts(date)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
}

function weekdayFor(date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
  }).format(date);
}

export function renderClockSvg(themeName = "light", date = new Date()) {
  const theme = THEMES[themeName] || THEMES.light;
  const parts = partsFor(date);
  const dateText = `${parts.year}-${parts.month}-${parts.day}`;
  const timeText = `${parts.hour}:${parts.minute}:${parts.second}`;
  const weekday = weekdayFor(date);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="title description">
  <title id="title">Live Tashkent clock</title>
  <desc id="description">Current date and time in Asia/Tashkent</desc>
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" rx="10" ry="10" fill="${escapeXml(theme.bg)}" stroke="${escapeXml(theme.border)}" stroke-width="1"/>
  <text x="20" y="30" font-family="ui-monospace, Menlo, monospace" font-size="13" fill="${escapeXml(theme.dim)}">$ date --time-zone "${escapeXml(TIME_ZONE)}"</text>
  <text x="20" y="60" font-family="ui-monospace, Menlo, monospace" font-size="22" font-weight="600" fill="${escapeXml(theme.fg)}">${escapeXml(dateText)}  ${escapeXml(timeText)}</text>
  <text x="20" y="82" font-family="ui-monospace, Menlo, monospace" font-size="12" fill="${escapeXml(theme.accent)}">${escapeXml(weekday)} · Tashkent, UZ</text>
</svg>`;
}

export { escapeXml, partsFor, TIME_ZONE };

if (typeof process !== "undefined" && process.env?.NODE_ENV === "test") {
  // Keep module exports available to the test runner without a second source copy.
}
