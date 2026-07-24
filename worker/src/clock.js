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
  const border = escapeXml(theme.border);
  const accent = escapeXml(theme.accent);
  const fg = escapeXml(theme.fg);
  const dim = escapeXml(theme.dim);
  const bg = escapeXml(theme.bg);
  const prompt = escapeXml(theme.prompt);
  const response = escapeXml(theme.response);
  const pulse = escapeXml(theme.accent);

  const cursorX = padX + measureText(prompt, 16) + 6;
  const spinnerX = padX + measureText(RESPONSE_LINES[RESPONSE_LINES.length - 1], 14) + 12;
  const spinnerY = responseY + lineHeight * 2 - 4;
  const cursorY = promptY - 4;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="cardTitle cardDesc">
  <title id="cardTitle">Live Tashkent clock and terminal</title>
  <desc id="cardDesc">Terminal whoami output and current Asia/Tashkent date and time</desc>
  <defs>
    <clipPath id="borderClip">
      <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="14" ry="14"/>
    </clipPath>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" rx="14" ry="14" fill="${bg}" stroke="${border}" stroke-width="1"/>
  <g clip-path="url(#borderClip)" stroke="${accent}" stroke-width="2" fill="none" opacity="0.55">
    <line x1="0" y1="0" x2="14" y2="0">
      <animate attributeName="x1" from="-14" to="${width}" dur="3s" repeatCount="indefinite"/>
      <animate attributeName="x2" from="0" to="${width + 14}" dur="3s" repeatCount="indefinite"/>
    </line>
  </g>
  <text x="${padX}" y="${padY + 16}" font-family="ui-monospace, Menlo, monospace" font-size="13" fill="${dim}">$ date --time-zone "${escapeXml(TIME_ZONE)}"</text>
  <text x="${padX}" y="${terminalTop - 6}" font-family="ui-monospace, Menlo, monospace" font-size="14" font-weight="600" fill="${accent}">shakhbozmn@portfolio</text>
  <text x="${padX}" y="${promptY}" font-family="ui-monospace, Menlo, monospace" font-size="16" fill="${prompt}">${escapedPrompt}</text>
  <rect x="${cursorX}" y="${cursorY}" width="9" height="18" fill="${pulse}">
    <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1s" repeatCount="indefinite"/>
  </rect>
  <text x="${padX}" y="${responseY}" font-family="ui-monospace, Menlo, monospace" font-size="14" fill="${response}">${escapedLines[0]}</text>
  <text x="${padX}" y="${responseY + lineHeight}" font-family="ui-monospace, Menlo, monospace" font-size="14" fill="${response}">${escapedLines[1]}</text>
  <text x="${padX}" y="${responseY + lineHeight * 2}" font-family="ui-monospace, Menlo, monospace" font-size="14" fill="${response}">${escapedLines[2]}</text>
  <g transform="translate(${spinnerX} ${spinnerY})" font-family="ui-monospace, Menlo, monospace" font-size="14" fill="${accent}">
    <text>${escapedLines[2] ? ' ' : ''}<tspan>
      <animate attributeName="opacity" values="0;0;1" keyTimes="0;0.25;1" dur="1s" begin="0s" repeatCount="indefinite"/>|</tspan>
      <tspan>
      <animate attributeName="opacity" values="0;0;1" keyTimes="0;0.25;1" dur="1s" begin="0.25s" repeatCount="indefinite"/>/</tspan>
      <tspan>
      <animate attributeName="opacity" values="0;0;1" keyTimes="0;0.25;1" dur="1s" begin="0.5s" repeatCount="indefinite"/>-</tspan>
      <tspan>
      <animate attributeName="opacity" values="0;0;1" keyTimes="0;0.25;1" dur="1s" begin="0.75s" repeatCount="indefinite"/>\</tspan>
    </text>
  </g>
  <line x1="${padX}" x2="${width - padX}" y1="${lastY + 8}" y2="${lastY + 8}" stroke="${border}" stroke-width="1"/>
  <text x="${padX}" y="${clockY}" font-family="ui-monospace, Menlo, monospace" font-size="22" font-weight="600" fill="${fg}">${escapeXml(dateText)}  ${escapeXml(timeText)}</text>
  <circle cx="${padX - 8}" cy="${clockY - 6}" r="4" fill="${accent}">
    <animate attributeName="opacity" values="1;0.25;1" dur="1s" repeatCount="indefinite"/>
  </circle>
  <text x="${padX}" y="${clockY + 22}" font-family="ui-monospace, Menlo, monospace" font-size="13" fill="${accent}">${escapeXml(weekday)} · Tashkent, UZ · open for collaboration</text>
</svg>`;
}

function measureText(text, fontSize) {
  const monospaceWidthRatio = 0.6;
  return Math.round(String(text).length * fontSize * monospaceWidthRatio);
}


export { escapeXml, partsFor, weekdayFor, TIME_ZONE, RESPONSE_LINES, PROMPT, THEMES };
