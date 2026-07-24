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
  { text: "shakhbozms@github:~$ whoami", kind: "command" },
  { text: "Shahboz — product engineer, Tashkent, UZ.", kind: "response" },
  { text: "Working across product + engineering on Gnezdo,", kind: "response" },
  { text: "a real-estate booking / PMS platform.", kind: "response" },
  { text: "Comfortable owning a feature end to end.", kind: "response" },
  { text: "", kind: "blank" },
  { text: "shakhbozms@github:~$ stack", kind: "command" },
  { text: "frontend:  React · React Native · Expo · Next.js", kind: "response" },
  { text: "backend:   Node.js · FeathersJS · MongoDB", kind: "response" },
  { text: "infra:     Docker · Traefik · Portainer · Grafana", kind: "response" },
  { text: "", kind: "blank" },
  { text: "shakhbozms@github:~$ projects", kind: "command" },
  { text: "feathers-board         FeathersJS v5 playground", kind: "response" },
  { text: "4work                  two-sided portfolio marketplace", kind: "response" },
  { text: "scrap-fortress         Unity tower defense", kind: "response" },
  { text: "flight-delay-prediction  US flight-delay risk classifier", kind: "response" },
  { text: "", kind: "blank" },
  { text: "— tap to play, type, or run stats —", kind: "hint" },
];

const PALETTE = {
  light: { bg: "#f6f8fa", border: "#d0d7de", fg: "#0b1220", dim: "#57606a", accent: "#0969da", green: "#1a7f37", highlight: "rgba(9,105,218,0.18)" },
  dark: { bg: "#0d1117", border: "#30363d", fg: "#e6edf3", dim: "#8b949e", accent: "#58a6ff", green: "#3fb950", highlight: "rgba(88,166,255,0.18)" },
};

function colorFor(theme, key) {
  return (PALETTE[theme] || PALETTE.dark)[key];
}

const CHAR_WIDTH = 7.8;
const LINE_HEIGHT = 18;

export function renderPreviewSvg(themeName = "dark") {
  const t = {
    bg: colorFor(themeName, "bg"),
    border: colorFor(themeName, "border"),
    fg: colorFor(themeName, "fg"),
    dim: colorFor(themeName, "dim"),
    accent: colorFor(themeName, "accent"),
    green: colorFor(themeName, "green"),
    highlight: colorFor(themeName, "highlight"),
  };

  const padX = 22;
  const padTop = 32;
  const width = 760;
  const totalLines = COMMAND_LINES.length;
  const height = padTop + LINE_HEIGHT * totalLines + 28;
  const totalSeconds = 8;

  const textElements = [];
  const highlightRects = [];

  for (let i = 0; i < COMMAND_LINES.length; i++) {
    const line = COMMAND_LINES[i];
    if (line.kind === "blank") continue;

    const y = padTop + LINE_HEIGHT * i + 4;
    const isCommand = line.kind === "command";
    const isHint = line.kind === "hint";

    let promptText = "";
    let pathText = "";
    let commandText = "";
    let responseText = "";

    if (isCommand) {
      promptText = "shakhbozms@github";
      pathText = ":~$";
      commandText = line.text.slice("shakhbozms@github:~$".length);
    } else {
      responseText = line.text;
    }

    const fillColor = isHint ? t.accent : isCommand ? t.fg : t.dim;
    let text = "";

    if (isCommand) {
      text += `<tspan fill="${escapeXml(t.green)}">${escapeXml(promptText)}</tspan>`;
      text += `<tspan fill="${escapeXml(t.accent)}">${escapeXml(pathText)}</tspan>`;
      text += ` `;
      text += escapeXml(commandText);
    } else {
      text += escapeXml(responseText);
    }

    textElements.push(
      `<text x="${padX}" y="${y}" font-family="ui-monospace, Menlo, monospace" font-size="13" fill="${escapeXml(fillColor)}">${text}</text>`
    );

    if (isCommand) {
      const highlightX = padX + (promptText.length + pathText.length + 1) * CHAR_WIDTH;
      const highlightY = y - LINE_HEIGHT + 4;
      const widthChars = commandText.length;
      const highlightWidth = widthChars * CHAR_WIDTH;
      highlightRects.push({ x: highlightX, y: highlightY, w: highlightWidth, h: LINE_HEIGHT, lineIndex: i, chars: widthChars });
    }
  }

  const highlights = highlightRects
    .map((rect) => {
      const startAt = (rect.lineIndex / totalLines) * 0.7;
      const dur = 0.4;
      const keyTimes = `0;${startAt.toFixed(4)};${(startAt + dur).toFixed(4)};1`;
      const values = `0;1;1;0`;
      return `<rect x="${rect.x.toFixed(2)}" y="${rect.y.toFixed(2)}" width="${rect.w.toFixed(2)}" height="${rect.h}" fill="${escapeXml(t.highlight)}" opacity="0"><animate attributeName="opacity" values="${values}" keyTimes="${keyTimes}" dur="${totalSeconds}s" repeatCount="indefinite"/></rect>`;
    })
    .join("\n  ");

  const cursorX = padX;
  const cursorY = padTop + LINE_HEIGHT * 0 - 10;
  const cursorAnim = `<rect x="${cursorX}" y="${cursorY}" width="7" height="14" fill="${escapeXml(t.green)}"><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1s" repeatCount="indefinite"/></rect>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="previewTitle">
  <title id="previewTitle">Terminal autoplay preview</title>
  <rect x="0" y="0" width="${width}" height="${height}" rx="12" ry="12" fill="${escapeXml(t.bg)}" stroke="${escapeXml(t.border)}" stroke-width="1"/>
  <text x="${padX}" y="18" font-family="ui-monospace, Menlo, monospace" font-size="12" fill="${escapeXml(t.dim)}">shakhbozms@github — autoplay preview (loop ${totalSeconds}s)</text>
  ${textElements.join("\n  ")}
  ${highlights}
  ${cursorAnim}
</svg>`;
}
