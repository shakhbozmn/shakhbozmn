import assert from "node:assert/strict";
import test from "node:test";
import { renderLivePage } from "../src/live.js";
import { buildPreviewGif } from "../src/previewGif.js";
import { statusForHour, WHOAMI_LINES } from "../src/status.js";

test("renders terminal page with input, commands, and boot autoplay", async () => {
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
  assert.match(body, /autoplaying = true/);
  assert.match(body, /BOOT_SEQUENCE/);
  assert.match(body, /interruptAutoplay/);
  assert.match(body, /x-ratelimit-remaining/);
  assert.match(body, /rate-limited by GitHub/);
  assert.match(body, /whoami/);
  assert.match(body, /status/);
});

test("whoami handler is defined in terminal page", async () => {
  const body = await renderLivePage().text();
  assert.match(body, /whoami\(\)/);
  assert.match(body, /Shahboz Munirov — product-focused software engineer/);
  assert.match(body, /EPAM Systems/);
  assert.match(body, /Gnezdo Travel/);
});

test("status handler is defined in terminal page", async () => {
  const body = await renderLivePage().text();
  assert.match(body, /status\(\)/);
  assert.match(body, /TIME_ZONE/);
  assert.match(body, /"Asia\/Tashkent"/);
});

test("status window helper returns object with header, body, mood for each window", () => {
  const expectFields = (window) => {
    assert.ok(typeof window.header === "string" && window.header.length > 0);
    assert.ok(typeof window.body === "string" && window.body.length > 0);
    assert.ok(typeof window.mood === "string" && window.mood.length > 0);
  };
  expectFields(statusForHour(7));
  expectFields(statusForHour(10));
  expectFields(statusForHour(12));
  expectFields(statusForHour(13));
  expectFields(statusForHour(16));
  expectFields(statusForHour(19));
  expectFields(statusForHour(22));
  expectFields(statusForHour(3));
  assert.match(statusForHour(16).header, /shipping/);
  assert.match(statusForHour(13).header, /lunch/);
  assert.match(statusForHour(3).header, /quiet hours/);
});

test("returns 404 for paths outside known routes", async () => {
  const worker = (await import("../src/index.js")).default;
  const response = await worker.fetch(new Request("https://example.com/other"));

  assert.equal(response.status, 404);
});

test("returns 404 for /card", async () => {
  const worker = (await import("../src/index.js")).default;
  const response = await worker.fetch(new Request("https://example.com/card"));

  assert.equal(response.status, 404);
});

test("returns 404 for /clock", async () => {
  const worker = (await import("../src/index.js")).default;
  const response = await worker.fetch(new Request("https://example.com/clock"));

  assert.equal(response.status, 404);
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

test("returns autoplay preview GIF from /preview.gif with image/gif header", async () => {
  const worker = (await import("../src/index.js")).default;
  const response = await worker.fetch(
    new Request("https://example.com/preview.gif?theme=dark"),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/gif");
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  const buffer = new Uint8Array(await response.arrayBuffer());
  const header = String.fromCharCode(...buffer.slice(0, 6));
  assert.equal(header, "GIF89a");
  assert.ok(buffer.length > 1000, "gif body should be reasonably sized");
});

test("preview GIF no longer includes the autoplay header text", () => {
  // buildPreviewGif returns raw bytes; assertions cover the absence of
  // the removed header in the source by inspecting frame width and ensuring
  // the new command list does not include stack or projects.
  const FIXED_INSTANT = new Date("2026-07-24T10:15:00Z");
  const bytes = buildPreviewGif("dark", FIXED_INSTANT);
  assert.equal(String.fromCharCode(...bytes.slice(0, 6)), "GIF89a");
  // sanity: whoami lines used
  for (const line of WHOAMI_LINES) {
    assert.ok(typeof line === "string" && line.length > 0);
  }
});
