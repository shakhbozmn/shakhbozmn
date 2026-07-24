import gifenc from "gifenc";
const { GIFEncoder, quantize, applyPalette } = gifenc;
import { CELL_WIDTH, GLYPH_HEIGHT, SCALE, drawText, textWidth } from "./font.js";
import { WHOAMI_LINES, statusHourFor, statusLinesFor } from "./status.js";

const PALETTE = {
  light: {
    bg: [246, 248, 250],
    titlebar: [228, 232, 237],
    border: [208, 215, 222],
    fg: [11, 18, 32],
    dim: [87, 96, 106],
    accent: [9, 105, 218],
    green: [26, 127, 55],
    red: [255, 95, 86],
    yellow: [255, 189, 46],
    dotGreen: [39, 201, 63],
  },
  dark: {
    bg: [30, 30, 32],
    titlebar: [42, 42, 46],
    border: [60, 60, 67],
    fg: [220, 220, 224],
    dim: [160, 160, 170],
    accent: [88, 166, 255],
    green: [63, 185, 80],
    red: [255, 95, 86],
    yellow: [255, 189, 46],
    dotGreen: [39, 201, 63],
  },
};

const COMMANDS = [
  { prompt: "shakhbozms@github", path: ":~$", cmd: "whoami", output: WHOAMI_LINES },
  {
    prompt: "shakhbozms@github",
    path: ":~$",
    cmd: "status",
    outputFn: (now) => statusLinesFor(now),
  },
];

const LINE_GAP = 6;
const CELL_W = CELL_WIDTH * SCALE;
const CELL_H = (GLYPH_HEIGHT + 2) * SCALE;
const TITLEBAR_H = 22;
const PAD_X = 16;
const PAD_TOP = TITLEBAR_H + 14;
const FRAME_DELAY_MS = 110;
const TYPE_STEP_FRAMES = 3;
const READ_STEP_FRAMES = 18;
const FREEZE_STEP_FRAMES = 80;
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

function drawTitlebar(ctx, theme) {
  ctx.fillRect(0, 0, ctx.width, TITLEBAR_H, theme.titlebar);
  // macOS traffic-light dots
  const dotR = 5;
  const dotY = TITLEBAR_H / 2;
  const dotXStart = 12;
  const dotGap = 18;
  for (let i = 0; i < 3; i++) {
    const cx = dotXStart + i * dotGap;
    const cy = dotY;
    const [r, g, b] = [theme.red, theme.yellow, theme.dotGreen][i];
    for (let py = -dotR; py <= dotR; py++) {
      for (let px = -dotR; px <= dotR; px++) {
        if (px * px + py * py <= dotR * dotR) {
          ctx.fillRect(cx + px, cy + py, 1, 1, [r, g, b]);
        }
      }
    }
  }
  const title = "shakhbozms@github — zsh — 80x24";
  const titleW = textWidth(title);
  drawText(ctx, title, Math.floor((ctx.width - titleW) / 2), 6, theme.dim);
  ctx.fillRect(0, TITLEBAR_H, ctx.width, 1, theme.border);
}

function drawCommandLine(ctx, theme, promptText, pathText, typedCmd, y) {
  const promptEndX = PAD_X + textWidth(promptText);
  drawText(ctx, promptText, PAD_X, y, theme.green);
  drawText(ctx, pathText, promptEndX, y, theme.accent);
  const cmdStartX = promptEndX + textWidth(pathText) + CELL_W;
  drawText(ctx, typedCmd, cmdStartX, y, theme.fg);
  return cmdStartX + textWidth(typedCmd);
}

function drawCursor(ctx, theme, x, y, visible) {
  if (!visible) return;
  ctx.fillRect(x, y, 2, CELL_H, theme.fg);
}

function heightFor(now) {
  const lineCount = COMMANDS.reduce(
    (acc, cmd) => acc + 1 + (cmd.outputFn ? cmd.outputFn(now).length : cmd.output.length),
    0,
  );
  return PAD_TOP + lineCount * (CELL_H + LINE_GAP) + 12;
}

export function buildPreviewGif(themeName = "dark", now = new Date()) {
  const theme = PALETTE[themeName] || PALETTE.dark;
  const gif = GIFEncoder();
  const width = 600;
  const height = heightFor(now);
  for (const rgba of buildFrames(theme, now, width, height)) {
    const palette = quantize(rgba, 32);
    const index = applyPalette(rgba, palette);
    gif.writeFrame(index, width, height, { palette, delay: FRAME_DELAY_MS, transparent: false });
  }
  gif.finish();
  return gif.bytesView();
}

function buildFrames(theme, now, width, height) {
  const frames = [];
  const yLines = [];

  for (const cmd of COMMANDS) {
    yLines.push({ type: "command-prompt", cmd });
    const output = cmd.outputFn ? cmd.outputFn(now) : cmd.output;
    for (const line of output) {
      yLines.push({ type: "response", text: line });
    }
  }

  let cursorY = PAD_TOP;
  for (const ln of yLines) {
    ln.y = cursorY;
    cursorY += CELL_H + LINE_GAP;
  }

  function newFrame() {
    const ctx = makeFrameContext(width, height);
    fill(ctx, theme.bg);
    strokeRect(ctx, 0, 0, ctx.width - 1, ctx.height - 1, theme.border);
    drawTitlebar(ctx, theme);
    return ctx;
  }

  for (let i = 0; i < yLines.length; i++) {
    const line = yLines[i];
    if (line.type === "command-prompt") {
      const cmd = line.cmd;
      const totalChars = cmd.cmd.length;

      for (let typed = 0; typed <= totalChars; typed++) {
        for (let s = 0; s < TYPE_STEP_FRAMES; s++) {
          const ctx = newFrame();
          drawAllUpTo(ctx, theme, yLines, i);
          const fullCmdX = drawCommandLine(ctx, theme, cmd.prompt, cmd.path, cmd.cmd.substring(0, typed), line.y);
          drawCursor(ctx, theme, fullCmdX, line.y, (frames.length % 2) === 0);
          frames.push(ctx.rgba);
        }
      }

      for (let r = 0; r < READ_STEP_FRAMES; r++) {
        const ctx = newFrame();
        drawAllUpTo(ctx, theme, yLines, i + 1);
        const fullCmdX = drawCommandLine(ctx, theme, cmd.prompt, cmd.path, cmd.cmd, line.y);
        drawCursor(ctx, theme, fullCmdX, line.y, (frames.length % 2) === 0);
        frames.push(ctx.rgba);
      }
    } else if (line.type === "response") {
      const ctx = newFrame();
      drawAllUpTo(ctx, theme, yLines, i + 1);
      drawCursor(ctx, theme, PAD_X, line.y, (frames.length % 2) === 0);
      frames.push(ctx.rgba);
    }
  }

  for (let i = 0; i < FREEZE_STEP_FRAMES; i++) {
    const ctx = newFrame();
    drawAllUpTo(ctx, theme, yLines, yLines.length);
    drawCursor(ctx, theme, PAD_X, yLines[yLines.length - 1].y, (i % 2) === 0);
    frames.push(ctx.rgba);
  }

  return frames;
}

function drawAllUpTo(ctx, theme, yLines, upTo) {
  for (let i = 0; i < upTo; i++) {
    const ln = yLines[i];
    if (ln.type === "command-prompt") {
      drawCommandLine(ctx, theme, ln.cmd.prompt, ln.cmd.path, ln.cmd.cmd, ln.y);
    } else if (ln.type === "response") {
      drawText(ctx, ln.text, PAD_X, ln.y, theme.dim);
    }
  }
}
