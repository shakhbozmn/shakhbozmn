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
  const surface = escapeXml(theme.surface);

  const cursorX = padX + measureText(prompt, 16) + 6;
  const cursorY = promptY - 4;
  const spinnerX = padX + measureText(RESPONSE_LINES[RESPONSE_LINES.length - 1], 14) + 12;
  const spinnerY = responseY + lineHeight * 2 - 4;

  const promptText = escapeXml(PROMPT);
  const promptYAttr = promptY;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="cardTitle cardDesc">
  <title id="cardTitle">Live Tashkent clock and terminal</title>
  <desc id="cardDesc">Animated terminal whoami output and current Asia/Tashkent date and time</desc>
  <defs>
    <linearGradient id="cardBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${surface}"/>
      <stop offset="100%" stop-color="${bg}"/>
    </linearGradient>
    <linearGradient id="accentSweep" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${accent}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="borderClip">
      <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="14" ry="14"/>
    </clipPath>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" rx="14" ry="14" fill="url(#cardBg)" stroke="${border}" stroke-width="1"/>

  <g clip-path="url(#borderClip)">
    <line x1="0" y1="0" x2="20" y2="0" stroke="url(#accentSweep)" stroke-width="2" stroke-linecap="round">
      <animate attributeName="x1" from="-40" to="${width}" dur="3.5s" repeatCount="indefinite"/>
      <animate attributeName="x2" from="-20" to="${width + 40}" dur="3.5s" repeatCount="indefinite"/>
    </line>
    <line x1="0" y1="${height}" x2="20" y2="${height}" stroke="url(#accentSweep)" stroke-width="2" stroke-linecap="round" opacity="0.4">
      <animate attributeName="x1" from="-40" to="${width}" dur="5s" begin="1.2s" repeatCount="indefinite"/>
      <animate attributeName="x2" from="-20" to="${width + 40}" dur="5s" begin="1.2s" repeatCount="indefinite"/>
    </line>
  </g>

  <text x="${padX}" y="${padY + 16}" font-family="ui-monospace, Menlo, monospace" font-size="13" fill="${dim}">$ date --time-zone "${escapeXml(TIME_ZONE)}"</text>
  <text x="${padX}" y="${terminalTop - 6}" font-family="ui-monospace, Menlo, monospace" font-size="14" font-weight="600" fill="${accent}">shakhbozmn@portfolio</text>

  <text x="${padX}" y="${promptYAttr}" font-family="ui-monospace, Menlo, monospace" font-size="16" fill="${prompt}">${promptText}</text>
  <rect x="${cursorX}" y="${cursorY}" width="9" height="18" fill="${pulse}">
    <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1s" repeatCount="indefinite"/>
  </rect>

  ${renderTypingLine(0, responseY, response, escapedLines[0], width, padX)}
  ${renderTypingLine(1, responseY + lineHeight, response, escapedLines[1], width, padX)}
  ${renderTypingLine(2, responseY + lineHeight * 2, response, escapedLines[2], width, padX)}

  <g transform="translate(${spinnerX} ${spinnerY})" font-family="ui-monospace, Menlo, monospace" font-size="14" fill="${accent}">
    <text><tspan opacity="0">|
      <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.25;0.5" dur="1s" begin="0s" repeatCount="indefinite"/>
    </tspan><tspan opacity="0">/
      <animate attributeName="opacity" values="0;1;0" keyTimes="0.25;0.5;0.75" dur="1s" begin="0s" repeatCount="indefinite"/>
    </tspan><tspan opacity="0">-
      <animate attributeName="opacity" values="0;1;0" keyTimes="0.5;0.75;1" dur="1s" begin="0s" repeatCount="indefinite"/>
    </tspan><tspan opacity="0">\
      <animate attributeName="opacity" values="0;1;0" keyTimes="0.75;1;0" dur="1s" begin="0s" repeatCount="indefinite"/>
    </tspan></text>
  </g>

  <line x1="${padX}" x2="${width - padX}" y1="${lastY + 8}" y2="${lastY + 8}" stroke="${border}" stroke-width="1">
    <animate attributeName="stroke-opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite"/>
  </line>

  <text x="${padX}" y="${clockY}" font-family="ui-monospace, Menlo, monospace" font-size="22" font-weight="600" fill="${fg}">${escapeXml(dateText)}  ${escapeXml(timeText)}</text>

  <circle cx="${padX - 8}" cy="${clockY - 6}" r="4" fill="${accent}">
    <animate attributeName="opacity" values="1;0.25;1" dur="1s" repeatCount="indefinite"/>
    <animate attributeName="r" values="4;5;4" dur="1s" repeatCount="indefinite"/>
  </circle>

  <text x="${padX}" y="${clockY + 22}" font-family="ui-monospace, Menlo, monospace" font-size="13" fill="${accent}">${escapeXml(weekday)} · Tashkent, UZ · open for collaboration</text>
</svg>`;
}

function renderTypingLine(lineIndex, y, color, text, cardWidth, padX) {
  const fillColor = color;
  const startWidth = 0;
  const endWidth = Math.min(measureText(text, 14) + 6, cardWidth - padX * 2);
  const cycleSeconds = 9;
  const beginOffset = lineIndex * 0.4;
  const clipId = `typeClip${lineIndex}`;

  return `
  <defs>
    <clipPath id="${clipId}">
      <rect x="${padX}" y="${y - 16}" width="${endWidth}" height="20">
        <animate attributeName="width" values="${startWidth};${endWidth};${endWidth};${startWidth}" keyTimes="0;0.05;0.85;1" dur="${cycleSeconds}s" begin="${beginOffset}s" repeatCount="indefinite"/>
      </rect>
    </clipPath>
  </defs>
  <text x="${padX}" y="${y}" font-family="ui-monospace, Menlo, monospace" font-size="14" fill="${fillColor}" clip-path="url(#${clipId})">${text}</text>`;
}




function measureText(text, fontSize) {
  const monospaceWidthRatio = 0.6;
  return Math.round(String(text).length * fontSize * monospaceWidthRatio);
}


export { escapeXml, partsFor, weekdayFor, TIME_ZONE, RESPONSE_LINES, PROMPT, THEMES };
