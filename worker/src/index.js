import { renderClockSvg } from "./clock.js";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname !== "/clock") {
      return new Response("Not found", { status: 404 });
    }

    const theme = url.searchParams.get("theme") === "dark" ? "dark" : "light";
    const svg = renderClockSvg(theme, new Date());

    return new Response(svg, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Type": "image/svg+xml; charset=UTF-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
};
