import gifenc from "gifenc";
const { GIFEncoder, quantize, applyPalette } = gifenc;
import { CELL_HEIGHT, CELL_WIDTH, drawText, textWidth } from "./font.js";

const PALETTE = {
  light: {
    bg: [246, 248, 250],
    border: [208, 215, 222],
    fg: [11, 18, 32],
    dim: [87, 96, 106],
    accent: [9, 105, 218],
    green: [26, 127, 55],
    highlight: [200, 220, 250],
  },
  dark: {
    bg: [13, 17, 23],
    border: [48, 54, 61],
    fg: [230, 237, 243],
    dim: [139, 148, 158],
    accent: [88, 166, 255],
    green: [63, 185, 80],
    highlight: [40, 70, 110],
  },
};

const COMMANDS = [
  { prompt: "shakhbozms@github", path: ":~$", cmd: "whoami", output: [
    "Shahboz — product engineer, Tashkent, UZ.",
    "Working across product + engineering on Gnezdo,",
    "a real-estate booking / PMS platform.",
    "Comfortable owning a feature end to end.",
  ]},
  { prompt: "shakhbozms@github", path: ":~$", cmd: "stack", output: [
    "frontend:  React · React Native · Expo · Next.js",
    "backend:   Node.js · FeathersJS · MongoDB",
    "infra:     Docker · Traefik · Portainer · Grafana",
  ]},
  { prompt: "shakhbozms@github", path: ":~$", cmd: "projects", output: [
    "feathers-board         FeathersJS v5 playground",
    "4work                  two-sided portfolio marketplace",
    "scrap-fortress         Unity tower defense",
    "flight-delay-prediction  US flight-delay risk classifier",
  ]},
];

const WIDTH = 600;
const HEIGHT = 260;
const PAD_X = 12;
const PAD_TOP = 28;
const FRAME_DELAY_MS = 90;
const TYPE_STEP_FRAMES = 2;
const READ_STEP_FRAMES = 16;
const PALETTE_BYTES = 4;

function makeFrameContext(width, height) {
  const rgba = new Uint8Array(width * height * PALETTE_BYTES);
  return {
    width,
    height,
    rgba,
    fillRect(x, y, w, h, color) {
      const [r, g, b] = color;
      const x0 = Math.max(0, Math.floor(x));
      const y0 = Math.max(0, Math.floor(y));
      const x1 = Math.min(width, Math.floor(x + w));
      const y1 = Math.min(height, Math.floor(y + h));
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const idx = (yy * width + xx) * PALETTE_BYTES;
          rgba[idx] = r;
          rgba[idx + 1] = g;
          rgba[idx + 2] = b;
          rgba[idx + 3] = 255;
        }
      }
    },
  };
}

function fill(ctx, color) {
  ctx.fillRect(0, 0, ctx.width, ctx.height, color);
}

function strokeRect(ctx, x, y, w, h, color) {
  ctx.fillRect(x, y, w, 1, color);
  ctx.fillRect(x, y + h - 1, w, 1, color);
  ctx.fillRect(x, y, 1, h, color);
  ctx.fillRect(x + w - 1, y, 1, h, color);
}

function drawHeader(ctx, theme) {
  fill(ctx, theme.bg);
  strokeRect(ctx, 0, 0, ctx.width - 1, ctx.height - 1, theme.border);
  drawText(ctx, "shakhbozms@github — autoplay", PAD_X, 6, theme.dim);
}

function drawCommandLine(ctx, theme, promptText, pathText, typedCmd, y, highlightProgress) {
  const promptEndX = PAD_X + textWidth(promptText);
  drawText(ctx, promptText, PAD_X, y, theme.green);
  drawText(ctx, pathText, promptEndX, y, theme.accent);
  const cmdStartX = promptEndX + textWidth(pathText) + CELL_WIDTH;
  const fullCmdX = cmdStartX + textWidth(typedCmd);
  drawText(ctx, typedCmd, cmdStartX, y, theme.fg);
  if (highlightProgress > 0 && highlightProgress < 1) {
    const barX = cmdStartX - 1;
    const barW = Math.max(1, Math.round(textWidth(typedCmd) * highlightProgress));
    ctx.fillRect(barX, y - 1, barW, CELL_HEIGHT + 2, theme.highlight);
    drawText(ctx, typedCmd, cmdStartX, y, theme.fg);
  }
  return fullCmdX;
}

function drawCursor(ctx, theme, x, y, visible) {
  if (!visible) return;
  ctx.fillRect(x, y - 1, 2, CELL_HEIGHT + 2, theme.green);
}

export function buildPreviewGif(themeName = "dark") {
  const theme = PALETTE[themeName] || PALETTE.dark;
  const gif = GIFEncoder();
  const frames = buildFrames(theme);
  for (const rgba of frames) {
    const palette = quantize(rgba, 32);
    const index = applyPalette(rgba, palette);
    gif.writeFrame(index, WIDTH, HEIGHT, { palette, delay: FRAME_DELAY_MS, transparent: false });
  }
  gif.finish();
  return gif.bytesView();
}

function buildFrames(theme) {
  const frames = [];
  const lineGap = 4;
  const totalLines = 1 + COMMANDS.reduce((acc, c) => acc + c.output.length, 0) + COMMANDS.length;

  let y = PAD_TOP;
  const lines = [];
  lines.push({ type: "header", y });
  y += CELL_HEIGHT + lineGap;
  for (const cmd of COMMANDS) {
    lines.push({ type: "command-prompt", y, cmd, typed: "", highlight: 0 });
    y += CELL_HEIGHT + lineGap;
    for (const out of cmd.output) {
      lines.push({ type: "response", y, text: out, cursor: { x: PAD_X, y, visible: false } });
      y += CELL_HEIGHT + lineGap;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.type === "command-prompt") {
      const cmd = line.cmd;
      const totalChars = cmd.length;
      let cursorBlink = true;
      let prevCursor = null;

      for (let typed = 0; typed <= totalChars; typed++) {
        const ctx = makeFrameContext(WIDTH, HEIGHT);
        drawHeader(ctx, theme);
        drawPreviouslyTyped(ctx, theme, lines, i, typed);
        const partial = cmd.substring(0, typed);
        const fullCmdX = drawCommandLine(ctx, theme, "shakhbozms@github", ":~$", partial, line.y, 0);
        const cursorVisible = (frames.length % 2) === 0;
        drawCursor(ctx, theme, fullCmdX, line.y, cursorVisible);
        frames.push(ctx.rgba);
        if (typed < totalChars) {
          for (let s = 1; s < TYPE_STEP_FRAMES; s++) {
            const ctx2 = makeFrameContext(WIDTH, HEIGHT);
            drawHeader(ctx2, theme);
            drawPreviouslyTyped(ctx2, theme, lines, i, typed);
            drawCommandLine(ctx2, theme, "shakhbozms@github", ":~$", partial, line.y, 0);
            drawCursor(ctx2, theme, fullCmdX, line.y, (frames.length % 2) === 0);
            frames.push(ctx2.rgba);
          }
        }
      }

      for (let r = 0; r < READ_STEP_FRAMES; r++) {
        const ctx3 = makeFrameContext(WIDTH, HEIGHT);
        drawHeader(ctx3, theme);
        drawPreviouslyTyped(ctx3, theme, lines, i, totalChars, true);
        const fullCmdX = drawCommandLine(ctx3, theme, "shakhbozms@github", ":~$", cmd, line.y, 0);
        drawCursor(ctx3, theme, fullCmdX, line.y, (frames.length % 2) === 0);
        frames.push(ctx3.rgba);
      }
    } else if (line.type === "response") {
      const ctx = makeFrameContext(WIDTH, HEIGHT);
      drawHeader(ctx, theme);
      drawAllUpTo(ctx, theme, lines, i + 1, true);
      drawText(ctx, line.text, PAD_X, line.y, theme.dim);
      const cursorVisible = (frames.length % 2) === 0;
      drawCursor(ctx, theme, PAD_X + textWidth(line.text) + 2, line.y, cursorVisible);
      frames.push(ctx.rgba);
    }
  }

  for (let i = 0; i < 24; i++) {
    const ctx = makeFrameContext(WIDTH, HEIGHT);
    drawHeader(ctx, theme);
    drawAllUpTo(ctx, theme, lines, lines.length, true);
    drawCursor(ctx, theme, PAD_X, lines[lines.length - 1].y, (i % 2) === 0);
    frames.push(ctx.rgba);
  }

  return frames;
}

function drawPreviouslyTyped(ctx, theme, lines, commandIndex, typedChars, includeOutputs) {
  for (let i = 0; i < commandIndex; i++) {
    const ln = lines[i];
    if (ln.type === "command-prompt") {
      drawCommandLine(ctx, theme, ln.cmd.prompt || "shakhbozms@github", ln.cmd.path || ":~$", ln.cmd.cmd, ln.y, 0);
    } else if (ln.type === "response" && includeOutputs) {
      drawText(ctx, ln.text, PAD_X, ln.y, theme.dim);
    }
  }
  return null;
}

function drawAllUpTo(ctx, theme, lines, upTo, includeOutputs) {
  for (let i = 0; i < upTo; i++) {
    const ln = lines[i];
    if (ln.type === "command-prompt") {
      const prompt = ln.cmd.prompt || "shakhbozms@github";
      const path = ln.cmd.path || ":~$";
      drawCommandLine(ctx, theme, prompt, path, ln.cmd.cmd, ln.y, 0);
    } else if (ln.type === "response" && includeOutputs) {
      drawText(ctx, ln.text, PAD_X, ln.y, theme.dim);
    }
  }
}
