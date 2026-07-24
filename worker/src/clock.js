const THEMES = {
  light: {
    bg: "#f6f8fa",
    surface: "#ffffff",
    border: "#d0d7de",
    fg: "#0b1220",
    dim: "#57606a",
    accent: "#0969da",
    prompt: "#0b1220",
    response: "#3d4448",
  },
  dark: {
    bg: "#0d1117",
    surface: "#161b22",
    border: "#30363d",
    fg: "#ffffff",
    dim: "#8b949e",
    accent: "#58a6ff",
    prompt: "#f0f6fc",
    response: "#c9d1d9",
  },
};

const TIME_ZONE = "Asia/Tashkent";
const PROMPT = "$ whoami";
const RESPONSE_LINES = [
  "Shahboz Munirov",
  "Software engineer at EPAM and product engineer at Gnezdo",
  "— in the meantime launching Gnezdo Admin",
];

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

export function renderClockSvg(themeName = "light", date = new Date(), { combined = false } = {}) {
  const theme = THEMES[themeName] || THEMES.light;
  const parts = partsFor(date);
  const dateText = `${parts.year}-${parts.month}-${parts.day}`;
  const timeText = `${parts.hour}:${parts.minute}:${parts.second}`;
  const weekday = weekdayFor(date);

  if (!combined) {
    return renderCompactClock(theme, dateText, timeText, weekday);
  }
  return renderCombinedCard(theme, dateText, timeText, weekday);
}

function renderCompactClock(theme, dateText, timeText, weekday) {
  const width = 440;
  const height = 100;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">Live Tashkent clock</title>
  <desc id="description">Current date and time in Asia/Tashkent</desc>
  <rect x="0" y="0" width="${width}" height="${height}" rx="10" ry="10" fill="${escapeXml(theme.bg)}" stroke="${escapeXml(theme.border)}" stroke-width="1"/>
  <text x="20" y="30" font-family="ui-monospace, Menlo, monospace" font-size="13" fill="${escapeXml(theme.dim)}">$ date --time-zone "${escapeXml(TIME_ZONE)}"</text>
  <text x="20" y="60" font-family="ui-monospace, Menlo, monospace" font-size="22" font-weight="600" fill="${escapeXml(theme.fg)}">${escapeXml(dateText)}  ${escapeXml(timeText)}</text>
  <text x="20" y="82" font-family="ui-monospace, Menlo, monospace" font-size="12" fill="${escapeXml(theme.accent)}">${escapeXml(weekday)} · Tashkent, UZ</text>
</svg>`;
}

function renderCombinedCard(theme, dateText, timeText, weekday) {
  const width = 720;
  const height = 240;
  const padX = 24;
  const padY = 20;
  const terminalTop = 70;
  const lineHeight = 26;
  const promptY = terminalTop;
  const responseY = promptY + lineHeight;
  const lastY = responseY + lineHeight * (RESPONSE_LINES.length - 1);
  const clockY = lastY + 30;

  const escapedPrompt = escapeXml(PROMPT);
  const escapedLines = RESPONSE_LINES.map(escapeXml);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="cardTitle cardDesc">
  <title id="cardTitle">Live Tashkent clock and terminal</title>
  <desc id="cardDesc">Terminal whoami output and current Asia/Tashkent date and time</desc>
  <rect x="0" y="0" width="${width}" height="${height}" rx="14" ry="14" fill="${escapeXml(theme.bg)}" stroke="${escapeXml(theme.border)}" stroke-width="1"/>
  <text x="${padX}" y="${padY + 16}" font-family="ui-monospace, Menlo, monospace" font-size="13" fill="${escapeXml(theme.dim)}">$ date --time-zone "${escapeXml(TIME_ZONE)}"</text>
  <text x="${padX}" y="${terminalTop - 6}" font-family="ui-monospace, Menlo, monospace" font-size="14" font-weight="600" fill="${escapeXml(theme.accent)}">shakhbozmn@portfolio</text>
  <text x="${padX}" y="${promptY}" font-family="ui-monospace, Menlo, monospace" font-size="16" fill="${escapeXml(theme.prompt)}">${escapedPrompt}</text>
  <text x="${padX}" y="${responseY}" font-family="ui-monospace, Menlo, monospace" font-size="14" fill="${escapeXml(theme.response)}">${escapedLines[0]}</text>
  <text x="${padX}" y="${responseY + lineHeight}" font-family="ui-monospace, Menlo, monospace" font-size="14" fill="${escapeXml(theme.response)}">${escapedLines[1]}</text>
  <text x="${padX}" y="${responseY + lineHeight * 2}" font-family="ui-monospace, Menlo, monospace" font-size="14" fill="${escapeXml(theme.response)}">${escapedLines[2]}</text>
  <line x1="${padX}" x2="${width - padX}" y1="${lastY + 8}" y2="${lastY + 8}" stroke="${escapeXml(theme.border)}" stroke-width="1"/>
  <text x="${padX}" y="${clockY}" font-family="ui-monospace, Menlo, monospace" font-size="22" font-weight="600" fill="${escapeXml(theme.fg)}">${escapeXml(dateText)}  ${escapeXml(timeText)}</text>
  <text x="${padX}" y="${clockY + 22}" font-family="ui-monospace, Menlo, monospace" font-size="13" fill="${escapeXml(theme.accent)}">${escapeXml(weekday)} · Tashkent, UZ · open for collaboration</text>
</svg>`;
}

export { escapeXml, partsFor, weekdayFor, TIME_ZONE, RESPONSE_LINES, PROMPT, THEMES };
