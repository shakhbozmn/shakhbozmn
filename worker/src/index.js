import { renderLivePage } from "./live.js";
import { renderPreviewSvg } from "./preview.js";

const headers = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

function svgResponse(body) {
  return new Response(body, {
    status: 200,
    headers: { ...headers, "Content-Type": "image/svg+xml; charset=UTF-8" },
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const theme = url.searchParams.get("theme") === "light" ? "light" : "dark";

    if (url.pathname === "/live" || url.pathname === "/terminal") {
      return renderLivePage();
    }

    if (url.pathname === "/preview" || url.pathname === "/autoplay") {
      return svgResponse(renderPreviewSvg(theme));
    }

    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=UTF-8" },
    });
  },
};
