# Shahboz Munirov

Current roles — **Software Engineer at EPAM Systems · Product Engineer at Gnezdo Travel**

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/product-flight-deck-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/product-flight-deck-light.svg">
  <img alt="Shahboz Munirov — Software Engineer at EPAM Systems and Product Engineer at Gnezdo Travel, building travel-tech products from Tashkent" src="assets/product-flight-deck-light.svg" width="100%">
</picture>

Software engineer at EPAM, product engineer at Gnezdo Travel. I write the boring glue between mobile UX and the queue nobody wants to touch. Expo unless you give me a reason not to — currently rewriting the channel-sync worker, July 2026.

[Current focus](#current-focus) · [Shipped](#shipped) · [How I work](#how-i-work) · [Reach me](#reach-me)

## Current focus

Gnezdo Travel — booking and channel-manager work for short-stay operators. This quarter: stabilizing the nightly availability reconciliation, tightening the FeathersJS service surface, and getting the BullMQ workers into TypeScript. The hard part isn't the code; it's the operators' expectations and Booking.com's rate limits in the same sentence.

## Shipped

**feathers-board — developer tools**
FeathersJS v5 API playground. Built it because debugging Feathers services from a terminal was eating my evenings. Embedded mode came from wanting it in our own admin panel.
[Source](https://github.com/shakhbozmn/feathers-board) · [Package](https://www.npmjs.com/package/feathers-playground) · [Docs](https://github.com/shakhbozmn/feathers-board/blob/main/USAGE.md)

**4work — marketplace systems**
Two-sided portfolio marketplace. The interesting part was modeling applications as a state machine — RBAC fell out of that. Django, Postgres, Redis, Docker, CI — the boring parts I learned from.
[Source](https://github.com/shakhbozmn/4work)

**Scrap Fortress — game systems**
Unity/C# tower defense. My first Unity project that survived contact with a real player. Tower upgrade math took longer than the wave system; Unity's animation stack is criminally underdocumented.
[Source](https://github.com/shakhbozmn/scrap-fortress)

## How I work

**Build** — React Native + Expo for Gnezdo's operator apps. I'd rather ship one well-typed screen than five fetch calls across the stack.

**Connect** — FeathersJS services between the operator app, Booking.com, and our internal admin. Realtime hooks beat polling, almost always.

**Operate** — BullMQ workers on Redis for nightly reconciliation and webhook retries. Observability before cleverness.

## Flight recorder

<!-- FLIGHT_RECORDER:START -->
**Latest public transmission:** [feathers-board](https://github.com/shakhbozmn/feathers-board) · JavaScript · updated 2026-07-19
<!-- FLIGHT_RECORDER:END -->

## Off the clock

CS2 — IGL for a small stack. Currently grinding Faceit level 9.

Tennis — UTN league on weekends. Working on second-serve consistency.

Travel — collecting airport-lounge UX notes. Last trip: Almaty.

## Reach me

[Telegram](https://t.me/shakhbozms) — fastest.

[Email](mailto:shakhbozmn@gmail.com) — for anything serious.

[LinkedIn](https://linkedin.com/in/shakhbozms) — recruiting only.

[Website](https://shahbozms.uz/) — writing and product notes.

---

Last updated July 2026. Building from Tashkent, shipping to three time zones.
