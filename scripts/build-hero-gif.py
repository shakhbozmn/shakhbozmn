"""Generate hero GIFs (light + dark) for the profile README.

Apple-minimal terminal that types letter-by-letter and holds a final read-pause.
Now widget bakes in real time at UTC+5 (Bukhara, UZ). Regenerate via
.github/workflows/refresh-hero.yml so the clock stays current.
"""

import math
from datetime import datetime, timedelta, timezone
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

# Layout
W, H = 960, 232
FPS = 12
PAD_X = 32
PAD_Y = 16
LINE_H = 36
RESPONSE_FONT_SIZE = 18
PROMPT_FONT_SIZE = 22

FONT_REG = "/System/Library/Fonts/SFNSMono.ttf"
FONT_HEAVY = "/System/Library/Fonts/SFNSMono.ttf"

PROMPT = "$ whoami"
RESPONSE_LINE_1 = "Shahboz Munirov"
# Long role sentence, pre-wrapped into two visual lines so the GIF can type
# letter-by-letter and stay within the 960 px width at 18 px font.
RESPONSE_LINE_2 = (
    "Software engineer at EPAM and product engineer at Gnezdo "
    "— in the meantime"
)
RESPONSE_LINE_3 = (
    "launching Gnezdo Admin (listings, calendar, channels — all "
    "in one place)."
)

# Now widget config
NW_W, NW_H = 960, 168
NW_PAD = 24
NW_BORDER = 1
NW_FONT_SIZE = 22
NW_LINE_H = 36

NOW_DATE = None  # computed from real time at render
NOW_LOCATION = "Bukhara"
NOW_BASE_COORDS = (39.77, "N", 64.43, "E")
SPINNER = "|/-\\"


def status_for_frame(i, n_frames, now):
    """Real-time line: `○ local HH:MM · <activity>`. `i` is unused but kept
    for signature compatibility."""
    return f"○ local {now.strftime('%H:%M')}  ·  {activity_for_hour(now.hour)}"


# Bukhara/Uzbekistan: fixed UTC+5 (no DST).
LOCAL_TZ = timezone(timedelta(hours=5))


def activity_for_hour(h):
    if 5 <= h < 11:
        return "morning stack"
    if 11 <= h < 14:
        return "lunch + ideas"
    if 14 <= h < 18:
        return "deep work"
    if 18 <= h < 22:
        return "shipping"
    return "reading / quiet hours"


def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def render_terminal(bg, prompt_color, response_color, out_path):
    """Loops: `$ whoami` → 4 typed lines letter-by-letter → holds."""
    font_prompt = ImageFont.truetype(FONT_HEAVY, PROMPT_FONT_SIZE)
    font_response = ImageFont.truetype(FONT_REG, RESPONSE_FONT_SIZE)

    # Phase frame budgets. Hold phases are short so PIL doesn't dedup
    # consecutive identical frames. Cursor alternates every frame so even
    # full-text frames differ pixel-wise.
    f_prompt_type = 12    # 8 chars at ~0.67 chars/frame, slower typing
    f_prompt_hold = 4
    f_line1_type = 24     # 16 chars "Shahboz Munirov" at ~0.67 chars/frame
    f_line1_hold = 4
    f_line2_type = 75     # 75 chars, ~1 char/frame
    f_line2_hold = 4
    f_line3_type = 76     # 76 chars, ~1 char/frame
    f_hold_complete = 36  # ~3 sec freeze so the user can read
    total = (
        f_prompt_type + f_prompt_hold
        + f_line1_type + f_line1_hold
        + f_line2_type + f_line2_hold
        + f_line3_type
        + f_hold_complete
    )

    y_prompt = PAD_Y
    y_line1 = y_prompt + LINE_H
    y_line2 = y_line1 + LINE_H
    y_line3 = y_line2 + LINE_H

    n0 = len(PROMPT)
    n1 = len(RESPONSE_LINE_1)
    n2 = len(RESPONSE_LINE_2)
    n3 = len(RESPONSE_LINE_3)

    s1 = f_prompt_type
    s2 = s1 + f_prompt_hold
    s3 = s2 + f_line1_type
    s4 = s3 + f_line1_hold
    s5 = s4 + f_line2_type
    s6 = s5 + f_line2_hold
    s7 = s6 + f_line3_type
    s8 = s7 + f_hold_complete

    for i in range(total):
        img = Image.new("RGB", (W, H), bg)
        draw = ImageDraw.Draw(img)
        cv = (i % 2) == 0

        pc, l1c, l2c, l3c = 0, 0, 0, 0

        if i < s1:
            pc = max(1, min(n0, (i + 1) * n0 // f_prompt_type))
        elif i < s2:
            pc = n0
        elif i < s3:
            pc = n0
            l1c = max(1, min(n1, (i - s2 + 1) * n1 // f_line1_type))
        elif i < s4:
            pc = n0; l1c = n1
        elif i < s5:
            pc = n0; l1c = n1
            l2c = max(1, min(n2, (i - s4 + 1) * n2 // f_line2_type))
        elif i < s6:
            pc = n0; l1c = n1; l2c = n2
        elif i < s7:
            pc = n0; l1c = n1; l2c = n2
            l3c = max(1, min(n3, (i - s6 + 1) * n3 // f_line3_type))
        else:
            pc = n0; l1c = n1; l2c = n2; l3c = n3

        prompt_text = PROMPT[:pc]
        if l1c == 0:
            prompt_text += ("▌" if cv else "")
        draw.text((PAD_X, y_prompt), prompt_text, font=font_prompt, fill=prompt_color)

        if l1c > 0:
            t = RESPONSE_LINE_1[:l1c] + ("▌" if (l2c == 0 and cv) else "")
            draw.text((PAD_X + 24, y_line1), t, font=font_response, fill=response_color)
        if l2c > 0:
            t = RESPONSE_LINE_2[:l2c] + ("▌" if (l3c == 0 and cv) else "")
            draw.text((PAD_X + 24, y_line2), t, font=font_response, fill=response_color)
        if l3c > 0:
            t = RESPONSE_LINE_3[:l3c] + ("▌" if cv else "")
            draw.text((PAD_X + 24, y_line3), t, font=font_response, fill=response_color)

        img.save(f"/tmp/_t_{i:03d}.png")

    frames = [Image.open(f"/tmp/_t_{i:03d}.png") for i in range(total)]
    duration_ms = int(1000 / FPS)
    frames[0].save(
        out_path,
        format="GIF",
        save_all=True,
        append_images=frames[1:],
        duration=duration_ms,
        loop=0,
        optimize=False,
        disposal=2,
    )
    for i in range(total):
        Path(f"/tmp/_t_{i:03d}.png").unlink(missing_ok=True)


def render_now_widget(bg, fg, muted, accent, out_path, now=None):
    """Bordered card with marching-ants border, pulsing pin halo, wiggling coords,
    spinner. Three lines: date, location, status (real time UTC+5)."""
    font = ImageFont.truetype(FONT_REG, NW_FONT_SIZE)
    font_dot = ImageFont.truetype(FONT_HEAVY, NW_FONT_SIZE + 2)

    if now is None:
        now = datetime.now(timezone.utc).astimezone(LOCAL_TZ)

    n_frames = 36  # 3 s loop
    date_text = now.strftime("%a · %Y-%m-%d")

    inner_x = NW_PAD
    inner_y = NW_PAD
    inner_w = NW_W - 2 * NW_PAD
    inner_h = NW_H - 2 * NW_PAD

    line1_y = inner_y + 18
    line2_y = line1_y + NW_LINE_H
    line3_y = line2_y + NW_LINE_H

    bx0, by0 = NW_PAD - NW_BORDER, NW_PAD - NW_BORDER
    bx1, by1 = NW_W - NW_PAD + NW_BORDER - 1, NW_H - NW_PAD + NW_BORDER - 1

    base_lat, ns, base_lon, ew = NOW_BASE_COORDS

    def draw_marching_rect(draw, x0, y0, x1, y1, color, offset):
        """Draws a rectangle as dashed lines with given phase offset."""
        dash, gap = 8, 6
        period = dash + gap
        # Top + bottom
        for x in range(x0, x1 + 1):
            if ((x - x0 - offset) % period) < dash:
                draw.point((x, y0), fill=color)
                draw.point((x, y1), fill=color)
        # Left + right
        for y in range(y0, y1 + 1):
            if ((y - y0 - offset) % period) < dash:
                draw.point((x0, y), fill=color)
                draw.point((x1, y), fill=color)
        # Corners
        for cx, cy in [(x0, y0), (x1, y0), (x0, y1), (x1, y1)]:
            draw.point((cx, cy), fill=color)

    def draw_animated_border(draw, color, accent_color, offset):
        # Base dim outline
        draw_marching_rect(draw, bx0, by0, bx1, by1, muted, offset)
        # Accent marching ants on top
        draw_marching_rect(draw, bx0, by0, bx1, by1, color, offset * 2)

    for i in range(n_frames):
        img = Image.new("RGB", (NW_W, NW_H), bg)
        draw = ImageDraw.Draw(img)

        phase = (i / n_frames) * 2 * math.pi
        pulse = (math.sin(phase) + 1) / 2  # 0..1

        # Marching-ants border
        draw_animated_border(draw, fg, accent, i)

        # Line 1: date with blinking cursor block
        cursor_visible = (i % 14) < 10
        line1 = date_text + ("   ▌" if cursor_visible else "   ")
        draw.text((inner_x + 14, line1_y), line1, font=font, fill=fg)

        # Line 2: location with pulsing dot + halo + wiggling coords
        dot_color = lerp_color(fg, accent, pulse * 0.55 + 0.2)
        draw.text((inner_x + 14, line2_y), NOW_LOCATION + " ", font=font, fill=fg)
        bbox = draw.textbbox((0, 0), NOW_LOCATION + " ", font=font)
        dot_x = inner_x + 14 + (bbox[2] - bbox[0]) + 2
        cy = line2_y + NW_FONT_SIZE // 2 - 2
        # Halo expanding rings
        for ring in (1, 2, 3):
            t = (pulse + ring * 0.18) % 1.0
            if t < 0.85:
                r = int(6 + t * 18)
                fade = max(0.0, 0.45 - t * 0.55)
                ring_color = lerp_color(bg, accent, fade)
                draw.ellipse([dot_x - r, cy - r, dot_x + r, cy + r], outline=ring_color)
        # Core pulsing dot
        r = 4 + int(pulse * 2)
        draw.ellipse([dot_x - r, cy - r, dot_x + r, cy + r], fill=dot_color)

        # Wiggling coords
        lat_w = base_lat + math.sin(phase * 2) * 0.005
        lon_w = base_lon + math.cos(phase * 2) * 0.005
        coords_text = f"  {lat_w:.2f}°{ns}  {lon_w:.2f}°{ew}   UTC+5"
        draw.text((dot_x + r + 6, line2_y), coords_text, font=font, fill=muted)

        # Line 3: status with rotating spinner + animated underline + ticking clock
        spinner_char = SPINNER[i % len(SPINNER)]
        full_text = status_for_frame(i, n_frames, now)
        # Replace leading ○ with spinner for liveness
        if full_text.startswith("○ "):
            full_text = f"{spinner_char}  " + full_text[2:]
        draw.text((inner_x + 14, line3_y), full_text, font=font, fill=muted)
        # Underline sweep (animated marker)
        bbox3 = draw.textbbox((0, 0), full_text, font=font)
        sweep_x = inner_x + 14 + int(((bbox3[2] - bbox3[0]) - 30) * pulse)
        underline_y = line3_y + NW_FONT_SIZE + 2
        draw.line([(sweep_x, underline_y), (sweep_x + 30, underline_y)], fill=accent, width=1)

        img.save(f"/tmp/_n_{i:03d}.png")

    frames = [Image.open(f"/tmp/_n_{i:03d}.png") for i in range(n_frames)]
    frames[0].save(
        out_path,
        format="GIF",
        save_all=True,
        append_images=frames[1:],
        duration=int(1000 / FPS),
        loop=0,
        optimize=False,
        disposal=2,
    )
    for i in range(n_frames):
        Path(f"/tmp/_n_{i:03d}.png").unlink(missing_ok=True)


def main():
    out_dir = Path("assets")
    out_dir.mkdir(exist_ok=True)

    render_terminal(
        bg=(12, 12, 14),
        prompt_color=(245, 245, 247),
        response_color=(170, 170, 178),
        out_path=out_dir / "terminal-loop-dark.gif",
    )
    render_terminal(
        bg=(250, 250, 252),
        prompt_color=(20, 20, 22),
        response_color=(95, 95, 100),
        out_path=out_dir / "terminal-loop-light.gif",
    )

    # Now widget — light
    render_now_widget(
        bg=(245, 245, 248),
        fg=(20, 20, 22),
        muted=(95, 95, 100),
        accent=(0, 113, 227),
        out_path=out_dir / "floating-banner-light.gif",
    )
    # Now widget — dark
    render_now_widget(
        bg=(18, 18, 22),
        fg=(220, 220, 228),
        muted=(150, 150, 158),
        accent=(80, 160, 255),
        out_path=out_dir / "floating-banner-dark.gif",
    )

    print("done")


if __name__ == "__main__":
    main()
