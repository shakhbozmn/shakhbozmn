import assert from "node:assert/strict";
import test from "node:test";
import { escapeXml, renderClockSvg } from "../src/clock.js";
import { renderLivePage } from "../src/live.js";

const instant = new Date("2026-07-24T18:34:56Z");

test("renders Asia/Tashkent date and time", () => {
  const svg = renderClockSvg("dark", instant);

  assert.match(svg, /2026-07-24  23:34:56/);
  assert.match(svg, />Fri · Tashkent, UZ</);
  assert.match(svg, /fill="#0d1117"/);
});

test("combined card matches /live static visual without animation", () => {
  const svg = renderClockSvg("dark", instant, { combined: true });

  assert.match(svg, /\$ whoami/);
  assert.match(svg, /Shahboz Munirov/);
  assert.match(svg, /Gnezdo Admin/);
  assert.match(svg, /2026-07-24  23:34:56/);
  assert.match(svg, /Fri · Tashkent, UZ/);
  assert.match(svg, /open for collaboration/);
  assert.match(svg, /tap card to replay terminal/);
  assert.doesNotMatch(svg, /<animate /);
  assert.doesNotMatch(svg, /<tspan /);
  assert.doesNotMatch(svg, /<linearGradient /);
  assert.doesNotMatch(svg, /<clipPath /);
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

test("renders terminal page with input and commands", async () => {
  const response = renderLivePage();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
  assert.equal(response.headers.get("cache-control"), "public, max-age=300");
  const body = await response.text();
  assert.match(body, /id="stdin"/);
  assert.match(body, /shakhbozms@github/);
  assert.match(body, /api\.github\.com\/users\/shakhbozmn/);
  assert.match(body, /help · about · stack · projects · contact · stats/);
  assert.match(body, /COMMANDS\["sudo hire-me"\]/);
});

test("returns 404 for paths outside known routes", async () => {
  const worker = (await import("../src/index.js")).default;
  const response = await worker.fetch(new Request("https://example.com/other"));

  assert.equal(response.status, 404);
});

test("returns combined SVG from /card with security headers", async () => {
  const worker = (await import("../src/index.js")).default;
  const response = await worker.fetch(
    new Request("https://example.com/card?theme=dark"),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/svg+xml; charset=UTF-8");
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(await response.text(), /Live Tashkent clock and terminal/);
});

test("returns terminal HTML from /live with cache headers", async () => {
  const worker = (await import("../src/index.js")).default;
  const response = await worker.fetch(
    new Request("https://example.com/live?theme=dark"),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
  assert.equal(response.headers.get("cache-control"), "public, max-age=300");
  const body = await response.text();
  assert.match(body, /id="stdin"/);
  assert.match(body, /api\.github\.com\/users\/shakhbozmn/);
});

test("returns terminal HTML from /terminal alias", async () => {
  const worker = (await import("../src/index.js")).default;
  const response = await worker.fetch(
    new Request("https://example.com/terminal"),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
  const body = await response.text();
  assert.match(body, /id="stdin"/);
});
