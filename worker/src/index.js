import { renderClockSvg } from "./clock.js";
import { renderLivePage } from "./live.js";

const headers = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

function response(body, contentType, status = 200) {
  return new Response(body, {
    status,
    headers: { ...headers, "Content-Type": contentType },
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const theme = url.searchParams.get("theme") === "dark" ? "dark" : "light";

    if (url.pathname === "/card" || url.pathname === "/clock") {
      return response(renderClockSvg(theme, new Date(), { combined: true }), "image/svg+xml; charset=UTF-8");
    }

    if (url.pathname === "/live") {
      return response(renderLivePage(theme), "text/html; charset=UTF-8");
    }

    return response("Not found", "text/plain; charset=UTF-8", 404);
  },
};
