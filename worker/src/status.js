export const TIME_ZONE = "Asia/Tashkent";

export const WHOAMI_LINES = [
  "Shahboz Munirov — product-focused software engineer.",
  "Day job: senior software engineer at EPAM Systems.",
  "Side build: Gnezdo Travel (real-estate / PMS platform).",
  "Building product and engineering end to end.",
];

export const STATUS_WINDOWS = [
  {
    start: 6, end: 9,
    header: "wake-up window · 06:00–09:00",
    body: "espresso, triage, sketch the day",
    mood: "~ \"plan less, ship more\"",
  },
  {
    start: 9, end: 11,
    header: "morning stack · 09:00–11:00",
    body: "PR review, docs, align the team",
    mood: "~ \"make small things work first\"",
  },
  {
    start: 11, end: 13,
    header: "deep work · 11:00–13:00",
    body: "heads down on Gnezdo features",
    mood: "~ \"tab closed, focus on\"",
  },
  {
    start: 13, end: 14,
    header: "lunch + thinking · 13:00–14:00",
    body: "long walk, no meetings, no messages",
    mood: "~ \"the answer walks with you\"",
  },
  {
    start: 14, end: 18,
    header: "shipping zone · 14:00–18:00",
    body: "builds, deploys, dashboards green",
    mood: "~ \"ship it and iterate\"",
  },
  {
    start: 18, end: 21,
    header: "evening review · 18:00–21:00",
    body: "wrap up, write notes, plan tomorrow",
    mood: "~ \"tomorrow is already on the runway\"",
  },
  {
    start: 21, end: 24,
    header: "side project · 21:00–00:00",
    body: "Gnezdo Travel experiments, sketches",
    mood: "~ \"the fun work happens after the fun work\"",
  },
  {
    start: 0, end: 6,
    header: "quiet hours · 00:00–06:00",
    body: "reading, light tinkering, sleeping",
    mood: "~ \"tomorrow is a different problem\"",
  },
];

export function statusForHour(hour) {
  for (const window of STATUS_WINDOWS) {
    if (window.end <= window.start) {
      if (hour >= window.start || hour < window.end) return window;
    } else if (hour >= window.start && hour < window.end) {
      return window;
    }
  }
  return STATUS_WINDOWS[STATUS_WINDOWS.length - 1];
}

export function statusLinesFor(date) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt
      .formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  );
  const hour = Number(parts.hour);
  const w = statusForHour(hour);
  return [
    `local: ${parts.weekday} ${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} · ${TIME_ZONE}`,
    `▌ ${w.header}`,
    `↳ ${w.body}`,
    w.mood,
  ];
}

export function statusHourFor(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    hour12: false,
  });
  return Number(
    Object.fromEntries(
      fmt
        .formatToParts(date)
        .filter((p) => p.type !== "literal")
        .map((p) => [p.type, p.value]),
    ).hour,
  );
}
