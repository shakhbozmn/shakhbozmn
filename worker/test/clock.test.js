import assert from "node:assert/strict";
import test from "node:test";
import { renderLivePage } from "../src/live.js";

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

test("returns autoplay preview SVG from /preview with security headers", async () => {
  const worker = (await import("../src/index.js")).default;
  const response = await worker.fetch(
    new Request("https://example.com/preview?theme=dark"),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/svg+xml; charset=UTF-8");
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  const body = await response.text();
  assert.match(body, /Terminal autoplay preview/);
  assert.match(body, /whoami/);
  assert.match(body, /stack/);
  assert.match(body, /projects/);
  assert.match(body, /Shahboz — product engineer/);
  assert.match(body, /feathers-board/);
  assert.match(body, /repeatCount="indefinite"/);
  assert.match(body, /<rect /);
});

test("returns autoplay preview SVG from /autoplay alias", async () => {
  const worker = (await import("../src/index.js")).default;
  const response = await worker.fetch(
    new Request("https://example.com/autoplay?theme=light"),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/svg+xml; charset=UTF-8");
  const body = await response.text();
  assert.match(body, /fill="#f6f8fa"/);
  assert.match(body, /whoami/);
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
