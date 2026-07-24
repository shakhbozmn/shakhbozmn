function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

const COMMAND_LINES = [
  "shakhbozms@github:~$ whoami",
  "Shahboz — product engineer, Tashkent, UZ.",
  "Working across product + engineering on Gnezdo,",
  "a real-estate booking / PMS platform.",
  "Comfortable owning a feature end to end.",
  "",
  "shakhbozms@github:~$ stack",
  "frontend:  React · React Native · Expo · Next.js",
  "backend:   Node.js · FeathersJS · MongoDB",
  "infra:     Docker · Traefik · Portainer · Grafana",
  "",
  "shakhbozms@github:~$ projects",
  "feathers-board         FeathersJS v5 playground",
  "4work                  two-sided portfolio marketplace",
  "scrap-fortress         Unity tower defense",
  "flight-delay-prediction  US flight-delay risk classifier",
  "",
  "— tap to play, type, or run stats —",
];

const PALETTE = {
  light: { bg: "#f6f8fa", border: "#d0d7de", fg: "#0b1220", dim: "#57606a", accent: "#0969da", green: "#1a7f37" },
  dark: { bg: "#0d1117", border: "#30363d", fg: "#e6edf3", dim: "#8b949e", accent: "#58a6ff", green: "#3fb950" },
};

function colorFor(theme, key) {
  return (PALETTE[theme] || PALETTE.dark)[key];
}

export function renderPreviewSvg(themeName = "dark") {
  const t = {
    bg: colorFor(themeName, "bg"),
    border: colorFor(themeName, "border"),
    fg: colorFor(themeName, "fg"),
    dim: colorFor(themeName, "dim"),
    accent: colorFor(themeName, "accent"),
    green: colorFor(themeName, "green"),
  };

  const width = 760;
  const lineHeight = 18;
  const padX = 22;
  const padTop = 32;
  const totalLines = COMMAND_LINES.length;
  const height = padTop + lineHeight * totalLines + 28;
  const charStep = 0.045;
  const lineRevealExtra = 0.18;
  const totalSeconds = (totalLines * lineHeight / 12 + 1).toFixed(2);

  const textElements = [];
  let lineOffset = 0;

  for (let i = 0; i < COMMAND_LINES.length; i++) {
    const line = COMMAND_LINES[i];
    const y = padTop + lineHeight * i + 4;
    const isCommand = line.startsWith("shakhbozms@github:~$");
    const promptPart = isCommand ? "shakhbozms@github" : "";
    const commandPart = isCommand ? line.slice("shakhbozms@github:~$".length) : line;

    const colorFill = isCommand ? t.fg : t.dim;
    let text = "";

    if (isCommand) {
      const promptChars = promptPart.length;
      const promptBegin = (lineOffset * charStep).toFixed(4);
      const promptEnd = (lineOffset * charStep + 0.01).toFixed(4);
      const pathBegin = ((lineOffset + promptChars) * charStep).toFixed(4);
      const pathEnd = ((lineOffset + promptChars) * charStep + 0.01).toFixed(4);

      text += `<tspan fill="${escapeXml(t.green)}" opacity="0">${escapeXml(promptPart)}<animate attributeName="opacity" values="0;0;1" keyTimes="0;${promptBegin};${promptEnd}" dur="${totalSeconds}s" fill="freeze" repeatCount="1"/></tspan>`;
      text += `<tspan fill="${escapeXml(t.accent)}" opacity="0">:~$<animate attributeName="opacity" values="0;0;1" keyTimes="0;${pathBegin};${pathEnd}" dur="${totalSeconds}s" fill="freeze" repeatCount="1"/></tspan>`;
      text += ` `;

      for (let c = 0; c < commandPart.length; c++) {
        const ch = commandPart[c];
        const at = lineOffset + promptChars + 4 + c;
        const begin = (at * charStep).toFixed(4);
        const end = (at * charStep + 0.01).toFixed(4);
        text += `<tspan opacity="0">${escapeXml(ch)}<animate attributeName="opacity" values="0;0;1" keyTimes="0;${begin};${end}" dur="${totalSeconds}s" fill="freeze" repeatCount="1"/></tspan>`;
      }

      lineOffset += promptChars + 4 + commandPart.length + lineRevealExtra;
    } else {
      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        const at = lineOffset + c;
        const begin = (at * charStep).toFixed(4);
        const end = (at * charStep + 0.01).toFixed(4);
        text += `<tspan opacity="0">${escapeXml(ch)}<animate attributeName="opacity" values="0;0;1" keyTimes="0;${begin};${end}" dur="${totalSeconds}s" fill="freeze" repeatCount="1"/></tspan>`;
      }

      lineOffset += line.length + lineRevealExtra;
    }

    textElements.push(
      `<text x="${padX}" y="${y}" font-family="ui-monospace, Menlo, monospace" font-size="13" fill="${escapeXml(colorFill)}">${text}</text>`
    );
  }

  const cursorX = padX + 8;
  const cursorY = padTop + lineHeight * (totalLines - 1) - 10;
  const cursorAnim = `<rect x="${cursorX}" y="${cursorY}" width="7" height="14" fill="${escapeXml(t.green)}" opacity="0"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.94;0.95;0.99;1" dur="${totalSeconds}s" fill="freeze" repeatCount="1"/></rect>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="previewTitle">
  <title id="previewTitle">Terminal autoplay preview</title>
  <rect x="0" y="0" width="${width}" height="${height}" rx="12" ry="12" fill="${escapeXml(t.bg)}" stroke="${escapeXml(t.border)}" stroke-width="1"/>
  <text x="${padX}" y="18" font-family="ui-monospace, Menlo, monospace" font-size="12" fill="${escapeXml(t.dim)}">shakhbozms@github — autoplay preview (${totalSeconds}s)</text>
  ${textElements.join("\n  ")}
  ${cursorAnim}
</svg>`;
}
