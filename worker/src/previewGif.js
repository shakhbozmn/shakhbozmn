import gifenc from "gifenc";
const { GIFEncoder, quantize, applyPalette } = gifenc;
import { CELL_HEIGHT, CELL_WIDTH, drawText, textWidth } from "./font.js";
import { WHOAMI_LINES, statusHourFor, statusLinesFor } from "./status.js";

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
  { prompt: "shakhbozms@github", path: ":~$", cmd: "whoami", output: WHOAMI_LINES },
  {
    prompt: "shakhbozms@github",
    path: ":~$",
    cmd: "status",
    outputFn: (now) => statusLinesFor(now),
  },
];

const WIDTH = 600;
const HEIGHT = 320;
const PAD_X = 14;
const PAD_TOP = 20;
const FRAME_DELAY_MS = 110;
const TYPE_STEP_FRAMES = 3;
const READ_STEP_FRAMES = 18;
const FREEZE_STEP_FRAMES = 70;
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

function drawCommandLine(ctx, theme, promptText, pathText, typedCmd, y) {
  const promptEndX = PAD_X + textWidth(promptText);
  drawText(ctx, promptText, PAD_X, y, theme.green);
  drawText(ctx, pathText, promptEndX, y, theme.accent);
  const cmdStartX = promptEndX + textWidth(pathText) + CELL_WIDTH;
  drawText(ctx, typedCmd, cmdStartX, y, theme.fg);
  return cmdStartX + textWidth(typedCmd);
}

function drawCursor(ctx, theme, x, y, visible) {
  if (!visible) return;
  ctx.fillRect(x, y - 1, 2, CELL_HEIGHT + 2, theme.green);
}

function lineIndexOfCommand(yLines, commandIndex) {
  // yLines alternates prompt+output. The command-prompt line at commandIndex is the one to draw;
  // everything BEFORE it (already drawn or not) is part of the prior history that must remain.
  // For our sequence: yLines[0] is the first command-prompt; subsequent lines are response lines.
  // yLines structure: [prompt0, resp0, resp1, resp2, resp3, prompt1, resp0, resp1, resp2, resp3]
  // commandIndex is the index of the command-prompt in yLines. We want to draw all lines up to (but not
  // including) the current command's typed-portion frames, keeping the FULL prior prompt + responses.
  // For drawAllUpTo, we pass yLines.length; for drawPreviouslyTyped we pass commandIndex.
  return commandIndex;
}

export function buildPreviewGif(themeName = "dark", now = new Date()) {
  const theme = PALETTE[themeName] || PALETTE.dark;
  const gif = GIFEncoder();
  for (const rgba of buildFrames(theme, now)) {
    const palette = quantize(rgba, 32);
    const index = applyPalette(rgba, palette);
    gif.writeFrame(index, WIDTH, HEIGHT, { palette, delay: FRAME_DELAY_MS, transparent: false });
  }
  gif.finish();
  return gif.bytesView();
}

function buildFrames(theme, now) {
  const frames = [];
  const lineGap = 6;
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
    cursorY += CELL_HEIGHT + lineGap;
  }

  for (let i = 0; i < yLines.length; i++) {
    const line = yLines[i];
    if (line.type === "command-prompt") {
      const cmd = line.cmd;
      const totalChars = cmd.cmd.length;

      for (let typed = 0; typed <= totalChars; typed++) {
        for (let s = 0; s < TYPE_STEP_FRAMES; s++) {
          const ctx = makeFrameContext(WIDTH, HEIGHT);
          fill(ctx, theme.bg);
          strokeRect(ctx, 0, 0, ctx.width - 1, ctx.height - 1, theme.border);
          drawAllUpTo(ctx, theme, yLines, i);
          const fullCmdX = drawCommandLine(ctx, theme, cmd.prompt, cmd.path, cmd.cmd.substring(0, typed), line.y);
          drawCursor(ctx, theme, fullCmdX, line.y, (frames.length % 2) === 0);
          frames.push(ctx.rgba);
        }
      }

      for (let r = 0; r < READ_STEP_FRAMES; r++) {
        const ctx = makeFrameContext(WIDTH, HEIGHT);
        fill(ctx, theme.bg);
        strokeRect(ctx, 0, 0, ctx.width - 1, ctx.height - 1, theme.border);
        drawAllUpTo(ctx, theme, yLines, i + 1);
        const fullCmdX = drawCommandLine(ctx, theme, cmd.prompt, cmd.path, cmd.cmd, line.y);
        drawCursor(ctx, theme, fullCmdX, line.y, (frames.length % 2) === 0);
        frames.push(ctx.rgba);
      }
    } else if (line.type === "response") {
      const ctx = makeFrameContext(WIDTH, HEIGHT);
      fill(ctx, theme.bg);
      strokeRect(ctx, 0, 0, ctx.width - 1, ctx.height - 1, theme.border);
      drawAllUpTo(ctx, theme, yLines, i + 1);
      drawCursor(ctx, theme, PAD_X, line.y, (frames.length % 2) === 0);
      frames.push(ctx.rgba);
    }
  }

  for (let i = 0; i < FREEZE_STEP_FRAMES; i++) {
    const ctx = makeFrameContext(WIDTH, HEIGHT);
    fill(ctx, theme.bg);
    strokeRect(ctx, 0, 0, ctx.width - 1, ctx.height - 1, theme.border);
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
