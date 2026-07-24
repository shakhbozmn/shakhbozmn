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
