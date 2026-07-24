import assert from "node:assert/strict";
import test from "node:test";
import { escapeXml, renderClockSvg } from "../src/clock.js";

const instant = new Date("2026-07-24T18:34:56Z");

test("renders Asia/Tashkent date and time", () => {
  const svg = renderClockSvg("dark", instant);

  assert.match(svg, /2026-07-24  23:34:56/);
  assert.match(svg, />Fri · Tashkent, UZ</);
  assert.match(svg, /fill="#0d1117"/);
});

test("falls back to light theme", () => {
  const svg = renderClockSvg("unknown", instant);

  assert.match(svg, /fill="#f6f8fa"/);
});

test("escapes XML text", () => {
  assert.equal(escapeXml(`<&>\"'`), "&lt;&amp;&gt;&quot;&#39;");
});

test("does not expose arbitrary timezone data", () => {
  const svg = renderClockSvg("light", instant);

  assert.doesNotMatch(svg, /UTC|America\//);
  assert.match(svg, /Asia\/Tashkent/);
});

test("supports date rollover in Tashkent", () => {
  const svg = renderClockSvg("light", new Date("2026-07-24T19:30:00Z"));

  assert.match(svg, /2026-07-25  00:30:00/);
});

test("returns 404 for paths outside clock endpoint", async () => {
  const worker = (await import("../src/index.js")).default;
  const response = await worker.fetch(new Request("https://example.com/other"));

  assert.equal(response.status, 404);
});

test("returns SVG with no-store security headers", async () => {
  const worker = (await import("../src/index.js")).default;
  const response = await worker.fetch(
    new Request("https://example.com/clock?theme=dark"),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/svg+xml; charset=UTF-8");
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(await response.text(), /Live Tashkent clock/);
});
