import { renderLivePage } from "./live.js";
import { buildPreviewGif } from "./previewGif.js";

const headers = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const theme = url.searchParams.get("theme") === "light" ? "light" : "dark";

    if (url.pathname === "/live" || url.pathname === "/terminal") {
      return renderLivePage();
    }

    if (url.pathname === "/preview.gif" || url.pathname === "/autoplay.gif") {
      return new Response(buildPreviewGif(theme), {
        status: 200,
        headers: { ...headers, "Content-Type": "image/gif" },
      });
    }

    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=UTF-8" },
    });
  },
};
