export const TIME_ZONE = "Asia/Tashkent";

export const WHOAMI_LINES = [
  "Shahboz Munirov — product-focused software engineer.",
  "Day job: senior software engineer at EPAM Systems.",
  "Side build: Gnezdo Travel (real-estate / PMS platform).",
  "Building product and engineering end to end.",
];

const STATUS_WINDOWS = [
  { start: 6, end: 9, line: "waking up · espresso · triage inbox" },
  { start: 9, end: 11, line: "morning stack · review PRs, plan the day" },
  { start: 11, end: 13, line: "deep work · heads down on Gnezdo features" },
  { start: 13, end: 14, line: "lunch + thinking · long walk, no meetings" },
  { start: 14, end: 18, line: "shipping · builds, deploys, dashboards" },
  { start: 18, end: 21, line: "evening review · wrap up, write notes" },
  { start: 21, end: 24, line: "side project · Gnezdo Travel experiments" },
  { start: 0, end: 6, line: "quiet hours · reading, light tinkering" },
];

export function statusForHour(hour) {
  for (const window of STATUS_WINDOWS) {
    if (window.end <= window.start) {
      if (hour >= window.start || hour < window.end) return window.line;
    } else if (hour >= window.start && hour < window.end) {
      return window.line;
    }
  }
  return STATUS_WINDOWS[STATUS_WINDOWS.length - 1].line;
}

export function statusDateLine(date = new Date()) {
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
  return `${parts.weekday} ${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
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
